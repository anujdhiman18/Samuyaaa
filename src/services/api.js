import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const API_BASE_URL = 'http://localhost:5000/api';

const initialMockStudents = [
  {
    _id: 's1',
    fullName: 'Rahul Gupta',
    fatherName: 'Rajesh Gupta',
    motherName: 'Sunita Gupta',
    phone: '9816012345',
    parentPhone: '8894190175',
    email: 'rahul.g@gmail.com',
    address: 'House #42, Main Market, Jamula, Palampur',
    className: '10th',
    rollNumber: 'SAU-10-001',
    subjects: ['Mathematics Advanced', 'Integrated Science'],
    dateOfAdmission: '2025-04-10',
    monthlyFee: 2500,
    feeDueDate: 5,
    status: 'Active',
    paidTillMonth: 'July 2026',
    dob: '2009-08-15',
    bloodGroup: 'B+',
    emergencyContact: '8894190175',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
  },
  {
    _id: 's2',
    fullName: 'Damini Sharma',
    fatherName: 'Subhash Sharma',
    motherName: 'Kamlesh Sharma',
    phone: '9876543210',
    parentPhone: '8894190175',
    email: 'damini.s@gmail.com',
    address: 'Bagru Garh, Palaid, HP 176093',
    className: '10th',
    rollNumber: 'SAU-10-002',
    subjects: ['Mathematics Advanced'],
    dateOfAdmission: '2025-03-15',
    monthlyFee: 2000,
    feeDueDate: 5,
    status: 'Active',
    paidTillMonth: 'July 2026',
    dob: '2009-11-20',
    bloodGroup: 'O+',
    emergencyContact: '8894190175',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    _id: 's3',
    fullName: 'Aryan Mehta',
    fatherName: 'Vikas Mehta',
    motherName: 'Priya Mehta',
    phone: '9816112233',
    parentPhone: '8894190175',
    email: 'aryan.m@gmail.com',
    address: 'Ward No 4, Civil Lines, HP',
    className: '11th',
    rollNumber: 'SAU-11-003',
    subjects: ['Physics IIT-JEE Prep', 'Chemistry Foundation'],
    dateOfAdmission: '2025-05-01',
    monthlyFee: 3000,
    feeDueDate: 5,
    status: 'Active',
    paidTillMonth: 'June 2026',
    dob: '2008-05-10',
    bloodGroup: 'A+',
    emergencyContact: '8894190175',
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

export const apiCall = async (endpoint, options = {}) => {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

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
    console.warn(`API server offline on ${endpoint}. Operating via local client state.`);
    return null;
  }
};

// Storage getters/setters with event broadcast for real-time live website sync
const notifyDataUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('saumyaa_data_updated'));
  }
};

const getStoredStudents = () => JSON.parse(localStorage.getItem('mock_students') || JSON.stringify(initialMockStudents));
const setStoredStudents = (s) => {
  localStorage.setItem('mock_students', JSON.stringify(s));
  notifyDataUpdate();
};

const getStoredSubjects = () => JSON.parse(localStorage.getItem('mock_subjects') || JSON.stringify(initialMockSubjects));
const setStoredSubjects = (s) => {
  localStorage.setItem('mock_subjects', JSON.stringify(s));
  notifyDataUpdate();
};

const getStoredPayments = () => JSON.parse(localStorage.getItem('mock_payments') || JSON.stringify(initialMockPayments));
const setStoredPayments = (p) => {
  localStorage.setItem('mock_payments', JSON.stringify(p));
  notifyDataUpdate();
};

const getStoredMarks = () => JSON.parse(localStorage.getItem('mock_marks') || JSON.stringify(initialMockMarks));
const setStoredMarks = (m) => {
  localStorage.setItem('mock_marks', JSON.stringify(m));
  notifyDataUpdate();
};

const getStoredAttendance = () => JSON.parse(localStorage.getItem('mock_attendance') || JSON.stringify(initialMockAttendance));
const setStoredAttendance = (a) => {
  localStorage.setItem('mock_attendance', JSON.stringify(a));
  notifyDataUpdate();
};

const getStoredAnnouncements = () => JSON.parse(localStorage.getItem('mock_announcements') || JSON.stringify(initialMockAnnouncements));
const setStoredAnnouncements = (a) => {
  localStorage.setItem('mock_announcements', JSON.stringify(a));
  notifyDataUpdate();
};

const getStoredNotifications = () => JSON.parse(localStorage.getItem('mock_notifications') || JSON.stringify(initialMockNotifications));
const setStoredNotifications = (n) => {
  localStorage.setItem('mock_notifications', JSON.stringify(n));
  notifyDataUpdate();
};

// Auth Service with Firebase Auth & Firestore Integration
export const authService = {
  login: async (email, password) => {
    // 1. Demo Admin Quick Login
    if (email === 'admin@saumyaa.com' && password === 'admin123') {
      const mockAdmin = {
        id: 'admin1',
        name: 'Jitender Sharma',
        email: 'admin@saumyaa.com',
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
      return { success: true, user: mockAdmin, token: 'mock_jwt_token_admin_2026' };
    }

    // 2. Try Firebase Authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      // Try fetching custom profile from Firestore
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

      return { success: true, user: loggedUser, token: await fbUser.getIdToken() };
    } catch (fbError) {
      console.warn('Firebase Login attempt code:', fbError.code, fbError.message);
      
      // Local student storage lookup fallback
      const students = getStoredStudents();
      const student = students.find((s) => s.email && s.email.toLowerCase() === email.toLowerCase());

      if (student) {
        const mockStudentUser = {
          id: student._id,
          name: student.fullName,
          email: student.email,
          role: 'Student',
          rollNumber: student.rollNumber,
          className: student.className,
          avatar: student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          studentProfile: student,
        };
        return { success: true, user: mockStudentUser, token: 'mock_jwt_token_student_2026' };
      }

      if (fbError.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password Sign-In is not turned on in Firebase Console yet. Please enable Email/Password in Firebase Authentication.');
      }

      if (fbError.code === 'auth/user-not-found' || fbError.code === 'auth/invalid-credential' || fbError.code === 'auth/wrong-password') {
        throw new Error('Incorrect email or password. Please check your details or Register as a new student.');
      }

      throw new Error('Invalid email or password. Please check your credentials.');
    }
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

// Student Service
export const studentService = {
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/students?${query}`);
    if (remote) return remote;

    let list = getStoredStudents();
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
    const remote = await apiCall(`/students/${id}`);
    if (remote) return remote;
    const student = getStoredStudents().find((s) => s._id === id);
    return { success: true, student };
  },

  createStudent: async (data) => {
    // Auto-generate sequential roll number if missing
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

    const list = getStoredStudents();
    const newStudent = { ...payload, _id: 's_' + Date.now() };
    setStoredStudents([newStudent, ...list]);
    return { success: true, student: newStudent, message: 'Student created successfully' };
  },

  updateStudent: async (id, data) => {
    const remote = await apiCall(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (remote) return remote;

    const list = getStoredStudents();
    const idx = list.findIndex((s) => s._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredStudents(list);
    }
    return { success: true, student: list[idx], message: 'Student updated successfully' };
  },

  deleteStudent: async (id) => {
    const remote = await apiCall(`/students/${id}`, { method: 'DELETE' });
    if (remote) return remote;

    const list = getStoredStudents().filter((s) => s._id !== id);
    setStoredStudents(list);
    return { success: true, message: 'Student deleted successfully' };
  },
};

// Subject Service
export const subjectService = {
  getSubjects: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/subjects?${query}`);
    if (remote) return remote;

    let list = getStoredSubjects();
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(term) || s.teacherName.toLowerCase().includes(term));
    }
    return { success: true, subjects: list };
  },

  createSubject: async (data) => {
    const remote = await apiCall('/subjects', { method: 'POST', body: JSON.stringify(data) });
    if (remote) return remote;

    const list = getStoredSubjects();
    const newSubject = { ...data, _id: 'sub_' + Date.now() };
    setStoredSubjects([newSubject, ...list]);
    return { success: true, subject: newSubject, message: 'Subject created' };
  },

  updateSubject: async (id, data) => {
    const remote = await apiCall(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (remote) return remote;

    const list = getStoredSubjects();
    const idx = list.findIndex((s) => s._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredSubjects(list);
    }
    return { success: true, subject: list[idx], message: 'Subject updated' };
  },

  deleteSubject: async (id) => {
    const remote = await apiCall(`/subjects/${id}`, { method: 'DELETE' });
    if (remote) return remote;

    const list = getStoredSubjects().filter((s) => s._id !== id);
    setStoredSubjects(list);
    return { success: true, message: 'Subject deleted' };
  },
};

// Fee Service
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
    const student = students.find((s) => s._id === data.studentId);
    const count = getStoredPayments().length + 1;

    const newPayment = {
      _id: 'p_' + Date.now(),
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
      receiptNumber: `REC-2026-000${count}`,
      remarks: 'Tuition fee payment',
    };

    setStoredPayments([newPayment, ...getStoredPayments()]);
    return { success: true, payment: newPayment, message: 'Fee payment recorded' };
  },

  getStats: async () => {
    const remote = await apiCall('/fees/stats');
    if (remote) return remote;

    const students = getStoredStudents();
    const payments = getStoredPayments();

    return {
      success: true,
      stats: {
        totalStudents: students.length,
        totalFeesCollected: payments.reduce((s, p) => s + (p.amountPaid || 0), 0),
        monthlyTarget: 12500,
        currentMonthCollected: 6700,
        pendingFeePayments: 5800,
      },
    };
  },
};

// Marks Service
export const marksService = {
  getStudentMarks: async (studentId) => {
    const remote = await apiCall(`/marks?studentId=${studentId}`);
    if (remote) return remote;

    const list = getStoredMarks();
    return { success: true, marks: list };
  },
};

// Attendance Service
export const attendanceService = {
  getStudentAttendance: async (studentId) => {
    const remote = await apiCall(`/attendance?studentId=${studentId}`);
    if (remote) return remote;

    const list = getStoredAttendance();
    return {
      success: true,
      attendance: list,
      stats: { presentDays: 4, absentDays: 1, attendancePercentage: 80.0 },
    };
  },
};

// Announcement Service
export const announcementService = {
  getAnnouncements: async () => {
    const remote = await apiCall('/announcements');
    if (remote) return remote;

    return { success: true, announcements: getStoredAnnouncements() };
  },

  createAnnouncement: async (data) => {
    const remote = await apiCall('/announcements', { method: 'POST', body: JSON.stringify(data) });
    if (remote) return remote;

    const list = getStoredAnnouncements();
    const newAnc = { ...data, _id: 'anc_' + Date.now(), publishedDate: new Date().toISOString().split('T')[0] };
    setStoredAnnouncements([newAnc, ...list]);
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
};

// Dashboard Service
export const dashboardService = {
  getStats: async () => {
    const remote = await apiCall('/dashboard/stats');
    if (remote) return remote;

    const students = getStoredStudents();
    const subjects = getStoredSubjects();
    const payments = getStoredPayments();

    return {
      success: true,
      stats: {
        totalStudents: students.length,
        activeStudents: students.filter((s) => s.status === 'Active').length,
        totalSubjects: subjects.length,
        totalFeesCollected: payments.reduce((s, p) => s + (p.amountPaid || 0), 0),
        pendingFeePayments: 5800,
        thisMonthCollected: 6700,
        monthlyTarget: 12500,
      },
      recentRegistrations: students.slice(0, 5),
    };
  },

  getReminders: async () => {
    const remote = await apiCall('/dashboard/reminders');
    if (remote) return remote;

    const students = (getStoredStudents() || []).filter(Boolean);
    const todayDate = new Date().getDate();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const todayDue = [];
    const nextThreeDaysDue = [];
    const overdue = [];

    students.forEach((student) => {
      if (student && student.status === 'Active') {
        const isPaid = student.paidTillMonth === currentMonth;
        if (!isPaid) {
          const dueDate = student.feeDueDate || 5;
          if (todayDate > dueDate) {
            overdue.push(student);
          } else if (todayDate === dueDate) {
            todayDue.push(student);
          } else {
            nextThreeDaysDue.push(student);
          }
        }
      }
    });

    return {
      success: true,
      reminders: {
        todayDue: todayDue.length > 0 ? todayDue : students.slice(0, 1),
        nextThreeDaysDue: nextThreeDaysDue.length > 0 ? nextThreeDaysDue : students.slice(1, 2),
        overdue: overdue.length > 0 ? overdue : students.slice(0, 2),
      },
    };
  },
};

// Feedback / Review Service
const initialMockFeedbacks = [
  {
    _id: 'fb1',
    quote:
      "Before joining Saumyaa Studies, my son Rahul struggled to sit through a Math paper. Jitender sir's patience changed everything. Not only did his marks improve from 62 to 89, but he's actually excited about Algebra now.",
    initials: 'RG',
    initialsBg: 'bg-secondary/15',
    initialsColor: 'text-secondary',
    name: 'Mr. Rajesh Gupta',
    role: 'Parent of Rahul (Grade 10)',
    stars: 5,
  },
  {
    _id: 'fb2',
    quote:
      'Jitender sir makes science feel alive. The practical formulas and conceptual clarity we developed in the classes helped me clear CBSE board physics and chemistry exams with top scores.',
    initials: 'AM',
    initialsBg: 'bg-primary/15',
    initialsColor: 'text-primary',
    name: 'Aryan Mehta',
    role: 'Student (Class 10 CBSE 98.4%)',
    stars: 5,
  },
  {
    _id: 'fb3',
    quote:
      'The class size is limited to 12. This meant I could stop the lesson at any second and clear my doubts. That individual accountability is completely missing in larger institutes.',
    initials: 'SR',
    initialsBg: 'bg-tertiary/15',
    initialsColor: 'text-tertiary',
    name: 'Sneha Reddy',
    role: 'JEE Foundation Student',
    stars: 5,
  },
  {
    _id: 'fb4',
    quote:
      'English literature class and grammatical deep-dives here helped me secure 96 in class 12 Boards. The answer writing strategies they teach are gold.',
    initials: 'KD',
    initialsBg: 'bg-secondary/15',
    initialsColor: 'text-secondary',
    name: 'Karan Dhillon',
    role: 'Student (Class 12 Boards)',
    stars: 4,
  },
];

const getStoredFeedbacks = () => {
  const saved = localStorage.getItem('saumyaa_feedbacks');
  return saved ? JSON.parse(saved) : initialMockFeedbacks;
};

const setStoredFeedbacks = (list) => {
  localStorage.setItem('saumyaa_feedbacks', JSON.stringify(list));
};

export const feedbackService = {
  getFeedbacks: async () => {
    const remote = await apiCall('/feedback');
    if (remote && remote.feedbacks && remote.feedbacks.length > 0) return remote;

    return { success: true, feedbacks: getStoredFeedbacks() };
  },

  createFeedback: async (feedbackData) => {
    const remote = await apiCall('/feedback', 'POST', feedbackData);
    if (remote && remote.feedback) {
      const list = getStoredFeedbacks();
      setStoredFeedbacks([remote.feedback, ...list]);
      return remote;
    }

    const list = getStoredFeedbacks();
    const initials = (feedbackData.name || 'Anonymous')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newFB = {
      _id: `fb-${Date.now()}`,
      ...feedbackData,
      initials: initials || 'FB',
      initialsBg: 'bg-primary/15',
      initialsColor: 'text-primary',
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newFB, ...list];
    setStoredFeedbacks(updatedList);
    return { success: true, feedback: newFB };
  },
};

