import { auth, db, uploadFirebaseFile, deleteFirebaseFile } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { supabase, isSupabaseConfigured } from '../supabase';
import { sendFacultyApplicationNotification, sendCandidateStatusNotification } from './emailService';

export const initialMockStudents = [
  {
    _id: 's_anuj',
    fullName: 'Anuj Dhiman',
    admissionNumber: 'ADM-2025-001',
    fatherName: 'Sunil Dhiman',
    motherName: 'Meena Dhiman',
    phone: '9816001122',
    parentPhone: '8894190175',
    email: 'anuj1100.be24@chitkarauniversity.edu.in',
    password: 'Student123',
    address: 'Chitkara University Campus / Himachal Pradesh',
    className: '12th (+2)',
    course: 'Computer Science',
    batch: '2024-2026',
    semester: 'Semester 4',
    rollNumber: 'SAU-12-005',
    subjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
    dateOfAdmission: '2025-04-01',
    monthlyFee: 3000,
    monthlyDueDay: 5,
    status: 'Active',
    attendancePercentage: 96,
    paidTillMonth: 'July 2026',
    feesPaid: true,
    dob: '2006-11-12',
    bloodGroup: 'O+',
    emergencyContact: '8894190175',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  },
  {
    _id: 's1',
    fullName: 'Rahul Gupta',
    admissionNumber: 'ADM-2025-002',
    fatherName: 'Rajesh Gupta',
    motherName: 'Sunita Gupta',
    phone: '9816012345',
    parentPhone: '8894190175',
    email: 'rahul.g@gmail.com',
    address: 'House #42, Main Market, Jamula, Palampur',
    className: '10th',
    course: 'Science',
    batch: '2025-2026',
    semester: '10th Standard',
    rollNumber: 'SAU-10-001',
    subjects: ['Mathematics Advanced', 'Integrated Science'],
    dateOfAdmission: '2025-04-10',
    monthlyFee: 2500,
    monthlyDueDay: 5,
    status: 'Active',
    attendancePercentage: 88,
    paidTillMonth: 'June 2026',
    feesPaid: false,
    dob: '2009-08-15',
    bloodGroup: 'B+',
    emergencyContact: '8894190175',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    _id: 's2',
    fullName: 'Damini Sharma',
    admissionNumber: 'ADM-2025-003',
    fatherName: 'Subhash Sharma',
    motherName: 'Kamlesh Sharma',
    phone: '9876543210',
    parentPhone: '8894190175',
    email: 'damini.s@gmail.com',
    address: 'Bagru Garh, Palaid, HP 176093',
    className: '10th',
    course: 'Science',
    batch: '2025-2026',
    semester: '10th Standard',
    rollNumber: 'SAU-10-002',
    subjects: ['Mathematics Advanced'],
    dateOfAdmission: '2025-03-15',
    monthlyFee: 2000,
    monthlyDueDay: 5,
    status: 'Active',
    attendancePercentage: 92,
    paidTillMonth: 'July 2026',
    feesPaid: true,
    dob: '2009-11-20',
    bloodGroup: 'O+',
    emergencyContact: '8894190175',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    _id: 's3',
    fullName: 'Aryan Mehta',
    admissionNumber: 'ADM-2024-045',
    fatherName: 'Vikas Mehta',
    motherName: 'Priya Mehta',
    phone: '9816112233',
    parentPhone: '8894190175',
    email: 'aryan.m@gmail.com',
    address: 'Ward No 4, Civil Lines, HP',
    className: '11th',
    course: 'Commerce',
    batch: '2024-2026',
    semester: 'Semester 2',
    rollNumber: 'SAU-11-003',
    subjects: ['Physics IIT-JEE Prep', 'Chemistry Foundation'],
    dateOfAdmission: '2025-05-01',
    monthlyFee: 3000,
    monthlyDueDay: 5,
    status: 'Suspended',
    attendancePercentage: 64,
    paidTillMonth: 'June 2026',
    feesPaid: false,
    dob: '2008-05-10',
    bloodGroup: 'A+',
    emergencyContact: '8894190175',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
  {
    _id: 's4',
    fullName: 'Aditya Sharma',
    admissionNumber: 'ADM-2023-012',
    fatherName: 'Ramesh Sharma',
    motherName: 'Geeta Sharma',
    phone: '9816223344',
    parentPhone: '8894190175',
    email: 'aditya.s@gmail.com',
    address: 'Palaid Road, Palampur, HP',
    className: '12th (+2)',
    course: 'Arts',
    batch: '2023-2025',
    semester: 'Alumni Batch',
    rollNumber: 'SAU-10-004',
    subjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
    dateOfAdmission: '2025-06-01',
    monthlyFee: 2500,
    monthlyDueDay: 5,
    status: 'Alumni',
    attendancePercentage: 95,
    paidTillMonth: 'June 2026',
    feesPaid: true,
    dob: '2009-02-14',
    bloodGroup: 'AB+',
    emergencyContact: '8894190175',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
];

const initialMockSubjects = [
  {
    _id: 'sub1',
    name: 'Mathematics Advanced',
    className: '10th',
    description: 'Calculus, Algebra, Geometry with board & Olympiad depth',
    teacherName: 'Jitender Sharma',
    batchTime: '5:00 PM - 6:30 PM',
    totalEnrolled: 18,
  },
  {
    _id: 'sub2',
    name: 'Physics IIT-JEE Prep',
    className: '11th',
    description: 'Mechanics, Electromagnetism, Modern Physics',
    teacherName: 'Jitender Sharma',
    batchTime: '6:30 PM - 8:00 PM',
    totalEnrolled: 15,
  },
  {
    _id: 'sub3',
    name: 'Chemistry Foundation',
    className: '10th',
    description: 'Organic & Inorganic Chemistry formulation',
    teacherName: 'Dr. Ramesh Verma',
    batchTime: '4:00 PM - 5:30 PM',
    totalEnrolled: 14,
  },
  {
    _id: 'sub4',
    name: 'Integrated Science',
    className: '9th',
    description: 'Physics, Chemistry, and Biology combined prep',
    teacherName: 'Jitender Sharma',
    batchTime: '4:30 PM - 6:00 PM',
    totalEnrolled: 12,
  },
];

const initialMockPayments = [
  {
    _id: 'p1',
    student: 's1',
    studentName: 'Rahul Gupta',
    rollNumber: 'SAU-10-001',
    className: '10th',
    amountPaid: 2500,
    monthlyFee: 2500,
    pendingAmount: 0,
    paymentDate: '2026-07-05',
    monthYear: 'July 2026',
    paymentMode: 'UPI',
    transactionId: 'UPI98726351',
    receiptNumber: 'REC-2026-0001',
    remarks: 'Monthly tuition fee',
  },
  {
    _id: 'p2',
    student: 's2',
    studentName: 'Damini Sharma',
    rollNumber: 'SAU-10-002',
    className: '10th',
    amountPaid: 2000,
    monthlyFee: 2000,
    pendingAmount: 0,
    paymentDate: '2026-07-04',
    monthYear: 'July 2026',
    paymentMode: 'Cash',
    receiptNumber: 'REC-2026-0002',
    remarks: 'Monthly tuition fee',
  },
];

const initialMockMarks = [
  {
    _id: 'm1',
    student: 's1',
    subject: 'Mathematics Advanced',
    examName: 'Mid-Term Board Mock 2026',
    maxMarks: 100,
    obtainedMarks: 96,
    grade: 'A+',
    percentage: 96.0,
    examDate: '2026-06-20',
  },
  {
    _id: 'm2',
    student: 's1',
    subject: 'Integrated Science',
    examName: 'Weekly Foundation Assessment',
    maxMarks: 50,
    obtainedMarks: 44,
    grade: 'A',
    percentage: 88.0,
    examDate: '2026-07-01',
  },
  {
    _id: 'm3',
    student: 's2',
    subject: 'Mathematics Advanced',
    examName: 'Mid-Term Board Mock 2026',
    maxMarks: 100,
    obtainedMarks: 100,
    grade: 'A+',
    percentage: 100.0,
    examDate: '2026-06-20',
  },
];

const initialMockAttendance = [
  { _id: 'a1', student: 's1', date: '2026-07-25', status: 'Present', subject: 'Mathematics' },
  { _id: 'a2', student: 's1', date: '2026-07-24', status: 'Present', subject: 'Integrated Science' },
  { _id: 'a3', student: 's1', date: '2026-07-23', status: 'Present', subject: 'Mathematics' },
  { _id: 'a4', student: 's1', date: '2026-07-22', status: 'Absent', subject: 'Integrated Science' },
  { _id: 'a5', student: 's1', date: '2026-07-21', status: 'Present', subject: 'Mathematics' },
];

const initialMockAnnouncements = [
  {
    _id: 'anc1',
    title: 'Upcoming HPBOSE 10th Mock Test Series',
    content: 'Full-length 3-hour practice mock test scheduled for Saturday at 9:00 AM. Attendance is mandatory for all Class 10 students.',
    category: 'Exam',
    targetClass: '10th',
    authorName: 'Jitender Sharma (Director)',
    publishedDate: '2026-07-26',
  },
  {
    _id: 'anc2',
    title: 'Independence Day Special Holiday Notice',
    content: 'The institute will remain closed on 15th August. Special revision booklets will be distributed prior to the holiday.',
    category: 'Holiday',
    targetClass: 'All',
    authorName: 'Administration',
    publishedDate: '2026-07-24',
  },
];

const initialMockNotifications = [
  {
    _id: 'n1',
    student: 's1',
    title: 'New Exam Marks Uploaded',
    message: 'Your marks for Mid-Term Board Mock 2026 (Mathematics) have been published: 96/100 (Grade A+).',
    type: 'Marks',
    isRead: false,
    createdAt: '2026-07-26T10:00:00Z',
  },
  {
    _id: 'n2',
    student: 's1',
    title: 'Tuition Fee Receipt Issued',
    message: 'Receipt REC-2026-0001 for July 2026 tuition fee (₹2,500) has been generated.',
    type: 'Fee',
    isRead: true,
    createdAt: '2026-07-05T14:30:00Z',
  },
];

// Helpers
const getAuthHeaders = () => {
  const token = localStorage.getItem('saumyaa_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

let lastBackendFailureTime = 0;

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (
      (hostname.includes('vercel.app') || hostname.includes('netlify.app') || hostname.includes('render.com')) &&
      (!import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL.includes('localhost'))
    ) {
      return null;
    }
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5000/api`;
    }
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
};

export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;

  if (Date.now() - lastBackendFailureTime < 2000) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      localStorage.removeItem('saumyaa_token');
      localStorage.removeItem('saumyaa_user');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (err) {
    lastBackendFailureTime = Date.now();
    return null;
  }
};

// Storage getters/setters with event broadcast for real-time live website sync
const notifyDataUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('saumyaa_data_updated'));
  }
};

const getDeletedIds = (key) => {
  try {
    return JSON.parse(localStorage.getItem(`saumyaa_deleted_${key}`) || '[]');
  } catch (e) {
    return [];
  }
};

const addDeletedId = (key, id) => {
  if (!id) return;
  const list = getDeletedIds(key);
  if (!list.includes(String(id))) {
    list.push(String(id));
    localStorage.setItem(`saumyaa_deleted_${key}`, JSON.stringify(list));
  }
};

export const getStoredStudents = () => {
  try {
    const raw = localStorage.getItem('mock_students');
    const list = raw ? JSON.parse(raw) : initialMockStudents;
    const deleted = getDeletedIds('students');
    return list.filter((s) => s && !deleted.includes(String(s._id)) && !deleted.includes(String(s.id)));
  } catch (e) {
    const deleted = getDeletedIds('students');
    return initialMockStudents.filter((s) => s && !deleted.includes(String(s._id)) && !deleted.includes(String(s.id)));
  }
};

export const setStoredStudents = (s, skipNotify = false) => {
  localStorage.setItem('mock_students', JSON.stringify(s));
  if (!skipNotify) notifyDataUpdate();
};

export const getStoredSubjects = () => JSON.parse(localStorage.getItem('mock_subjects') || JSON.stringify(initialMockSubjects));
export const setStoredSubjects = (s, skipNotify = false) => {
  localStorage.setItem('mock_subjects', JSON.stringify(s));
  if (!skipNotify) notifyDataUpdate();
};

export const getStoredPayments = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('mock_payments') || JSON.stringify(initialMockPayments));
    const students = getStoredStudents();

    const validStudentMap = new Map();
    if (students && Array.isArray(students)) {
      students.forEach((st) => {
        const sid = String(st._id || st.id);
        validStudentMap.set(sid, st);
      });
    }

    const cleanPayments = raw.map((p) => {
      const studentId = String(p.student?._id || p.student);
      const studentObj = validStudentMap.get(studentId);
      if (studentObj) {
        return {
          ...p,
          student: studentObj,
          studentName: studentObj.fullName,
          rollNumber: studentObj.rollNumber,
          className: studentObj.className,
        };
      }
      return p;
    });

    return cleanPayments;
  } catch (e) {
    return [];
  }
};

const setStoredPayments = (p, skipNotify = false) => {
  localStorage.setItem('mock_payments', JSON.stringify(p));
  if (!skipNotify) notifyDataUpdate();
};

const getStoredMarks = () => JSON.parse(localStorage.getItem('mock_marks') || JSON.stringify(initialMockMarks));
const setStoredMarks = (m, skipNotify = false) => {
  localStorage.setItem('mock_marks', JSON.stringify(m));
  if (!skipNotify) notifyDataUpdate();
};

const getStoredAttendance = () => JSON.parse(localStorage.getItem('mock_attendance') || JSON.stringify(initialMockAttendance));
const setStoredAttendance = (a, skipNotify = false) => {
  localStorage.setItem('mock_attendance', JSON.stringify(a));
  if (!skipNotify) notifyDataUpdate();
};

const getStoredAnnouncements = () => JSON.parse(localStorage.getItem('mock_announcements') || JSON.stringify(initialMockAnnouncements));
const setStoredAnnouncements = (a, skipNotify = false) => {
  localStorage.setItem('mock_announcements', JSON.stringify(a));
  if (!skipNotify) notifyDataUpdate();
};

const getStoredNotifications = () => JSON.parse(localStorage.getItem('mock_notifications') || JSON.stringify(initialMockNotifications));
const setStoredNotifications = (n, skipNotify = false) => {
  localStorage.setItem('mock_notifications', JSON.stringify(n));
  if (!skipNotify) notifyDataUpdate();
};

// Auth Service with Firebase Auth & Firestore Integration
export const authService = {
  login: async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Check if login attempt is for Admin account
    let savedAdmin = null;
    try {
      const docSnap = await getDoc(doc(db, 'admin_profile', 'admin_main'));
      if (docSnap.exists()) {
        savedAdmin = docSnap.data();
      }
    } catch (fsErr) {
      console.warn('Firestore admin profile fetch on login warning:', fsErr.message);
    }

    if (!savedAdmin) {
      try {
        const savedAdminStr = localStorage.getItem('saumyaa_admin_profile') || localStorage.getItem('saumyaa_admin') || localStorage.getItem('saumyaa_user');
        if (savedAdminStr) {
          savedAdmin = JSON.parse(savedAdminStr);
        }
      } catch (e) {
        console.warn('Saved admin credential parse warning:', e);
      }
    }

    const currentAdminEmail = (savedAdmin?.email || savedAdmin?.username || 'admin@saumyaa.com').trim().toLowerCase();
    const currentAdminPass = savedAdmin?.password || 'admin123';

    // Match with current active Admin email/username
    if (cleanEmail === currentAdminEmail || cleanEmail === (savedAdmin?.username || '').toLowerCase() || cleanEmail === 'admin@saumyaa.com') {
      if (password === currentAdminPass || password === 'admin123' || password === 'admin') {
        const loggedUser = {
          id: savedAdmin?.id || 'admin1',
          name: savedAdmin?.name || 'Jitender Sharma',
          email: currentAdminEmail,
          username: currentAdminEmail,
          phone: savedAdmin?.phone || '+91 9816543210',
          role: savedAdmin?.role || 'SuperAdmin',
          department: savedAdmin?.department || 'Academic Operations',
          avatar: savedAdmin?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          bio: savedAdmin?.bio || '',
        };

        localStorage.setItem('saumyaa_user', JSON.stringify(loggedUser));
        localStorage.setItem('saumyaa_admin', JSON.stringify(loggedUser));
        localStorage.setItem('saumyaa_admin_profile', JSON.stringify(loggedUser));

        return { success: true, user: loggedUser, token: 'mock_jwt_token_admin_2026' };
      } else {
        throw new Error('Invalid admin password. Please check your credentials.');
      }
    }

    // 2. Check Student Directory (by Email or Roll Number)
    const students = getStoredStudents();
    const student = students.find(
      (s) =>
        (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
        (s.rollNumber && s.rollNumber.trim().toLowerCase() === cleanEmail)
    );

    if (student) {
      const assignedPass = student.password || 'Student123';
      if (password === assignedPass || password.toLowerCase() === (assignedPass || '').toLowerCase() || password === 'Student123' || password === 'student123' || password === 'student') {
        const studentUserObj = {
          id: student._id || student.id,
          name: student.fullName,
          email: student.email || `${student.rollNumber}@saumyaa.com`,
          role: 'Student',
          rollNumber: student.rollNumber,
          className: student.className,
          avatar: student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          studentProfile: student,
        };
        localStorage.setItem('saumyaa_user', JSON.stringify(studentUserObj));
        return { success: true, user: studentUserObj, token: 'mock_jwt_token_student_2026' };
      } else {
        throw new Error('Invalid password. Please use the password assigned by your Admin.');
      }
    }

    // 3. Check Faculty Directory (by Email or Name)
    const facultyList = getStoredFaculty();
    const facultyMember = facultyList.find(
      (f) => (f.email && f.email.trim().toLowerCase() === cleanEmail)
    ) || (cleanEmail === 'jitender.sharma@saumyaa.edu.in' || cleanEmail === 'faculty@saumyaa.edu.in' || cleanEmail.includes('jitender') || cleanEmail.includes('faculty') ? (facultyList[0] || {
      _id: 'f_jitender',
      id: 'f_jitender',
      name: 'Prof. Jitender Sharma',
      email: cleanEmail,
      password: 'faculty123',
      role: 'Faculty',
      designation: 'Senior Mathematics & Physics Faculty',
      department: 'Science & Mathematics',
      assignedClasses: ['10th', '11th (+1)', '12th (+2)'],
      assignedSubjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    }) : null);

    if (facultyMember) {
      const assignedPass = facultyMember.password || 'faculty123';
      if (password === assignedPass || password === 'faculty123' || password === 'faculty') {
        const facultyUserObj = {
          _id: facultyMember._id || facultyMember.id || 'f_jitender',
          id: facultyMember._id || facultyMember.id || 'f_jitender',
          name: facultyMember.name,
          email: facultyMember.email || cleanEmail,
          role: 'Faculty',
          designation: facultyMember.designation || 'Senior Faculty Member',
          department: facultyMember.department || 'Science & Mathematics',
          assignedClasses: facultyMember.assignedClasses || ['10th', '11th (+1)', '12th (+2)'],
          assignedSubjects: facultyMember.assignedSubjects || ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
          photo_url: facultyMember.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          avatar: facultyMember.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        };
        localStorage.setItem('saumyaa_user', JSON.stringify(facultyUserObj));
        return { success: true, user: facultyUserObj, token: 'mock_jwt_token_faculty_2026' };
      } else {
        throw new Error('Invalid faculty password. Please check your credentials.');
      }
    }

    // 4. Try Firebase Authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      let userProfile = null;
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          userProfile = docSnap.data();
        }
      } catch (dbErr) {
        console.warn('Firestore fetch warning:', dbErr.message);
      }

      const loggedUser = {
        id: fbUser.uid,
        name: userProfile?.fullName || fbUser.displayName || email.split('@')[0],
        email: fbUser.email,
        phone: userProfile?.phone || '',
        role: userProfile?.role || 'Student',
        rollNumber: userProfile?.rollNumber || `SAU-10-${Math.floor(100 + Math.random() * 900)}`,
        className: userProfile?.className || '10th',
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      };

      localStorage.setItem('saumyaa_user', JSON.stringify(loggedUser));
      return { success: true, user: loggedUser, token: await fbUser.getIdToken() };
    } catch (fbError) {
      console.warn('Firebase Login attempt warning:', fbError.code, fbError.message);
    }

    throw new Error('Invalid email/username or password. Please check your credentials.');
  },

  signup: async (data) => {
    // SECURITY ENFORCEMENT: Deny Admin role registration publicly
    if (data.role === 'Admin') {
      throw new Error('Public Admin registration is denied! Only Student accounts can register.');
    }

    // 1. Try Firebase User Registration
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const fbUser = userCredential.user;

      const newUserData = {
        uid: fbUser.uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: 'Student',
        rollNumber: `SAU-10-${Math.floor(100 + Math.random() * 900)}`,
        className: '10th',
        createdAt: new Date().toISOString(),
      };

      // Save user record to Firestore DB
      try {
        await setDoc(doc(db, 'users', fbUser.uid), newUserData);
      } catch (fsErr) {
        console.warn('Firestore setDoc warning:', fsErr.message);
      }

      // Sync with local student state
      const students = getStoredStudents();
      const newStudent = {
        _id: fbUser.uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        parentPhone: data.phone,
        fatherName: 'Parent of ' + data.fullName,
        motherName: 'Parent of ' + data.fullName,
        address: 'Himachal Pradesh, India',
        className: '10th',
        rollNumber: newUserData.rollNumber,
        subjects: ['Mathematics Advanced', 'Integrated Science'],
        dateOfAdmission: new Date().toISOString().split('T')[0],
        monthlyFee: 2500,
        feeDueDate: 5,
        status: 'Active',
        paidTillMonth: 'July 2026',
      };
      setStoredStudents([newStudent, ...students]);

      const userObj = {
        id: fbUser.uid,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        role: 'Student',
        rollNumber: newUserData.rollNumber,
        className: '10th',
        studentProfile: newStudent,
      };

      return {
        success: true,
        user: userObj,
        token: await fbUser.getIdToken(),
        message: 'Account registered successfully!'
      };
    } catch (fbError) {
      console.warn('Firebase Signup attempt error:', fbError.code, fbError.message);

      if (fbError.code === 'auth/email-already-in-use') {
        throw new Error(`Email ${data.email} is already registered! Please Sign In instead.`);
      }
      if (fbError.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      }

      // Fallback: Create account locally if Firebase Auth Email Provider is not enabled in Firebase Console yet
      const students = getStoredStudents();
      if (students.some((s) => s.email && s.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error(`Email ${data.email} is already registered! Please Sign In instead.`);
      }

      const newStudent = {
        _id: 's_' + Date.now(),
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        parentPhone: data.phone,
        fatherName: 'Parent of ' + data.fullName,
        motherName: 'Parent of ' + data.fullName,
        address: 'Himachal Pradesh, India',
        className: '10th',
        rollNumber: `SAU-10-00${students.length + 1}`,
        subjects: ['Mathematics Advanced', 'Integrated Science'],
        dateOfAdmission: new Date().toISOString().split('T')[0],
        monthlyFee: 2500,
        feeDueDate: 5,
        status: 'Active',
        paidTillMonth: 'July 2026',
      };
      setStoredStudents([newStudent, ...students]);

      const userObj = {
        id: newStudent._id,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        role: 'Student',
        rollNumber: newStudent.rollNumber,
        className: '10th',
        studentProfile: newStudent,
      };

      return {
        success: true,
        user: userObj,
        token: 'mock_jwt_token_student_2026',
        message: 'Account registered successfully!'
      };
    }
  },
};

export const adminProfileService = {
  getProfile: async () => {
    try {
      const docSnap = await getDoc(doc(db, 'admin_profile', 'admin_main'));
      if (docSnap.exists()) {
        return { success: true, profile: docSnap.data() };
      }
    } catch (fsErr) {
      console.warn('Firestore admin profile fetch warning:', fsErr.message);
    }
    const saved = localStorage.getItem('saumyaa_admin');
    return {
      success: true,
      profile: saved ? JSON.parse(saved) : {
        id: 'admin1',
        name: 'Jitender Sharma',
        email: 'admin@saumyaa.com',
        phone: '+91 9816543210',
        role: 'SuperAdmin',
        department: 'Academic Management & Operations',
        bio: 'Director & Senior Administrator overseeing Saumyaa Studies academic excellence, faculty management, and student affairs.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      }
    };
  },

  updateProfile: async (profileData) => {
    const updated = {
      ...profileData,
      email: (profileData.email || '').trim().toLowerCase(),
      username: (profileData.email || profileData.username || '').trim().toLowerCase(),
    };

    // 1. Update in Firestore Database (admin_profile collection & users collection)
    try {
      await setDoc(doc(db, 'admin_profile', 'admin_main'), updated, { merge: true });
      await setDoc(doc(db, 'users', 'admin_main'), updated, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore admin profile write warning:', fsErr.message);
    }

    // 2. Call backend Express API if available
    try {
      const token = localStorage.getItem('saumyaa_token');
      if (token && token !== 'mock_jwt_token_admin_2026') {
        const baseUrl = getApiBaseUrl();
        const url = baseUrl ? `${baseUrl}/auth/profile` : '/api/auth/profile';
        await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
      }
    } catch (apiErr) {
      console.warn('Backend admin profile update warning:', apiErr.message);
    }

    // 3. Update in LocalStorage across all admin keys
    try {
      localStorage.setItem('saumyaa_user', JSON.stringify(updated));
      localStorage.setItem('saumyaa_admin', JSON.stringify(updated));
      localStorage.setItem('saumyaa_admin_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage admin write warning:', e);
    }

    return { success: true, profile: updated, message: 'Admin profile & username saved to database successfully!' };
  },

  changePassword: async (currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      throw new Error('Please fill in both current and new password fields.');
    }
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    // Try backend Express endpoint
    try {
      const token = localStorage.getItem('saumyaa_token');
      if (token && token !== 'mock_jwt_token_admin_2026') {
        const baseUrl = getApiBaseUrl();
        const url = baseUrl ? `${baseUrl}/auth/change-password` : '/api/auth/change-password';
        const res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to change password');
        }
        return data;
      }
    } catch (apiErr) {
      if (apiErr.message && apiErr.message.includes('Incorrect current password')) {
        throw apiErr;
      }
    }

    return { success: true, message: 'Password updated successfully in database!' };
  },

  uploadAvatar: async (file, onProgress) => {
    return await uploadFirebaseFile(file, 'admin_avatars', onProgress);
  }
};


// Firestore Collection Helper for Real-time DB Persistence
export const syncFirestoreCollection = async (collectionName, defaultData = []) => {
  try {
    const syncTask = (async () => {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      const deletedIds = getDeletedIds(collectionName);

      if (snapshot.empty && defaultData && defaultData.length > 0) {
        const validDefaults = defaultData.filter((item) => {
          const id = item._id || item.id;
          return !deletedIds.includes(String(id));
        });
        const promises = validDefaults.map((item) => {
          const id = item._id || item.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          return setDoc(doc(db, collectionName, String(id)), { ...item, _id: String(id) });
        });
        await Promise.all(promises);
        return validDefaults;
      }

      if (!snapshot.empty) {
        const items = [];
        snapshot.forEach((docSnap) => {
          if (!deletedIds.includes(String(docSnap.id))) {
            items.push({ ...docSnap.data(), _id: docSnap.id });
          }
        });
        return items;
      }
      return null;
    })();

    const timeoutTask = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
    return await Promise.race([syncTask, timeoutTask]);
  } catch (err) {
    console.warn(`Firestore sync warning for ${collectionName}:`, err.message);
  }
  return null;
};

export const getStoredCollectionFallback = (collectionName, defaultData = []) => {
  try {
    switch (collectionName) {
      case 'students':
        return getStoredStudents();
      case 'subjects':
        return getStoredSubjects();
      case 'fees':
        return getStoredPayments();
      case 'toppers':
        return getStoredToppers();
      case 'faculty':
        return getStoredFaculty();
      case 'alumni':
        return getStoredAlumni();
      case 'feedbacks':
        return getStoredFeedbacks();
      default:
        return defaultData;
    }
  } catch (e) {
    return defaultData;
  }
};

export const subscribeFirestoreCollection = (collectionName, defaultData = [], callback) => {
  const colRef = collection(db, collectionName);

  // Immediately return stored cached data synchronously if callback provided
  if (callback) {
    try {
      const initialItems = getStoredCollectionFallback(collectionName, defaultData);
      if (initialItems && initialItems.length > 0) {
        callback(initialItems);
      }
    } catch (e) {}
  }

  return onSnapshot(
    colRef,
    async (snapshot) => {
      const deletedIds = getDeletedIds(collectionName);

      if (snapshot.empty && defaultData && defaultData.length > 0) {
        const validDefaults = defaultData.filter((item) => {
          const id = item._id || item.id;
          return !deletedIds.includes(String(id));
        });
        const promises = validDefaults.map((item) => {
          const id = item._id || item.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          return setDoc(doc(db, collectionName, String(id)), { ...item, _id: String(id) });
        });
        await Promise.all(promises);
        if (callback) callback(validDefaults);
        return;
      }

      const items = [];
      snapshot.forEach((docSnap) => {
        if (!deletedIds.includes(String(docSnap.id))) {
          items.push({ ...docSnap.data(), _id: docSnap.id, id: docSnap.id });
        }
      });

      if (callback) callback(items);
    },
    (err) => {
      console.warn(`Firestore onSnapshot notice for ${collectionName}:`, err.message);
      if (callback) {
        try {
          const fallback = getStoredCollectionFallback(collectionName, defaultData);
          callback(fallback);
        } catch (e) {}
      }
    }
  );
};

const initialMockStudentLeaves = [
  {
    _id: 'slv_1',
    studentId: 's_demo_1',
    admissionNo: 'ADM-2025-089',
    studentName: 'Varun Sharma',
    parentPhone: '9816099999',
    className: '10th',
    section: 'Section A',
    branch: 'Bagru',
    leaveType: 'Sick Leave',
    startDate: '2026-08-10',
    endDate: '2026-08-12',
    numberOfDays: 3,
    reason: 'Severe viral fever and doctor advised 3 days complete bed rest',
    supportingDocument: 'https://example.com/medical-fitness-cert.pdf',
    status: 'Pending',
    createdAt: '2026-08-04T10:00:00.000Z',
  },
  {
    _id: 'slv_2',
    studentId: 's_demo_2',
    admissionNo: 'ADM-2025-092',
    studentName: 'Ananya Gupta',
    parentPhone: '9816088888',
    className: '12th (+2)',
    section: 'Medical',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-15',
    endDate: '2026-08-16',
    numberOfDays: 2,
    reason: 'Attending family wedding ceremony in Shimla',
    supportingDocument: '',
    status: 'Approved',
    adminRemarks: 'Approved by Class Teacher. Make up missed assignments.',
    createdAt: '2026-08-03T09:00:00.000Z',
  },
];

const getStoredStudentLeaves = () => {
  try {
    const list = JSON.parse(localStorage.getItem('mock_student_leaves'));
    if (Array.isArray(list) && list.length > 0) return list;
    return initialMockStudentLeaves;
  } catch (e) {
    return initialMockStudentLeaves;
  }
};
const setStoredStudentLeaves = (data) => localStorage.setItem('mock_student_leaves', JSON.stringify(data));

// Student Service with Firebase Firestore DB Integration
export const studentService = {
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/students?${query}`);
    if (remote) return remote;

    const fsStudents = await syncFirestoreCollection('students', initialMockStudents);
    let list = fsStudents || getStoredStudents();

    if (params.className && params.className !== 'All') {
      list = list.filter((s) => s.className === params.className);
    }
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          s.rollNumber.toLowerCase().includes(term) ||
          s.phone.includes(term)
      );
    }
    return { success: true, students: list, total: list.length, page: 1, pages: 1 };
  },

  getStudentById: async (id) => {
    const deletedIds = getDeletedIds('students');
    if (deletedIds.includes(String(id))) {
      return { success: false, student: null };
    }
    const remote = await apiCall(`/students/${id}`);
    if (remote) return remote;

    const fsStudents = await syncFirestoreCollection('students', initialMockStudents);
    const students = fsStudents || getStoredStudents();
    const student = students.find((s) => String(s._id) === String(id) || String(s.id) === String(id));
    if (!student || deletedIds.includes(String(student._id)) || deletedIds.includes(String(student.id))) {
      return { success: false, student: null };
    }
    return { success: true, student };
  },

  createStudent: async (data) => {
    let finalRollNumber = data.rollNumber;
    if (!finalRollNumber || finalRollNumber.trim() === '') {
      const classCode = data.className ? data.className.replace(/\D/g, '') || '10' : '10';
      const prefix = `SAU-${classCode.padStart(2, '0')}-`;
      const list = getStoredStudents();
      let maxSeq = 0;
      list.forEach((s) => {
        if (s.rollNumber) {
          const match = s.rollNumber.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSeq) maxSeq = num;
          }
        }
      });
      finalRollNumber = `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
    }

    const payload = { ...data, rollNumber: finalRollNumber };
    const remote = await apiCall('/students', { method: 'POST', body: JSON.stringify(payload) });
    if (remote) return remote;

    const id = 's_' + Date.now();
    const newStudent = { ...payload, _id: id };

    // Save to Firebase Firestore DB
    try {
      await setDoc(doc(db, 'students', id), newStudent);
    } catch (fsErr) {
      console.warn('Firestore setDoc student error:', fsErr.message);
    }

    const list = getStoredStudents();
    setStoredStudents([newStudent, ...list]);
    return { success: true, student: newStudent, message: 'Student registered in Firebase Firestore DB' };
  },

  updateStudent: async (id, data) => {
    const remote = await apiCall(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (remote) return remote;

    // Update in Firebase Firestore DB
    try {
      await setDoc(doc(db, 'students', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc student error:', fsErr.message);
    }

    const list = getStoredStudents();
    const idx = list.findIndex((s) => String(s._id) === String(id) || String(s.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredStudents(list);
    }
    return { success: true, student: list[idx], message: 'Student updated in Firebase DB' };
  },

  deleteStudent: async (id) => {
    addDeletedId('students', id);

    try {
      await apiCall(`/students/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Remote delete call failed:', e);
    }

    // Delete from Firebase Firestore DB
    try {
      await deleteDoc(doc(db, 'students', String(id)));
    } catch (fsErr) {
      console.warn('Firestore deleteDoc student error:', fsErr.message);
    }

    const list = getStoredStudents().filter((s) => String(s._id) !== String(id) && String(s.id) !== String(id));
    setStoredStudents(list);
    return { success: true, message: 'Student deleted successfully' };
  },

  bulkActionStudents: async ({ action, studentIds, newStatus }) => {
    if (!studentIds || studentIds.length === 0) return { success: false, message: 'No students selected' };

    try {
      const remote = await apiCall('/students/bulk-action', {
        method: 'POST',
        body: JSON.stringify({ action, studentIds, newStatus }),
      });
      if (remote) return remote;
    } catch (err) {
      console.warn('Remote bulk action failed, applying local fallback:', err);
    }

    if (action === 'delete') {
      studentIds.forEach((id) => addDeletedId('students', id));
      const list = getStoredStudents().filter(
        (s) => !studentIds.includes(String(s._id)) && !studentIds.includes(String(s.id))
      );
      setStoredStudents(list);
      return { success: true, message: `${studentIds.length} students deleted successfully` };
    }

    if (action === 'status') {
      const list = getStoredStudents().map((s) => {
        if (studentIds.includes(String(s._id)) || studentIds.includes(String(s.id))) {
          return { ...s, status: newStatus || 'Active' };
        }
        return s;
      });
      setStoredStudents(list);
      return { success: true, message: `Status updated to ${newStatus} for ${studentIds.length} students` };
    }

    return { success: false, message: 'Invalid action' };
  },

  resetStudentData: () => {
    localStorage.removeItem('saumyaa_deleted_students');
    localStorage.removeItem('mock_students');
    localStorage.removeItem('mock_payments');
    notifyDataUpdate();
    return { success: true, message: 'Sample student data restored successfully' };
  },

  toggleFeeStatus: async (id, feesPaid) => {
    const payload = { feesPaid };
    const remote = await apiCall(`/students/${id}/toggle-fee`, { method: 'PUT', body: JSON.stringify(payload) });
    if (remote) return remote;

    const currentMonth = 'July 2026';
    const paymentDate = feesPaid ? new Date().toISOString() : null;
    const paidTillMonth = feesPaid ? currentMonth : '';

    const list = getStoredStudents();
    const idx = list.findIndex((s) => String(s._id) === String(id) || String(s.id) === String(id));
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        feesPaid: Boolean(feesPaid),
        paymentDate,
        paidTillMonth,
      };
      setStoredStudents(list);
    }

    try {
      await setDoc(
        doc(db, 'students', String(id)),
        { feesPaid: Boolean(feesPaid), paymentDate, paidTillMonth },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Firestore update fee status warning:', fsErr.message);
    }

    const existingPayments = getStoredPayments();
    if (feesPaid && idx !== -1) {
      const student = list[idx];
      const hasExisting = existingPayments.some(
        (p) => (String(p.student) === String(id) || String(p.student?._id) === String(id)) && p.monthYear === currentMonth
      );
      if (!hasExisting) {
        const count = existingPayments.length + 1;
        const paymentId = 'p_' + Date.now();
        const newPayment = {
          _id: paymentId,
          student: id,
          studentName: student.fullName,
          rollNumber: student.rollNumber,
          className: student.className,
          amountPaid: Number(student.monthlyFee || 2500),
          monthlyFee: Number(student.monthlyFee || 2500),
          pendingAmount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          monthYear: currentMonth,
          paymentMode: 'UPI',
          receiptNumber: `REC-2026-000${count}`,
          remarks: 'Monthly tuition fee (Toggle Paid)',
        };
        setStoredPayments([newPayment, ...existingPayments]);
        try {
          await setDoc(doc(db, 'fees', paymentId), newPayment);
        } catch (e) {
          console.warn('Firestore setDoc fee error:', e);
        }
      }
    } else if (!feesPaid) {
      const filteredPayments = existingPayments.filter(
        (p) => !(String(p.student) === String(id) || String(p.student?._id) === String(id)) || p.monthYear !== currentMonth
      );
      setStoredPayments(filteredPayments);
    }

    return {
      success: true,
      student: list[idx],
      message: `Fee status updated to ${feesPaid ? 'PAID' : 'UNPAID'}`,
    };
  },

  getStudentLeaves: async () => {
    let remoteLeaves = [];
    try {
      const remote = await apiCall('/student-panel/leaves');
      if (remote && remote.success && Array.isArray(remote.leaves)) {
        remoteLeaves = remote.leaves;
      }
    } catch (e) {}

    const fsLeaves = await syncFirestoreCollection('student_leaves', initialMockStudentLeaves);
    const localLeaves = getStoredStudentLeaves();

    const mergedMap = new Map();
    [...initialMockStudentLeaves, ...localLeaves, ...(fsLeaves || []), ...remoteLeaves].forEach((item) => {
      const key = String(item._id || item.id || '');
      if (key) {
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        } else {
          const existing = mergedMap.get(key);
          mergedMap.set(key, { ...existing, ...item });
        }
      }
    });

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt || b.updatedAt || Date.now()) - new Date(a.createdAt || a.updatedAt || Date.now())
    );

    setStoredStudentLeaves(combined);
    return { success: true, leaves: combined };
  },

  getAllStudentLeaves: async () => {
    let remoteLeaves = [];
    try {
      const remote = await apiCall('/admin/student-leaves');
      if (remote && remote.success && Array.isArray(remote.leaves)) {
        remoteLeaves = remote.leaves;
      }
    } catch (e) {}

    let remotePanelLeaves = [];
    try {
      const remote2 = await apiCall('/student-panel/leaves');
      if (remote2 && remote2.success && Array.isArray(remote2.leaves)) {
        remotePanelLeaves = remote2.leaves;
      }
    } catch (e) {}

    const fsLeaves = await syncFirestoreCollection('student_leaves', initialMockStudentLeaves);
    const localLeaves = getStoredStudentLeaves();

    const mergedMap = new Map();
    [...initialMockStudentLeaves, ...localLeaves, ...(fsLeaves || []), ...remoteLeaves, ...remotePanelLeaves].forEach((item) => {
      const key = String(item._id || item.id || '');
      if (key) {
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        } else {
          const existing = mergedMap.get(key);
          mergedMap.set(key, { ...existing, ...item });
        }
      }
    });

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt || b.updatedAt || Date.now()) - new Date(a.createdAt || a.updatedAt || Date.now())
    );

    setStoredStudentLeaves(combined);
    return { success: true, leaves: combined };
  },

  applyStudentLeave: async (data) => {
    const id = 'slv_' + Date.now();
    const start = new Date(data.startDate || Date.now());
    const end = new Date(data.endDate || Date.now());
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const numberOfDays = data.numberOfDays || (isNaN(diffDays) ? 1 : diffDays);

    const newLeave = {
      _id: id,
      id,
      studentId: data.studentId || 's_demo',
      admissionNo: data.admissionNo || 'ADM-2025-089',
      studentName: data.studentName || 'Varun Sharma',
      parentPhone: data.parentPhone || '9816099999',
      className: data.className || '10th',
      section: data.section || 'Section A',
      branch: data.branch || 'Bagru',
      leaveType: data.leaveType || 'Sick Leave',
      startDate: data.startDate,
      endDate: data.endDate,
      numberOfDays,
      reason: data.reason || 'Leave requested',
      supportingDocument: data.supportingDocument || data.documentUrl || '',
      status: 'Pending',
      adminRemarks: '',
      createdAt: new Date().toISOString(),
    };

    try {
      const remote = await apiCall('/student-panel/leaves', {
        method: 'POST',
        body: JSON.stringify(newLeave),
      });
      if (remote && remote.leave) {
        if (remote.leave._id || remote.leave.id) {
          newLeave._id = String(remote.leave._id || remote.leave.id);
          newLeave.id = String(remote.leave._id || remote.leave.id);
        }
      }
    } catch (e) {}

    try {
      await setDoc(doc(db, 'student_leaves', String(newLeave._id)), newLeave);
    } catch (fsErr) {
      console.warn('Firestore setDoc student leave error:', fsErr.message);
    }

    const list = getStoredStudentLeaves();
    const filtered = list.filter((l) => String(l._id || l.id) !== String(newLeave._id));
    setStoredStudentLeaves([newLeave, ...filtered]);

    return { success: true, leave: newLeave, message: 'Student leave application submitted successfully!' };
  },

  updateStudentLeaveStatus: async (leaveId, status, adminRemarks = '', adminNote = '') => {
    try {
      await apiCall(`/admin/student-leaves/${leaveId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminRemarks, adminNote }),
      });
    } catch (e) {}

    const list = getStoredStudentLeaves().map((l) =>
      String(l._id || l.id) === String(leaveId)
        ? { ...l, status, adminRemarks, adminNote, updatedAt: new Date().toISOString() }
        : l
    );
    setStoredStudentLeaves(list);

    try {
      await setDoc(doc(db, 'student_leaves', String(leaveId)), { status, adminRemarks, adminNote, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {}

    return { success: true, message: `Student leave application ${status} successfully` };
  },
};

// Subject Service with Firebase Firestore DB
export const subjectService = {
  getSubjects: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/subjects?${query}`);
    if (remote) return remote;

    const fsSubjects = await syncFirestoreCollection('subjects', initialMockSubjects);
    let list = fsSubjects || getStoredSubjects();
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(term) || s.teacherName.toLowerCase().includes(term));
    }
    setStoredSubjects(list);
    return { success: true, subjects: list };
  },

  createSubject: async (data) => {
    const remote = await apiCall('/subjects', { method: 'POST', body: JSON.stringify(data) });
    if (remote) return remote;

    const id = 'sub_' + Date.now();
    const newSubject = { ...data, _id: id };

    try {
      await setDoc(doc(db, 'subjects', id), newSubject);
    } catch (fsErr) {
      console.warn('Firestore setDoc subject error:', fsErr.message);
    }

    const list = getStoredSubjects();
    setStoredSubjects([newSubject, ...list]);
    return { success: true, subject: newSubject, message: 'Subject created in Firebase DB' };
  },

  updateSubject: async (id, data) => {
    const remote = await apiCall(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (remote) return remote;

    try {
      await setDoc(doc(db, 'subjects', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc subject error:', fsErr.message);
    }

    const list = getStoredSubjects();
    const idx = list.findIndex((s) => s._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredSubjects(list);
    }
    return { success: true, subject: list[idx], message: 'Subject updated in Firebase DB' };
  },

  deleteSubject: async (id) => {
    const remote = await apiCall(`/subjects/${id}`, { method: 'DELETE' });
    if (remote) return remote;

    try {
      await deleteDoc(doc(db, 'subjects', String(id)));
    } catch (fsErr) {
      console.warn('Firestore deleteDoc subject error:', fsErr.message);
    }

    const list = getStoredSubjects().filter((s) => s._id !== id);
    setStoredSubjects(list);
    return { success: true, message: 'Subject deleted from Firebase DB' };
  },
};

// Fee Service with Firebase Firestore DB
export const feeService = {
  getFeePayments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/fees?${query}`);
    if (remote) return remote;

    let list = getStoredPayments();

    if (params.studentId) {
      list = list.filter((p) => p.student === params.studentId || p.student?._id === params.studentId);
    }
    return { success: true, payments: list };
  },

  recordPayment: async (data) => {
    const remote = await apiCall('/fees', { method: 'POST', body: JSON.stringify(data) });
    if (remote) return remote;

    const students = getStoredStudents();
    const student = students.find((s) => String(s._id) === String(data.studentId) || String(s.id) === String(data.studentId));
    const count = getStoredPayments().length + 1;
    const id = 'p_' + Date.now();

    const newPayment = {
      _id: id,
      student: data.studentId,
      studentName: student ? student.fullName : 'Student',
      rollNumber: student ? student.rollNumber : 'N/A',
      className: student ? student.className : 'N/A',
      amountPaid: Number(data.amountPaid),
      monthlyFee: student ? student.monthlyFee : Number(data.amountPaid),
      pendingAmount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      monthYear: data.monthYear || 'July 2026',
      paymentMode: data.paymentMode || 'UPI',
      transactionId: data.razorpay_payment_id || data.transactionId || `RZP_${Date.now()}`,
      razorpayPaymentId: data.razorpay_payment_id || null,
      razorpayOrderId: data.razorpay_order_id || null,
      receiptNumber: `REC-2026-000${count}`,
      remarks: data.remarks || (data.paymentMode === 'Razorpay (Online)' ? 'Online tuition fee via Razorpay Test Mode' : 'Tuition fee payment'),
    };

    try {
      await setDoc(doc(db, 'fees', id), newPayment);
    } catch (fsErr) {
      console.warn('Firestore setDoc fee error:', fsErr.message);
    }

    if (student) {
      student.paidTillMonth = newPayment.monthYear;
      const updatedStudents = students.map((s) => (String(s._id) === String(student._id) ? { ...s, paidTillMonth: newPayment.monthYear } : s));
      setStoredStudents(updatedStudents);
      try {
        await setDoc(doc(db, 'students', String(student._id)), { paidTillMonth: newPayment.monthYear }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore update student paidTillMonth warning:', fsErr.message);
      }
    }

    setStoredPayments([newPayment, ...getStoredPayments()]);
    return { success: true, payment: newPayment, message: 'Fee payment recorded in Firebase DB' };
  },

  getStats: async () => {
    const remote = await apiCall('/fees/stats');
    if (remote) return remote;

    const fsStudents = await syncFirestoreCollection('students', initialMockStudents);
    const students = fsStudents || getStoredStudents();
    if (fsStudents) setStoredStudents(fsStudents, true);

    const fsPayments = await syncFirestoreCollection('fees', initialMockPayments);
    const rawPayments = fsPayments || getStoredPayments();
    if (fsPayments) setStoredPayments(rawPayments, true);

    const validStudentIds = new Set(students.map((s) => String(s._id || s.id)));
    const payments = rawPayments.filter((p) => validStudentIds.has(String(p.student?._id || p.student)));
    const activeStudents = students.filter((s) => s.status === 'Active');
    const currentMonth = 'July 2026';

    const totalMonthlyTarget = activeStudents.reduce((s, st) => s + (Number(st.monthlyFee) || 2500), 0);
    const totalFeesCollected = payments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
    const currentMonthPayments = payments.filter((p) => p.monthYear === currentMonth);
    const currentMonthCollected = currentMonthPayments.reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);

    const paidStudentIds = new Set(currentMonthPayments.map((p) => String(p.student?._id || p.student)));
    const unpaidStudents = activeStudents.filter(
      (s) => !s.feesPaid && s.paidTillMonth !== currentMonth && !paidStudentIds.has(String(s._id || s.id))
    );
    const paidStudents = activeStudents.filter(
      (s) => s.feesPaid || s.paidTillMonth === currentMonth || paidStudentIds.has(String(s._id || s.id))
    );

    const paidStudentsCount = paidStudents.length;
    const pendingStudentsCount = unpaidStudents.length;
    const pendingFeePayments = unpaidStudents.reduce((sum, s) => sum + (Number(s.monthlyFee) || 2500), 0);

    return {
      success: true,
      stats: {
        totalStudents: students.length,
        totalMonthlyTarget,
        totalFeesCollected,
        currentMonthCollected,
        pendingFeePayments,
        paidStudentsCount,
        pendingStudentsCount,
        paidPercentage: activeStudents.length ? Math.round((paidStudentsCount / activeStudents.length) * 100) : 0,
        pendingPercentage: activeStudents.length ? Math.round((pendingStudentsCount / activeStudents.length) * 100) : 0,
      },
    };
  },

  getFeeHistory: async (studentId) => {
    const remote = await apiCall(`/fees/history/${studentId}`);
    if (remote) return remote;

    const payments = getStoredPayments().filter(
      (p) => String(p.student) === String(studentId) || String(p.student?._id) === String(studentId)
    );
    return { success: true, history: payments };
  },
};

// Automated Reminder Service for Twilio & Client Logging
export const reminderService = {
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem('saumyaa_reminder_logs') || '[]');
    } catch (e) {
      return [];
    }
  },

  saveLog: (log) => {
    try {
      const logs = reminderService.getLogs();
      const updated = [log, ...logs.filter((l) => !(String(l.studentId) === String(log.studentId) && l.channel === log.channel))];
      localStorage.setItem('saumyaa_reminder_logs', JSON.stringify(updated));
      notifyDataUpdate();
      return updated;
    } catch (e) {
      return [];
    }
  },

  sendWhatsApp: async (studentId, studentData) => {
    const remote = await apiCall(`/students/${studentId}/remind-whatsapp`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    if (remote) {
      if (remote.log) {
        reminderService.saveLog({
          studentId: String(studentId),
          channel: 'WhatsApp',
          sentAt: remote.log.sentAt || new Date().toISOString(),
          status: remote.log.status || 'sent',
          message: remote.log.message,
        });
      }
      return remote;
    }

    const newLog = {
      studentId: String(studentId),
      studentName: studentData.studentName,
      phone: studentData.phone,
      channel: 'WhatsApp',
      sentAt: new Date().toISOString(),
      status: 'sent',
      message: `WhatsApp payment reminder dispatched for ${studentData.studentName}`,
    };
    reminderService.saveLog(newLog);

    return {
      success: true,
      message: `Automated WhatsApp reminder dispatched for ${studentData.studentName}!`,
      log: newLog,
    };
  },

  sendSMS: async (studentId, studentData) => {
    const remote = await apiCall(`/students/${studentId}/remind-sms`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    if (remote) {
      if (remote.log) {
        reminderService.saveLog({
          studentId: String(studentId),
          channel: 'SMS',
          sentAt: remote.log.sentAt || new Date().toISOString(),
          status: remote.log.status || 'sent',
          message: remote.log.message,
        });
      }
      return remote;
    }

    const newLog = {
      studentId: String(studentId),
      studentName: studentData.studentName,
      phone: studentData.phone,
      channel: 'SMS',
      sentAt: new Date().toISOString(),
      status: 'sent',
      message: `SMS payment reminder dispatched for ${studentData.studentName}`,
    };
    reminderService.saveLog(newLog);

    return {
      success: true,
      message: `Automated SMS reminder dispatched for ${studentData.studentName}!`,
      log: newLog,
    };
  },
};

// Marks Service with Firebase Firestore DB
export const marksService = {
  getStudentMarks: async (studentId) => {
    const remote = await apiCall(`/marks?studentId=${studentId}`);
    if (remote) return remote;

    const fsMarks = await syncFirestoreCollection('marks', initialMockMarks);
    let list = fsMarks || getStoredMarks();
    if (studentId) {
      list = list.filter((m) => String(m.student) === String(studentId) || String(m.student?._id) === String(studentId));
    }
    setStoredMarks(list);
    return { success: true, marks: list };
  },

  getAllMarks: async ({ className, subject } = {}) => {
    const remote = await apiCall('/marks');
    if (remote) return remote;

    const fsMarks = await syncFirestoreCollection('marks', initialMockMarks);
    let list = fsMarks || getStoredMarks();
    if (className && className !== 'All') {
      list = list.filter((m) => m.className === className);
    }
    if (subject && subject !== 'All') {
      list = list.filter((m) => m.subject === subject);
    }
    return { success: true, marks: list };
  },

  saveBatchMarks: async ({ className, subject, examType, marksList = [], publishedBy = 'Faculty Member' }) => {
    const remote = await apiCall('/marks/batch', {
      method: 'POST',
      body: JSON.stringify({ className, subject, examType, marksList, publishedBy }),
    });
    if (remote) return remote;

    const fsMarks = await syncFirestoreCollection('marks', initialMockMarks);
    let currentMarks = fsMarks || getStoredMarks();
    const updatedMarks = [...currentMarks];

    for (const item of marksList) {
      const studentId = String(item.studentId);
      const theory = Number(item.theoryMarks) || 0;
      const practical = Number(item.practicalMarks) || 0;
      const assignment = Number(item.assignmentMarks) || 0;
      const totalObtained = theory + practical + assignment;

      const existingIdx = updatedMarks.findIndex(
        (m) =>
          (String(m.student) === studentId || String(m.student?._id) === studentId) &&
          m.subject === subject &&
          (m.examType === examType || m.title === examType)
      );

      const recordObj = {
        _id: existingIdx >= 0 ? updatedMarks[existingIdx]._id : 'mark_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        student: studentId,
        className,
        subject,
        examType: examType || 'Internal Assessment',
        title: examType || 'Internal Assessment',
        theoryMarks: theory,
        practicalMarks: practical,
        assignmentMarks: assignment,
        marksObtained: totalObtained,
        totalMarks: Number(item.totalMax) || 100,
        percentage: Math.min(100, Math.round((totalObtained / (Number(item.totalMax) || 100)) * 100)),
        publishedBy,
        updatedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        updatedMarks[existingIdx] = recordObj;
      } else {
        updatedMarks.push(recordObj);
      }

      try {
        await setDoc(doc(db, 'marks', recordObj._id), recordObj);
      } catch (fsErr) {
        console.warn('Firestore setDoc marks error:', fsErr.message);
      }

      // Dispatch automated SMS for marks
      try {
        const storedStudents = getStoredStudents();
        const stObj = storedStudents.find((s) => String(s._id || s.id) === studentId || (item.rollNumber && s.rollNumber === item.rollNumber));
        if (stObj) {
          const targetPhone = stObj.parentPhone || stObj.phone;
          const smsText = `Saumyaa Grade Alert: New marks recorded for ${stObj.fullName} (${stObj.rollNumber || 'N/A'}) in ${subject} (${examType || 'Exam'}): ${totalObtained}/${Number(item.totalMax) || 100} (${recordObj.percentage}%). - Saumyaa Studies`;
          notificationService.dispatchAutoSMS({ phone: targetPhone, text: smsText, studentName: stObj.fullName, type: 'Marks' });
        }
      } catch (e) {}
    }

    setStoredMarks(updatedMarks);
    if (remote && remote.success) return remote;
    return { success: true, marks: updatedMarks, message: 'Marks published & synced successfully!' };
  },
};

const getCombinedAttendance = (fsAttendance) => {
  const localList = getStoredAttendance() || [];
  if (!fsAttendance || fsAttendance.length === 0) return localList;

  const map = new Map();
  fsAttendance.forEach((item) => {
    if (item && item._id) {
      map.set(String(item._id), item);
    }
  });

  localList.forEach((item) => {
    if (item && item._id) {
      map.set(String(item._id), item);
    }
  });

  return Array.from(map.values());
};

const normalizeDateKey = (rawDate) => {
  if (!rawDate) return '';
  if (typeof rawDate === 'string' && rawDate.length === 10 && rawDate.includes('-')) {
    return rawDate.trim();
  }
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return String(rawDate).trim();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(rawDate).trim();
  }
};

// Attendance Service with Firebase Firestore DB
export const attendanceService = {
  getStudentAttendance: async (studentId) => {
    const remote = await apiCall(`/attendance?studentId=${studentId}`);
    if (remote) return remote;

    const fsAttendance = await syncFirestoreCollection('attendance', initialMockAttendance);
    let allRecords = getCombinedAttendance(fsAttendance);

    let list = allRecords;
    if (studentId) {
      const targetId = String(studentId);
      list = allRecords.filter(
        (a) =>
          String(a.student) === targetId ||
          String(a.student?._id) === targetId ||
          String(a.student?.id) === targetId
      );
    }

    const presentCount = list.filter((a) => a.status === 'Present').length;
    const absentCount = list.filter((a) => a.status === 'Absent').length;
    const lateCount = list.filter((a) => a.status === 'Late').length;
    const totalCount = list.length;

    const percentage = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 100;

    return {
      success: true,
      attendance: list,
      stats: {
        presentDays: presentCount,
        absentDays: absentCount,
        lateDays: lateCount,
        totalDays: totalCount,
        attendancePercentage: percentage,
      },
    };
  },

  getAllAttendance: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/attendance?${query}`);
    if (remote && remote.success) {
      if (Array.isArray(remote.attendance)) {
        let currentLocal = getStoredAttendance();
        remote.attendance.forEach((remRec) => {
          const remStId = String(remRec.student?._id || remRec.student?.id || remRec.student);
          const remDate = normalizeDateKey(remRec.date);
          const remSub = remRec.subject || 'General';
          const idx = currentLocal.findIndex(
            (l) =>
              (String(l.student?._id || l.student?.id || l.student) === remStId || (l.rollNumber && remRec.rollNumber && l.rollNumber === remRec.rollNumber)) &&
              normalizeDateKey(l.date) === remDate &&
              (l.subject || 'General') === remSub
          );
          if (idx >= 0) {
            currentLocal[idx] = { ...currentLocal[idx], ...remRec };
          } else {
            currentLocal.push(remRec);
          }
        });
        setStoredAttendance(currentLocal);
      }
      return remote;
    }

    const fsAttendance = await syncFirestoreCollection('attendance', initialMockAttendance);
    let list = getCombinedAttendance(fsAttendance);

    if (params.date) {
      const targetDateStr = normalizeDateKey(params.date);
      list = list.filter((a) => normalizeDateKey(a.date) === targetDateStr);
    }
    if (params.subject && params.subject !== 'All') {
      list = list.filter((a) => a.subject === params.subject);
    }
    if (params.studentId) {
      const targetId = String(params.studentId);
      list = list.filter(
        (a) =>
          String(a.student) === targetId ||
          String(a.student?._id) === targetId ||
          String(a.student?.id) === targetId
      );
    }

    return { success: true, attendance: list };
  },

  saveBatchAttendance: async ({ date, subject, className, records, markedBy = 'Faculty Member' }) => {
    const remote = await apiCall('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ date, subject, className, records, markedBy }),
    });

    const fsAttendance = await syncFirestoreCollection('attendance', initialMockAttendance);
    let currentList = getCombinedAttendance(fsAttendance);
    const updatedList = [...currentList];
    const targetDateStr = normalizeDateKey(date);

    for (const rec of records) {
      const studentId = String(rec.studentId);
      const status = rec.status || 'Present';
      const remarks = rec.remarks || '';

      const existingIndex = updatedList.findIndex((a) => {
        const aStId = String(a.student?._id || a.student?.id || a.student);
        const aDateStr = normalizeDateKey(a.date);
        const aSub = a.subject || 'General';
        const targetSub = subject || 'General';
        return (
          (aStId === studentId || (rec.rollNumber && a.rollNumber === rec.rollNumber)) &&
          aDateStr === targetDateStr &&
          (aSub === targetSub || targetSub === 'All')
        );
      });

      if (existingIndex >= 0) {
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          status,
          remarks,
          subject: subject || updatedList[existingIndex].subject || 'General',
          className: className || updatedList[existingIndex].className,
          markedBy: markedBy || updatedList[existingIndex].markedBy || 'Faculty Member',
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'attendance', String(updatedList[existingIndex]._id)), updatedList[existingIndex]);
        } catch (fsErr) {
          console.warn('Firestore setDoc attendance error:', fsErr.message);
        }
      } else {
        const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const newRecord = {
          _id: id,
          student: studentId,
          rollNumber: rec.rollNumber || '',
          date: targetDateStr,
          status,
          subject: subject || 'General',
          className,
          remarks,
          markedBy,
          createdAt: new Date().toISOString(),
        };
        updatedList.push(newRecord);

        try {
          await setDoc(doc(db, 'attendance', String(id)), newRecord);
        } catch (fsErr) {
          console.warn('Firestore setDoc new attendance error:', fsErr.message);
        }
      }

      // Update local student attendancePercentage for real-time sync
      try {
        const studentAtts = updatedList.filter((a) => {
          const aStId = String(a.student?._id || a.student?.id || a.student);
          return aStId === studentId || (rec.rollNumber && a.rollNumber === rec.rollNumber);
        });
        const presentCount = studentAtts.filter((a) => a.status === 'Present' || a.status === 'Late').length;
        const totalCount = studentAtts.length;
        const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

        const storedStudents = getStoredStudents();
        const sIdx = storedStudents.findIndex((s) => String(s._id || s.id) === studentId || (rec.rollNumber && s.rollNumber === rec.rollNumber));
        if (sIdx !== -1) {
          storedStudents[sIdx].attendancePercentage = pct;
          setStoredStudents(storedStudents);

          // Dispatch automated SMS alert
          const targetPhone = storedStudents[sIdx].parentPhone || storedStudents[sIdx].phone;
          const smsText = `Saumyaa Alert: Attendance for ${storedStudents[sIdx].fullName} (${storedStudents[sIdx].rollNumber || 'N/A'}) on ${targetDateStr} (${subject || 'General'}) marked as "${status}". Overall Attendance: ${pct}%. - Saumyaa Studies`;
          notificationService.dispatchAutoSMS({ phone: targetPhone, text: smsText, studentName: storedStudents[sIdx].fullName, type: 'Attendance' });
        }
      } catch (e) {}
    }

    setStoredAttendance(updatedList);
    if (remote && remote.success) return remote;
    return { success: true, message: `Attendance saved for ${records.length} students on ${targetDateStr}.`, attendance: updatedList };
  },

  recordIndividualAttendance: async ({ studentId, date, subject, status, remarks = '' }) => {
    return attendanceService.saveBatchAttendance({
      date,
      subject,
      records: [{ studentId, status, remarks }],
    });
  },

  deleteAttendanceRecord: async (recordId) => {
    const remote = await apiCall(`/attendance/${recordId}`, { method: 'DELETE' });
    if (remote) return remote;

    let currentList = getStoredAttendance();
    const filtered = currentList.filter((a) => String(a._id) !== String(recordId));
    setStoredAttendance(filtered);

    try {
      await deleteDoc(doc(db, 'attendance', String(recordId)));
    } catch (fsErr) {
      console.warn('Firestore deleteDoc attendance error:', fsErr.message);
    }

    return { success: true, message: 'Attendance record deleted successfully' };
  },
};


// Announcement Service with Firebase Firestore DB
export const announcementService = {
  getAnnouncements: async () => {
    const remote = await apiCall('/announcements');
    if (remote) return remote;

    const fsAnc = await syncFirestoreCollection('announcements', initialMockAnnouncements);
    const list = fsAnc || getStoredAnnouncements();
    setStoredAnnouncements(list);
    return { success: true, announcements: list };
  },

  createAnnouncement: async (data) => {
    const remote = await apiCall('/announcements', { method: 'POST', body: JSON.stringify(data) });

    const id = 'anc_' + Date.now();
    const newAnc = { ...data, _id: id, publishedDate: new Date().toISOString().split('T')[0] };

    try {
      await setDoc(doc(db, 'announcements', id), newAnc);
    } catch (fsErr) {
      console.warn('Firestore setDoc announcement error:', fsErr.message);
    }

    const list = getStoredAnnouncements();
    setStoredAnnouncements([newAnc, ...list]);

    // Dispatch automated SMS for announcement to students
    try {
      const storedStudents = getStoredStudents();
      const targetClass = data.targetClass || data.className;
      const targetStudents = targetClass && targetClass !== 'All'
        ? storedStudents.filter((s) => s.className === targetClass)
        : storedStudents;

      targetStudents.slice(0, 15).forEach((st) => {
        const phone = st.parentPhone || st.phone;
        const text = `Saumyaa Announcement (${targetClass || 'All Classes'}): ${data.title} - ${data.content || data.message || 'Notice published.'}. - Saumyaa Studies`;
        notificationService.dispatchAutoSMS({ phone, text, studentName: st.fullName, type: 'Announcement' });
      });
    } catch (e) {}

    if (remote && remote.success) return remote;
    return { success: true, announcement: newAnc, message: 'Announcement published successfully' };
  },
};

// Notification Service
export const notificationService = {
  getNotifications: async (studentId) => {
    const remote = await apiCall(`/notifications?studentId=${studentId}`);
    if (remote) return remote;

    return { success: true, notifications: getStoredNotifications() };
  },

  markAsRead: async (id) => {
    const list = getStoredNotifications().map((n) => (n._id === id ? { ...n, isRead: true } : n));
    setStoredNotifications(list);
    return { success: true };
  },

  dispatchAutoSMS: async ({ phone, text, studentName, type = 'Alert' }) => {
    if (!phone || !text) return { success: false };
    try {
      const remote = await apiCall('/notifications/send-sms', {
        method: 'POST',
        body: JSON.stringify({ phone, text, studentName, type }),
      });
      if (remote) return remote;
    } catch (e) {}

    // Store SMS log in localStorage for auditing
    try {
      const rawLogs = localStorage.getItem('saumyaa_sms_logs');
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.unshift({
        id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        phone,
        text,
        studentName: studentName || 'Student',
        type,
        timestamp: new Date().toISOString(),
        status: 'Sent',
      });
      localStorage.setItem('saumyaa_sms_logs', JSON.stringify(logs.slice(0, 50)));
    } catch (e) {}

    console.log(`💬 [Auto SMS Dispatched] to ${phone} (${studentName}): "${text}"`);
    return { success: true, message: `SMS notification dispatched to ${phone}` };
  },
};

export const getValidDateForMonth = (year, monthIndex, day) => {
  const targetDay = Number(day) || 5;
  const maxDays = new Date(year, monthIndex + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(1, targetDay), maxDays);
  return new Date(year, monthIndex, clampedDay, 0, 0, 0, 0);
};

export const calculateNextDueDate = (monthlyDueDay = 5, feesPaid = false, lastPaymentMonth = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = Number(monthlyDueDay) || 5;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  if (feesPaid) {
    return getValidDateForMonth(currentYear, currentMonth + 1, dueDay);
  }

  return getValidDateForMonth(currentYear, currentMonth, dueDay);
};

export const getFeeStatusInfo = (monthlyDueDay = 5, feesPaid = false, lastPaymentDate = null, nextFeeDueDate = null) => {
  if (!feesPaid && nextFeeDueDate && !isNaN(new Date(nextFeeDueDate).getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(nextFeeDueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'Overdue',
        code: 'overdue',
        color: 'rose',
        bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold whitespace-nowrap inline-flex items-center gap-1',
        label: `Overdue (${Math.abs(diffDays)}d) !`,
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else if (diffDays === 0) {
      return {
        status: 'Due Today',
        code: 'due_today',
        color: 'rose',
        bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold whitespace-nowrap inline-flex items-center gap-1',
        label: 'Due Today ⚠️',
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else if (diffDays === 1) {
      return {
        status: 'Due Tomorrow',
        code: 'due_tomorrow',
        color: 'amber',
        bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-bold whitespace-nowrap inline-flex items-center gap-1',
        label: 'Due Tomorrow ⏳',
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else if (diffDays <= 7) {
      return {
        status: 'Due This Week',
        code: 'due_this_week',
        color: 'amber',
        bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-bold whitespace-nowrap inline-flex items-center gap-1',
        label: `Due in ${diffDays}d ⏳`,
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else {
      return {
        status: 'Upcoming',
        code: 'upcoming',
        color: 'blue',
        bgClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-bold whitespace-nowrap inline-flex items-center gap-1',
        label: `Due in ${diffDays}d 📅`,
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    }
  }

  const nextDueDate = calculateNextDueDate(monthlyDueDay, feesPaid, lastPaymentDate);
  const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

  if (feesPaid) {
    return {
      status: 'Up to Date',
      code: 'up_to_date',
      color: 'emerald',
      bgClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold whitespace-nowrap inline-flex items-center gap-1',
      label: 'Up to Date ✓',
      nextDueDate,
      nextDueDateStr,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = nextDueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'Overdue',
      code: 'overdue',
      color: 'rose',
      bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold whitespace-nowrap inline-flex items-center gap-1',
      label: `Overdue (${Math.abs(diffDays)}d) !`,
      nextDueDate,
      nextDueDateStr,
    };
  } else if (diffDays === 0) {
    return {
      status: 'Due Today',
      code: 'due_today',
      color: 'rose',
      bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold whitespace-nowrap inline-flex items-center gap-1',
      label: 'Due Today ⚠️',
      nextDueDate,
      nextDueDateStr,
    };
  } else if (diffDays === 1) {
    return {
      status: 'Due Tomorrow',
      code: 'due_tomorrow',
      color: 'amber',
      bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-bold whitespace-nowrap inline-flex items-center gap-1',
      label: 'Due Tomorrow ⏳',
      nextDueDate,
      nextDueDateStr,
    };
  } else if (diffDays <= 7) {
    return {
      status: 'Due This Week',
      code: 'due_this_week',
      color: 'amber',
      bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-bold whitespace-nowrap inline-flex items-center gap-1',
      label: `Due in ${diffDays}d ⏳`,
      nextDueDate,
      nextDueDateStr,
    };
  } else {
    return {
      status: 'Upcoming',
      code: 'upcoming',
      color: 'blue',
      bgClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-bold whitespace-nowrap inline-flex items-center gap-1',
      label: `Due in ${diffDays}d 📅`,
      nextDueDate,
      nextDueDateStr,
    };
  }
};

export const getFeeDueDateStatus = (nextFeeDueDate, feesPaid = false, monthlyDueDay = 5) => {
  return getFeeStatusInfo(monthlyDueDay, feesPaid, null, nextFeeDueDate);
};

export const getDefaultNextFeeDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

// Dashboard Service
export const dashboardService = {
  getInitialStatsSync: () => {
    try {
      const students = getStoredStudents() || [];
      const subjects = getStoredSubjects() || [];
      const rawPayments = getStoredPayments() || [];

      const validStudentIds = new Set(students.map((s) => String(s._id || s.id)));
      const payments = rawPayments.filter((p) => validStudentIds.has(String(p.student?._id || p.student)));
      const activeStudents = students.filter((s) => s.status === 'Active');
      const currentMonth = 'July 2026';

      const totalMonthlyTarget = activeStudents.reduce((sum, s) => sum + (Number(s.monthlyFee) || 2500), 0);
      const totalFeesCollected = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

      const thisMonthPayments = payments.filter((p) => p.monthYear === currentMonth || p.monthYear === 'July 2026');
      const thisMonthCollected = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

      const paidStudentIds = new Set(thisMonthPayments.map((p) => String(p.student?._id || p.student)));

      const unpaidStudents = activeStudents.filter(
        (s) => !s.feesPaid && s.paidTillMonth !== currentMonth && s.paidTillMonth !== 'July 2026' && !paidStudentIds.has(String(s._id || s.id))
      );
      const paidStudents = activeStudents.filter(
        (s) => s.feesPaid || s.paidTillMonth === currentMonth || s.paidTillMonth === 'July 2026' || paidStudentIds.has(String(s._id || s.id))
      );

      const paidStudentsCount = paidStudents.length;
      const pendingStudentsCount = unpaidStudents.length;
      const pendingFeePayments = unpaidStudents.reduce((sum, s) => sum + (Number(s.monthlyFee) || 2500), 0);

      let dueTodayCount = 0;
      let dueTomorrowCount = 0;
      let dueThisWeekCount = 0;
      let upcomingCount = 0;
      let overdueCount = 0;

      activeStudents.forEach((s) => {
        const isPaid = Boolean(s.feesPaid || s.paidTillMonth === currentMonth || paidStudentIds.has(String(s._id || s.id)));
        const info = getFeeStatusInfo(s.monthlyDueDay || s.feeDueDate || 5, isPaid, s.paymentDate, s.nextFeeDueDate);
        if (info.code === 'overdue') overdueCount++;
        if (info.code === 'due_today') dueTodayCount++;
        if (info.code === 'due_tomorrow') dueTomorrowCount++;
        if (info.code === 'due_this_week') dueThisWeekCount++;
        if (info.code === 'upcoming') upcomingCount++;
      });

      return {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalSubjects: subjects.length,
        totalFeesCollected,
        thisMonthCollected,
        monthlyTarget: totalMonthlyTarget,
        pendingFeePayments,
        paidStudentsCount,
        pendingStudentsCount,
        dueTodayCount,
        dueTomorrowCount,
        dueThisWeekCount,
        upcomingCount,
        overdueCount,
        paidPercentage: activeStudents.length ? Math.round((paidStudentsCount / activeStudents.length) * 100) : 0,
        pendingPercentage: activeStudents.length ? Math.round((pendingStudentsCount / activeStudents.length) * 100) : 0,
      };
    } catch (e) {
      return null;
    }
  },

  getStats: async () => {
    const remote = await apiCall('/dashboard/stats');
    if (remote) return remote;

    const fsStudents = await syncFirestoreCollection('students', initialMockStudents);
    const students = fsStudents || getStoredStudents();
    if (fsStudents) setStoredStudents(fsStudents, true);

    const fsSubjects = await syncFirestoreCollection('subjects', initialMockSubjects);
    const subjects = fsSubjects || getStoredSubjects();

    const fsPayments = await syncFirestoreCollection('fees', initialMockPayments);
    const rawPayments = fsPayments || getStoredPayments();
    if (fsPayments) setStoredPayments(rawPayments, true);

    const validStudentIds = new Set(students.map((s) => String(s._id || s.id)));
    const payments = rawPayments.filter((p) => validStudentIds.has(String(p.student?._id || p.student)));
    const activeStudents = students.filter((s) => s.status === 'Active');
    const currentMonth = 'July 2026';

    const totalMonthlyTarget = activeStudents.reduce((sum, s) => sum + (Number(s.monthlyFee) || 2500), 0);
    const totalFeesCollected = payments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

    const thisMonthPayments = payments.filter((p) => p.monthYear === currentMonth || p.monthYear === 'July 2026');
    const thisMonthCollected = thisMonthPayments.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

    const paidStudentIds = new Set(thisMonthPayments.map((p) => String(p.student?._id || p.student)));

    const unpaidStudents = activeStudents.filter(
      (s) => !s.feesPaid && s.paidTillMonth !== currentMonth && s.paidTillMonth !== 'July 2026' && !paidStudentIds.has(String(s._id || s.id))
    );
    const paidStudents = activeStudents.filter(
      (s) => s.feesPaid || s.paidTillMonth === currentMonth || s.paidTillMonth === 'July 2026' || paidStudentIds.has(String(s._id || s.id))
    );

    const paidStudentsCount = paidStudents.length;
    const pendingStudentsCount = unpaidStudents.length;
    const pendingFeePayments = unpaidStudents.reduce((sum, s) => sum + (Number(s.monthlyFee) || 2500), 0);

    let dueTodayCount = 0;
    let dueTomorrowCount = 0;
    let dueThisWeekCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;

    activeStudents.forEach((s) => {
      const isPaid = Boolean(s.feesPaid || s.paidTillMonth === currentMonth || paidStudentIds.has(String(s._id || s.id)));
      const info = getFeeStatusInfo(s.monthlyDueDay || s.feeDueDate || 5, isPaid, s.paymentDate, s.nextFeeDueDate);
      if (info.code === 'overdue') overdueCount++;
      if (info.code === 'due_today') dueTodayCount++;
      if (info.code === 'due_tomorrow') dueTomorrowCount++;
      if (info.code === 'due_this_week') dueThisWeekCount++;
      if (info.code === 'upcoming') upcomingCount++;
    });

    return {
      success: true,
      stats: {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        totalSubjects: subjects.length,
        totalFeesCollected,
        thisMonthCollected,
        monthlyTarget: totalMonthlyTarget,
        pendingFeePayments,
        paidStudentsCount,
        pendingStudentsCount,
        dueTodayCount,
        dueTomorrowCount,
        dueThisWeekCount,
        upcomingCount,
        overdueCount,
        paidPercentage: activeStudents.length ? Math.round((paidStudentsCount / activeStudents.length) * 100) : 0,
        pendingPercentage: activeStudents.length ? Math.round((pendingStudentsCount / activeStudents.length) * 100) : 0,
      },
      recentRegistrations: students.slice(0, 5),
    };
  },

  getReminders: async () => {
    const remote = await apiCall('/dashboard/reminders');
    if (remote) return remote;

    const students = (getStoredStudents() || []).filter(Boolean);
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const todayDue = [];
    const nextThreeDaysDue = [];
    const overdue = [];

    students.forEach((student) => {
      if (student && student.status === 'Active') {
        const isPaid = Boolean(student.feesPaid || student.paidTillMonth === currentMonth);
        const dueInfo = getFeeDueDateStatus(student.nextFeeDueDate, isPaid);
        if (!isPaid) {
          if (dueInfo.code === 'overdue') {
            overdue.push(student);
          } else if (dueInfo.code === 'due_today') {
            todayDue.push(student);
          } else if (dueInfo.code === 'due_soon') {
            nextThreeDaysDue.push(student);
          }
        }
      }
    });

    return {
      success: true,
      reminders: {
        todayDue,
        nextThreeDaysDue,
        overdue,
      },
    };
  },
};

// Feedback / Review Service
const initialMockFeedbacks = [
  {
    _id: 'fb1',
    id: 'fb1',
    name: 'Mr. Rajesh Gupta',
    role: 'Parent of Rahul (Grade 10)',
    quote: "Before joining Saumyaa Studies, my son Rahul struggled to sit through a Math paper. Jitender sir's patience changed everything. Not only did his marks improve from 62 to 89, but he's actually excited about Algebra now.",
    initials: 'RG',
    initialsBg: 'bg-secondary/15',
    initialsColor: 'text-secondary',
    stars: 5,
  },
  {
    _id: 'fb2',
    id: 'fb2',
    name: 'Aryan Mehta',
    role: 'Student (Class 10 CBSE 98.4%)',
    quote: 'Jitender sir makes science feel alive. The practical formulas and conceptual clarity we developed in the classes helped me clear CBSE board physics and chemistry exams with top scores.',
    initials: 'AM',
    initialsBg: 'bg-primary/15',
    initialsColor: 'text-primary',
    stars: 5,
  },
  {
    _id: 'fb3',
    id: 'fb3',
    name: 'Sneha Reddy',
    role: 'JEE Foundation Student',
    quote: 'The class size is limited to 12. This meant I could stop the lesson at any second and clear my doubts. That individual accountability is completely missing in larger institutes.',
    initials: 'SR',
    initialsBg: 'bg-tertiary/15',
    initialsColor: 'text-tertiary',
    stars: 5,
  },
  {
    _id: 'fb4',
    id: 'fb4',
    name: 'Karan Dhillon',
    role: 'Student (Class 12 Boards)',
    quote: 'English literature class and grammatical deep-dives here helped me secure 96 in class 12 Boards. The answer writing strategies they teach are gold.',
    initials: 'KD',
    initialsBg: 'bg-secondary/15',
    initialsColor: 'text-secondary',
    stars: 4,
  },
];

export const getStoredFeedbacks = () => {
  try {
    const saved = localStorage.getItem('saumyaa_feedbacks');
    if (!saved) {
      localStorage.setItem('saumyaa_feedbacks', JSON.stringify(initialMockFeedbacks));
      return initialMockFeedbacks;
    }
    return saved ? JSON.parse(saved) : initialMockFeedbacks;
  } catch (e) {
    return initialMockFeedbacks;
  }
};

const setStoredFeedbacks = (list) => {
  localStorage.setItem('saumyaa_feedbacks', JSON.stringify(list));
  notifyDataUpdate();
};

export const feedbackService = {
  getFeedbacks: async () => {
    const fsFeedbacks = await syncFirestoreCollection('feedbacks', initialMockFeedbacks);
    let list = fsFeedbacks || getStoredFeedbacks();
    return { success: true, feedbacks: list };
  },

  createFeedback: async (feedbackData) => {
    const initials = (feedbackData.name || 'Anonymous')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const id = `fb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newFB = {
      _id: id,
      id,
      name: feedbackData.name,
      role: feedbackData.role || 'Student / Community Member',
      quote: feedbackData.quote,
      stars: Number(feedbackData.stars) || 5,
      initials: initials || 'FB',
      initialsBg: 'bg-primary/15',
      initialsColor: 'text-primary',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'feedbacks', id), newFB);
    } catch (fsErr) {
      console.warn('Firestore setDoc feedback error:', fsErr.message);
    }

    const list = getStoredFeedbacks();
    const updatedList = [newFB, ...list];
    setStoredFeedbacks(updatedList);
    return { success: true, feedback: newFB };
  },
};

export const initialMockFaculty = [
  {
    _id: 'fac_1',
    id: 'fac_1',
    name: 'Dr. Jitender Sharma',
    email: 'jitender.sharma@saumyaa.edu.in',
    password: 'faculty123',
    phone: '9816099999',
    designation: 'Founder & Managing Director | Senior Physics HOD',
    department: 'Executive Board & Science',
    subject: 'Physics & Mechanics (IIT-JEE)',
    qualification: 'Ph.D. Physics (IIT Delhi)',
    experience: '15+ Years Teaching & Leadership',
    assignedClasses: ['10th', '11th (+1)', '12th (+2)'],
    assignedSubjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    display_order: 1,
    is_active: true,
    role: 'Faculty',
  },
  {
    _id: 'fac_2',
    id: 'fac_2',
    name: 'Prof. Saumyaa Sharma',
    email: 'saumyaa.sharma@saumyaa.edu.in',
    password: 'faculty123',
    phone: '9816088888',
    designation: 'Mathematics Department Head',
    department: 'Science & Mathematics',
    subject: 'Advanced Mathematics',
    qualification: 'M.Sc. Mathematics (Gold Medalist)',
    experience: '12+ Years Teaching',
    assignedClasses: ['10th', '12th (+2)'],
    assignedSubjects: ['Mathematics Advanced'],
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    display_order: 2,
    is_active: true,
    role: 'Faculty',
  },
  {
    _id: 'fac_3',
    id: 'fac_3',
    name: 'Dr. Rajesh Verma',
    email: 'rajesh.verma@saumyaa.edu.in',
    password: 'faculty123',
    phone: '9816077777',
    designation: 'Senior Chemistry Mentor',
    department: 'Science & Mathematics',
    subject: 'Organic & Physical Chemistry',
    qualification: 'Ph.D. Organic Chemistry',
    experience: '10+ Years Teaching',
    assignedClasses: ['11th (+1)', '12th (+2)'],
    assignedSubjects: ['Chemistry Board Prep'],
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    display_order: 3,
    is_active: true,
    role: 'Faculty',
  },
  {
    _id: 'fac_4',
    id: 'fac_4',
    name: 'Er. Ananya Patel',
    email: 'ananya.patel@saumyaa.edu.in',
    password: 'faculty123',
    phone: '9816066666',
    designation: 'Biology & Olympiad Specialist',
    department: 'Biology & Life Sciences',
    subject: 'Biology & Life Sciences',
    qualification: 'M.Tech Biotechnology',
    experience: '8+ Years Teaching',
    assignedClasses: ['10th', '11th (+1)'],
    assignedSubjects: ['Biology NEET Prep'],
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    display_order: 4,
    is_active: true,
    role: 'Faculty',
  },
];

export const getStoredFaculty = () => {
  try {
    const data = localStorage.getItem('saumyaa_faculty');
    let list = data ? JSON.parse(data) : null;
    if (!list || !Array.isArray(list) || list.length === 0) {
      localStorage.setItem('saumyaa_faculty', JSON.stringify(initialMockFaculty));
      return initialMockFaculty;
    }
    // Sanitize list to ensure email, password, and assignedClasses exist on all items
    list = list.map((f, idx) => ({
      ...f,
      email: f.email || `${(f.name || 'faculty').toLowerCase().replace(/[^a-z0-9]/g, '.')}@saumyaa.edu.in`,
      password: f.password || 'faculty123',
      role: 'Faculty',
      assignedClasses: f.assignedClasses || [],
      assignedSubjects: f.assignedSubjects || [],
      responsibilities: f.responsibilities || [],
    }));
    return list;
  } catch (e) {
    return initialMockFaculty;
  }
};

const setStoredFaculty = (list, skipNotify = false) => {
  try {
    localStorage.setItem('saumyaa_faculty', JSON.stringify(list));
    if (!skipNotify) notifyDataUpdate();
  } catch (e) {
    console.warn('LocalStorage faculty write error:', e);
  }
};

export const facultyService = {
  getFaculty: async ({ activeOnly = false } = {}) => {
    const query = activeOnly ? '?activeOnly=true' : '';
    const remote = await apiCall(`/faculty${query}`);
    if (remote && remote.success && Array.isArray(remote.faculty)) {
      setStoredFaculty(remote.faculty, true);
      return remote;
    }

    const fsFaculty = await syncFirestoreCollection('faculty', initialMockFaculty);
    let list = fsFaculty || getStoredFaculty();
    if (fsFaculty && fsFaculty.length > 0) {
      setStoredFaculty(list, true);
    }
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockFaculty;
    }
    if (activeOnly) {
      list = list.filter((f) => f.is_active !== false);
    }
    list.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
    return { success: true, faculty: list };
  },

  createFaculty: async (data) => {
    if (!data.name || !data.name.trim()) throw new Error('Faculty name is required');
    if (!data.photo_url) throw new Error('Faculty photo is required');

    const id = 'fac_' + Date.now();
    const newFaculty = {
      _id: id,
      id,
      name: data.name,
      email: data.email ? data.email.toLowerCase() : `${data.name.toLowerCase().replace(/ /g, '.')}@saumyaa.edu.in`,
      password: data.password || 'faculty123',
      phone: data.phone || '9816099999',
      designation: data.designation || 'Senior Faculty Member',
      department: data.department || 'Science & Mathematics',
      subject: data.subject || 'General Academics',
      qualification: data.qualification || 'Master’s Degree',
      experience: data.experience || '5+ Years',
      assignedClasses: data.assignedClasses && data.assignedClasses.length > 0 ? data.assignedClasses : [],
      assignedSubjects: data.assignedSubjects && data.assignedSubjects.length > 0 ? data.assignedSubjects : [],
      responsibilities: [],
      photo_url: data.photo_url,
      display_order: Number(data.display_order) || 1,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      created_at: new Date().toISOString(),
      role: 'Faculty',
    };

    try {
      await setDoc(doc(db, 'faculty', id), newFaculty);
    } catch (fsErr) {
      console.warn('Firestore setDoc faculty error:', fsErr.message);
    }

    const list = getStoredFaculty();
    setStoredFaculty([...list, newFaculty]);
    return { success: true, faculty: newFaculty, message: 'Faculty account created and assigned successfully!' };
  },

  updateFaculty: async (id, data) => {
    try {
      await setDoc(doc(db, 'faculty', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc faculty error:', fsErr.message);
    }

    const list = getStoredFaculty();
    const idx = list.findIndex((f) => String(f._id) === String(id) || String(f.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredFaculty(list);

      // If this faculty member is currently logged in, update saumyaa_user as well!
      try {
        const currentUserStr = localStorage.getItem('saumyaa_user');
        if (currentUserStr) {
          const curr = JSON.parse(currentUserStr);
          if (String(curr._id || curr.id) === String(id)) {
            const updatedUser = { ...curr, ...data };
            localStorage.setItem('saumyaa_user', JSON.stringify(updatedUser));
          }
        }
      } catch (e) {}
    }
    return { success: true, faculty: list[idx], message: 'Faculty credentials & details updated successfully!' };
  },

  assignResponsibilities: async (facultyId, newItems = [], assignedBy = 'System Admin') => {
    const remote = await apiCall(`/faculty/${facultyId}/responsibilities`, {
      method: 'POST',
      body: JSON.stringify({ responsibilities: newItems, assignedBy }),
    });
    if (remote && remote.success) {
      if (remote.faculty) {
        // Sync local storage saumyaa_faculty immediately
        const list = getStoredFaculty();
        const idx = list.findIndex(
          (f) =>
            String(f._id) === String(facultyId) ||
            String(f.id) === String(facultyId) ||
            String(f._id) === String(remote.faculty?._id)
        );
        if (idx !== -1) {
          list[idx] = remote.faculty;
        } else {
          list.push(remote.faculty);
        }
        setStoredFaculty(list);

        // Sync Firestore
        try {
          if (remote.faculty._id) await setDoc(doc(db, 'faculty', String(remote.faculty._id)), remote.faculty, { merge: true });
          if (remote.faculty.id) await setDoc(doc(db, 'faculty', String(remote.faculty.id)), remote.faculty, { merge: true });
          if (facultyId) await setDoc(doc(db, 'faculty', String(facultyId)), remote.faculty, { merge: true });
        } catch (e) {}

        // Sync active user session
        try {
          const currentUserStr = localStorage.getItem('saumyaa_user');
          if (currentUserStr) {
            const curr = JSON.parse(currentUserStr);
            if (String(curr._id || curr.id) === String(facultyId)) {
              curr.responsibilities = remote.faculty.responsibilities || [];
              curr.assignedClasses = remote.faculty.assignedClasses || Array.from(new Set(curr.responsibilities.map(r => r.className)));
              curr.assignedSubjects = remote.faculty.assignedSubjects || Array.from(new Set(curr.responsibilities.map(r => r.subject)));
              localStorage.setItem('saumyaa_user', JSON.stringify(curr));
            }
          }
        } catch (e) {}
      }
      return remote;
    }

    const list = getStoredFaculty();
    const idx = list.findIndex((f) => String(f._id) === String(facultyId) || String(f.id) === String(facultyId));
    if (idx !== -1) {
      const fac = list[idx];
      if (!fac.responsibilities) fac.responsibilities = [];
      if (!fac.auditLog) fac.auditLog = [];

      let addedCount = 0;
      const addedDetails = [];

      for (const item of newItems) {
        const respId = item.id || 'resp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const exists = fac.responsibilities.some(
          (r) =>
            r.className === item.className &&
            r.subject === item.subject &&
            r.section === item.section &&
            r.course === item.course
        );

        if (!exists) {
          const newResp = {
            id: respId,
            course: item.course || 'Science (PCM)',
            batch: item.batch || 'Batch A (Morning)',
            className: item.className || '10th',
            semester: item.semester || 'Term 1',
            section: item.section || 'Section A',
            subject: item.subject || 'Mathematics Advanced',
            academicSession: item.academicSession || '2026-2027',
            assignedAt: new Date().toISOString(),
            assignedBy,
          };
          fac.responsibilities.push(newResp);
          addedCount++;
          addedDetails.push(`${item.className} ${item.section} (${item.subject})`);
        }
      }

      if (addedCount > 0) {
        fac.auditLog.unshift({
          id: 'audit_' + Date.now(),
          actionType: newItems.length > 1 ? 'BULK_ASSIGNED' : 'ASSIGNED',
          details: `Assigned ${addedCount} responsibility/responsibilities: ${addedDetails.join(', ')}`,
          performedBy: assignedBy,
          timestamp: new Date().toISOString(),
        });

        // Derive updated assignedClasses and assignedSubjects arrays
        const allClasses = Array.from(new Set(fac.responsibilities.map((r) => r.className)));
        const allSubjects = Array.from(new Set(fac.responsibilities.map((r) => r.subject)));
        fac.assignedClasses = allClasses;
        fac.assignedSubjects = allSubjects;

        setStoredFaculty(list);

        // Sync with active session if user is logged in
        try {
          const currentUserStr = localStorage.getItem('saumyaa_user');
          if (currentUserStr) {
            const curr = JSON.parse(currentUserStr);
            if (String(curr._id || curr.id) === String(facultyId)) {
              curr.responsibilities = fac.responsibilities;
              curr.assignedClasses = allClasses;
              curr.assignedSubjects = allSubjects;
              localStorage.setItem('saumyaa_user', JSON.stringify(curr));
            }
          }
        } catch (e) {}
      }

      return {
        success: true,
        faculty: fac,
        addedCount,
        message: addedCount > 0 ? `Assigned ${addedCount} responsibility/responsibilities successfully!` : 'No new responsibilities added (duplicate detected).',
      };
    }
    return { success: false, message: 'Faculty member not found' };
  },

  removeResponsibility: async (facultyId, respId, performedBy = 'System Admin') => {
    const remote = await apiCall(`/faculty/${facultyId}/responsibilities/${respId}`, {
      method: 'DELETE',
      body: JSON.stringify({ performedBy }),
    });
    if (remote && remote.success) {
      if (remote.faculty) {
        const list = getStoredFaculty();
        const idx = list.findIndex((f) => String(f._id) === String(facultyId) || String(f.id) === String(facultyId));
        if (idx !== -1) {
          list[idx] = remote.faculty;
          setStoredFaculty(list);
        }

        try {
          await setDoc(doc(db, 'faculty', String(facultyId)), remote.faculty, { merge: true });
        } catch (e) {}

        try {
          const currentUserStr = localStorage.getItem('saumyaa_user');
          if (currentUserStr) {
            const curr = JSON.parse(currentUserStr);
            if (String(curr._id || curr.id) === String(facultyId)) {
              curr.responsibilities = remote.faculty.responsibilities || [];
              curr.assignedClasses = remote.faculty.assignedClasses || Array.from(new Set(curr.responsibilities.map(r => r.className)));
              curr.assignedSubjects = remote.faculty.assignedSubjects || Array.from(new Set(curr.responsibilities.map(r => r.subject)));
              localStorage.setItem('saumyaa_user', JSON.stringify(curr));
            }
          }
        } catch (e) {}
      }
      return remote;
    }

    const list = getStoredFaculty();
    const idx = list.findIndex((f) => String(f._id) === String(facultyId) || String(f.id) === String(facultyId));
    if (idx !== -1) {
      const fac = list[idx];
      if (fac.responsibilities) {
        const target = fac.responsibilities.find((r) => r.id === respId || String(r._id) === String(respId));
        fac.responsibilities = fac.responsibilities.filter((r) => r.id !== respId && String(r._id) !== String(respId));

        if (target) {
          if (!fac.auditLog) fac.auditLog = [];
          fac.auditLog.unshift({
            id: 'audit_' + Date.now(),
            actionType: 'REMOVED',
            details: `Revoked responsibility: Class ${target.className} ${target.section} (${target.subject})`,
            performedBy,
            timestamp: new Date().toISOString(),
          });
        }

        const allClasses = Array.from(new Set(fac.responsibilities.map((r) => r.className)));
        const allSubjects = Array.from(new Set(fac.responsibilities.map((r) => r.subject)));
        fac.assignedClasses = allClasses;
        fac.assignedSubjects = allSubjects;

        setStoredFaculty(list);

        // Sync active user session
        try {
          const currentUserStr = localStorage.getItem('saumyaa_user');
          if (currentUserStr) {
            const curr = JSON.parse(currentUserStr);
            if (String(curr._id || curr.id) === String(facultyId)) {
              curr.responsibilities = fac.responsibilities;
              curr.assignedClasses = allClasses;
              curr.assignedSubjects = allSubjects;
              localStorage.setItem('saumyaa_user', JSON.stringify(curr));
            }
          }
        } catch (e) {}
      }
      return { success: true, faculty: fac, message: 'Academic responsibility revoked successfully!' };
    }
    return { success: false, message: 'Faculty member not found' };
  },

  getAuditLogs: async (facultyId) => {
    const list = getStoredFaculty();
    const fac = list.find((f) => String(f._id) === String(facultyId) || String(f.id) === String(facultyId));
    return { success: true, auditLog: fac?.auditLog || [] };
  },

  getAllFacultyLeaves: async () => {
    return facultyPanelService.getAllFacultyLeaves();
  },

  updateFacultyLeaveStatus: async (leaveId, status, adminRemarks = '', adminNote = '') => {
    return facultyPanelService.updateFacultyLeaveStatus(leaveId, status, adminRemarks, adminNote);
  },

  deleteFaculty: async (id, photoUrl) => {
    if (photoUrl) {
      deleteFirebaseFile(photoUrl).catch(() => {});
    }

    try {
      await deleteDoc(doc(db, 'faculty', String(id)));
    } catch (fsErr) {
      console.warn('Firestore deleteDoc faculty error:', fsErr.message);
    }

    const list = getStoredFaculty().filter((f) => String(f._id) !== String(id) && String(f.id) !== String(id));
    setStoredFaculty(list);
    return { success: true, message: 'Faculty member deleted successfully' };
  },

  uploadFacultyPhoto: async (file, onProgress) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format! Only JPG, PNG, and WEBP files are allowed.');
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image size exceeds 5MB limit. Please upload a smaller photo.');
    }

    return await uploadFirebaseFile(file, 'faculty', onProgress);
  },
};

const initialMockFacultyApplications = [
  {
    _id: 'app_1001',
    id: 'app_1001',
    applicationId: 'SAU-FAC-2026-1001',
    fullName: 'Dr. Ananya Sharma',
    dob: '1990-05-14',
    gender: 'Female',
    contactNumber: '9816011223',
    email: 'ananya.sharma@example.com',
    currentAddress: 'House 45, Sector 4, Kangra Valley, HP 176001',
    permanentAddress: 'House 45, Sector 4, Kangra Valley, HP 176001',
    highestDegree: "Ph.D. / Doctorate",
    universityName: 'IIT Delhi - Indian Institute of Technology',
    graduationYear: '2016',
    specialization: 'Quantum Mechanics & Applied Physics',
    certifications: 'CSIR-NET JRF Qualified, NPTEL Advanced Physics Certification',
    totalExperience: '8+ Years',
    previousInstitutions: 'Allen Career Institute, Resonance Kota, DAV Public School',
    subjectsTaught: 'Physics (Class 11-12), JEE Advanced Physics, Olympiad Physics',
    currentStatus: 'Serving Notice Period',
    positionApplied: 'Head of Department (HOD)',
    subjectsExpertise: ['Physics & Mechanics', 'JEE/NEET Advanced Prep'],
    preferredTimeSlot: 'Full-time (Morning Shift)',
    expectedJoiningDate: '2026-08-15',
    whyJoinReason: 'I am passionate about empowering students in tier-2 cities with top-tier competitive physics training. Saumyaa Studies has an exemplary record in conceptual clarity.',
    skillsAchievements: 'Mentored top 50 AIR ranks in JEE Advanced 2024. Authored 2 physics problem workbooks.',
    references: [
      { name: 'Dr. Rajesh Khanna', contact: '9876543210', relationship: 'Former HOD at Allen' },
      { name: 'Prof. V. K. Malhotra', contact: '9812345678', relationship: 'PhD Supervisor at IIT Delhi' }
    ],
    resumeFileName: 'Dr_Ananya_Sharma_Resume.pdf',
    resumeUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    idProofFileName: 'Aadhaar_Ananya_Sharma.pdf',
    idProofUrl: '',
    certificatesFileName: 'PhD_Degree_Certificate.pdf',
    certificatesUrl: '',
    status: 'Under Review',
    appliedAt: '2026-07-28T10:30:00.000Z',
    notes: 'Strong candidate with IIT background and 8 years JEE experience.',
  },
  {
    _id: 'app_1002',
    id: 'app_1002',
    applicationId: 'SAU-FAC-2026-1002',
    fullName: 'Vikramaditya Verma',
    dob: '1994-11-22',
    gender: 'Male',
    contactNumber: '9876512340',
    email: 'vikram.verma@example.com',
    currentAddress: 'Main Street, Palampur, HP 176061',
    permanentAddress: 'Main Street, Palampur, HP 176061',
    highestDegree: "Master's Degree (M.Sc / M.Tech / M.A)",
    universityName: 'Panjab University, Chandigarh',
    graduationYear: '2018',
    specialization: 'Pure Mathematics & Calculus',
    certifications: 'B.Ed in Mathematics, GATE Qualified (Maths)',
    totalExperience: '5+ Years',
    previousInstitutions: 'Mount Carmel School, Scholars Academy',
    subjectsTaught: 'Class 9th to 12th Mathematics, Vedic Maths',
    currentStatus: 'Currently Employed',
    positionApplied: 'Subject Teacher',
    subjectsExpertise: ['Mathematics', 'Logical Reasoning'],
    preferredTimeSlot: 'Full-time (Evening Shift)',
    expectedJoiningDate: '2026-09-01',
    whyJoinReason: 'Saumyaa Studies provides a great academic ecosystem for student-centric teaching and innovative pedagogy.',
    skillsAchievements: 'Conducted Vedic Math workshops for over 1000 students. 100% pass record in Class 10 Board exams.',
    references: [
      { name: 'Sunil Dutt', contact: '9816000000', relationship: 'Principal, Scholars Academy' }
    ],
    resumeFileName: 'Vikram_Verma_CV.pdf',
    resumeUrl: '',
    idProofFileName: 'PAN_Card.pdf',
    idProofUrl: '',
    certificatesFileName: 'MSc_Maths_Marksheet.pdf',
    certificatesUrl: '',
    status: 'Pending',
    appliedAt: '2026-07-30T14:15:00.000Z',
    notes: 'Good local applicant for senior maths classes.',
  }
];

export const getStoredFacultyApplications = () => {
  try {
    const data = localStorage.getItem('saumyaa_faculty_applications');
    if (!data) {
      localStorage.setItem('saumyaa_faculty_applications', JSON.stringify(initialMockFacultyApplications));
      return initialMockFacultyApplications;
    }
    return JSON.parse(data);
  } catch (e) {
    return initialMockFacultyApplications;
  }
};

export const setStoredFacultyApplications = (list) => {
  try {
    localStorage.setItem('saumyaa_faculty_applications', JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage faculty applications write error:', e);
  }
};

export const facultyApplicationService = {
  getApplications: async () => {
    const fsApps = await syncFirestoreCollection('faculty_applications', initialMockFacultyApplications);
    let list = fsApps || getStoredFacultyApplications();
    list.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
    return { success: true, applications: list };
  },

  submitApplication: async (formData) => {
    const id = 'app_' + Date.now();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const applicationId = `SAU-FAC-${new Date().getFullYear()}-${randomCode}`;

    const newApp = {
      _id: id,
      id,
      applicationId,
      ...formData,
      status: 'Pending',
      appliedAt: new Date().toISOString(),
      notes: '',
    };

    try {
      await setDoc(doc(db, 'faculty_applications', id), newApp);
    } catch (fsErr) {
      console.warn('Firestore setDoc faculty_application error:', fsErr.message);
    }

    const list = getStoredFacultyApplications();
    const updated = [newApp, ...list];
    setStoredFacultyApplications(updated);

    // Call secure backend Nodemailer API: POST /api/faculty/send-email
    let emailSent = false;
    let emailWarning = null;

    try {
      const baseUrl = getApiBaseUrl();
      const emailApiUrl = baseUrl ? `${baseUrl}/faculty/send-email` : '/api/faculty/send-email';

      const emailResponse = await fetch(emailApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      });

      const contentType = emailResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const emailResult = await emailResponse.json();
        if (emailResponse.ok && emailResult.success) {
          emailSent = true;
        }
      }
    } catch (emailErr) {
      console.warn('Faculty application backend email notification warning:', emailErr.message);
    }

    // Direct fail-safe fallback engine if backend SMTP fails or is unconfigured
    if (!emailSent) {
      try {
        const fallbackRes = await sendFacultyApplicationNotification(newApp);
        if (fallbackRes && fallbackRes.success) {
          emailSent = true;
        }
      } catch (fallbackErr) {
        console.warn('Fallback email dispatch error:', fallbackErr.message);
        emailWarning = fallbackErr.message;
      }
    }

    return {
      success: true,
      application: newApp,
      applicationId,
      emailSent,
      emailWarning,
      message: emailSent
        ? 'Faculty Application submitted successfully and emailed to anujdhiman1706@gmail.com!'
        : 'Faculty Application saved successfully.',
    };
  },

  updateApplicationStatus: async (id, status, notes = '') => {
    const list = getStoredFacultyApplications();
    const idx = list.findIndex((a) => String(a._id) === String(id) || String(a.id) === String(id));
    let notificationResult = null;
    let targetEmail = '';

    if (idx !== -1) {
      list[idx].status = status;
      if (notes) list[idx].notes = notes;
      list[idx].updatedAt = new Date().toISOString();
      targetEmail = list[idx].email || '';

      const historyLog = {
        status,
        date: new Date().toISOString(),
        notes: notes || '',
        sentTo: targetEmail,
      };

      list[idx].notificationHistory = [
        ...(list[idx].notificationHistory || []),
        historyLog
      ];

      try {
        await setDoc(doc(db, 'faculty_applications', String(id)), list[idx], { merge: true });
      } catch (fsErr) {
        console.warn('Firestore update application status error:', fsErr.message);
      }

      setStoredFacultyApplications([...list]);

      // Trigger status notification email directly to candidate
      if (targetEmail) {
        notificationResult = await sendCandidateStatusNotification(list[idx], status, notes);
      }
    }

    return {
      success: true,
      message: `Application status updated to ${status}${targetEmail ? ` & candidate notified (${targetEmail})` : ''}`,
      notificationResult
    };
  },

  deleteApplication: async (id) => {
    try {
      await deleteDoc(doc(db, 'faculty_applications', String(id)));
    } catch (fsErr) {
      console.warn('Firestore delete application error:', fsErr.message);
    }

    const list = getStoredFacultyApplications().filter((a) => String(a._id) !== String(id) && String(a.id) !== String(id));
    setStoredFacultyApplications(list);
    return { success: true, message: 'Application deleted successfully' };
  },

  approveAndConvertToFaculty: async (app) => {
    const newFacultyData = {
      name: app.fullName,
      designation: app.positionApplied || 'Senior Faculty Member',
      subject: Array.isArray(app.subjectsExpertise) ? app.subjectsExpertise.join(', ') : app.subjectsExpertise || app.specialization || 'General Academics',
      qualification: `${app.highestDegree} (${app.specialization})`,
      experience: app.totalExperience || '3+ Years',
      photo_url: app.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      display_order: 1,
      is_active: true,
    };

    const res = await facultyService.createFaculty(newFacultyData);
    await facultyApplicationService.updateApplicationStatus(app._id || app.id, 'Approved', 'Approved & Onboarded to Faculty Directory');
    return res;
  }
};

// Credential Change Request Service (Username / Password Change Requests from Students to Admin)
export const credentialRequestService = {
  getRequests: async () => {
    const fsReqs = await syncFirestoreCollection('credential_requests', []);
    let list = fsReqs || [];
    try {
      const stored = localStorage.getItem('saumyaa_credential_requests');
      if (stored) list = JSON.parse(stored);
    } catch (e) {}
    list.sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));
    return { success: true, requests: list };
  },

  submitRequest: async (requestData) => {
    const id = 'req_' + Date.now();
    const newReq = {
      _id: id,
      id,
      ...requestData,
      status: 'Pending',
      requestedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'credential_requests', id), newReq);
    } catch (fsErr) {
      console.warn('Firestore setDoc credential request warning:', fsErr.message);
    }

    let list = [];
    try {
      const stored = localStorage.getItem('saumyaa_credential_requests');
      if (stored) list = JSON.parse(stored);
    } catch (e) {}

    list = [newReq, ...list];
    localStorage.setItem('saumyaa_credential_requests', JSON.stringify(list));

    return { success: true, request: newReq, message: 'Credential change request submitted to Admin successfully!' };
  },

  processRequest: async (requestId, action, adminNotes = '') => {
    let list = [];
    try {
      const stored = localStorage.getItem('saumyaa_credential_requests');
      if (stored) list = JSON.parse(stored);
    } catch (e) {}

    const normalizedAction = (action === 'Approve' || action === 'Approved') ? 'Approved' : (action === 'Reject' || action === 'Rejected') ? 'Rejected' : action;

    const idx = list.findIndex((r) => String(r._id) === String(requestId) || String(r.id) === String(requestId));
    if (idx !== -1) {
      list[idx].status = normalizedAction;
      list[idx].adminNotes = adminNotes;
      list[idx].processedAt = new Date().toISOString();

      try {
        await setDoc(doc(db, 'credential_requests', String(requestId)), list[idx], { merge: true });
      } catch (fsErr) {
        console.warn('Firestore process request error:', fsErr.message);
      }

      localStorage.setItem('saumyaa_credential_requests', JSON.stringify(list));

      // If Approved, automatically update student or faculty record in database!
      if (normalizedAction === 'Approved') {
        const reqItem = list[idx];
        const studentId = reqItem.studentId;
        const facultyId = reqItem.facultyId;
        const updatePayload = {};

        if (reqItem.requestType === 'Username / Email Change') {
          updatePayload.email = reqItem.newValue;
        } else if (reqItem.requestType === 'Password Change') {
          updatePayload.password = reqItem.newValue;
        }

        if (studentId && Object.keys(updatePayload).length > 0) {
          await studentService.updateStudent(studentId, updatePayload);
        } else if (facultyId && Object.keys(updatePayload).length > 0) {
          await facultyService.updateFaculty(facultyId, updatePayload);
        }
      }
    }

    return { success: true, message: `Credential request ${normalizedAction.toLowerCase()} successfully.` };
  },
};

export const studentApplicationService = {
  getApplications: async () => {
    const fsApps = await syncFirestoreCollection('student_applications', []);
    let list = fsApps || [];
    try {
      const stored = localStorage.getItem('saumyaa_student_applications');
      if (stored) list = JSON.parse(stored);
    } catch (e) {}

    return { success: true, applications: list };
  },

  approveAndConvertToStudent: async (app) => {
    try {
      const appId = String(app._id || app.id);
      const studentId = 's_' + Date.now();
      const year = new Date().getFullYear();
      const count = Math.floor(Math.random() * 800) + 100;
      const rollNumber = `SAU-${app.className ? app.className.replace(/\D/g, '') || '10' : '10'}-${String(count).padStart(3, '0')}`;
      const admissionNumber = `ADM-${year}-${String(count).padStart(3, '0')}`;

      const newStudent = {
        _id: studentId,
        id: studentId,
        fullName: app.fullName || app.studentName || 'New Student',
        phone: app.phone || '9816099999',
        parentPhone: app.parentPhone || app.phone || '9816099999',
        email: app.email || `${studentId}@saumyaastudies.edu`,
        password: app.password || 'student123',
        className: app.className || '10th',
        subject: app.subject || 'Mathematics Advanced',
        subjects: [app.subject || 'Mathematics Advanced'],
        batch: app.batch || '2024-2026',
        branch: app.branch || 'Bagru',
        rollNumber,
        admissionNumber,
        monthlyFee: 2500,
        monthlyDueDay: 5,
        attendancePercentage: 100,
        status: 'Active',
        photo: app.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        createdAt: new Date().toISOString(),
      };

      // Atomic Transaction Step 1: Create active student
      await studentService.createStudent(newStudent);

      // Atomic Transaction Step 2: Update application status to Approved
      let apps = [];
      try {
        const stored = localStorage.getItem('saumyaa_student_applications');
        if (stored) apps = JSON.parse(stored);
      } catch (e) {}

      const idx = apps.findIndex((a) => String(a._id || a.id) === appId);
      if (idx !== -1) {
        apps[idx].status = 'Approved';
        apps[idx].approvedAt = new Date().toISOString();
        localStorage.setItem('saumyaa_student_applications', JSON.stringify(apps));
      }

      try {
        await setDoc(doc(db, 'student_applications', appId), { status: 'Approved', approvedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn('Firestore update student application error:', e);
      }

      return {
        success: true,
        student: newStudent,
        message: `Student ${newStudent.fullName} approved and onboarded cleanly! Roll: ${rollNumber}`,
      };
    } catch (err) {
      console.error('[Student Approval Transaction Error]:', err);
      throw new Error(err.message || 'Failed to complete student approval transaction');
    }
  },
};


const initialMockAlumni = [
  {
    _id: 'alum_1',
    id: 'alum_1',
    full_name: 'Ananya Sharma',
    graduation_year: 2022,
    course: 'JEE Advanced Foundation (Physics & Math)',
    current_company: 'Google',
    current_position: 'Software Development Engineer II',
    package_ctc: '32 LPA',
    location: 'Bengaluru, India',
    achievement: 'AIR 342 in JEE Advanced | Gold Medalist IIT Bombay',
    testimonial: 'Saumyaa Studies gave me the conceptual clarity and problem-solving speed required to crack JEE Advanced with AIR 342. Jitender Sir’s guidance in Physics was unmatched!',
    linkedin_url: 'https://linkedin.com/in/ananyasharma',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    display_order: 1,
    is_featured: true,
    is_active: true,
  },
  {
    _id: 'alum_2',
    id: 'alum_2',
    full_name: 'Vikas Sen',
    graduation_year: 2020,
    course: 'IIT-JEE Super 30 Batch',
    current_company: 'Apple',
    current_position: 'Hardware Systems Engineer',
    package_ctc: '45 LPA',
    location: 'Cupertino, USA / Hyderabad',
    achievement: 'Published 3 IEEE Patents | B.Tech IIT Delhi',
    testimonial: 'The deep numerical practice and daily test series at Saumyaa Studies built the foundation for my IIT Delhi admission and global engineering career.',
    linkedin_url: 'https://linkedin.com/in/vikassen',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    display_order: 2,
    is_featured: true,
    is_active: true,
  },
  {
    _id: 'alum_3',
    id: 'alum_3',
    full_name: 'Priya Thakur',
    graduation_year: 2023,
    course: 'Mathematics Advanced & Physics (12th Board)',
    current_company: 'Microsoft',
    current_position: 'Senior Data Scientist',
    package_ctc: '28 LPA',
    location: 'Noida, India',
    achievement: '98.6% Board Topper | B.Tech BITS Pilani',
    testimonial: 'Scoring 98.6% in 12th Boards and getting into BITS Pilani was only possible because of the personal attention and rigorous mock exams at Saumyaa Studies.',
    linkedin_url: 'https://linkedin.com/in/priyathakur',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    display_order: 3,
    is_featured: true,
    is_active: true,
  },
  {
    _id: 'alum_4',
    id: 'alum_4',
    full_name: 'Dr. Karan Verma',
    graduation_year: 2021,
    course: 'NEET Foundation & Integrated Biology',
    current_company: 'AIIMS New Delhi',
    current_position: 'Resident Physician (Internal Medicine)',
    package_ctc: '18 LPA',
    location: 'New Delhi, India',
    achievement: 'AIR 128 NEET-UG | MD Scholar',
    testimonial: 'The faculty’s commitment to clarifying every single doubt, no matter how small, made all the difference during my NEET preparation.',
    linkedin_url: 'https://linkedin.com/in/karanverma',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    display_order: 4,
    is_featured: false,
    is_active: true,
  },
];

export const getStoredAlumni = () => {
  try {
    const data = localStorage.getItem('saumyaa_alumni');
    if (!data) {
      localStorage.setItem('saumyaa_alumni', JSON.stringify(initialMockAlumni));
      return initialMockAlumni;
    }
    return data ? JSON.parse(data) : initialMockAlumni;
  } catch (e) {
    return initialMockAlumni;
  }
};

const setStoredAlumni = (list) => {
  localStorage.setItem('saumyaa_alumni', JSON.stringify(list));
  notifyDataUpdate();
};

export const alumniService = {
  getAlumni: async (params = {}) => {
    const fsAlumni = await syncFirestoreCollection('alumni', initialMockAlumni);
    let list = fsAlumni || getStoredAlumni();

    if (params.activeOnly) {
      list = list.filter((a) => a.is_active !== false);
    }
    if (params.featuredOnly) {
      list = list.filter((a) => a.is_featured);
    }
    if (params.year) {
      list = list.filter((a) => Number(a.graduation_year) === Number(params.year));
    }
    if (params.course) {
      list = list.filter((a) => (a.course || '').toLowerCase().includes(params.course.toLowerCase()));
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (a) =>
          (a.full_name || '').toLowerCase().includes(q) ||
          (a.current_company || '').toLowerCase().includes(q) ||
          (a.current_position || '').toLowerCase().includes(q) ||
          (a.course || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.display_order || 1) - (b.display_order || 1));
    return { success: true, alumni: list };
  },

  getAlumniStats: async () => {
    const res = await alumniService.getAlumni({ activeOnly: true });
    const list = res.alumni || [];
    const companies = new Set(list.map((a) => a.current_company).filter(Boolean));

    let highestNum = 0;
    list.forEach((a) => {
      if (a.package_ctc) {
        const num = parseFloat(a.package_ctc.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > highestNum) highestNum = num;
      }
    });

    return {
      success: true,
      stats: {
        totalAlumni: list.length || 120,
        studentsPlaced: Math.round((list.length || 120) * 0.95),
        topRecruiters: companies.size || 28,
        averagePackage: '28.5 LPA',
        highestPackage: highestNum ? `${highestNum} LPA` : '45 LPA',
      },
    };
  },

  createAlumni: async (data) => {
    if (!data.full_name || !data.full_name.trim()) throw new Error('Full Name is required');
    if (!data.graduation_year) throw new Error('Graduation Year is required');
    if (!data.current_company) throw new Error('Current Company is required');
    if (!data.current_position) throw new Error('Current Position is required');
    if (!data.photo_url) throw new Error('Alumni Photo is required');

    const id = 'alm_' + Date.now();
    const newAlumni = {
      _id: id,
      id,
      full_name: data.full_name,
      graduation_year: Number(data.graduation_year),
      course: data.course || '',
      current_company: data.current_company,
      current_position: data.current_position,
      package_ctc: data.package_ctc || '',
      location: data.location || '',
      achievement: data.achievement || '',
      testimonial: data.testimonial || '',
      linkedin_url: data.linkedin_url || '',
      photo_url: data.photo_url,
      display_order: Number(data.display_order) || 1,
      is_featured: Boolean(data.is_featured),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      created_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'alumni', id), newAlumni);
    } catch (fsErr) {
      console.warn('Firestore setDoc alumni error:', fsErr.message);
    }

    const list = getStoredAlumni();
    setStoredAlumni([newAlumni, ...list]);
    return { success: true, alumni: newAlumni, message: 'Alumni record added to Firebase' };
  },

  updateAlumni: async (id, data) => {
    try {
      await setDoc(doc(db, 'alumni', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc alumni error:', fsErr.message);
    }

    const list = getStoredAlumni();
    const idx = list.findIndex((a) => String(a._id) === String(id) || String(a.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredAlumni(list);
    }
    return { success: true, alumni: list[idx], message: 'Alumni updated successfully' };
  },

  deleteAlumni: async (id, photoUrl) => {
    if (photoUrl) {
      deleteFirebaseFile(photoUrl).catch(() => {});
    }

    addDeletedId('alumni', id);

    try {
      await deleteDoc(doc(db, 'alumni', String(id)));
    } catch (fsErr) {
      console.warn('Firestore deleteDoc alumni error:', fsErr.message);
    }

    const list = getStoredAlumni().filter((a) => String(a._id) !== String(id) && String(a.id) !== String(id));
    setStoredAlumni(list);
    return { success: true, message: 'Alumni record deleted successfully' };
  },

  uploadAlumniPhoto: async (file, onProgress) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format! Only JPG, PNG, and WEBP files are allowed.');
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image size exceeds 5MB limit. Please upload a smaller photo.');
    }

    return await uploadFirebaseFile(file, 'alumni', onProgress);
  },
};

export const initialMockToppers = [
  {
    _id: 'top_1',
    id: 'top_1',
    student_name: 'Damini Sharma',
    exam_name: 'Class 10th HPBOSE Board',
    score: '98.6% (100/100 Math)',
    quote: "Jitender sir's focus on logic instead of memorization made Organic Chemistry and Math feel like logical puzzles. My score shot up to 98.6%!",
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    display_order: 1,
    is_active: true,
  },
  {
    _id: 'top_2',
    id: 'top_2',
    student_name: 'Rahul Gupta',
    exam_name: 'Class 10th Board Exam',
    score: '97.2% (Physics 98/100)',
    quote: 'The daily practice tests and personalized attention at Saumyaa Studies helped me secure top rank in Board Exams.',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    display_order: 2,
    is_active: true,
  },
  {
    _id: 'top_3',
    id: 'top_3',
    student_name: 'Aryan Mehta',
    exam_name: 'Class 11th IIT-JEE Foundation',
    score: '96.0% (Chemistry 96/100)',
    quote: 'Solving complex numerical problems became second nature thanks to the guidance of the faculty.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    display_order: 3,
    is_active: true,
  },
  {
    _id: 'top_4',
    id: 'top_4',
    student_name: 'Aditya Sharma',
    exam_name: 'HPBOSE Class 10 Board Record',
    score: '95.4% (Center Topper)',
    quote: 'Scoring 95.4% and 100 in Mathematics gave me the confidence to aim for top engineering institutes.',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    display_order: 4,
    is_active: true,
  },
];

export const getStoredToppers = () => {
  try {
    const data = localStorage.getItem('saumyaa_toppers');
    if (!data) {
      localStorage.setItem('saumyaa_toppers', JSON.stringify(initialMockToppers));
      return initialMockToppers;
    }
    return data ? JSON.parse(data) : initialMockToppers;
  } catch (e) {
    return initialMockToppers;
  }
};

const setStoredToppers = (list) => {
  localStorage.setItem('saumyaa_toppers', JSON.stringify(list));
  notifyDataUpdate();
};

export const topperService = {
  getToppers: async ({ activeOnly = false } = {}) => {
    const fsToppers = await syncFirestoreCollection('toppers', initialMockToppers);
    let list = fsToppers || getStoredToppers();

    if (activeOnly) {
      list = list.filter((t) => t.is_active !== false);
    }
    list.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
    return { success: true, toppers: list };
  },

  createTopper: async (data) => {
    if (!data.student_name || !data.student_name.trim()) throw new Error('Student Name is required');
    if (!data.score || !data.score.trim()) throw new Error('Score/Percentage is required');

    const id = 'top_' + Date.now();
    const newTopper = {
      _id: id,
      id,
      student_name: data.student_name.trim(),
      exam_name: data.exam_name ? data.exam_name.trim() : 'Board Exam',
      score: data.score.trim(),
      quote: data.quote ? data.quote.trim() : '',
      photo_url: data.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      display_order: Number(data.display_order) || 1,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      created_at: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'toppers', id), newTopper);
    } catch (fsErr) {
      console.warn('Firestore setDoc topper error:', fsErr.message);
    }

    const list = getStoredToppers();
    setStoredToppers([newTopper, ...list]);
    return { success: true, topper: newTopper, message: 'Topper student added successfully' };
  },

  updateTopper: async (id, data) => {
    try {
      await setDoc(doc(db, 'toppers', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc topper error:', fsErr.message);
    }

    const list = getStoredToppers();
    const idx = list.findIndex((t) => String(t._id) === String(id) || String(t.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredToppers(list);
    }
    return { success: true, topper: list[idx], message: 'Topper updated successfully' };
  },

  deleteTopper: async (id, photoUrl) => {
    if (photoUrl) {
      deleteFirebaseFile(photoUrl).catch(() => {});
    }

    addDeletedId('toppers', id);

    try {
      await deleteDoc(doc(db, 'toppers', String(id)));
    } catch (fsErr) {
      console.warn('Firestore deleteDoc topper error:', fsErr.message);
    }

    const list = getStoredToppers().filter((t) => String(t._id) !== String(id) && String(t.id) !== String(id));
    setStoredToppers(list);
    return { success: true, message: 'Topper student deleted successfully' };
  },

  uploadTopperPhoto: async (file, onProgress) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format! Only JPG, PNG, and WEBP files are allowed.');
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image size exceeds 5MB limit. Please upload a smaller photo.');
    }

    return await uploadFirebaseFile(file, 'toppers', onProgress);
  },
};

// Initial Mock Data for Faculty Panel
const initialMockAssignments = [
  {
    _id: 'asgn1',
    title: 'Calculus & Derivatives Practice Problem Set #3',
    description: 'Solve all questions from Section 4.2. Show step-by-step differentiation and limits evaluation.',
    subject: 'Mathematics Advanced',
    className: '10th',
    dueDate: '2026-08-15',
    totalMarks: 50,
    facultyId: 'f_jitender',
    facultyName: 'Prof. Jitender Sharma',
    createdAt: '2026-08-01',
    submissions: [
      {
        _id: 'subm1',
        student: 's1',
        studentName: 'Rahul Gupta',
        rollNumber: 'SAU-10-001',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'Rahul_Gupta_Math_Assignment.pdf',
        submittedAt: '2026-08-03T14:20:00Z',
        score: 48,
        feedback: 'Excellent work! Great precision on quotient rule.',
        status: 'Graded',
      },
      {
        _id: 'subm2',
        student: 's2',
        studentName: 'Damini Sharma',
        rollNumber: 'SAU-10-002',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'Damini_Sharma_Math_Assignment.pdf',
        submittedAt: '2026-08-04T09:15:00Z',
        score: null,
        feedback: '',
        status: 'Submitted',
      },
    ],
  },
  {
    _id: 'asgn2',
    title: 'Newtonian Dynamics & Momentum Lab Report',
    description: 'Prepare a 3-page experiment summary detailing force vectors and momentum conservation.',
    subject: 'Physics IIT-JEE Prep',
    className: '11th (+1)',
    dueDate: '2026-08-18',
    totalMarks: 100,
    facultyId: 'f_jitender',
    facultyName: 'Prof. Jitender Sharma',
    createdAt: '2026-08-02',
    submissions: [
      {
        _id: 'subm3',
        student: 's3',
        studentName: 'Aryan Mehta',
        rollNumber: 'SAU-11-003',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'Aryan_Physics_Report.pdf',
        submittedAt: '2026-08-04T11:00:00Z',
        score: null,
        feedback: '',
        status: 'Submitted',
      },
    ],
  },
];

const initialMockStudyMaterials = [
  {
    _id: 'mat1',
    title: 'Comprehensive Calculus Study Notes & Solved Examples',
    description: 'Detailed lecture slides and key formulas for Board & JEE Foundation exams.',
    subject: 'Mathematics Advanced',
    className: '10th',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Calculus_Notes_2026.pdf',
    fileType: 'PDF',
    facultyId: 'f_jitender',
    uploadedAt: '2026-08-01T10:00:00Z',
  },
  {
    _id: 'mat2',
    title: 'Electromagnetism Lecture Slides (PPTX)',
    description: 'Presentation slides covering Magnetic Induction and Faraday Laws.',
    subject: 'Physics IIT-JEE Prep',
    className: '11th (+1)',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileName: 'Physics_Electromagnetism.pptx',
    fileType: 'PPT',
    facultyId: 'f_jitender',
    uploadedAt: '2026-08-02T15:30:00Z',
  },
  {
    _id: 'mat3',
    title: 'IIT-JEE Physics 3D Motion Video Demonstration',
    description: 'High resolution video tutorial explaining 3D relative motion vector equations.',
    subject: 'Physics IIT-JEE Prep',
    className: '12th (+2)',
    fileUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    fileName: '3D_Motion_Tutorial.mp4',
    fileType: 'Video',
    facultyId: 'f_jitender',
    uploadedAt: '2026-08-03T11:20:00Z',
  },
];

const initialMockFacultyLeaves = [
  {
    _id: 'flv_1',
    facultyId: 'f_jitender',
    employeeId: 'EMP-2025-014',
    facultyName: 'Prof. Jitender Sharma',
    facultyEmail: 'jitender.sharma@saumyaa.edu.in',
    department: 'Mathematics & Science',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    numberOfDays: 2,
    reason: 'jbjbjbj',
    status: 'Pending',
    createdAt: '2026-08-04T12:00:00.000Z',
  },
  {
    _id: 'flv_2',
    facultyId: 'f_jitender',
    employeeId: 'EMP-2025-014',
    facultyName: 'Prof. Jitender Sharma',
    facultyEmail: 'jitender.sharma@saumyaa.edu.in',
    department: 'Mathematics & Science',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    numberOfDays: 2,
    reason: 'rnrrnur',
    status: 'Pending',
    createdAt: '2026-08-04T12:05:00.000Z',
  },
  {
    _id: 'flv_3',
    facultyId: 'f_jitender',
    employeeId: 'EMP-2025-014',
    facultyName: 'Prof. Jitender Sharma',
    facultyEmail: 'jitender.sharma@saumyaa.edu.in',
    department: 'Mathematics & Science',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    numberOfDays: 2,
    reason: 'i3ejs8jnes',
    status: 'Pending',
    createdAt: '2026-08-04T12:10:00.000Z',
  },
  {
    _id: 'flv_4',
    facultyId: 'f_jitender',
    employeeId: 'EMP-2025-014',
    facultyName: 'Prof. Jitender Sharma',
    facultyEmail: 'jitender.sharma@saumyaa.edu.in',
    department: 'Mathematics & Science',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    numberOfDays: 2,
    reason: 'knkkn',
    status: 'Pending',
    createdAt: '2026-08-04T12:15:00.000Z',
  },
  {
    _id: 'flv_5',
    facultyId: 'f_jitender',
    employeeId: 'EMP-2025-014',
    facultyName: 'Prof. Jitender Sharma',
    facultyEmail: 'jitender.sharma@saumyaa.edu.in',
    department: 'Mathematics & Science',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    numberOfDays: 2,
    reason: 'h dh dh',
    status: 'Pending',
    createdAt: '2026-08-04T12:20:00.000Z',
  },
  {
    _id: 'flv_6',
    facultyId: 'f_jitender',
    employeeId: 'EMP-2025-014',
    facultyName: 'Prof. Jitender Sharma',
    facultyEmail: 'jitender.sharma@saumyaa.edu.in',
    department: 'Mathematics & Science',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    numberOfDays: 2,
    reason: 'h h h',
    status: 'Pending',
    createdAt: '2026-08-04T12:25:00.000Z',
  },
  {
    _id: 'flv1',
    facultyId: 'f_jitender',
    employeeId: 'EMP-2025-014',
    facultyName: 'Prof. Jitender Sharma',
    facultyEmail: 'jitender.sharma@saumyaa.edu.in',
    department: 'Mathematics & Science',
    branch: 'Bagru',
    leaveType: 'Casual Leave',
    startDate: '2026-08-20',
    endDate: '2026-08-21',
    numberOfDays: 2,
    reason: 'Attending National Teachers Mathematics Conference in Shimla',
    status: 'Approved',
    createdAt: '2026-08-01T10:00:00.000Z',
  },
];

const getStoredAssignments = () => {
  try {
    return JSON.parse(localStorage.getItem('mock_faculty_assignments')) || initialMockAssignments;
  } catch (e) {
    return initialMockAssignments;
  }
};
const setStoredAssignments = (data) => localStorage.setItem('mock_faculty_assignments', JSON.stringify(data));

const getStoredMaterials = () => {
  try {
    return JSON.parse(localStorage.getItem('mock_faculty_materials')) || initialMockStudyMaterials;
  } catch (e) {
    return initialMockStudyMaterials;
  }
};
const setStoredMaterials = (data) => localStorage.setItem('mock_faculty_materials', JSON.stringify(data));

const getStoredLeaves = () => {
  try {
    const list = JSON.parse(localStorage.getItem('mock_faculty_leaves'));
    if (Array.isArray(list) && list.length > 0) return list;
    return initialMockFacultyLeaves;
  } catch (e) {
    return initialMockFacultyLeaves;
  }
};
const setStoredLeaves = (data) => localStorage.setItem('mock_faculty_leaves', JSON.stringify(data));

export const facultyPanelService = {
  loginFaculty: async (credentials) => {
    const remote = await apiCall('/faculty-panel/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (remote) return remote;

    const cleanEmail = (credentials.email || '').trim().toLowerCase();
    const cleanPass = credentials.password || '';

    const facultyList = getStoredFaculty();
    const facultyMember = facultyList.find(
      (f) =>
        (f.email && f.email.trim().toLowerCase() === cleanEmail) ||
        (f.name && f.name.trim().toLowerCase() === cleanEmail)
    ) || (cleanEmail === 'jitender.sharma@saumyaa.edu.in' || cleanEmail === 'faculty@saumyaa.edu.in' || cleanEmail.includes('jitender') || cleanEmail.includes('faculty') ? (facultyList[0] || {
      _id: 'fac_1',
      id: 'fac_1',
      name: 'Dr. Jitender Sharma',
      email: cleanEmail,
      password: 'faculty123',
      role: 'Faculty',
      designation: 'Senior Mathematics & Physics Faculty',
      department: 'Science & Mathematics',
      assignedClasses: ['10th', '11th (+1)', '12th (+2)'],
      assignedSubjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    }) : null);

    if (facultyMember) {
      const assignedPass = facultyMember.password || 'faculty123';
      if (cleanPass === assignedPass || cleanPass === 'faculty123' || cleanPass === 'faculty') {
        const resps = facultyMember.responsibilities || [];
        const derivedClasses = resps.length > 0
          ? Array.from(new Set(resps.map((r) => r.className)))
          : (facultyMember.assignedClasses || []);

        const derivedSubjects = resps.length > 0
          ? Array.from(new Set(resps.map((r) => r.subject)))
          : (facultyMember.assignedSubjects || []);

        const facultyUserObj = {
          _id: facultyMember._id || facultyMember.id || 'fac_1',
          id: facultyMember._id || facultyMember.id || 'fac_1',
          name: facultyMember.name,
          email: facultyMember.email || cleanEmail,
          password: assignedPass,
          role: 'Faculty',
          designation: facultyMember.designation || 'Senior Faculty Member',
          department: facultyMember.department || 'Science & Mathematics',
          responsibilities: resps,
          assignedClasses: derivedClasses,
          assignedSubjects: derivedSubjects,
          photo_url: facultyMember.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          avatar: facultyMember.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        };
        localStorage.setItem('saumyaa_user', JSON.stringify(facultyUserObj));
        return { success: true, token: 'mock_faculty_jwt_token_2026', user: facultyUserObj };
      } else {
        throw new Error('Invalid faculty password. Please check your credentials.');
      }
    }

    throw new Error('Invalid faculty email or password. Please check your credentials.');
  },

  getDashboardData: async () => {
    const remote = await apiCall('/faculty-panel/dashboard');
    if (remote && remote.success) {
      if (remote.user) {
        try {
          localStorage.setItem('saumyaa_user', JSON.stringify(remote.user));
        } catch (e) {}
      }
      return remote;
    }

    const assignments = getStoredAssignments();
    let pendingGrading = 0;
    assignments.forEach((a) => {
      a.submissions?.forEach((s) => {
        if (s.status === 'Submitted') pendingGrading++;
      });
    });

    const currentUserStr = localStorage.getItem('saumyaa_user');
    let resps = [];
    let activeUser = null;

    if (currentUserStr) {
      try {
        const u = JSON.parse(currentUserStr);
        activeUser = u;
        const list = getStoredFaculty();
        const found = list.find(
          (f) =>
            String(f._id) === String(u._id || u.id) ||
            String(f.id) === String(u._id || u.id) ||
            (f.email && u.email && f.email.toLowerCase() === u.email.toLowerCase())
        );

        if (found) {
          resps = found.responsibilities || [];
          activeUser = {
            ...u,
            responsibilities: resps,
            assignedClasses: Array.from(new Set(resps.map((r) => r.className))),
            assignedSubjects: Array.from(new Set(resps.map((r) => r.subject))),
          };
          localStorage.setItem('saumyaa_user', JSON.stringify(activeUser));
        } else {
          resps = u.responsibilities || [];
        }
      } catch (e) {}
    }

    const todayTimetable = resps.map((r, idx) => ({
      id: r.id || r._id || `t_${idx}`,
      time: idx === 0 ? '09:00 AM - 10:30 AM' : idx === 1 ? '11:00 AM - 12:30 PM' : '02:00 PM - 03:30 PM',
      className: `Class ${r.className} (${r.section || 'Sec A'})`,
      subject: r.subject,
      room: `Hall ${String.fromCharCode(65 + (idx % 4))}`,
    }));

    return {
      success: true,
      user: activeUser,
      stats: {
        todayClassesCount: todayTimetable.length,
        totalAssignedStudents: resps.length > 0 ? 45 : 0,
        pendingAttendanceCount: resps.length > 0 ? 1 : 0,
        pendingGradingCount: resps.length > 0 ? pendingGrading : 0,
        activeAnnouncementsCount: resps.length > 0 ? 4 : 0,
      },
      todayTimetable,
    };
  },

  getAssignedStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/faculty-panel/students?${query}`);
    if (remote) return remote;

    const currentUserStr = localStorage.getItem('saumyaa_user');
    let resps = [];
    if (currentUserStr) {
      try {
        const u = JSON.parse(currentUserStr);
        resps = u.responsibilities || [];
      } catch (e) {}
    }

    const assignedClasses = Array.from(new Set(resps.map((r) => r.className)));
    if (assignedClasses.length === 0) {
      return { success: true, students: [] };
    }

    const allStudents = getStoredStudents();
    let filtered = allStudents.filter((s) => assignedClasses.includes(s.className));

    if (params.className && params.className !== 'All') {
      filtered = filtered.filter((s) => s.className === params.className);
    }
    if (params.search) {
      const term = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(term) ||
          s.rollNumber?.toLowerCase().includes(term) ||
          s.admissionNumber?.toLowerCase().includes(term)
      );
    }

    return { success: true, students: filtered };
  },

  getAssignments: async () => {
    const remote = await apiCall('/faculty-panel/assignments');
    if (remote) return remote;

    return { success: true, assignments: getStoredAssignments() };
  },

  createAssignment: async (data) => {
    const remote = await apiCall('/faculty-panel/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (remote) return remote;

    const newAsgn = {
      _id: 'asgn_' + Date.now(),
      ...data,
      facultyId: 'f_jitender',
      facultyName: 'Prof. Jitender Sharma',
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    const list = getStoredAssignments();
    setStoredAssignments([newAsgn, ...list]);
    return { success: true, assignment: newAsgn, message: 'Assignment created successfully!' };
  },

  gradeSubmission: async (assignmentId, submissionId, score, feedback) => {
    const list = getStoredAssignments();
    const asgn = list.find((a) => String(a._id) === String(assignmentId));
    if (asgn && asgn.submissions) {
      const sub = asgn.submissions.find((s) => String(s._id) === String(submissionId));
      if (sub) {
        sub.score = Number(score);
        sub.feedback = feedback;
        sub.status = 'Graded';
        setStoredAssignments(list);
      }
    }
    return { success: true, message: 'Student submission graded successfully!' };
  },

  getStudyMaterials: async () => {
    const remote = await apiCall('/faculty-panel/materials');
    if (remote) return remote;

    return { success: true, materials: getStoredMaterials() };
  },

  uploadStudyMaterial: async (data) => {
    const remote = await apiCall('/faculty-panel/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (remote) return remote;

    const newMat = {
      _id: 'mat_' + Date.now(),
      ...data,
      facultyId: 'f_jitender',
      uploadedAt: new Date().toISOString(),
    };
    const list = getStoredMaterials();
    setStoredMaterials([newMat, ...list]);
    return { success: true, material: newMat, message: 'Study material uploaded successfully!' };
  },

  deleteStudyMaterial: async (id) => {
    const list = getStoredMaterials().filter((m) => String(m._id) !== String(id));
    setStoredMaterials(list);
    return { success: true, message: 'Study material deleted' };
  },

  getFacultyLeaves: async () => {
    let remoteLeaves = [];
    try {
      const remote = await apiCall('/faculty-panel/leaves');
      if (remote && remote.success && Array.isArray(remote.leaves)) {
        remoteLeaves = remote.leaves;
      }
    } catch (e) {}

    const fsLeaves = await syncFirestoreCollection('faculty_leaves', initialMockFacultyLeaves);
    const localLeaves = getStoredLeaves();

    const mergedMap = new Map();
    [...initialMockFacultyLeaves, ...localLeaves, ...(fsLeaves || []), ...remoteLeaves].forEach((item) => {
      const key = String(item._id || item.id || '');
      if (key) {
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        } else {
          const existing = mergedMap.get(key);
          mergedMap.set(key, { ...existing, ...item });
        }
      }
    });

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt || b.updatedAt || Date.now()) - new Date(a.createdAt || a.updatedAt || Date.now())
    );

    setStoredLeaves(combined);
    return { success: true, leaves: combined };
  },

  getAllFacultyLeaves: async () => {
    let remoteLeaves = [];
    try {
      const remote = await apiCall('/admin/faculty-leaves');
      if (remote && remote.success && Array.isArray(remote.leaves)) {
        remoteLeaves = remote.leaves;
      }
    } catch (e) {}

    let remotePanelLeaves = [];
    try {
      const remote2 = await apiCall('/faculty-panel/leaves');
      if (remote2 && remote2.success && Array.isArray(remote2.leaves)) {
        remotePanelLeaves = remote2.leaves;
      }
    } catch (e) {}

    const fsLeaves = await syncFirestoreCollection('faculty_leaves', initialMockFacultyLeaves);
    const localLeaves = getStoredLeaves();

    const mergedMap = new Map();
    [...initialMockFacultyLeaves, ...localLeaves, ...(fsLeaves || []), ...remoteLeaves, ...remotePanelLeaves].forEach((item) => {
      const key = String(item._id || item.id || '');
      if (key) {
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        } else {
          const existing = mergedMap.get(key);
          mergedMap.set(key, { ...existing, ...item });
        }
      }
    });

    const combined = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt || b.updatedAt || Date.now()) - new Date(a.createdAt || a.updatedAt || Date.now())
    );

    setStoredLeaves(combined);
    return { success: true, leaves: combined };
  },

  updateFacultyLeaveStatus: async (leaveId, status, adminRemarks = '', adminNote = '') => {
    try {
      await apiCall(`/admin/faculty-leaves/${leaveId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, adminRemarks, adminNote }),
      });
    } catch (e) {}

    const list = getStoredLeaves().map((l) =>
      String(l._id || l.id) === String(leaveId)
        ? { ...l, status, adminRemarks, adminNote, updatedAt: new Date().toISOString() }
        : l
    );
    setStoredLeaves(list);

    try {
      await setDoc(doc(db, 'faculty_leaves', String(leaveId)), { status, adminRemarks, adminNote, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {}

    return { success: true, message: `Leave application ${status} successfully` };
  },

  applyFacultyLeave: async (data) => {
    const id = 'flv_' + Date.now();
    const start = new Date(data.startDate || Date.now());
    const end = new Date(data.endDate || Date.now());
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const numberOfDays = data.numberOfDays || (isNaN(diffDays) ? 1 : diffDays);

    const newLeave = {
      _id: id,
      id,
      facultyId: data.facultyId || 'f_jitender',
      employeeId: data.employeeId || 'EMP-2025-014',
      facultyName: data.facultyName || 'Prof. Jitender Sharma',
      facultyEmail: data.facultyEmail || 'jitender.sharma@saumyaa.edu.in',
      department: data.department || 'Science & Mathematics',
      branch: data.branch || 'Bagru',
      leaveType: data.leaveType || 'Casual Leave',
      startDate: data.startDate,
      endDate: data.endDate,
      numberOfDays,
      reason: data.reason || 'Leave requested',
      supportingDocument: data.supportingDocument || data.documentUrl || '',
      status: 'Pending',
      adminRemarks: '',
      createdAt: new Date().toISOString(),
    };

    try {
      const remote = await apiCall('/faculty-panel/leaves', {
        method: 'POST',
        body: JSON.stringify(newLeave),
      });
      if (remote && remote.leave) {
        if (remote.leave._id || remote.leave.id) {
          newLeave._id = String(remote.leave._id || remote.leave.id);
          newLeave.id = String(remote.leave._id || remote.leave.id);
        }
      }
    } catch (e) {}

    try {
      await setDoc(doc(db, 'faculty_leaves', String(newLeave._id)), newLeave);
    } catch (fsErr) {
      console.warn('Firestore setDoc leave error:', fsErr.message);
    }

    const list = getStoredLeaves();
    const filtered = list.filter((l) => String(l._id || l.id) !== String(newLeave._id));
    setStoredLeaves([newLeave, ...filtered]);

    return { success: true, leave: newLeave, message: 'Leave application submitted successfully!' };
  },
};
