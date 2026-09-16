import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';
import Student from './models/Student.js';
import Subject from './models/Subject.js';
import FeePayment from './models/FeePayment.js';
import Role from './models/Role.js';
import Faculty from './models/Faculty.js';
import Branch from './models/Branch.js';
import Batch from './models/Batch.js';
import Attendance from './models/Attendance.js';
import Marks from './models/Marks.js';
import Notification from './models/Notification.js';
import Announcement from './models/Announcement.js';
import { SYSTEM_DEFAULT_ROLES } from './controllers/rbacController.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saumyaa_db';

export const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB for seeding...');

    // Clear existing collections safely
    await Admin.deleteMany();
    await Student.deleteMany();
    await Subject.deleteMany();
    await FeePayment.deleteMany();
    await Role.deleteMany();
    await Faculty.deleteMany();
    await Branch.deleteMany();
    await Batch.deleteMany();
    await Attendance.deleteMany();
    await Marks.deleteMany();
    await Notification.deleteMany();
    await Announcement.deleteMany();

    // 1. Seed Branches
    const branches = await Branch.insertMany([
      { name: 'Main Center (Bagru)', code: 'MAIN_CENTER', address: 'Main Center Campus, Bagru', city: 'Bagru', phone: '+91 9816001122' },
      { name: 'Branch (Daroh)', code: 'BRANCH_DAROH', address: 'Daroh Market Road', city: 'Daroh', phone: '+91 9816003344' },
    ]);
    console.log(`✓ Seeded ${branches.length} Branches`);

    // 2. Seed System Default Roles
    const seededRoles = await Role.insertMany(SYSTEM_DEFAULT_ROLES);
    console.log(`✓ Seeded ${seededRoles.length} System RBAC Roles`);

    // 3. Create Admin Account
    const admin = await Admin.create({
      name: 'Jitender Sharma',
      email: 'admin@saumyaa.com',
      password: 'admin123',
      role: 'SuperAdmin',
      phone: '+91 9816543210',
      department: 'Academic Operations & Management',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });
    console.log(`✓ Default Admin Created: admin@saumyaa.com / admin123`);

    // 4. Seed Faculty Members
    const facultyHashedPass = await bcrypt.hash('faculty123', 10);
    const facultyMembers = await Faculty.insertMany([
      {
        name: 'Prof. Jitender Sharma',
        designation: 'Senior Mathematics & Physics HOD',
        subject: 'Mathematics Advanced',
        qualification: 'M.Sc. Mathematics & Physics, B.Ed',
        experience: '15+ Years Teaching Experience',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        email: 'jitender.sharma@saumyaa.edu.in',
        password: facultyHashedPass,
        phone: '9816099999',
        department: 'Science & Mathematics',
        assignedClasses: ['S2', 'S3'],
        assignedSubjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
        role: 'HEAD_OF_DEPARTMENT',
        roles: ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER'],
        branch: 'Main Center (Bagru)',
        branchId: 'MAIN_CENTER',
        is_active: true,
        display_order: 1,
      },
      {
        name: 'Dr. Ramesh Verma',
        designation: 'Senior Chemistry Faculty',
        subject: 'Chemistry Foundation',
        qualification: 'Ph.D. Chemistry',
        experience: '12+ Years Experience',
        photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        email: 'ramesh.verma@saumyaa.edu.in',
        password: facultyHashedPass,
        phone: '9816088888',
        department: 'Science & Mathematics',
        assignedClasses: ['S2'],
        assignedSubjects: ['Chemistry Foundation'],
        role: 'SENIOR_FACULTY',
        roles: ['SENIOR_FACULTY', 'SUBJECT_TEACHER'],
        branch: 'Main Center (Bagru)',
        branchId: 'MAIN_CENTER',
        is_active: true,
        display_order: 2,
      },
    ]);
    console.log(`✓ Seeded ${facultyMembers.length} Faculty Profiles`);

    // 5. Seed Batches
    const batches = await Batch.insertMany([
      { name: 'Class 10th Morning Batch', academicSession: '2025-2026', className: '10th', category: 'S2', timings: '5:00 PM – 6:30 PM', maxCapacity: 20 },
      { name: 'Class 12th IIT-JEE Target', academicSession: '2025-2026', className: '12th (+2)', category: 'S4', timings: '6:30 PM – 8:00 PM', maxCapacity: 25 },
    ]);
    console.log(`✓ Seeded ${batches.length} Academic Batches`);

    // 6. Seed Subjects
    const subjects = await Subject.insertMany([
      {
        name: 'Mathematics Advanced',
        subjectCode: 'MATH-S2',
        className: 'Class S2',
        category: 'Foundation',
        categoryCode: 'S2',
        stream: 'CBSE Board',
        description: 'Calculus, Algebra, Geometry with board depth',
        teacherName: 'Prof. Jitender Sharma',
        faculty: facultyMembers[0]._id,
        batchTime: '5:00 PM – 6:30 PM',
        maxCapacity: 20,
        branch: 'Main Center (Bagru)',
        isActive: true,
      },
      {
        name: 'Physics IIT-JEE Prep',
        subjectCode: 'PHYS-S4',
        className: 'Class S4',
        category: 'IIT-JEE Prep',
        categoryCode: 'S4',
        stream: 'IIT-JEE Prep',
        description: 'Mechanics, Electromagnetism, Modern Physics',
        teacherName: 'Prof. Jitender Sharma',
        faculty: facultyMembers[0]._id,
        batchTime: '6:30 PM – 8:00 PM',
        maxCapacity: 25,
        branch: 'Main Center (Bagru)',
        isActive: true,
      },
    ]);
    console.log(`✓ Seeded ${subjects.length} Subject Offerings`);

    // 7. Seed Students
    const studentHashedPass = await bcrypt.hash('Student123', 10);
    const students = await Student.insertMany([
      {
        fullName: 'Rahul Gupta',
        admissionNumber: 'ADM-2025-001',
        rollNumber: 'SAU-02-001',
        fatherName: 'Rajesh Gupta',
        motherName: 'Sunita Gupta',
        phone: '9816012345',
        parentPhone: '8894190175',
        email: 'rahul.g@gmail.com',
        password: studentHashedPass,
        address: 'House #42, Main Market, Palampur',
        className: '10th',
        academicStage: 'S2',
        course: 'Science',
        batch: '2025-2026',
        semester: 'Semester 1',
        subjects: ['Mathematics Advanced'],
        monthlyFee: 2500,
        feesPaid: true,
        paidTillMonth: 'July 2026',
        status: 'Active',
        attendancePercentage: 92,
        branch: 'Main Center (Bagru)',
      },
      {
        fullName: 'Aryan Mehta',
        admissionNumber: 'ADM-2025-002',
        rollNumber: 'SAU-04-002',
        fatherName: 'Vikas Mehta',
        motherName: 'Priya Mehta',
        phone: '9816112233',
        parentPhone: '8894190175',
        email: 'aryan.m@gmail.com',
        password: studentHashedPass,
        address: 'Ward No 4, Civil Lines, HP',
        className: '12th (+2)',
        academicStage: 'S4',
        course: 'Non-Medical (PCM)',
        batch: '2024-2026',
        semester: 'Semester 3',
        subjects: ['Physics IIT-JEE Prep'],
        monthlyFee: 3000,
        feesPaid: false,
        paidTillMonth: 'June 2026',
        status: 'Active',
        attendancePercentage: 86,
        branch: 'Main Center (Bagru)',
      },
    ]);
    console.log(`✓ Seeded ${students.length} Student Profiles`);

    // 8. Seed Fee Payments
    const feePayments = await FeePayment.insertMany([
      {
        student: students[0]._id,
        studentName: students[0].fullName,
        rollNumber: students[0].rollNumber,
        className: 'S2',
        amountPaid: 2500,
        monthlyFee: 2500,
        pendingAmount: 0,
        paymentDate: new Date(),
        monthYear: 'July 2026',
        paymentMode: 'UPI',
        receiptNumber: 'REC-2026-0001',
        transactionId: 'UPI-987654321',
        remarks: 'Monthly tuition fee',
      },
    ]);
    console.log(`✓ Seeded ${feePayments.length} Fee Payments`);

    // 9. Seed Attendance
    await Attendance.insertMany([
      { student: students[0]._id, rollNumber: students[0].rollNumber, studentName: students[0].fullName, date: new Date(), status: 'Present', subject: 'Mathematics Advanced' },
      { student: students[1]._id, rollNumber: students[1].rollNumber, studentName: students[1].fullName, date: new Date(), status: 'Present', subject: 'Physics IIT-JEE Prep' },
    ]);
    console.log(`✓ Seeded Attendance Records`);

    // 10. Seed Marks
    await Marks.insertMany([
      {
        student: students[0]._id,
        rollNumber: students[0].rollNumber,
        studentName: students[0].fullName,
        className: '10th',
        examName: 'Mid-Term Board Mock 2026',
        subject: 'Mathematics Advanced',
        obtainedMarks: 94,
        maxMarks: 100,
        percentage: 94.0,
        grade: 'A+',
      },
    ]);
    console.log(`✓ Seeded Exam Marks`);

    // 11. Seed Announcements
    await Announcement.insertMany([
      {
        title: 'Mid-Term Board Preparatory Examination',
        content: 'Comprehensive 3-hour examination scheduled for next week.',
        category: 'Exam',
        targetClass: 'All',
        authorName: 'Jitender Sharma (Director)',
        publishedDate: '2026-07-28',
      },
    ]);
    console.log(`✓ Seeded Announcements`);

    console.log('\n🎉 MongoDB database seeded successfully with complete dynamic relational records!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

if (process.argv[1]?.includes('seed.js')) {
  seedData();
}
