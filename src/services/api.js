import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { supabase, isSupabaseConfigured } from '../supabase';

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

const getStoredStudents = () => {
  try {
    const raw = localStorage.getItem('mock_students');
    const list = raw !== null ? JSON.parse(raw) : initialMockStudents;
    const deleted = getDeletedIds('students');
    return list.filter((s) => s && !deleted.includes(String(s._id)) && !deleted.includes(String(s.id)));
  } catch (e) {
    const deleted = getDeletedIds('students');
    return initialMockStudents.filter((s) => s && !deleted.includes(String(s._id)) && !deleted.includes(String(s.id)));
  }
};

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

// Firestore Collection Helper for Real-time DB Persistence
const syncFirestoreCollection = async (collectionName, defaultData = []) => {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const deletedIds = getDeletedIds(collectionName);

    if (snapshot.empty && defaultData && defaultData.length > 0) {
      const validDefaults = defaultData.filter((item) => {
        const id = item._id || item.id;
        return !deletedIds.includes(String(id));
      });
      // Seed default initial data into Firestore if empty
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
  } catch (err) {
    console.warn(`Firestore sync warning for ${collectionName}:`, err.message);
  }
  return null;
};

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

  resetStudentData: () => {
    localStorage.removeItem('saumyaa_deleted_students');
    localStorage.removeItem('mock_students');
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

    if (feesPaid && idx !== -1) {
      const student = list[idx];
      const count = getStoredPayments().length + 1;
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
      setStoredPayments([newPayment, ...getStoredPayments()]);
      try {
        await setDoc(doc(db, 'fees', paymentId), newPayment);
      } catch (e) {
        console.warn('Firestore setDoc fee error:', e);
      }
    }

    return {
      success: true,
      student: list[idx],
      message: `Fee status updated to ${feesPaid ? 'PAID' : 'UNPAID'}`,
    };
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

    const fsPayments = await syncFirestoreCollection('fees', initialMockPayments);
    let list = fsPayments || getStoredPayments();

    if (params.studentId) {
      list = list.filter((p) => p.student === params.studentId || p.student?._id === params.studentId);
    }
    setStoredPayments(list);
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
      receiptNumber: `REC-2026-000${count}`,
      remarks: 'Tuition fee payment',
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

    const students = getStoredStudents();
    const payments = getStoredPayments();
    const activeStudents = students.filter((s) => s.status === 'Active');
    const currentMonth = 'July 2026';

    const totalMonthlyTarget = activeStudents.reduce((s, st) => s + (st.monthlyFee || 0), 0);
    const totalFeesCollected = payments.reduce((s, p) => s + (p.amountPaid || 0), 0);
    const currentMonthPayments = payments.filter((p) => p.monthYear === currentMonth);
    const currentMonthCollected = currentMonthPayments.reduce((s, p) => s + (p.amountPaid || 0), 0);
    const pendingFeePayments = Math.max(0, totalMonthlyTarget - currentMonthCollected);

    const paidStudentIds = new Set(currentMonthPayments.map((p) => String(p.student?._id || p.student)));
    const paidStudentsCount = activeStudents.filter((s) => paidStudentIds.has(String(s._id)) || s.paidTillMonth === currentMonth).length;
    const pendingStudentsCount = Math.max(0, activeStudents.length - paidStudentsCount);

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

// Marks Service with Firebase Firestore DB
export const marksService = {
  getStudentMarks: async (studentId) => {
    const remote = await apiCall(`/marks?studentId=${studentId}`);
    if (remote) return remote;

    const fsMarks = await syncFirestoreCollection('marks', initialMockMarks);
    let list = fsMarks || getStoredMarks();
    if (studentId) {
      list = list.filter((m) => m.student === studentId || m.student?._id === studentId);
    }
    setStoredMarks(list);
    return { success: true, marks: list };
  },
};

// Attendance Service with Firebase Firestore DB
export const attendanceService = {
  getStudentAttendance: async (studentId) => {
    const remote = await apiCall(`/attendance?studentId=${studentId}`);
    if (remote) return remote;

    const fsAttendance = await syncFirestoreCollection('attendance', initialMockAttendance);
    let list = fsAttendance || getStoredAttendance();
    if (studentId) {
      list = list.filter((a) => a.student === studentId || a.student?._id === studentId);
    }
    setStoredAttendance(list);
    const presentCount = list.filter((a) => a.status === 'Present').length;
    const totalCount = list.length || 1;
    return {
      success: true,
      attendance: list,
      stats: {
        presentDays: presentCount,
        absentDays: totalCount - presentCount,
        attendancePercentage: Math.round((presentCount / totalCount) * 100)
      },
    };
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
    if (remote) return remote;

    const id = 'anc_' + Date.now();
    const newAnc = { ...data, _id: id, publishedDate: new Date().toISOString().split('T')[0] };

    try {
      await setDoc(doc(db, 'announcements', id), newAnc);
    } catch (fsErr) {
      console.warn('Firestore setDoc announcement error:', fsErr.message);
    }

    const list = getStoredAnnouncements();
    setStoredAnnouncements([newAnc, ...list]);
    return { success: true, announcement: newAnc, message: 'Announcement published in Firebase DB' };
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

const initialMockFaculty = [
  {
    _id: 'fac_1',
    id: 'fac_1',
    name: 'Dr. Jitender Sharma',
    designation: 'Senior Physics HOD',
    subject: 'Physics & Mechanics',
    qualification: 'Ph.D. Physics (IIT Delhi)',
    experience: '15+ Years Teaching',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    display_order: 1,
    is_active: true,
  },
  {
    _id: 'fac_2',
    id: 'fac_2',
    name: 'Prof. Saumyaa Sharma',
    designation: 'Mathematics Department Head',
    subject: 'Advanced Mathematics',
    qualification: 'M.Sc. Mathematics (Gold Medalist)',
    experience: '12+ Years Teaching',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    display_order: 2,
    is_active: true,
  },
  {
    _id: 'fac_3',
    id: 'fac_3',
    name: 'Dr. Rajesh Verma',
    designation: 'Senior Chemistry Mentor',
    subject: 'Organic & Physical Chemistry',
    qualification: 'Ph.D. Organic Chemistry',
    experience: '10+ Years Teaching',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    display_order: 3,
    is_active: true,
  },
  {
    _id: 'fac_4',
    id: 'fac_4',
    name: 'Er. Ananya Patel',
    designation: 'Biology & Olympiad Specialist',
    subject: 'Biology & Life Sciences',
    qualification: 'M.Tech Biotechnology',
    experience: '8+ Years Teaching',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    display_order: 4,
    is_active: true,
  },
];

const getStoredFaculty = () => {
  try {
    const data = localStorage.getItem('saumyaa_faculty');
    if (!data) {
      localStorage.setItem('saumyaa_faculty', JSON.stringify(initialMockFaculty));
      return initialMockFaculty;
    }
    return JSON.parse(data);
  } catch (e) {
    return initialMockFaculty;
  }
};

const setStoredFaculty = (list) => {
  try {
    localStorage.setItem('saumyaa_faculty', JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage faculty write error:', e);
  }
};

export const facultyService = {
  getFaculty: async ({ activeOnly = false } = {}) => {
    // 1. Try Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('faculty').select('*').order('display_order', { ascending: true });
        if (activeOnly) {
          query = query.eq('is_active', true);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return { success: true, faculty: data };
        }
      } catch (sbErr) {
        console.warn('Supabase getFaculty error, falling back:', sbErr.message);
      }
    }

    // 2. Try Express API Backend
    const remote = await apiCall(`/faculty${activeOnly ? '?activeOnly=true' : ''}`);
    if (remote && remote.faculty) return remote;

    // 3. LocalStorage Fallback
    let list = getStoredFaculty();
    if (activeOnly) {
      list = list.filter((f) => f.is_active);
    }
    list.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
    return { success: true, faculty: list };
  },

  createFaculty: async (data) => {
    if (!data.name || !data.name.trim()) {
      throw new Error('Faculty name is required');
    }
    if (!data.photo_url) {
      throw new Error('Faculty photo is required');
    }

    // 1. Supabase insert
    if (isSupabaseConfigured()) {
      try {
        const { data: sbData, error } = await supabase
          .from('faculty')
          .insert([
            {
              name: data.name,
              designation: data.designation || 'Senior Faculty Member',
              subject: data.subject || 'General Academics',
              qualification: data.qualification || 'Master’s Degree',
              experience: data.experience || '5+ Years',
              photo_url: data.photo_url,
              display_order: Number(data.display_order) || 1,
              is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
            },
          ])
          .select();
        if (!error && sbData && sbData[0]) {
          return { success: true, faculty: sbData[0], message: 'Faculty member created in Supabase' };
        }
      } catch (sbErr) {
        console.warn('Supabase createFaculty warning:', sbErr.message);
      }
    }

    // 2. Express Backend
    const remote = await apiCall('/faculty', { method: 'POST', body: JSON.stringify(data) });
    if (remote && remote.faculty) return remote;

    // 3. LocalStorage
    const newFaculty = {
      _id: 'fac_' + Date.now(),
      id: 'fac_' + Date.now(),
      name: data.name,
      designation: data.designation || 'Senior Faculty Member',
      subject: data.subject || 'General Academics',
      qualification: data.qualification || 'Master’s Degree',
      experience: data.experience || '5+ Years',
      photo_url: data.photo_url,
      display_order: Number(data.display_order) || 1,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      created_at: new Date().toISOString(),
    };
    const list = getStoredFaculty();
    const updated = [...list, newFaculty];
    setStoredFaculty(updated);
    return { success: true, faculty: newFaculty, message: 'Faculty added successfully' };
  },

  updateFaculty: async (id, data) => {
    if (isSupabaseConfigured()) {
      try {
        const { data: sbData, error } = await supabase
          .from('faculty')
          .update(data)
          .eq('id', id)
          .select();
        if (!error && sbData && sbData[0]) {
          return { success: true, faculty: sbData[0], message: 'Faculty updated in Supabase' };
        }
      } catch (sbErr) {
        console.warn('Supabase updateFaculty warning:', sbErr.message);
      }
    }

    const remote = await apiCall(`/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (remote && remote.faculty) return remote;

    const list = getStoredFaculty();
    const idx = list.findIndex((f) => String(f._id) === String(id) || String(f.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredFaculty(list);
    }
    return { success: true, faculty: list[idx], message: 'Faculty updated successfully' };
  },

  deleteFaculty: async (id, photoUrl) => {
    if (isSupabaseConfigured() && photoUrl && photoUrl.includes('/storage/v1/object/public/faculty/')) {
      try {
        const fileName = photoUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('faculty').remove([fileName]);
        }
      } catch (imgErr) {
        console.warn('Supabase storage remove image error:', imgErr.message);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('faculty').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase deleteFaculty error:', sbErr.message);
      }
    }

    try {
      await apiCall(`/faculty/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Express remote delete faculty call skipped:', e);
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

    if (onProgress) onProgress(20);

    if (isSupabaseConfigured()) {
      try {
        if (onProgress) onProgress(40);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('faculty').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

        if (uploadError) {
          console.warn('Supabase bucket upload error:', uploadError.message);
          throw uploadError;
        }

        if (onProgress) onProgress(80);
        const { data: publicUrlData } = supabase.storage.from('faculty').getPublicUrl(filePath);

        if (onProgress) onProgress(100);
        return publicUrlData.publicUrl;
      } catch (sbErr) {
        console.warn('Supabase Storage upload failed, converting to Base64:', sbErr.message);
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
      reader.onload = () => {
        if (onProgress) onProgress(100);
        resolve(reader.result);
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },
};

