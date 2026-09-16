import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import Branch from './models/Branch.js';
import Batch from './models/Batch.js';
import Student from './models/Student.js';
import Faculty from './models/Faculty.js';
import Subject from './models/Subject.js';
import FeePayment from './models/FeePayment.js';
import Attendance from './models/Attendance.js';
import Marks from './models/Marks.js';
import Announcement from './models/Announcement.js';
import Notification from './models/Notification.js';
import StudentLeave from './models/StudentLeave.js';
import FacultyLeave from './models/FacultyLeave.js';
import FacultyProfileRequest from './models/FacultyProfileRequest.js';
import StudentApplication from './models/StudentApplication.js';
import Feedback from './models/Feedback.js';
import Alumni from './models/Alumni.js';
import Admin from './models/Admin.js';
import Role from './models/Role.js';
import { SYSTEM_DEFAULT_ROLES } from './controllers/rbacController.js';
import { seedData } from './seed.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyBwY91EckPyl9OdwSwBiAv7ddz6o5JJtFc",
  authDomain: "saumya-8e8d4.firebaseapp.com",
  projectId: "saumya-8e8d4",
  storageBucket: "saumya-8e8d4.firebasestorage.app",
  messagingSenderId: "948990834474",
  appId: "1:948990834474:web:e806d5736b17b1d307d053",
  measurementId: "G-BMEBQ5YHV2"
};

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saumyaa_db';

export const migrateFirebaseToMongo = async () => {
  console.log('🚀 Checking Firebase to MongoDB Migration Status...');

  // 1. Try dynamic Firebase connection if SDK installed
  let fbDb = null;
  let collectionFn = null;
  let getDocsFn = null;
  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, getDocs } = await import('firebase/firestore');
    const fbApp = initializeApp(firebaseConfig, 'migration_app_' + Date.now());
    fbDb = getFirestore(fbApp);
    collectionFn = collection;
    getDocsFn = getDocs;
    console.log('✓ Initialized Firebase client connection.');
  } catch (err) {
    console.log('ℹ️ Firebase SDK has been uninstalled. Migrating/ensuring database using MongoDB Mongoose...');
    await seedData();
    return;
  }

  // 2. Connect to MongoDB
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`✓ Connected to MongoDB database: ${MONGO_URI}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('👉 Please make sure MongoDB is running or MONGODB_URI is correctly configured in server/.env');
    return;
  }

  const fetchCollectionDocs = async (colName) => {
    try {
      const snap = await getDocs(collection(fbDb, colName));
      const list = [];
      snap.forEach((d) => list.push({ _id: d.id, id: d.id, ...d.data() }));
      return list;
    } catch (e) {
      console.warn(`  ⚠️ Notice: Firestore collection "${colName}" could not be read (${e.message}). Proceeding.`);
      return [];
    }
  };

  const idMap = new Map(); // Old Firebase ID -> New MongoDB ObjectId

  try {
    // 1. Migrate Roles & System Admin
    console.log('\n📦 Step 1: Ensuring System Roles & Admin...');
    for (const r of SYSTEM_DEFAULT_ROLES) {
      await Role.findOneAndUpdate({ code: r.code }, r, { upsert: true, new: true });
    }
    const adminExists = await Admin.findOne({ email: 'admin@saumyaa.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      await Admin.create({
        fullName: 'Institute Super Administrator',
        email: 'admin@saumyaa.com',
        password: hashedPassword,
        role: 'SuperAdmin',
        branch: 'Main Center (Bagru)',
        isActive: true,
      });
    }
    console.log('  ✓ System Roles & Admin verified.');

    // 2. Migrate Branches
    console.log('\n📦 Step 2: Migrating Branches...');
    const fbBranches = await fetchCollectionDocs('branches');
    const defaultBranches = [
      { name: 'Main Center (Bagru)', code: 'MAIN_CENTER', address: 'Main Center Campus, Bagru', city: 'Bagru', phone: '+91 9816001122' },
      { name: 'Branch (Daroh)', code: 'BRANCH_DAROH', address: 'Daroh Market Road', city: 'Daroh', phone: '+91 9816003344' },
    ];
    const branchesToMigrate = fbBranches.length > 0 ? fbBranches : defaultBranches;
    for (const b of branchesToMigrate) {
      const doc = await Branch.findOneAndUpdate(
        { code: b.code || b.name },
        { name: b.name, code: b.code || b.name, address: b.address || '', city: b.city || '', phone: b.phone || '', status: 'Active' },
        { upsert: true, new: true }
      );
      if (b._id) idMap.set(String(b._id), doc._id);
    }
    console.log(`  ✓ Migrated ${branchesToMigrate.length} Branches.`);

    // 3. Migrate Faculty
    console.log('\n📦 Step 3: Migrating Faculty Records...');
    const fbFaculty = await fetchCollectionDocs('faculty');
    let facultyCount = 0;
    for (const f of fbFaculty) {
      const email = (f.email || `faculty_${facultyCount}@saumyaa.com`).toLowerCase().trim();
      let passHash = f.password;
      if (!passHash || !passHash.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        passHash = await bcrypt.hash(f.password || 'Faculty@123', salt);
      }
      const doc = await Faculty.findOneAndUpdate(
        { email },
        {
          name: f.name || f.fullName || 'Faculty Member',
          email,
          password: passHash,
          phone: f.phone || '+91 9816000000',
          designation: f.designation || 'Senior Faculty',
          department: f.department || 'Science & Mathematics',
          qualification: f.qualification || 'Master’s Degree',
          experience: f.experience || '5+ Years',
          branch: f.branch || 'Main Center (Bagru)',
          assignedClasses: f.assignedClasses || ['S2', 'S3'],
          assignedSubjects: f.assignedSubjects || [f.subject || 'Mathematics Advanced'],
          responsibilities: f.responsibilities || [],
          roles: Array.isArray(f.roles) ? f.roles : [f.role || 'SUBJECT_TEACHER'],
          photo_url: f.photo_url || f.photo || '',
          is_active: f.is_active !== false && f.status !== 'Inactive',
        },
        { upsert: true, new: true }
      );
      if (f._id) idMap.set(String(f._id), doc._id);
      facultyCount++;
    }
    console.log(`  ✓ Migrated ${facultyCount} Faculty records.`);

    // 4. Migrate Subjects
    console.log('\n📦 Step 4: Migrating Academic Subjects...');
    const fbSubjects = await fetchCollectionDocs('subjects');
    let subjectCount = 0;
    for (const s of fbSubjects) {
      const name = s.name || s.subjectName || 'General Subject';
      const categoryCode = s.categoryCode || (s.className?.includes('S1') ? 'S1' : s.className?.includes('S2') ? 'S2' : s.className?.includes('S3') ? 'S3' : s.className?.includes('S4') ? 'S4' : 'S3');
      const doc = await Subject.findOneAndUpdate(
        { name, categoryCode },
        {
          name,
          categoryCode,
          category: s.category || 'Foundation',
          className: s.className || `Class ${categoryCode}`,
          description: s.description || '',
          teacherName: s.teacherName || 'Jitender Sharma',
          batchTime: s.batchTime || '5:00 PM – 6:30 PM',
          maxCapacity: Number(s.maxCapacity) || 20,
          academicSession: s.academicSession || '2026-2027',
          branch: s.branch || 'Main Center (Bagru)',
          isActive: s.isActive !== false && s.status !== 'Inactive',
        },
        { upsert: true, new: true }
      );
      if (s._id) idMap.set(String(s._id), doc._id);
      subjectCount++;
    }
    console.log(`  ✓ Migrated ${subjectCount} Subjects.`);

    // 5. Migrate Students
    console.log('\n📦 Step 5: Migrating Student Records...');
    const fbStudents = await fetchCollectionDocs('students');
    let studentCount = 0;
    for (const st of fbStudents) {
      const rollNumber = st.rollNumber || `SAU-10-${String(studentCount + 1).padStart(3, '0')}`;
      const email = (st.email || `${rollNumber.toLowerCase()}@saumyaa.com`).toLowerCase().trim();
      let passHash = st.password;
      if (!passHash || !passHash.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        passHash = await bcrypt.hash(st.password || 'Student@123', salt);
      }
      const doc = await Student.findOneAndUpdate(
        { rollNumber },
        {
          fullName: st.fullName || st.name || 'Student',
          admissionNumber: st.admissionNumber || `ADM-2025-${String(studentCount + 1).padStart(3, '0')}`,
          rollNumber,
          email,
          password: passHash,
          phone: st.phone || '9816012345',
          parentPhone: st.parentPhone || '9816054321',
          fatherName: st.fatherName || '',
          motherName: st.motherName || '',
          address: st.address || 'Bagru, Rajasthan',
          className: st.className || 'S2',
          currentClass: st.currentClass || st.className || 'S2',
          subjects: st.subjects || ['Mathematics Advanced'],
          batch: st.batch || '2024-2026',
          branch: st.branch || 'Main Center (Bagru)',
          monthlyFee: Number(st.monthlyFee) || 2500,
          monthlyDueDay: Number(st.monthlyDueDay) || 5,
          status: st.status || 'Active',
          feesPaid: Boolean(st.feesPaid),
          paidTillMonth: st.paidTillMonth || '',
        },
        { upsert: true, new: true }
      );
      if (st._id) idMap.set(String(st._id), doc._id);
      studentCount++;
    }
    console.log(`  ✓ Migrated ${studentCount} Students.`);

    // 6. Migrate Fees & Payments
    console.log('\n📦 Step 6: Migrating Fee Payments...');
    const fbFees = await fetchCollectionDocs('fees');
    let feeCount = 0;
    for (const f of fbFees) {
      const stId = idMap.get(String(f.student)) || f.student;
      const txId = f.transactionId || f.receiptNumber || `RZP_${Date.now()}_${feeCount}`;
      await FeePayment.findOneAndUpdate(
        { transactionId: txId },
        {
          student: stId,
          amountPaid: Number(f.amountPaid) || 0,
          monthlyFee: Number(f.monthlyFee) || 2500,
          pendingAmount: Number(f.pendingAmount) || 0,
          monthYear: f.monthYear || 'July 2026',
          paymentMode: f.paymentMode || 'UPI',
          transactionId: txId,
          receiptNumber: f.receiptNumber || `REC-2026-${String(feeCount + 1).padStart(4, '0')}`,
          remarks: f.remarks || 'Migrated Tuition Fee Record',
          paymentDate: f.paymentDate ? new Date(f.paymentDate) : new Date(),
        },
        { upsert: true }
      );
      feeCount++;
    }
    console.log(`  ✓ Migrated ${feeCount} Fee Payments.`);

    // 7. Migrate Marks
    console.log('\n📦 Step 7: Migrating Student Marks...');
    const fbMarks = await fetchCollectionDocs('marks');
    let marksCount = 0;
    for (const m of fbMarks) {
      const stId = idMap.get(String(m.student || m.studentId)) || m.student;
      await Marks.findOneAndUpdate(
        {
          student: stId,
          subject: m.subject || 'Mathematics Advanced',
          examType: m.examType || m.title || 'Internal Assessment',
        },
        {
          student: stId,
          className: m.className || 'S2',
          subject: m.subject || 'Mathematics Advanced',
          examType: m.examType || m.title || 'Internal Assessment',
          marksObtained: Number(m.marksObtained) || 0,
          totalMaxMarks: Number(m.totalMaxMarks || m.totalMax) || 100,
          midTermMarks: Number(m.midTermMarks) || 0,
          finalExamMarks: Number(m.finalExamMarks) || 0,
          internalMarks: Number(m.internalMarks) || 0,
          assignmentMarks: Number(m.assignmentMarks) || 0,
          grade: m.grade || 'A',
          publishedBy: m.publishedBy || 'Faculty Member',
          isPublished: m.isPublished !== false,
        },
        { upsert: true }
      );
      marksCount++;
    }
    console.log(`  ✓ Migrated ${marksCount} Marks records.`);

    // 8. Migrate Attendance
    console.log('\n📦 Step 8: Migrating Attendance Records...');
    const fbAttendance = await fetchCollectionDocs('attendance');
    let attendanceCount = 0;
    for (const a of fbAttendance) {
      const stId = idMap.get(String(a.student?._id || a.student)) || a.student;
      const dateStr = a.date ? (typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
      await Attendance.findOneAndUpdate(
        {
          student: stId,
          date: new Date(dateStr),
          subject: a.subject || 'Mathematics Advanced',
        },
        {
          student: stId,
          subject: a.subject || 'Mathematics Advanced',
          date: new Date(dateStr),
          status: a.status || 'Present',
          remarks: a.remarks || '',
          markedBy: a.markedBy || 'Faculty Member',
        },
        { upsert: true }
      );
      attendanceCount++;
    }
    console.log(`  ✓ Migrated ${attendanceCount} Attendance records.`);

    // 9. Migrate Announcements, Leaves & Applications
    console.log('\n📦 Step 9: Migrating Announcements, Leaves & Applications...');
    const fbAnnouncements = await fetchCollectionDocs('announcements');
    for (const anc of fbAnnouncements) {
      await Announcement.findOneAndUpdate(
        { title: anc.title },
        {
          title: anc.title,
          content: anc.content || anc.description || '',
          category: anc.category || 'General',
          targetClass: anc.targetClass || 'All',
          publishedDate: anc.publishedDate ? new Date(anc.publishedDate) : new Date(),
          authorName: anc.authorName || anc.author || 'Institute Administration',
        },
        { upsert: true }
      );
    }

    const fbStudentLeaves = await fetchCollectionDocs('student_leaves');
    for (const sl of fbStudentLeaves) {
      const stId = idMap.get(String(sl.studentId || sl.student)) || sl.studentId;
      await StudentLeave.findOneAndUpdate(
        { studentId: stId, fromDate: sl.fromDate || sl.startDate },
        {
          studentId: stId,
          studentName: sl.studentName || 'Student',
          rollNumber: sl.rollNumber || 'N/A',
          className: sl.className || 'S2',
          leaveType: sl.leaveType || 'Sick Leave',
          reason: sl.reason || '',
          fromDate: sl.fromDate || sl.startDate || new Date().toISOString().split('T')[0],
          toDate: sl.toDate || sl.endDate || new Date().toISOString().split('T')[0],
          status: sl.status || 'Pending',
          adminRemarks: sl.adminRemarks || '',
        },
        { upsert: true }
      );
    }

    const fbFacultyLeaves = await fetchCollectionDocs('faculty_leaves');
    for (const fl of fbFacultyLeaves) {
      const facId = idMap.get(String(fl.facultyId || fl.faculty)) || fl.facultyId;
      await FacultyLeave.findOneAndUpdate(
        { facultyId: facId, fromDate: fl.fromDate || fl.startDate },
        {
          facultyId: facId,
          facultyName: fl.facultyName || 'Faculty',
          department: fl.department || 'Science',
          leaveType: fl.leaveType || 'Casual Leave',
          reason: fl.reason || '',
          fromDate: fl.fromDate || fl.startDate || new Date().toISOString().split('T')[0],
          toDate: fl.toDate || fl.endDate || new Date().toISOString().split('T')[0],
          status: fl.status || 'Pending',
          adminRemarks: fl.adminRemarks || '',
        },
        { upsert: true }
      );
    }

    const fbFeedbacks = await fetchCollectionDocs('feedbacks');
    for (const fb of fbFeedbacks) {
      await Feedback.findOneAndUpdate(
        { studentName: fb.studentName || fb.name, message: fb.message || fb.feedback },
        {
          studentName: fb.studentName || fb.name || 'Student',
          course: fb.course || fb.className || 'Science Foundation',
          rating: Number(fb.rating) || 5,
          message: fb.message || fb.feedback || '',
          isApproved: fb.isApproved !== false,
        },
        { upsert: true }
      );
    }

    const fbAlumni = await fetchCollectionDocs('alumni');
    for (const al of fbAlumni) {
      await Alumni.findOneAndUpdate(
        { name: al.name, passingYear: al.passingYear || al.year },
        {
          name: al.name || 'Alumni Member',
          passingYear: al.passingYear || al.year || '2024',
          currentStatus: al.currentStatus || al.college || 'Engineering Undergraduate',
          message: al.message || '',
          photo_url: al.photo_url || al.photo || '',
          isApproved: al.isApproved !== false,
        },
        { upsert: true }
      );
    }

    console.log('\n======================================================');
    console.log('🎉 FIREBASE TO MONGODB ATLAS MIGRATION COMPLETE!');
    console.log('======================================================');
    console.log(`Summary:`);
    console.log(`- Branches: ${branchesToMigrate.length}`);
    console.log(`- Faculty: ${facultyCount}`);
    console.log(`- Subjects: ${subjectCount}`);
    console.log(`- Students: ${studentCount}`);
    console.log(`- Fees: ${feeCount}`);
    console.log(`- Marks: ${marksCount}`);
    console.log(`- Attendance: ${attendanceCount}`);
    console.log(`- Announcements: ${fbAnnouncements.length}`);
    console.log('MongoDB is now populated and ready as the single source of truth.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateFirebaseToMongo();
