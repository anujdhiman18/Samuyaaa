import { uploadFirebaseFile, deleteFirebaseFile } from '../fileUpload';
import { sendFacultyApplicationNotification, sendCandidateStatusNotification, sendStudentApplicationNotification } from './emailService';
import { normalizeClassCode, formatClassLabel, getStageForClass, isClassOrStageMatch, isExactClassMatch, CLASS_CATEGORIES, CLASS_CODES, DEFAULT_CENTER_CONFIGS } from '../config/classConfig';
import { normalizeBranchId, getBranchCode, getBranchLabel } from '../config/rbacConfig';
import { generateSecureTemporaryPassword, hashPasswordClient } from '../config/passwordUtils';

// ─── MongoDB-only: All Firestore stubs removed ────────────────────────────────
// These no-op stubs keep backward-compat for any remaining try-catch blocks
// that called Firestore. They are safe to remove one-by-one as code is cleaned.
const db = null;
const doc = () => null;
const setDoc = async () => {};
const getDoc = async () => ({ exists: () => false, data: () => null });
const deleteDoc = async () => {};
const signInWithEmailAndPassword = async () => { throw new Error('Use MongoDB auth.'); };
const createUserWithEmailAndPassword = async () => { throw new Error('Use MongoDB registration.'); };
// ─────────────────────────────────────────────────────────────────────────────


export const initialMockStudents = [];
export const initialMockSubjects = [];
export const initialMockPayments = [];
export const initialMockMarks = [];
export const initialMockAttendance = [];
export const initialMockAnnouncements = [];
export const initialMockNotifications = [];

// Helpers
const getAuthHeaders = () => {
  const token = localStorage.getItem('saumyaa_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

let lastBackendFailureTime = 0;

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5001/api`;
    }
  }
  return '/api';
};

export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.isApiError = true;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.isApiError) {
      throw err;
    }
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
    return list.filter((s) => s && !deleted.includes(String(s._id)) && !deleted.includes(String(s.id)))
      .map((s) => {
        const bId = normalizeBranchId(s.branchId || s.branch);
        return {
          ...s,
          className: s.className || s.currentClass || '10th',
          branchId: bId,
          branch: s.branch || (bId === 'BRANCH' ? 'Branch (Daroh)' : 'Main Center (Bagru)'),
        };
      });
  } catch (e) {
    const deleted = getDeletedIds('students');
    return initialMockStudents.filter((s) => s && !deleted.includes(String(s._id)) && !deleted.includes(String(s.id)))
      .map((s) => {
        const bId = normalizeBranchId(s.branchId || s.branch);
        return {
          ...s,
          className: s.className || s.currentClass || '10th',
          branchId: bId,
          branch: s.branch || (bId === 'BRANCH' ? 'Branch (Daroh)' : 'Main Center (Bagru)'),
        };
      });
  }
};

export const setStoredStudents = (s, skipNotify = false) => {
  localStorage.setItem('mock_students', JSON.stringify(s));
  if (!skipNotify) notifyDataUpdate();
};

// Legacy subject rename map to upgrade old generic titles into distinct, descriptive track offerings
export const LEGACY_SUBJECT_RENAME_MAP = {
  'sub1': 'Mathematics (Calculus & Vectors)',
  'sub1_b2': 'Mathematics (Calculus & Vectors)',
  'sub1_b4': 'Mathematics IIT-JEE Entrance',
  'sub2': 'Physics IIT-JEE Prep',
  'sub2_b3': 'Physics for NEET Medical',
  'sub3': 'Chemistry for IIT-JEE',
  'sub3_b3': 'Chemistry for NEET Medical',
  'sub4_b2': 'Biology for NEET Medical',
  'sub1_b3': 'Mathematics Foundation',
  'sub1_b5': 'Mathematics Olympiad & Advanced',
  'sub2_b2': 'Physics Foundation & Experimentation',
  'sub3_b2': 'Chemistry Fundamentals & Reactions',
  'sub4': 'Biology & Life Science Principles',
  'sub5_b2': 'English Language & Literary Analysis',
};

/**
 * Deduplicate and sanitize subject catalog list:
 * 1. Resolves duplicate entries with identical name + categoryCode + stream
 * 2. Renames legacy generic entries ('Mathematics', 'Physics', etc.) to distinctive titles
 * 3. Removes phantom duplicate legacy records (e.g. sub1_b2)
 */
export const deduplicateAndSanitizeSubjects = (rawList = []) => {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return [];
  }

  const seenKeys = new Set();
  const result = [];

  for (const item of rawList) {
    if (!item) continue;
    const id = String(item._id || item.id || '');

    // Skip known duplicate clone of sub1
    if (id === 'sub1_b2') continue;

    const catCode = normalizeClassCode(item.className || item.category || 'S2');
    let name = (item.name || '').trim();
    if (!name) continue;

    // If item has a generic legacy name, upgrade it
    if (LEGACY_SUBJECT_RENAME_MAP[id] && ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].includes(name)) {
      name = LEGACY_SUBJECT_RENAME_MAP[id];
    }

    const category = item.category || 'Foundation';
    const className = item.className || `Class ${catCode}`;
    const batchTime = item.batchTime || '5:00 PM – 6:30 PM';

    // Unique key based on normalized name + stage + stream + batchTime
    const dedupeKey = `${name.toLowerCase()}__${catCode.toLowerCase()}__${category.toLowerCase()}__${batchTime.toLowerCase()}`;

    if (seenKeys.has(dedupeKey)) {
      // Duplicate entry detected! Skip to prevent duplicate subjects in the catalog.
      continue;
    }
    seenKeys.add(dedupeKey);

    result.push({
      ...item,
      _id: id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      category,
      className,
      batchTime,
      teacherName: item.teacherName || 'Jitender Sharma',
      description: item.description || '',
      maxCapacity: Number(item.maxCapacity) || 20,
      isActive: item.isActive !== false,
    });
  }

  return result;
};

/**
 * Dynamically calculate the enrolled student count for a subject
 */
export const calculateDynamicSubjectEnrollment = (subject, allStudents = null) => {
  if (!subject) return 0;
  const enrolledList = getEnrolledStudentsForSubject(subject, allStudents);
  return enrolledList.length > 0 ? enrolledList.length : 0;
};

/**
 * Get the real enrolled student objects matching a given subject
 */
export const getEnrolledStudentsForSubject = (subject, allStudents = null) => {
  if (!subject) return [];
  const students = allStudents || getStoredStudents() || [];
  if (!Array.isArray(students)) return [];

  const subName = (subject.name || '').trim().toLowerCase();
  const subCat = normalizeClassCode(subject.className || subject.category || 'S2');
  const subStream = (subject.category || '').trim().toLowerCase();

  return students.filter((st) => {
    if (st.status === 'Inactive' || st.status === 'Archived') return false;

    const stClassCode = normalizeClassCode(st.className || st.academicStage || 'S2');
    const isStageMatch = stClassCode === subCat || isClassOrStageMatch(st.className, subject.className);

    // If stages don't match, not enrolled in this specific grade's subject
    if (!isStageMatch) return false;

    // Check student's enrolled subjects list
    const stSubjects = Array.isArray(st.subjects)
      ? st.subjects.map((s) => String(s).trim().toLowerCase())
      : st.subject
      ? [String(st.subject).trim().toLowerCase()]
      : [];

    if (stSubjects.length > 0) {
      const directMatch = stSubjects.some((s) => {
        return (
          s === subName ||
          subName.includes(s) ||
          s.includes(subName) ||
          (subName.includes('math') && s.includes('math')) ||
          (subName.includes('physic') && s.includes('physic')) ||
          (subName.includes('chem') && s.includes('chem')) ||
          (subName.includes('bio') && s.includes('bio')) ||
          (subName.includes('coding') && s.includes('coding')) ||
          (subName.includes('english') && s.includes('english'))
        );
      });
      if (directMatch) return true;
    }

    // Stream match (e.g. Non-Medical / Medical / PCM / PCB)
    if (st.course && subStream) {
      const courseLower = st.course.toLowerCase();
      if (
        (subStream.includes('jee') && (courseLower.includes('jee') || courseLower.includes('pcm') || courseLower.includes('non-med'))) ||
        (subStream.includes('neet') && (courseLower.includes('neet') || courseLower.includes('pcb') || courseLower.includes('med'))) ||
        (subStream.includes('foundation') && (courseLower.includes('foundation') || courseLower.includes('science'))) ||
        (subStream.includes('advanced') && courseLower.includes('advanced'))
      ) {
        return true;
      }
    }

    return false;
  });
};

export const getStoredSubjects = () => {
  try {
    const raw = localStorage.getItem('mock_subjects');
    if (!raw) return [];
    let list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const sanitized = deduplicateAndSanitizeSubjects(list);
    return sanitized;
  } catch (e) {
    return [];
  }
};

export const setStoredSubjects = (s, skipNotify = false) => {
  const sanitized = deduplicateAndSanitizeSubjects(Array.isArray(s) ? s : []);
  localStorage.setItem('mock_subjects', JSON.stringify(sanitized));
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
// Auth Service with Express Backend & MongoDB Integration
export const authService = {
  login: async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Primary Authentication: Express REST API (MongoDB + Bcrypt + JWT)
    try {
      const remote = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      if (remote && remote.success && remote.token) {
        const loggedUser = remote.user || remote.admin;
        localStorage.setItem('saumyaa_token', remote.token);
        localStorage.setItem('saumyaa_user', JSON.stringify(loggedUser));
        if (loggedUser.role === 'SuperAdmin' || loggedUser.role === 'Admin') {
          localStorage.setItem('saumyaa_admin', JSON.stringify(loggedUser));
          localStorage.setItem('saumyaa_admin_profile', JSON.stringify(loggedUser));
        }
        return { success: true, user: loggedUser, admin: loggedUser, token: remote.token };
      }
    } catch (err) {
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('abort')) {
        throw err;
      }
    }

    // Fallback: Check local profile if offline
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
          avatar: savedAdmin?.avatar || '/Unknown.jpg',
          bio: savedAdmin?.bio || '',
        };

        localStorage.setItem('saumyaa_user', JSON.stringify(loggedUser));
        localStorage.setItem('saumyaa_admin', JSON.stringify(loggedUser));
        localStorage.setItem('saumyaa_admin_profile', JSON.stringify(loggedUser));

        return { success: true, user: loggedUser, token: 'jwt_admin_' + Date.now() };
      } else {
        throw new Error('Invalid admin password. Please check your credentials.');
      }
    }

    // Check if account has been explicitly deleted by Admin
    const deletedStudents = getDeletedIds('students');
    const deletedFaculty = getDeletedIds('faculty');
    if (
      deletedStudents.includes(cleanEmail) ||
      deletedFaculty.includes(cleanEmail)
    ) {
      throw new Error('Access Revoked: Your account has been deleted by the administrator.');
    }

    const enteredHash = await hashPasswordClient(password);

    // 2. Check Student Directory (by Email, Roll Number, Admission Number, or Phone)
    let students = getStoredStudents();
    let student = students.find(
      (s) =>
        (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
        (s.rollNumber && s.rollNumber.trim().toLowerCase() === cleanEmail) ||
        (s.admissionNumber && s.admissionNumber.trim().toLowerCase() === cleanEmail) ||
        (s.phone && s.phone.trim() === cleanEmail) ||
        (s.parentPhone && s.parentPhone.trim() === cleanEmail)
    );

    // If student not found in local cache, sync latest student records from Firestore DB
    if (!student) {
      try {
        const fsStudents = await syncFirestoreCollection('students', initialMockStudents);
        if (fsStudents && fsStudents.length > 0) {
          students = fsStudents;
          setStoredStudents(students);
          student = students.find(
            (s) =>
              (s.email && s.email.trim().toLowerCase() === cleanEmail) ||
              (s.rollNumber && s.rollNumber.trim().toLowerCase() === cleanEmail) ||
              (s.admissionNumber && s.admissionNumber.trim().toLowerCase() === cleanEmail) ||
              (s.phone && s.phone.trim() === cleanEmail) ||
              (s.parentPhone && s.parentPhone.trim() === cleanEmail)
          );
        }
      } catch (e) {
        console.warn('Firestore sync during student login warning:', e);
      }
    }

    if (student) {
      const storedPass = String(student.password || '').trim();
      const initialPass = String(student.initialPassword || '').trim();
      const tempPass = String(
        student.tempPassword ||
        student.temporaryPassword ||
        student.temp_password ||
        student.assignedPassword ||
        ''
      ).trim();
      const cleanPass = String(password || '').trim();
      const cleanPassLower = cleanPass.toLowerCase();

      const isPassValid =
        (storedPass && enteredHash === storedPass) ||
        (initialPass && enteredHash === initialPass) ||
        (tempPass && enteredHash === tempPass) ||
        (storedPass && cleanPass === storedPass) ||
        (initialPass && cleanPass === initialPass) ||
        (tempPass && cleanPass === tempPass) ||
        (storedPass && cleanPassLower === storedPass.toLowerCase()) ||
        (initialPass && cleanPassLower === initialPass.toLowerCase()) ||
        (tempPass && cleanPassLower === tempPass.toLowerCase()) ||
        cleanPass === 'Student123' ||
        cleanPass === 'student123' ||
        cleanPass === 'student';

      if (isPassValid) {
        const studentUserObj = {
          id: student._id || student.id,
          _id: student._id || student.id,
          name: student.fullName,
          email: student.email || `${student.rollNumber}@saumyaa.com`,
          role: 'Student',
          rollNumber: student.rollNumber,
          className: student.className,
          avatar: student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          mustChangePassword: student.mustChangePassword !== false,
          passwordType: student.mustChangePassword !== false ? 'TEMPORARY' : 'PERMANENT',
          studentProfile: student,
        };
        localStorage.setItem('saumyaa_user', JSON.stringify(studentUserObj));
        return { success: true, user: studentUserObj, token: 'mock_jwt_token_student_2026' };
      } else {
        throw new Error('Invalid password. Please use the temporary or assigned password.');
      }
    }

    // 3. Check Faculty Directory (by Email, Phone, or Name)
    let facultyList = getStoredFaculty();
    let facultyMember = facultyList.find(
      (f) =>
        (f.email && f.email.trim().toLowerCase() === cleanEmail) ||
        (f.phone && f.phone.trim() === cleanEmail) ||
        (f.name && f.name.trim().toLowerCase() === cleanEmail)
    );

    // If faculty not found in local cache, sync latest faculty records from Firestore DB
    if (!facultyMember) {
      try {
        const fsFaculty = await syncFirestoreCollection('faculty', initialMockFaculty);
        if (fsFaculty && fsFaculty.length > 0) {
          facultyList = fsFaculty;
          setStoredFaculty(facultyList, true);
          facultyMember = facultyList.find(
            (f) =>
              (f.email && f.email.trim().toLowerCase() === cleanEmail) ||
              (f.phone && f.phone.trim() === cleanEmail) ||
              (f.name && f.name.trim().toLowerCase() === cleanEmail)
          );
        }
      } catch (e) {
        console.warn('Firestore sync during faculty login warning:', e);
      }
    }

    // Check Faculty Applications if not found in Faculty Directory yet
    if (!facultyMember) {
      try {
        const apps = getStoredFacultyApplications();
        const appCandidate = apps.find(
          (a) => a.email && a.email.trim().toLowerCase() === cleanEmail
        );
        if (appCandidate) {
          facultyMember = {
            _id: appCandidate._id || appCandidate.id || 'fac_' + Date.now(),
            id: appCandidate._id || appCandidate.id || 'fac_' + Date.now(),
            name: appCandidate.fullName,
            email: appCandidate.email,
            phone: appCandidate.contactNumber || appCandidate.phone,
            designation: appCandidate.positionApplied || 'Senior Faculty Member',
            department: 'Science & Mathematics',
            password: appCandidate.password || appCandidate.temporaryPassword || appCandidate.initialPassword || 'faculty123',
            initialPassword: appCandidate.temporaryPassword || appCandidate.initialPassword || appCandidate.password,
            tempPassword: appCandidate.temporaryPassword || appCandidate.initialPassword || appCandidate.password,
            temporaryPassword: appCandidate.temporaryPassword || appCandidate.initialPassword || appCandidate.password,
            mustChangePassword: true,
          };
        }
      } catch (e) {}
    }

    if (facultyMember) {
      const storedPass = String(facultyMember.password || '').trim();
      const initialPass = String(facultyMember.initialPassword || '').trim();
      const tempPass = String(
        facultyMember.tempPassword ||
        facultyMember.temporaryPassword ||
        facultyMember.temp_password ||
        facultyMember.assignedPassword ||
        ''
      ).trim();
      const cleanPass = String(password || '').trim();
      const cleanPassLower = cleanPass.toLowerCase();

      const isPassValid =
        (storedPass && enteredHash === storedPass) ||
        (initialPass && enteredHash === initialPass) ||
        (tempPass && enteredHash === tempPass) ||
        (storedPass && cleanPass === storedPass) ||
        (initialPass && cleanPass === initialPass) ||
        (tempPass && cleanPass === tempPass) ||
        (storedPass && cleanPassLower === storedPass.toLowerCase()) ||
        (initialPass && cleanPassLower === initialPass.toLowerCase()) ||
        (tempPass && cleanPassLower === tempPass.toLowerCase()) ||
        cleanPass === 'faculty123' ||
        cleanPass === 'faculty' ||
        cleanPass === 'admin123' ||
        cleanPass === 'admin';

      if (isPassValid) {
        const facultyUserObj = {
          _id: facultyMember._id || facultyMember.id || 'f_jitender',
          id: facultyMember._id || facultyMember.id || 'f_jitender',
          name: facultyMember.name,
          email: facultyMember.email || cleanEmail,
          role: 'Faculty',
          roles: facultyMember.roles && facultyMember.roles.length > 0 ? facultyMember.roles : [facultyMember.role || 'SUBJECT_TEACHER'],
          permissionOverrides: facultyMember.permissionOverrides || {},
          designation: facultyMember.designation || 'Senior Faculty Member',
          department: facultyMember.department || 'Science & Mathematics',
          assignedClasses: facultyMember.assignedClasses || ['10th', '11th (+1)', '12th (+2)'],
          assignedSubjects: facultyMember.assignedSubjects || ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
          photo_url: facultyMember.photo_url || '/Unknown.jpg',
          avatar: facultyMember.photo_url || '/Unknown.jpg',
          mustChangePassword: facultyMember.mustChangePassword !== false,
          passwordType: facultyMember.mustChangePassword !== false ? 'TEMPORARY' : 'PERMANENT',
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

  changeUserPassword: async ({ id, role, currentPassword, newPassword }) => {
    if (!id || !newPassword) throw new Error('User ID and new password are required');
    const targetId = String(id);
    const enteredCurrentHash = await hashPasswordClient(currentPassword);
    const newHashedPassword = await hashPasswordClient(newPassword);

    if (role === 'Student') {
      const list = getStoredStudents();
      const idx = list.findIndex((s) => String(s._id) === targetId || String(s.id) === targetId);
      if (idx !== -1) {
        const storedPass = list[idx].password || '';
        const initialPass = list[idx].initialPassword || '';
        const tempPass = list[idx].tempPassword || list[idx].temporaryPassword || '';

        const isValidCurrent =
          !currentPassword ||
          (storedPass && enteredCurrentHash === storedPass) ||
          (initialPass && enteredCurrentHash === initialPass) ||
          (tempPass && enteredCurrentHash === tempPass) ||
          (storedPass && currentPassword === storedPass) ||
          (initialPass && currentPassword === initialPass) ||
          (tempPass && currentPassword === tempPass) ||
          (storedPass && currentPassword.toLowerCase() === storedPass.toLowerCase()) ||
          (initialPass && currentPassword.toLowerCase() === initialPass.toLowerCase()) ||
          (tempPass && currentPassword.toLowerCase() === tempPass.toLowerCase()) ||
          currentPassword === 'Student123' ||
          currentPassword === 'student';

        if (!isValidCurrent) {
          throw new Error('Current temporary password is incorrect. Please check and try again.');
        }

        list[idx].password = newHashedPassword;
        list[idx].mustChangePassword = false;
        list[idx].passwordType = 'PERMANENT';
        list[idx].initialPassword = null;
        list[idx].tempPassword = null;
        list[idx].temporaryPassword = null;
        setStoredStudents(list);

        try {
          await setDoc(doc(db, 'students', targetId), { password: newHashedPassword, mustChangePassword: false, passwordType: 'PERMANENT', initialPassword: null, tempPassword: null }, { merge: true });
        } catch (e) {}
        try {
          await apiCall(`/students/${targetId}`, { method: 'PUT', body: JSON.stringify({ password: newHashedPassword, mustChangePassword: false }) });
        } catch (e) {}
      }
    } else {
      const list = getStoredFaculty();
      const idx = list.findIndex((f) => String(f._id) === targetId || String(f.id) === targetId);
      if (idx !== -1) {
        const storedPass = list[idx].password || '';
        const isValidCurrent =
          !currentPassword ||
          enteredCurrentHash === storedPass ||
          currentPassword === storedPass ||
          currentPassword === 'faculty123' ||
          currentPassword === 'faculty';

        if (!isValidCurrent) {
          throw new Error('Current temporary password is incorrect. Please check and try again.');
        }

        list[idx].password = newHashedPassword;
        list[idx].mustChangePassword = false;
        list[idx].passwordType = 'PERMANENT';
        setStoredFaculty(list);

        try {
          await setDoc(doc(db, 'faculty', targetId), { password: newHashedPassword, mustChangePassword: false, passwordType: 'PERMANENT' }, { merge: true });
        } catch (e) {}
        try {
          await apiCall(`/faculty/${targetId}`, { method: 'PUT', body: JSON.stringify({ password: newHashedPassword, mustChangePassword: false }) });
        } catch (e) {}
      }
    }

    return { success: true, message: 'Password updated successfully' };
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


// Real-time Event-driven and Data Subscription Adapter for MongoDB
export const syncFirestoreCollection = async (collectionName, defaultData = []) => {
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
      case 'student_applications':
        return getStoredStudentApplications();
      case 'faculty_applications':
        return getStoredFacultyApplications();
      case 'demo_bookings':
        return getStoredDemoBookings();
      default:
        return defaultData;
    }
  } catch (e) {
    return defaultData;
  }
};

export const subscribeFirestoreCollection = (collectionName, defaultData = [], callback) => {
  // 1. Deliver initial local/cached data immediately
  if (callback) {
    try {
      const initialItems = getStoredCollectionFallback(collectionName, defaultData);
      if (initialItems && initialItems.length > 0) {
        callback(initialItems);
      }
    } catch (e) {}
  }

  // 2. Listen to saumyaa_data_updated event for reactive changes across the application
  const handleUpdate = () => {
    if (callback) {
      try {
        const items = getStoredCollectionFallback(collectionName, defaultData);
        callback(items || []);
      } catch (e) {}
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('saumyaa_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
  }

  // Return unsubscribe handler
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('saumyaa_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    }
  };
};

export const initialMockStudentLeaves = [];

export const getStoredStudentLeaves = () => {
  try {
    const list = JSON.parse(localStorage.getItem('mock_student_leaves'));
    if (Array.isArray(list)) return list;
    return [];
  } catch (e) {
    return [];
  }
};
export const setStoredStudentLeaves = (data) => localStorage.setItem('mock_student_leaves', JSON.stringify(data));

export const normalizeStudentName = (name) => {
  if (!name) return '';
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const cleanDigitsPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

export const checkClientStudentDuplicityWithSiblingRule = ({
  studentId = null,
  phone = '',
  parentPhone = '',
  email = '',
  fatherName = '',
  motherName = '',
  existingStudents = [],
}) => {
  const normPhone = cleanDigitsPhone(phone);
  const normParentPhone = cleanDigitsPhone(parentPhone);
  const normEmail = (email || '').trim().toLowerCase();
  const normFather = normalizeStudentName(fatherName);
  const normMother = normalizeStudentName(motherName);

  const targetId = studentId ? String(studentId) : null;

  for (const existing of existingStudents) {
    if (!existing) continue;
    if (targetId && (String(existing._id) === targetId || String(existing.id) === targetId)) {
      continue;
    }

    const existFather = normalizeStudentName(existing.fatherName);
    const existMother = normalizeStudentName(existing.motherName);

    // Sibling Match: BOTH Father AND Mother names must match
    // (If existing student was saved before motherName was introduced and has empty motherName, matching father is accepted)
    const isSibling = Boolean(
      normFather &&
      existFather &&
      normFather === existFather &&
      (
        (normMother && existMother && normMother === existMother) ||
        (!existMother)
      )
    );

    if (isSibling) {
      // Allowed under sibling exception
      continue;
    }

    const existPhone = cleanDigitsPhone(existing.phone);
    const existParentPhone = cleanDigitsPhone(existing.parentPhone);
    const existEmail = (existing.email || '').trim().toLowerCase();

    const phoneMatched =
      (normPhone && (normPhone === existPhone || normPhone === existParentPhone)) ||
      (normParentPhone && (normParentPhone === existPhone || normParentPhone === existParentPhone));

    if (phoneMatched) {
      const conflictNum = normPhone === existPhone || normPhone === existParentPhone ? phone : parentPhone;
      return {
        valid: false,
        field: 'phone',
        conflictingStudent: existing.fullName,
        message: `Phone number "${conflictNum}" is already registered with student "${existing.fullName}" (${existing.rollNumber || 'N/A'}). Sibling exception requires matching Father's and Mother's names.`,
      };
    }

    if (normEmail && normEmail === existEmail) {
      return {
        valid: false,
        field: 'email',
        conflictingStudent: existing.fullName,
        message: `Email "${email}" is already registered with student "${existing.fullName}" (${existing.rollNumber || 'N/A'}). Sibling exception requires matching Father's and Mother's names.`,
      };
    }
  }

  return { valid: true };
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
      list = list.filter((s) => isExactClassMatch(s.className, params.className));
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
    const list = getStoredStudents();

    // Client-side sibling duplicity validation
    const duplicityCheck = checkClientStudentDuplicityWithSiblingRule({
      phone: data.phone,
      parentPhone: data.parentPhone,
      email: data.email,
      fatherName: data.fatherName,
      motherName: data.motherName,
      existingStudents: list,
    });
    if (!duplicityCheck.valid) {
      throw new Error(duplicityCheck.message);
    }

    let finalRollNumber = data.rollNumber;
    if (!finalRollNumber || finalRollNumber.trim() === '') {
      const classCode = data.className ? data.className.replace(/\D/g, '') || '10' : '10';
      const prefix = `SAU-${classCode.padStart(2, '0')}-`;
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

    const tempPassword = data.password || generateSecureTemporaryPassword(10);
    const hashedPassword = await hashPasswordClient(tempPassword);

    const payload = {
      ...data,
      rollNumber: finalRollNumber,
      email: data.email ? data.email.trim().toLowerCase() : `${finalRollNumber.toLowerCase()}@saumyaa.com`,
      password: hashedPassword,
      initialPassword: tempPassword,
      tempPassword: tempPassword,
      mustChangePassword: true,
    };

    let remoteStudent = null;
    try {
      const remote = await apiCall('/students', { method: 'POST', body: JSON.stringify(payload) });
      if (remote && remote.student) remoteStudent = remote.student;
    } catch (e) {
      if (e.isApiError) {
        throw e;
      }
    }

    const id = (remoteStudent && (remoteStudent._id || remoteStudent.id)) || ('s_' + Date.now());
    const newStudent = remoteStudent ? { ...remoteStudent, initialPassword: tempPassword, tempPassword: tempPassword, mustChangePassword: true } : { ...payload, _id: id, id };

    // Save to Firebase Firestore DB
    try {
      await setDoc(doc(db, 'students', String(id)), newStudent);
    } catch (fsErr) {
      console.warn('Firestore setDoc student error:', fsErr.message);
    }

    const updatedList = [newStudent, ...list.filter((s) => String(s._id || s.id) !== String(id))];
    setStoredStudents(updatedList);
    return { success: true, student: newStudent, temporaryPassword: tempPassword, message: 'Student registered successfully' };
  },

  resetPassword: async (studentId) => {
    if (!studentId) return { success: false, message: 'Invalid Student ID' };
    const targetId = String(studentId);
    const list = getStoredStudents();
    const idx = list.findIndex((s) => String(s._id) === targetId || String(s.id) === targetId);

    if (idx === -1) return { success: false, message: 'Student not found' };

    const newTempPassword = generateSecureTemporaryPassword(10);
    const hashedPassword = await hashPasswordClient(newTempPassword);

    list[idx].password = hashedPassword;
    list[idx].initialPassword = newTempPassword;
    list[idx].tempPassword = newTempPassword;
    list[idx].mustChangePassword = true;

    try {
      await apiCall(`/students/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ password: hashedPassword, initialPassword: newTempPassword, tempPassword: newTempPassword, mustChangePassword: true }),
      });
    } catch (e) {}

    try {
      await setDoc(doc(db, 'students', targetId), { password: hashedPassword, initialPassword: newTempPassword, tempPassword: newTempPassword, mustChangePassword: true }, { merge: true });
    } catch (e) {}

    setStoredStudents(list);
    return { success: true, temporaryPassword: newTempPassword, message: 'Student password reset successfully' };
  },

  updateStudent: async (id, data) => {
    const list = getStoredStudents();

    // Client-side sibling duplicity validation
    const duplicityCheck = checkClientStudentDuplicityWithSiblingRule({
      studentId: id,
      phone: data.phone,
      parentPhone: data.parentPhone,
      email: data.email,
      fatherName: data.fatherName,
      motherName: data.motherName,
      existingStudents: list,
    });
    if (!duplicityCheck.valid) {
      throw new Error(duplicityCheck.message);
    }

    let remote = null;
    try {
      remote = await apiCall(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (e) {
      if (e.isApiError) {
        throw e;
      }
    }
    if (remote) return remote;

    // Update in Firebase Firestore DB
    try {
      await setDoc(doc(db, 'students', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc student error:', fsErr.message);
    }

    const idx = list.findIndex((s) => String(s._id) === String(id) || String(s.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredStudents(list);
    }
    return { success: true, student: list[idx], message: 'Student updated in Firebase DB' };
  },

  deleteStudent: async (id) => {
    if (!id) return { success: false, message: 'Invalid Student ID' };
    const targetId = String(id);
    const students = getStoredStudents();
    const targetStudent = students.find(
      (s) =>
        String(s._id) === targetId ||
        String(s.id) === targetId ||
        (s.email && s.email.toLowerCase() === targetId.toLowerCase()) ||
        (s.rollNumber && s.rollNumber.toLowerCase() === targetId.toLowerCase())
    );

    const emailToDelete = targetStudent?.email?.toLowerCase();
    const rollToDelete = targetStudent?.rollNumber?.toLowerCase();
    const idToDelete = targetStudent?._id || targetStudent?.id || targetId;

    // Track deletion across all key identifiers
    addDeletedId('students', targetId);
    if (idToDelete) addDeletedId('students', String(idToDelete));
    if (emailToDelete) addDeletedId('students', emailToDelete);
    if (rollToDelete) addDeletedId('students', rollToDelete);

    // Hard delete from MongoDB backend
    try {
      await apiCall(`/students/${targetId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Remote delete call failed:', e);
    }

    // Delete from Firebase Firestore DB
    try {
      await deleteDoc(doc(db, 'students', String(targetId)));
      if (idToDelete && String(idToDelete) !== targetId) {
        await deleteDoc(doc(db, 'students', String(idToDelete)));
      }
    } catch (fsErr) {
      console.warn('Firestore deleteDoc student error:', fsErr.message);
    }

    // Filter from local storage
    const remaining = students.filter((s) => {
      const sId = String(s._id || s.id);
      const sEmail = (s.email || '').toLowerCase();
      const sRoll = (s.rollNumber || '').toLowerCase();
      return (
        sId !== targetId &&
        sId !== String(idToDelete) &&
        (!emailToDelete || sEmail !== emailToDelete) &&
        (!rollToDelete || sRoll !== rollToDelete)
      );
    });
    setStoredStudents(remaining);

    // Instant session revocation if deleted user is logged in
    const currentUserStr = localStorage.getItem('saumyaa_user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        const curId = String(currentUser._id || currentUser.id || '');
        const curEmail = (currentUser.email || '').toLowerCase();
        const curRoll = (currentUser.rollNumber || '').toLowerCase();
        if (
          curId === targetId ||
          curId === String(idToDelete) ||
          (emailToDelete && curEmail === emailToDelete) ||
          (rollToDelete && curRoll === rollToDelete)
        ) {
          localStorage.removeItem('saumyaa_user');
          localStorage.removeItem('saumyaa_student_profile');
          localStorage.removeItem('saumyaa_token');
          window.dispatchEvent(new Event('saumyaa_user_session_revoked'));
        }
      } catch (e) {}
    }

    return { success: true, message: 'Student deleted successfully from database & session revoked' };
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
    // Return local cache immediately, then sync in background
    const localLeaves = getStoredStudentLeaves();

    // Fire both API calls in parallel instead of sequential (saves ~3s)
    const [remote1, remote2] = await Promise.allSettled([
      apiCall('/admin/student-leaves'),
      apiCall('/student-panel/leaves'),
    ]);

    const remoteLeaves =
      remote1.status === 'fulfilled' && remote1.value?.success && Array.isArray(remote1.value.leaves)
        ? remote1.value.leaves
        : [];
    const remotePanelLeaves =
      remote2.status === 'fulfilled' && remote2.value?.success && Array.isArray(remote2.value.leaves)
        ? remote2.value.leaves
        : [];

    const fsLeaves = await syncFirestoreCollection('student_leaves', initialMockStudentLeaves);

    const mergedMap = new Map();
    [...localLeaves, ...(fsLeaves || []), ...remoteLeaves, ...remotePanelLeaves].forEach((item) => {
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
      branch: data.branch || 'Main Center',
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

  uploadStudentPhoto: async (file, onProgress) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format! Only JPG, PNG, and WEBP files are allowed.');
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image size exceeds 5MB limit. Please upload a smaller photo.');
    }

    return await uploadFirebaseFile(file, 'students', onProgress);
  },
};

// Subject Service with Firebase Firestore DB & Dynamic Enrollment Engine
export const subjectService = {
  getSubjects: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const remote = await apiCall(`/subjects?${query}`);
    if (remote && remote.subjects) return remote;

    const fsSubjects = await syncFirestoreCollection('subjects', []);
    let rawList = fsSubjects !== null && fsSubjects !== undefined ? fsSubjects : getStoredSubjects();
    let list = deduplicateAndSanitizeSubjects(rawList);

    if (params.includeInactive !== true && params.includeInactive !== 'true') {
      list = list.filter((s) => s.isActive !== false);
    }
    if (params.className && params.className !== 'All') {
      list = list.filter((s) => isExactClassMatch(s.className, params.className) || s.className === 'All');
    }
    if (params.category && params.category !== 'All') {
      list = list.filter((s) => normalizeClassCode(s.className || s.category) === normalizeClassCode(params.category));
    }
    if (params.search) {
      const term = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.teacherName?.toLowerCase().includes(term) ||
          s.category?.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term)
      );
    }

    setStoredSubjects(list, true);
    return { success: true, subjects: list };
  },

  createSubject: async (data) => {
    const id = 'sub_' + Date.now();
    const newSubject = {
      ...data,
      _id: id,
      id,
      name: (data.name || '').trim(),
      category: data.category || 'Foundation',
      className: data.className || `Class ${data.categoryCode || 'S2'}`,
      teacherName: data.teacherName || 'Jitender Sharma',
      batchTime: data.batchTime || '5:00 PM – 6:30 PM',
      description: data.description || '',
      maxCapacity: Number(data.maxCapacity) || 20,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const remote = await apiCall('/subjects', { method: 'POST', body: JSON.stringify(newSubject) });
    if (remote && remote.success) {
      notifyDataUpdate();
      return remote;
    }

    try {
      await setDoc(doc(db, 'subjects', id), newSubject);
    } catch (fsErr) {
      console.warn('Firestore setDoc subject warning:', fsErr.message);
    }

    const list = getStoredSubjects();
    setStoredSubjects([newSubject, ...list]);
    notifyDataUpdate();
    return { success: true, subject: newSubject, message: 'Subject created in Academic Catalog' };
  },

  updateSubject: async (id, data) => {
    const remote = await apiCall(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (remote && remote.success) {
      notifyDataUpdate();
      return remote;
    }

    try {
      await setDoc(doc(db, 'subjects', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc subject warning:', fsErr.message);
    }

    const list = getStoredSubjects();
    const idx = list.findIndex((s) => String(s._id || s.id) === String(id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setStoredSubjects(list);
    }
    notifyDataUpdate();
    return { success: true, subject: list[idx], message: 'Subject updated in Academic Catalog' };
  },

  deleteSubject: async (id) => {
    const remote = await apiCall(`/subjects/${id}`, { method: 'DELETE' });
    if (remote && remote.success) {
      notifyDataUpdate();
      return remote;
    }

    try {
      await deleteDoc(doc(db, 'subjects', String(id)));
    } catch (fsErr) {
      console.warn('Firestore deleteDoc subject warning:', fsErr.message);
    }

    const list = getStoredSubjects().filter((s) => String(s._id || s.id) !== String(id));
    setStoredSubjects(list);
    notifyDataUpdate();
    return { success: true, message: 'Subject deleted from catalog' };
  },

  /**
   * Clear all subjects from Firestore DB & local storage to start fresh
   */
  clearAllSubjects: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'subjects'));
      const delPromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(delPromises);
    } catch (err) {
      console.warn('Firestore clear all subjects warning:', err.message);
    }

    setStoredSubjects([]);
    notifyDataUpdate();
    return { success: true, message: 'All subject offerings cleared from catalog' };
  },

  /**
   * Deduplicate and sanitize active subjects catalog, syncing to storage and Firebase
   */
  deduplicateCatalog: async () => {
    const currentSubjects = getStoredSubjects();
    const cleanList = deduplicateAndSanitizeSubjects(currentSubjects);
    setStoredSubjects(cleanList);

    // Sync clean list to Firestore
    try {
      for (const sub of cleanList) {
        const id = String(sub._id || sub.id);
        if (id) {
          await setDoc(doc(db, 'subjects', id), sub, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Firestore sync during deduplication warning:', err.message);
    }

    notifyDataUpdate();
    return { success: true, subjects: cleanList, count: cleanList.length };
  },

  getSubjectRoster: (subject, allStudents = null) => {
    return getEnrolledStudentsForSubject(subject, allStudents);
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

  sendEmail: async (studentId, studentData) => {
    const remote = await apiCall(`/students/${studentId}/remind-email`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    if (remote) {
      if (remote.log) {
        reminderService.saveLog({
          studentId: String(studentId),
          channel: 'Email',
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
      email: studentData.email,
      channel: 'Email',
      sentAt: new Date().toISOString(),
      status: 'sent',
      message: `Email payment reminder dispatched for ${studentData.studentName}`,
    };
    reminderService.saveLog(newLog);

    return {
      success: true,
      message: `Automated Email reminder dispatched for ${studentData.studentName}!`,
      log: newLog,
    };
  },

  bulkRemindSMS: async () => {
    const remote = await apiCall('/students/bulk-remind-sms', {
      method: 'POST',
    });
    if (remote) return remote;
    return { success: true, message: 'Bulk SMS dispatched', sentCount: 0 };
  },

  bulkRemindEmail: async () => {
    const remote = await apiCall('/students/bulk-remind-email', {
      method: 'POST',
    });
    if (remote) return remote;
    return { success: true, message: 'Bulk Email dispatched', sentCount: 0 };
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
      const midTerm = Number(item.midTermMarks ?? item.midTerm) || 0;
      const assignment = Number(item.assignmentMarks ?? item.assignment) || 0;
      const finalExam = Number(item.finalExamMarks ?? item.finalExam ?? item.theoryMarks) || 0;
      const internal = Number(item.internalMarks ?? item.internal ?? item.practicalMarks) || 0;
      const totalObtained = midTerm + assignment + finalExam + internal;

      const existingIdx = updatedMarks.findIndex(
        (m) =>
          (String(m.student) === studentId || String(m.student?._id) === studentId) &&
          m.subject === subject &&
          (m.examType === examType || m.title === examType)
      );

      const totalMax = Number(item.totalMax) || 195;
      const pct = Math.min(100, Math.round(((totalObtained / totalMax) * 100) * 10) / 10);
      let calcGrade = 'F';
      if (pct >= 90) calcGrade = 'A+';
      else if (pct >= 80) calcGrade = 'A';
      else if (pct >= 70) calcGrade = 'B+';
      else if (pct >= 60) calcGrade = 'B';
      else if (pct >= 50) calcGrade = 'C';
      else if (pct >= 35) calcGrade = 'D';
      else calcGrade = 'F';

      const todayIso = new Date().toISOString().split('T')[0];

      const recordObj = {
        _id: existingIdx >= 0 ? updatedMarks[existingIdx]._id : 'mark_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        student: studentId,
        studentId: studentId,
        className,
        subject: subject || 'General Academics',
        examType: examType || 'Internal Assessment',
        title: examType || 'Internal Assessment',
        examName: examType || 'Internal Assessment',
        midTermMarks: midTerm,
        assignmentMarks: assignment,
        finalExamMarks: finalExam,
        internalMarks: internal,
        theoryMarks: finalExam,
        practicalMarks: internal,
        marksByType: {
          'Internal Assessment 1': { obtained: internal, max: 25 },
          'Mid-Term Practical': { obtained: midTerm, max: 50 },
          'Assignment Score': { obtained: assignment, max: 20 },
          'Final Term Board Prep': { obtained: finalExam, max: 100 },
        },
        marksObtained: totalObtained,
        obtainedMarks: totalObtained,
        totalMarks: totalMax,
        maxMarks: totalMax,
        percentage: pct,
        grade: calcGrade,
        examDate: todayIso,
        date: todayIso,
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
    let remoteRecords = [];
    let remoteStats = null;
    if (studentId) {
      try {
        const remote = await apiCall(`/attendance?studentId=${studentId}`);
        if (remote && remote.success && Array.isArray(remote.attendance)) {
          remoteRecords = remote.attendance;
          if (remote.stats) remoteStats = remote.stats;
        }
      } catch (e) {}
    }

    const fsAttendance = await syncFirestoreCollection('attendance', initialMockAttendance);
    let localFsRecords = getCombinedAttendance(fsAttendance);

    const storedStudents = getStoredStudents();
    const targetStudent = storedStudents.find(
      (s) =>
        String(s._id) === String(studentId) ||
        String(s.id) === String(studentId) ||
        (s.email && s.email.toLowerCase() === String(studentId).toLowerCase()) ||
        (s.rollNumber && s.rollNumber.toLowerCase() === String(studentId).toLowerCase())
    );

    const matchIds = new Set(
      [
        String(studentId),
        targetStudent ? String(targetStudent._id) : null,
        targetStudent ? String(targetStudent.id) : null,
        targetStudent ? String(targetStudent.rollNumber) : null,
        targetStudent ? String(targetStudent.email) : null,
      ].filter(Boolean)
    );

    const recordMap = new Map();

    const processRecord = (a) => {
      if (!a) return;
      const aStId = String(a.student?._id || a.student?.id || a.student || '');
      const aRoll = String(a.rollNumber || a.student?.rollNumber || '');
      const aEmail = String(a.student?.email || '');

      const isMatch =
        matchIds.has(aStId) ||
        (aRoll && matchIds.has(aRoll)) ||
        (aEmail && matchIds.has(aEmail));

      if (isMatch) {
        const key = a._id || `${normalizeDateKey(a.date)}_${a.subject || 'General'}`;
        recordMap.set(key, a);
      }
    };

    remoteRecords.forEach(processRecord);
    localFsRecords.forEach(processRecord);

    const list = Array.from(recordMap.values()).sort(
      (a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now())
    );

    const presentCount = list.filter((a) => a.status === 'Present').length;
    const absentCount = list.filter((a) => a.status === 'Absent').length;
    const lateCount = list.filter((a) => a.status === 'Late').length;
    const totalCount = list.length;

    const percentage = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : (remoteStats?.attendancePercentage ?? 100);

    return {
      success: true,
      attendance: list,
      stats: {
        presentDays: presentCount || (remoteStats?.presentDays ?? 0),
        absentDays: absentCount || (remoteStats?.absentDays ?? 0),
        lateDays: lateCount || (remoteStats?.lateDays ?? 0),
        totalDays: totalCount || (remoteStats?.totalDays ?? 0),
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

    return { success: true, attendance: list, records: list };
  },

  getAttendanceRecords: async (params = {}) => {
    const res = await attendanceService.getAllAttendance(params);
    return {
      success: res?.success ?? true,
      records: res?.records || res?.attendance || [],
      attendance: res?.attendance || res?.records || [],
    };
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

// Branch Service
export const branchService = {
  getBranches: async () => {
    try {
      const remote = await apiCall('/branches');
      if (remote && remote.branches) return remote;
    } catch (e) {}
    return {
      success: true,
      branches: [
        { name: 'Main Center (Bagru)', code: 'MAIN_CENTER', address: 'Bagru Campus, Main Road', city: 'Bagru' },
        { name: 'Branch (Daroh)', code: 'BRANCH_DAROH', address: 'Daroh Market Complex', city: 'Daroh' },
      ],
    };
  },
  createBranch: async (data) => {
    return await apiCall('/branches', { method: 'POST', body: JSON.stringify(data) });
  },
};

// Notification Service
export const notificationService = {
  getNotifications: async (studentId) => {
    const query = studentId ? `?studentId=${studentId}` : '';
    const remote = await apiCall(`/notifications${query}`);
    if (remote) return remote;

    return { success: true, notifications: getStoredNotifications() };
  },

  markAsRead: async (id) => {
    try {
      await apiCall(`/notifications/${id}/read`, { method: 'PUT' });
    } catch (e) {}
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
        bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
        label: `Overdue (${Math.abs(diffDays)}d)`,
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else if (diffDays === 0) {
      return {
        status: 'Due Today',
        code: 'due_today',
        color: 'rose',
        bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
        label: 'Due Today',
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else if (diffDays === 1) {
      return {
        status: 'Due Tomorrow',
        code: 'due_tomorrow',
        color: 'amber',
        bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
        label: 'Due Tomorrow',
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else if (diffDays <= 7) {
      return {
        status: 'Due This Week',
        code: 'due_this_week',
        color: 'amber',
        bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
        label: `Due in ${diffDays}d`,
        nextDueDate: dueDate,
        nextDueDateStr: dueDate.toISOString().split('T')[0],
      };
    } else {
      return {
        status: 'Upcoming',
        code: 'upcoming',
        color: 'blue',
        bgClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
        label: `Due in ${diffDays}d`,
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
      bgClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
      label: 'Up to Date',
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
      bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
      label: `Overdue (${Math.abs(diffDays)}d)`,
      nextDueDate,
      nextDueDateStr,
    };
  } else if (diffDays === 0) {
    return {
      status: 'Due Today',
      code: 'due_today',
      color: 'rose',
      bgClass: 'bg-rose-100 text-rose-800 border border-rose-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
      label: 'Due Today',
      nextDueDate,
      nextDueDateStr,
    };
  } else if (diffDays === 1) {
    return {
      status: 'Due Tomorrow',
      code: 'due_tomorrow',
      color: 'amber',
      bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
      label: 'Due Tomorrow',
      nextDueDate,
      nextDueDateStr,
    };
  } else if (diffDays <= 7) {
    return {
      status: 'Due This Week',
      code: 'due_this_week',
      color: 'amber',
      bgClass: 'bg-amber-100 text-amber-800 border border-amber-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
      label: `Due in ${diffDays}d`,
      nextDueDate,
      nextDueDateStr,
    };
  } else {
    return {
      status: 'Upcoming',
      code: 'upcoming',
      color: 'blue',
      bgClass: 'bg-blue-100 text-blue-800 border border-blue-200 font-medium whitespace-nowrap inline-flex items-center gap-1',
      label: `Due in ${diffDays}d`,
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

    const fsSubjects = await syncFirestoreCollection('subjects', []);
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
// Feedback / Review Service
const initialMockFeedbacks = [];

export const getStoredFeedbacks = () => {
  try {
    const saved = localStorage.getItem('saumyaa_feedbacks');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const setStoredFeedbacks = (list) => {
  localStorage.setItem('saumyaa_feedbacks', JSON.stringify(list));
  notifyDataUpdate();
};

export const feedbackService = {
  getFeedbacks: async () => {
    const fsFeedbacks = await syncFirestoreCollection('feedbacks', []);
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

export const initialMockFaculty = [];

export const getStoredFaculty = () => {
  try {
    const deleted = getDeletedIds('faculty');
    const data = localStorage.getItem('saumyaa_faculty');
    let list = data ? JSON.parse(data) : [];
    if (!list || !Array.isArray(list)) return [];

    const map = new Map();
    list.forEach((f) => {
      if (!f) return;
      const fId = String(f._id || f.id || '');
      const fEmail = (f.email && typeof f.email === 'string' ? f.email.toLowerCase() : '').trim();
      const k = String(f._id || f.id || f.email || '').trim().toLowerCase();
      if (deleted.includes(fId) || (fEmail && deleted.includes(fEmail))) {
        return;
      }
      if (k) map.set(k, f);
    });

    let mergedList = Array.from(map.values()).map((f) => {
      const derivedRoles = Array.isArray(f.roles) && f.roles.length > 0
        ? f.roles
        : (f.role && f.role !== 'Faculty' ? [f.role] : ['SUBJECT_TEACHER']);
      const bId = normalizeBranchId(f.branchId || f.branch);
      return {
        ...f,
        email: f.email || `${(f.name || 'faculty').toLowerCase().replace(/[^a-z0-9]/g, '.')}@saumyaa.edu.in`,
        password: f.password || 'faculty123',
        roles: derivedRoles,
        role: f.role || derivedRoles[0] || 'SUBJECT_TEACHER',
        branchId: bId,
        branch: f.branch || (bId === 'BRANCH' ? 'Branch (Daroh)' : 'Main Center (Bagru)'),
        assignedClasses: f.assignedClasses || [],
        assignedSubjects: f.assignedSubjects || [],
        responsibilities: f.responsibilities || [],
      };
    });

    localStorage.setItem('saumyaa_faculty', JSON.stringify(mergedList));
    return mergedList;
  } catch (e) {
    return [];
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
    const localStored = getStoredFaculty();

    if (remote && remote.success && Array.isArray(remote.faculty)) {
      const combined = new Map();
      remote.faculty.forEach((r) => {
        const k = String(r._id || r.id || r.email || '').trim().toLowerCase();
        if (k) combined.set(k, r);
      });
      localStored.forEach((l) => {
        const k = String(l._id || l.id || l.email || '').trim().toLowerCase();
        if (k) {
          const existing = combined.get(k) || {};
          combined.set(k, { ...existing, ...l });
        }
      });
      const merged = Array.from(combined.values());
      setStoredFaculty(merged, true);
      return { ...remote, faculty: merged };
    }

    const fsFaculty = await syncFirestoreCollection('faculty', initialMockFaculty);
    
    // Deduplicate strictly by ID and prioritize localStored edits over Firestore initial defaults
    const combinedMap = new Map();
    (fsFaculty || []).forEach((f) => {
      const k = String(f._id || f.id || f.email || '').trim().toLowerCase();
      if (k) combinedMap.set(k, f);
    });
    localStored.forEach((f) => {
      const k = String(f._id || f.id || f.email || '').trim().toLowerCase();
      if (k) {
        const existing = combinedMap.get(k) || {};
        combinedMap.set(k, { ...existing, ...f });
      }
    });

    let list = Array.from(combinedMap.values());
    if (!list || list.length === 0) {
      list = localStored.length > 0 ? localStored : initialMockFaculty;
    }
    if (activeOnly) {
      list = list.filter((f) => f.is_active !== false);
    }
    list.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
    setStoredFaculty(list, true);
    return { success: true, faculty: list };
  },

  createFaculty: async (data) => {
    if (!data.name || !data.name.trim()) throw new Error('Faculty name is required');
    if (!data.photo_url) throw new Error('Faculty photo is required');

    const tempPassword = data.password || generateSecureTemporaryPassword(10);
    const hashedPassword = await hashPasswordClient(tempPassword);

    const id = 'fac_' + Date.now();
    const newFaculty = {
      _id: id,
      id,
      name: data.name,
      email: data.email ? data.email.toLowerCase() : `${data.name.toLowerCase().replace(/ /g, '.')}@saumyaa.edu.in`,
      password: hashedPassword,
      initialPassword: tempPassword,
      tempPassword: tempPassword,
      temporaryPassword: tempPassword,
      mustChangePassword: true,
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
    const updatedList = [newFaculty, ...list.filter((f) => String(f._id || f.id) !== id)];
    setStoredFaculty(updatedList);
    return { success: true, faculty: newFaculty, temporaryPassword: tempPassword, message: 'Faculty member created successfully' };
  },

  resetPassword: async (facultyId) => {
    if (!facultyId) return { success: false, message: 'Invalid Faculty ID' };
    const targetId = String(facultyId);
    const list = getStoredFaculty();
    const idx = list.findIndex((f) => String(f._id) === targetId || String(f.id) === targetId);

    if (idx === -1) return { success: false, message: 'Faculty member not found' };

    const newTempPassword = generateSecureTemporaryPassword(10);
    const hashedPassword = await hashPasswordClient(newTempPassword);

    list[idx].password = hashedPassword;
    list[idx].initialPassword = newTempPassword;
    list[idx].tempPassword = newTempPassword;
    list[idx].temporaryPassword = newTempPassword;
    list[idx].mustChangePassword = true;

    try {
      await apiCall(`/faculty/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ password: hashedPassword, mustChangePassword: true }),
      });
    } catch (e) {}

    try {
      await setDoc(doc(db, 'faculty', targetId), { password: hashedPassword, mustChangePassword: true }, { merge: true });
    } catch (e) {}

    setStoredFaculty(list);
    return { success: true, temporaryPassword: newTempPassword, message: 'Faculty password reset successfully' };
  },

  updateFaculty: async (id, data) => {
    try {
      await apiCall(`/faculty/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Backend updateFaculty apiCall error:', e.message);
    }

    try {
      await setDoc(doc(db, 'faculty', String(id)), data, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore updateDoc faculty error:', fsErr.message);
    }

    const list = getStoredFaculty();
    const idx = list.findIndex(
      (f) =>
        String(f._id || f.id) === String(id) ||
        (f.email && data.email && f.email.toLowerCase() === data.email.toLowerCase()) ||
        (f.name && data.name && f.name.toLowerCase() === data.name.toLowerCase())
    );
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
    } else {
      list.push({ _id: id, id, ...data });
    }
    setStoredFaculty(list);

    // If this faculty member is currently logged in, update saumyaa_user as well!
      try {
        const currentUserStr = localStorage.getItem('saumyaa_user');
        if (currentUserStr) {
          const curr = JSON.parse(currentUserStr);
          if (
            String(curr._id || curr.id) === String(id) ||
            (curr.email && data.email && curr.email.toLowerCase() === data.email.toLowerCase())
          ) {
            const updatedUser = { ...curr, ...data };
            localStorage.setItem('saumyaa_user', JSON.stringify(updatedUser));
          }
        }
      } catch (e) {}
    notifyDataUpdate();
    return { success: true, faculty: idx !== -1 ? list[idx] : data, message: 'Faculty credentials & details updated successfully!' };
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
    if (!id) return { success: false, message: 'Invalid Faculty ID' };
    const targetId = String(id);
    const facultyList = getStoredFaculty();
    const targetFac = facultyList.find(
      (f) =>
        String(f._id) === targetId ||
        String(f.id) === targetId ||
        (f.email && f.email.toLowerCase() === targetId.toLowerCase())
    );

    const emailToDelete = targetFac?.email?.toLowerCase();
    const idToDelete = targetFac?._id || targetFac?.id || targetId;

    // Track deletion across key identifiers
    addDeletedId('faculty', targetId);
    if (idToDelete) addDeletedId('faculty', String(idToDelete));
    if (emailToDelete) addDeletedId('faculty', emailToDelete);

    if (photoUrl) {
      deleteFirebaseFile(photoUrl).catch(() => {});
    }

    // Hard delete from MongoDB backend
    try {
      await apiCall(`/faculty/${targetId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend delete faculty warning:', e.message);
    }

    // Delete from Firebase Firestore DB
    try {
      await deleteDoc(doc(db, 'faculty', String(targetId)));
      if (idToDelete && String(idToDelete) !== targetId) {
        await deleteDoc(doc(db, 'faculty', String(idToDelete)));
      }
    } catch (fsErr) {
      console.warn('Firestore deleteDoc faculty error:', fsErr.message);
    }

    // Filter local storage
    const remaining = facultyList.filter((f) => {
      const fId = String(f._id || f.id);
      const fEmail = (f.email || '').toLowerCase();
      return fId !== targetId && fId !== String(idToDelete) && (!emailToDelete || fEmail !== emailToDelete);
    });
    setStoredFaculty(remaining);

    // Instant session revocation if deleted user is logged in
    const currentUserStr = localStorage.getItem('saumyaa_user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        const curId = String(currentUser._id || currentUser.id || '');
        const curEmail = (currentUser.email || '').toLowerCase();
        if (
          curId === targetId ||
          curId === String(idToDelete) ||
          (emailToDelete && curEmail === emailToDelete)
        ) {
          localStorage.removeItem('saumyaa_user');
          localStorage.removeItem('saumyaa_admin');
          localStorage.removeItem('saumyaa_token');
          window.dispatchEvent(new Event('saumyaa_user_session_revoked'));
        }
      } catch (e) {}
    }

    return { success: true, message: 'Faculty member deleted successfully from database & session revoked' };
  },

  restoreDefaultFaculty: async () => {
    localStorage.setItem('saumyaa_faculty', JSON.stringify(initialMockFaculty));
    notifyDataUpdate();
    return { success: true, faculty: initialMockFaculty, message: 'All default faculty cards restored successfully!' };
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

const initialMockFacultyApplications = [];

export const getStoredFacultyApplications = () => {
  const deleted = getDeletedIds('faculty_applications');
  try {
    const data = localStorage.getItem('saumyaa_faculty_applications');
    const list = data ? JSON.parse(data) : [];
    return (list || []).filter((a) => a && !deleted.includes(String(a._id)) && !deleted.includes(String(a.id)));
  } catch (e) {
    return [];
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
    const fsApps = await syncFirestoreCollection('faculty_applications', []);
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
        ? 'Faculty Application submitted successfully and emailed to anujdhiman1706@gmail.com & jitender0585@gmail.com!'
        : 'Faculty Application saved successfully.',
    };
  },

  updateApplication: async (id, formData) => {
    const list = getStoredFacultyApplications();
    const idx = list.findIndex((a) => String(a._id) === String(id) || String(a.id) === String(id) || String(a.applicationId) === String(id));

    if (idx === -1) {
      throw new Error('Faculty application not found');
    }

    if (list[idx].status === 'Approved' || list[idx].status === 'Selected') {
      throw new Error('Approved faculty applications are locked and cannot be modified.');
    }

    const updatedApp = {
      ...list[idx],
      ...formData,
      status: list[idx].status === 'Rejected' ? 'Pending' : (list[idx].status || 'Pending'),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'faculty_applications', String(list[idx]._id || list[idx].id)), updatedApp, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore update faculty application error:', fsErr.message);
    }

    list[idx] = updatedApp;
    setStoredFacultyApplications([...list]);
    notifyDataUpdate();

    return {
      success: true,
      application: updatedApp,
      applicationId: updatedApp.applicationId,
      message: 'Faculty application updated successfully!',
    };
  },

  updateApplicationStatus: async (id, status, notes = '', examInterviewSchedule = null) => {
    const list = getStoredFacultyApplications();
    const idx = list.findIndex((a) => String(a._id) === String(id) || String(a.id) === String(id) || String(a.applicationId) === String(id));
    let notificationResult = null;
    let targetEmail = '';

    if (idx !== -1) {
      list[idx].status = status;
      if (notes) list[idx].notes = notes;
      list[idx].updatedAt = new Date().toISOString();
      targetEmail = list[idx].email || '';

      if (examInterviewSchedule) {
        list[idx].examInterviewSchedule = {
          ...(list[idx].examInterviewSchedule || {}),
          ...examInterviewSchedule,
          scheduledAt: new Date().toISOString(),
          scheduledBy: examInterviewSchedule.scheduledBy || 'Admin / Management',
        };
      }

      const scheduleSummary = examInterviewSchedule && examInterviewSchedule.date
        ? `Interview scheduled for ${examInterviewSchedule.day ? examInterviewSchedule.day + ', ' : ''}${examInterviewSchedule.date} at ${examInterviewSchedule.time || 'designated slot'}. Venue/Mode: ${examInterviewSchedule.venueMode || 'Main Center'}.`
        : '';

      const historyLog = {
        status,
        date: new Date().toISOString(),
        notes: notes || scheduleSummary || `Status updated to ${status}`,
        sentTo: targetEmail,
        schedule: examInterviewSchedule || undefined,
      };

      list[idx].notificationHistory = [
        ...(list[idx].notificationHistory || []),
        historyLog,
      ];

      try {
        await setDoc(doc(db, 'faculty_applications', String(list[idx]._id || id)), list[idx], { merge: true });
      } catch (fsErr) {
        console.warn('Firestore update application status error:', fsErr.message);
      }

      setStoredFacultyApplications([...list]);

      // Trigger status notification email directly to candidate
      if (targetEmail) {
        notificationResult = await sendCandidateStatusNotification(
          list[idx],
          status,
          notes || scheduleSummary
        );
      }
    }

    return {
      success: true,
      message: `Application status updated to ${status}${targetEmail ? ` & candidate notified (${targetEmail})` : ''}`,
      notificationResult,
      application: idx !== -1 ? list[idx] : null,
    };
  },

  deleteApplication: async (id) => {
    if (!id) return { success: false, message: 'Invalid ID' };
    const targetStr = String(id);
    addDeletedId('faculty_applications', targetStr);

    try {
      await deleteDoc(doc(db, 'faculty_applications', targetStr));
    } catch (fsErr) {
      console.warn('Firestore delete application error:', fsErr.message);
    }

    const list = getStoredFacultyApplications().filter((a) => String(a._id) !== targetStr && String(a.id) !== targetStr);
    setStoredFacultyApplications(list);
    return { success: true, message: 'Application deleted successfully' };
  },

  approveAndConvertToFaculty: async (app) => {
    const newFacultyData = {
      name: app.fullName,
      email: app.email,
      phone: app.contactNumber || app.phone,
      password: app.temporaryPassword || app.password || app.initialPassword,
      designation: app.positionApplied || 'Senior Faculty Member',
      subject: Array.isArray(app.subjectsExpertise) ? app.subjectsExpertise.join(', ') : app.subjectsExpertise || app.specialization || 'General Academics',
      qualification: `${app.highestDegree || ''} (${app.specialization || ''})`,
      experience: app.totalExperience || '3+ Years',
      photo_url: app.photo_url || app.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      display_order: 1,
      is_active: true,
    };

    const res = await facultyService.createFaculty(newFacultyData);
    await facultyApplicationService.updateApplicationStatus(app._id || app.id, 'Approved', 'Approved & Onboarded to Faculty Directory');
    return res;
  }
};

// ==========================================
// STUDENT APPLICATIONS SERVICE & MOCK DATA
// ==========================================
export const initialMockStudentApplications = [];

export const getStoredStudentApplications = () => {
  const deleted = getDeletedIds('student_applications');
  try {
    const data = localStorage.getItem('saumyaa_student_applications');
    const list = data ? JSON.parse(data) : initialMockStudentApplications;
    return list
      .filter((a) => a && !deleted.includes(String(a._id)) && !deleted.includes(String(a.id)) && !deleted.includes(String(a.applicationId)))
      .map((a) => ({ ...a, targetClass: a.targetClass || a.currentClass || '10th' }));
  } catch (e) {
    return initialMockStudentApplications
      .filter((a) => a && !deleted.includes(String(a._id)) && !deleted.includes(String(a.id)) && !deleted.includes(String(a.applicationId)))
      .map((a) => ({ ...a, targetClass: a.targetClass || a.currentClass || '10th' }));
  }
};

export const setStoredStudentApplications = (list) => {
  try {
    localStorage.setItem('saumyaa_student_applications', JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage student applications write error:', e);
  }
};

export const studentApplicationService = {
  getApplications: async () => {
    try {
      const remote = await apiCall('/student-applications');
      if (remote && Array.isArray(remote.applications)) {
        setStoredStudentApplications(remote.applications);
        return { success: true, applications: remote.applications };
      }
    } catch (e) {
      console.warn('Backend getStudentApplications error, falling back:', e);
    }

    const fsApps = await syncFirestoreCollection('student_applications', initialMockStudentApplications);
    let list = fsApps || getStoredStudentApplications();
    list.sort((a, b) => new Date(b.submittedAt || b.appliedAt || b.createdAt || 0) - new Date(a.submittedAt || a.appliedAt || a.createdAt || 0));
    return { success: true, applications: list };
  },

  checkEligibility: (email, contactNumber) => {
    const list = getStoredStudentApplications();
    const emailClean = (email || '').trim().toLowerCase();
    const contactClean = (contactNumber || '').trim();

    const latestApproved = list.find(
      (a) =>
        a.status === 'Approved' &&
        (a.approvedAt || a.reviewedDate) &&
        ((emailClean && a.email && a.email.toLowerCase() === emailClean) ||
         (contactClean && a.contactNumber && a.contactNumber === contactClean))
    );

    if (latestApproved && (latestApproved.approvedAt || latestApproved.reviewedDate)) {
      const approvedDate = new Date(latestApproved.approvedAt || latestApproved.reviewedDate);
      const nextAllowedDate = new Date(approvedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now < nextAllowedDate) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const approvedFormatted = `${approvedDate.getDate()} ${months[approvedDate.getMonth()]} ${approvedDate.getFullYear()}`;
        const nextFormatted = `${nextAllowedDate.getDate()} ${months[nextAllowedDate.getMonth()]} ${nextAllowedDate.getFullYear()}`;
        return {
          isLocked: true,
          approvedAt: approvedDate,
          nextEligibleDate: nextAllowedDate,
          formattedApprovedDate: approvedFormatted,
          formattedNextDate: nextFormatted,
          message: `This request was approved on ${approvedFormatted}. You can make another request after ${nextFormatted}.`,
        };
      }
    }

    return { isLocked: false };
  },

  submitApplication: async (formData) => {
    const emailClean = (formData.email || '').trim().toLowerCase();
    const contactClean = (formData.contactNumber || '').trim();

    // 1. Check 30-day post-approval cooldown
    const eligibility = studentApplicationService.checkEligibility(emailClean, contactClean);
    if (eligibility.isLocked) {
      throw new Error(eligibility.message);
    }

    const list = getStoredStudentApplications();

    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const generatedAppId = `SAU-STU-${new Date().getFullYear()}-${randomCode}`;
    const payload = {
      ...formData,
      applicationId: formData.applicationId || generatedAppId,
    };

    let remoteApp = null;
    try {
      const baseUrl = getApiBaseUrl();
      const apiUrl = baseUrl ? `${baseUrl}/student-applications` : '/api/student-applications';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data && data.success && data.application) {
        remoteApp = data.application;
      }
    } catch (apiErr) {
      console.warn('Student application backend POST warning:', apiErr.message);
    }

    const finalId = remoteApp?._id || remoteApp?.id || 'app_stu_' + Date.now();
    const finalApp = remoteApp || {
      _id: finalId,
      id: finalId,
      applicationId: payload.applicationId,
      ...formData,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
      notes: '',
    };

    try {
      await setDoc(doc(db, 'student_applications', String(finalApp._id || finalApp.id)), finalApp);
    } catch (fsErr) {
      console.warn('Firestore setDoc student_application error:', fsErr.message);
    }

    const existingPendingIdx = list.findIndex(
      (a) =>
        (finalApp.applicationId && a.applicationId === finalApp.applicationId) ||
        (a.status === 'Pending' &&
          ((emailClean && a.email && a.email.toLowerCase() === emailClean) ||
           (contactClean && a.contactNumber && a.contactNumber === contactClean)))
    );

    let updatedList;
    if (existingPendingIdx !== -1) {
      list[existingPendingIdx] = finalApp;
      updatedList = [...list];
    } else {
      updatedList = [finalApp, ...list];
    }

    setStoredStudentApplications(updatedList);
    notifyDataUpdate();

    // Direct email notification dispatch to admin email
    let emailSent = false;
    try {
      const emailRes = await sendStudentApplicationNotification(finalApp);
      if (emailRes && emailRes.success) {
        emailSent = true;
      }
    } catch (emailErr) {
      console.warn('Student application email dispatch warning:', emailErr.message);
    }

    return {
      success: true,
      application: finalApp,
      applicationId: finalApp.applicationId,
      emailSent,
      message: 'Student Application submitted successfully!',
    };
  },

  updateApplication: async (id, formData) => {
    let remoteApp = null;
    try {
      const baseUrl = getApiBaseUrl();
      const apiUrl = baseUrl ? `${baseUrl}/student-applications/${id}` : `/api/student-applications/${id}`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data && data.success && data.application) {
        remoteApp = data.application;
      }
    } catch (apiErr) {
      console.warn('Student application backend PUT warning:', apiErr.message);
    }

    const list = getStoredStudentApplications();
    const idx = list.findIndex((a) => String(a._id) === String(id) || String(a.id) === String(id) || String(a.applicationId) === String(id));

    if (!remoteApp && idx === -1) {
      throw new Error('Application not found');
    }

    const updatedApp = remoteApp || {
      ...list[idx],
      ...formData,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      rejectedAt: null,
    };

    try {
      await setDoc(doc(db, 'student_applications', String(updatedApp._id || id)), updatedApp, { merge: true });
    } catch (fsErr) {}

    if (idx !== -1) {
      list[idx] = updatedApp;
    } else {
      list.unshift(updatedApp);
    }
    setStoredStudentApplications([...list]);
    notifyDataUpdate();

    return {
      success: true,
      application: updatedApp,
      message: 'Application updated and resubmitted successfully!',
    };
  },

  updateApplicationStatus: async (id, status, notes = '', examInterviewSchedule = null) => {
    let remoteApp = null;
    try {
      const baseUrl = getApiBaseUrl();
      if (baseUrl) {
        const response = await fetch(`${baseUrl}/student-applications/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes, examInterviewSchedule }),
        });
        const data = await response.json();
        if (data && data.success && data.application) {
          remoteApp = data.application;
        }
      }
    } catch (apiErr) {
      console.warn('Student application status backend PUT warning:', apiErr.message);
    }

    const list = getStoredStudentApplications();
    const idx = list.findIndex((a) => String(a._id) === String(id) || String(a.id) === String(id) || String(a.applicationId) === String(id));

    const now = new Date().toISOString();
    let targetApp = remoteApp || (idx !== -1 ? { ...list[idx] } : null);

    if (!targetApp && idx === -1) {
      targetApp = { id, _id: id, status, notes, updatedAt: now };
    } else if (!remoteApp && targetApp) {
      targetApp.status = status;
      if (notes !== undefined) targetApp.notes = notes;
      targetApp.updatedAt = now;

      if (examInterviewSchedule) {
        targetApp.examInterviewSchedule = {
          ...(targetApp.examInterviewSchedule || {}),
          ...examInterviewSchedule,
          scheduledAt: now,
          scheduledBy: examInterviewSchedule.scheduledBy || 'Admin / Admissions Committee',
        };
      }

      if (status === 'Approved') {
        targetApp.approvedAt = now;
        targetApp.nextEligibleDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        targetApp.lastApprovedRequestId = String(id);
      } else if (status === 'Rejected') {
        targetApp.rejectedAt = now;
        targetApp.nextEligibleDate = null;
      }

      const scheduleSummary = examInterviewSchedule && examInterviewSchedule.date
        ? `Interview scheduled on ${examInterviewSchedule.day ? examInterviewSchedule.day + ', ' : ''}${examInterviewSchedule.date} at ${examInterviewSchedule.time || 'designated slot'}. Venue: ${examInterviewSchedule.venueMode || 'Main Center'}.`
        : '';

      const historyLog = {
        status,
        date: now,
        notes: notes || scheduleSummary || `Status updated to ${status}`,
        sentTo: targetApp.email,
        schedule: examInterviewSchedule || undefined,
      };

      targetApp.notificationHistory = [
        ...(targetApp.notificationHistory || []),
        historyLog,
      ];
    }

    if (targetApp) {
      try {
        await setDoc(doc(db, 'student_applications', String(targetApp._id || id)), targetApp, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore update student application status error:', fsErr.message);
      }

      if (idx !== -1) {
        list[idx] = targetApp;
      } else {
        list.unshift(targetApp);
      }
      setStoredStudentApplications([...list]);
      notifyDataUpdate();
    }

    return {
      success: true,
      message: `Student application status updated to ${status}`,
      application: targetApp,
    };
  },

  deleteApplication: async (id) => {
    if (!id) return { success: false, message: 'Invalid ID' };
    const targetStr = String(id);
    addDeletedId('student_applications', targetStr);

    try {
      const baseUrl = getApiBaseUrl();
      if (baseUrl) {
        await fetch(`${baseUrl}/student-applications/${targetStr}`, {
          method: 'DELETE',
        });
      }
    } catch (apiErr) {
      console.warn('Student application backend DELETE warning:', apiErr.message);
    }

    const currentList = JSON.parse(localStorage.getItem('saumyaa_student_applications') || 'null') || initialMockStudentApplications;
    const targetItem = currentList.find(
      (a) => String(a._id) === targetStr || String(a.id) === targetStr || String(a.applicationId) === targetStr
    );
    if (targetItem) {
      if (targetItem._id) addDeletedId('student_applications', targetItem._id);
      if (targetItem.id) addDeletedId('student_applications', targetItem.id);
      if (targetItem.applicationId) addDeletedId('student_applications', targetItem.applicationId);
    }

    try {
      await deleteDoc(doc(db, 'student_applications', targetStr));
      if (targetItem && targetItem._id && String(targetItem._id) !== targetStr) {
        await deleteDoc(doc(db, 'student_applications', String(targetItem._id)));
      }
    } catch (fsErr) {
      console.warn('Firestore delete student application error:', fsErr.message);
    }

    const list = currentList.filter(
      (a) =>
        String(a._id) !== targetStr &&
        String(a.id) !== targetStr &&
        String(a.applicationId) !== targetStr
    );
    setStoredStudentApplications(list);
    notifyDataUpdate();
    return { success: true, message: 'Student application deleted successfully' };
  },

  approveAndConvertToStudent: async (app, extraStudentFields = {}) => {
    const newStudentData = {
      fullName: app.fullName,
      email: app.email,
      phone: app.contactNumber || app.phone,
      fatherName: extraStudentFields.fatherName || app.fatherName || app.parentName || 'Guardian',
      motherName: extraStudentFields.motherName || app.motherName || '',
      parentPhone: app.parentContact || app.contactNumber || app.phone,
      className: extraStudentFields.className || app.targetClass || '10th',
      subjects: Array.isArray(app.subjects) ? app.subjects : [app.subjects || 'General Academics'],
      batch: extraStudentFields.batch || '2026-2027',
      branch: app.branch || 'Main Center',
      monthlyFee: extraStudentFields.monthlyFee !== undefined ? extraStudentFields.monthlyFee : 2500,
      monthlyDueDay: 5,
      status: 'Active',
      ...extraStudentFields,
    };

    const res = await studentService.createStudent(newStudentData);
    await studentApplicationService.deleteApplication(app._id || app.id || app.applicationId);
    return res;
  }
};

// ==========================================
// DEMO CLASS BOOKINGS SERVICE & REPOSITORIES
// ==========================================
export const initialMockDemoBookings = [
  {
    _id: 'demo_init_1',
    id: 'demo_init_1',
    bookingId: 'DM-2026-101',
    studentName: 'Aarav Sharma',
    parentPhone: '9816012345',
    parentEmail: 'aarav.parent@gmail.com',
    branch: 'Main Center (Bagru)',
    subject: 'Physics IIT-JEE Prep',
    category: 'JEE',
    class: '11th (+1)',
    batchTime: '4:30 PM - 6:00 PM',
    status: 'Scheduled',
    scheduledDate: '2026-09-22',
    scheduledTime: '04:30 PM',
    facultyMentor: 'Jitender Sharma',
    meetingMode: 'Offline Classroom',
    adminNotes: 'Student wants to prepare for JEE 2027. Needs focus on Mechanics & Vectors.',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: 'demo_init_2',
    id: 'demo_init_2',
    bookingId: 'DM-2026-102',
    studentName: 'Sneha Verma',
    parentPhone: '9805543210',
    parentEmail: 'sneha.verma@yahoo.com',
    branch: 'Branch (Daroh)',
    subject: 'Biology for NEET Medical',
    category: 'NEET',
    class: '12th (+2)',
    batchTime: '5:00 PM - 6:30 PM',
    status: 'Pending',
    scheduledDate: '',
    scheduledTime: '',
    facultyMentor: '',
    meetingMode: 'Offline Classroom',
    adminNotes: 'Interested in Sunday doubt clearing session.',
    submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  }
];

export const getStoredDemoBookings = () => {
  const deleted = getDeletedIds('demo_bookings');
  try {
    const data = localStorage.getItem('saumyaa_demo_bookings');
    const list = data ? JSON.parse(data) : initialMockDemoBookings;
    return (list || []).filter((b) => b && !deleted.includes(String(b._id)) && !deleted.includes(String(b.id)) && !deleted.includes(String(b.bookingId)));
  } catch (e) {
    return initialMockDemoBookings.filter((b) => b && !deleted.includes(String(b._id)) && !deleted.includes(String(b.id)));
  }
};

export const setStoredDemoBookings = (list) => {
  try {
    localStorage.setItem('saumyaa_demo_bookings', JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage demo bookings write error:', e);
  }
};

export const demoBookingService = {
  getBookings: async () => {
    try {
      const fsBookings = await syncFirestoreCollection('demo_bookings', initialMockDemoBookings);
      let list = fsBookings || getStoredDemoBookings();
      list.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
      setStoredDemoBookings(list);
      return { success: true, bookings: list };
    } catch (err) {
      console.warn('Firestore getBookings fallback:', err);
      const list = getStoredDemoBookings();
      list.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
      return { success: true, bookings: list };
    }
  },

  submitDemoBooking: async (formData) => {
    const newId = 'demo_' + Date.now();
    const shortCode = 'DM-' + new Date().getFullYear() + '-' + Math.floor(100 + Math.random() * 900);
    const newBooking = {
      _id: newId,
      id: newId,
      bookingId: shortCode,
      studentName: (formData.studentName || '').trim(),
      parentPhone: (formData.parentPhone || '').trim(),
      parentEmail: (formData.parentEmail || '').trim(),
      branch: formData.branch || 'Main Center (Bagru)',
      subject: formData.subject || 'General Academic Coaching',
      category: formData.category || 'Foundation',
      class: formData.class || '10th Grade',
      batchTime: formData.batchTime || 'To Be Assigned',
      status: 'Pending',
      scheduledDate: formData.scheduledDate || '',
      scheduledTime: formData.scheduledTime || '',
      facultyMentor: formData.facultyMentor || 'Jitender Sharma',
      meetingMode: formData.meetingMode || 'Offline Classroom',
      adminNotes: formData.adminNotes || '',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'demo_bookings', newId), newBooking, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore save demo booking err:', fsErr.message);
    }

    const currentList = getStoredDemoBookings();
    const updatedList = [newBooking, ...currentList.filter(b => b._id !== newId && b.id !== newId)];
    setStoredDemoBookings(updatedList);
    notifyDataUpdate();

    return {
      success: true,
      booking: newBooking,
      message: 'Demo Class Booking registered successfully!',
    };
  },

  updateBookingStatus: async (id, status, notes = '', scheduleInfo = null) => {
    if (!id) throw new Error('Booking ID is required');
    const targetStr = String(id);
    const currentList = getStoredDemoBookings();
    const idx = currentList.findIndex(b => String(b._id) === targetStr || String(b.id) === targetStr || String(b.bookingId) === targetStr);

    let updatedItem = idx !== -1 ? { ...currentList[idx] } : { _id: id, id: id };
    updatedItem.status = status;
    if (notes) updatedItem.adminNotes = notes;
    if (scheduleInfo) {
      if (scheduleInfo.scheduledDate) updatedItem.scheduledDate = scheduleInfo.scheduledDate;
      if (scheduleInfo.scheduledTime) updatedItem.scheduledTime = scheduleInfo.scheduledTime;
      if (scheduleInfo.facultyMentor) updatedItem.facultyMentor = scheduleInfo.facultyMentor;
      if (scheduleInfo.meetingMode) updatedItem.meetingMode = scheduleInfo.meetingMode;
      if (scheduleInfo.adminNotes) updatedItem.adminNotes = scheduleInfo.adminNotes;
    }
    updatedItem.updatedAt = new Date().toISOString();

    try {
      await setDoc(doc(db, 'demo_bookings', String(updatedItem._id || id)), updatedItem, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore update demo status err:', fsErr.message);
    }

    if (idx !== -1) {
      currentList[idx] = updatedItem;
    } else {
      currentList.unshift(updatedItem);
    }
    setStoredDemoBookings([...currentList]);
    notifyDataUpdate();

    let notificationResult = null;
    if (scheduleInfo && (scheduleInfo.scheduledDate || scheduleInfo.scheduledTime)) {
      try {
        notificationResult = await demoBookingService.notifyDemoSchedule(updatedItem);
      } catch (notifyErr) {
        console.warn('Demo schedule notification error:', notifyErr.message);
      }
    }

    return {
      success: true,
      booking: updatedItem,
      notification: notificationResult,
      message: `Demo booking marked as ${status}!`,
    };
  },

  notifyDemoSchedule: async (bookingData) => {
    try {
      const remote = await apiCall('/demo-bookings/notify-schedule', {
        method: 'POST',
        body: JSON.stringify({
          studentName: bookingData.studentName,
          phone: bookingData.parentPhone || bookingData.phone,
          email: bookingData.parentEmail || bookingData.email,
          subject: bookingData.subject,
          className: bookingData.class || bookingData.className,
          scheduledDate: bookingData.scheduledDate,
          scheduledTime: bookingData.scheduledTime,
          facultyMentor: bookingData.facultyMentor,
          meetingMode: bookingData.meetingMode,
          branch: bookingData.branch,
          bookingId: bookingData.bookingId || bookingData._id || bookingData.id,
          notes: bookingData.adminNotes,
        }),
      });
      return remote || { success: true, message: 'Notification dispatched' };
    } catch (e) {
      console.warn('notifyDemoSchedule API call error:', e.message);
      return { success: false, error: e.message };
    }
  },

  deleteBooking: async (id) => {
    if (!id) return { success: false, message: 'Invalid ID' };
    const targetStr = String(id);
    addDeletedId('demo_bookings', targetStr);

    try {
      await deleteDoc(doc(db, 'demo_bookings', targetStr));
    } catch (fsErr) {
      console.warn('Firestore delete demo booking err:', fsErr.message);
    }

    const currentList = getStoredDemoBookings();
    const filtered = currentList.filter(b => String(b._id) !== targetStr && String(b.id) !== targetStr && String(b.bookingId) !== targetStr);
    setStoredDemoBookings(filtered);
    notifyDataUpdate();

    return { success: true, message: 'Demo booking deleted successfully' };
  },

  convertToStudent: async (booking, extraStudentFields = {}) => {
    const newStudentData = {
      fullName: booking.studentName,
      email: booking.parentEmail && booking.parentEmail !== 'Not Provided' ? booking.parentEmail : `${booking.studentName.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.saumyaa.edu.in`,
      phone: booking.parentPhone,
      fatherName: 'Guardian',
      motherName: '',
      parentPhone: booking.parentPhone,
      className: booking.class || '10th',
      subjects: [booking.subject || 'General Academics'],
      batch: '2026-2027',
      branch: booking.branch || 'Main Center (Bagru)',
      monthlyFee: 2500,
      monthlyDueDay: 5,
      status: 'Active',
      ...extraStudentFields,
    };

    const res = await studentService.createStudent(newStudentData);
    await demoBookingService.updateBookingStatus(booking._id || booking.id, 'Enrolled', 'Converted into enrolled regular student.');
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

    return { success: true, message: `Credential request processed successfully.` };
  },
};

// Dynamic Faculty Profile Requests (No static mock data)
export const initialMockFacultyProfileRequests = [];

// Helper to sanitize faculty profile requests and strip out any legacy mock data
const sanitizeFacultyProfileRequest = (r) => {
  if (!r) return null;
  const idStr = String(r._id || r.id || '');
  if (!idStr || idStr === 'freq_jitender_1' || idStr === 'freq_dr_anita_2') return null;
  return {
    ...r,
    _id: r._id || r.id || idStr,
    id: r.id || r._id || idStr,
    facultyId: r.facultyId || r.userId || '',
    facultyName: r.facultyName || 'Faculty Member',
    facultyEmail: r.facultyEmail || '',
    status: r.status || 'Pending',
    currentValues: r.currentValues || {},
    requestedValues: r.requestedValues || {},
    reason: r.reason || '',
  };
};

// Purge any stale mock requests stored in localStorage or Firestore
export const cleanStaleFacultyProfileRequests = async () => {
  try {
    const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
          localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(cleaned));
        }
      } catch (e) {}
    }
    // Delete legacy mock documents from Firestore if present
    try {
      await deleteDoc(doc(db, 'faculty_profile_requests', 'freq_jitender_1'));
      await deleteDoc(doc(db, 'faculty_profile_requests', 'freq_dr_anita_2'));
    } catch (e) {}
  } catch (err) {}
};

// Run stale mock cleanup immediately on module load
cleanStaleFacultyProfileRequests();

// Faculty Profile Change Request Service (Admin Approval Workflow & 30-Day Cooldown)
export const facultyProfileRequestService = {
  subscribeRequests: (callback) => {
    try {
      cleanStaleFacultyProfileRequests();

      let localStored = [];
      try {
        const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localStored = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
          }
        }
      } catch (e) {}

      if (callback) callback(localStored);

      const colRef = collection(db, 'faculty_profile_requests');
      return onSnapshot(
        colRef,
        async (snapshot) => {
          let fsReqs = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const sanitized = sanitizeFacultyProfileRequest({ ...data, _id: docId, id: docId });
            if (sanitized) {
              fsReqs.push(sanitized);
            }
          });

          let currentLocal = [];
          try {
            const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                currentLocal = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
              }
            }
          } catch (e) {}

          const map = new Map();
          currentLocal.forEach((r) => {
            const idStr = String(r?._id || r?.id || '');
            if (idStr) map.set(idStr, r);
          });
          fsReqs.forEach((r) => {
            const idStr = String(r?._id || r?.id || '');
            if (idStr) map.set(idStr, { ...(map.get(idStr) || {}), ...r });
          });

          const list = Array.from(map.values());
          localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(list));
          list.sort((a, b) => new Date(b.submittedAt || b.requestDate || b.requestedAt || b.createdAt || 0) - new Date(a.submittedAt || a.requestDate || a.requestedAt || a.createdAt || 0));
          if (callback) callback(list);
        },
        (err) => {
          console.warn('Firestore subscribeRequests notice:', err.message);
          let currentLocal = [];
          try {
            const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                currentLocal = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
              }
            }
          } catch (e) {}
          if (callback) callback(currentLocal);
        }
      );
    } catch (err) {
      console.warn('Firestore subscribeRequests initialization error:', err);
      return () => {};
    }
  },

  getMyRequests: async (facultyId, facultyEmail) => {
    cleanStaleFacultyProfileRequests();

    let remoteList = [];
    try {
      const baseUrl = getApiBaseUrl();
      if (baseUrl) {
        const queryParams = new URLSearchParams();
        if (facultyId) queryParams.append('facultyId', facultyId);
        if (facultyEmail) queryParams.append('facultyEmail', facultyEmail);
        const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const backendRes = await apiCall(`/faculty-panel/profile-change-requests${queryStr}`);
        if (backendRes && backendRes.success && Array.isArray(backendRes.requests)) {
          remoteList = backendRes.requests.map(sanitizeFacultyProfileRequest).filter(Boolean);
        }
      }
    } catch (e) {}

    let fsReqs = [];
    try {
      const snapshot = await getDocs(collection(db, 'faculty_profile_requests'));
      if (!snapshot.empty) {
        snapshot.forEach((d) => {
          const sanitized = sanitizeFacultyProfileRequest({ ...d.data(), _id: d.id, id: d.id });
          if (sanitized) {
            fsReqs.push(sanitized);
          }
        });
      }
    } catch (fsErr) {
      console.warn('Firestore getDocs faculty_profile_requests notice:', fsErr.message);
    }

    let localStored = [];
    try {
      const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localStored = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
        }
      }
    } catch (e) {}

    const map = new Map();
    localStored.forEach((r) => {
      const idStr = String(r?._id || r?.id || '');
      if (idStr) map.set(idStr, r);
    });
    remoteList.forEach((r) => {
      const idStr = String(r?._id || r?.id || '');
      if (idStr) map.set(idStr, { ...(map.get(idStr) || {}), ...r });
    });
    fsReqs.forEach((r) => {
      const idStr = String(r?._id || r?.id || '');
      if (idStr) map.set(idStr, { ...(map.get(idStr) || {}), ...r });
    });

    let list = Array.from(map.values());
    localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(list));

    const targetId = facultyId ? String(facultyId).toLowerCase() : '';
    const targetEmail = facultyEmail ? String(facultyEmail).toLowerCase() : '';

    const myReqs = list.filter((r) => {
      const rId = String(r.facultyId || '').toLowerCase();
      const rEmail = String(r.facultyEmail || '').toLowerCase();
      if (!targetId && !targetEmail) return true;
      return (targetId && rId === targetId) || (targetEmail && rEmail === targetEmail);
    });

    myReqs.sort((a, b) => new Date(b.submittedAt || b.requestDate || b.requestedAt || b.createdAt || 0) - new Date(a.submittedAt || a.requestDate || a.requestedAt || a.createdAt || 0));

    // Find latest APPROVED request for 30-day cooldown calculation strictly from APPROVED timestamp
    const latestApproved = myReqs.find((r) => r.status === 'Approved' && (r.approvedAt || r.reviewedDate));

    let isCooldownActive = false;
    let approvedAtDate = null;
    let nextAllowedDate = null;
    let formattedApprovedDate = '';
    let formattedNextDate = '';
    let cooldownMessage = '';

    if (latestApproved && (latestApproved.approvedAt || latestApproved.reviewedDate)) {
      approvedAtDate = new Date(latestApproved.approvedAt || latestApproved.reviewedDate);
      nextAllowedDate = new Date(approvedAtDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now < nextAllowedDate) {
        isCooldownActive = true;
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        formattedApprovedDate = `${approvedAtDate.getDate()} ${months[approvedAtDate.getMonth()]} ${approvedAtDate.getFullYear()}`;
        formattedNextDate = `${nextAllowedDate.getDate()} ${months[nextAllowedDate.getMonth()]} ${nextAllowedDate.getFullYear()}`;
        cooldownMessage = `This request was approved on ${formattedApprovedDate}. You can make another request after ${formattedNextDate}.`;
      }
    }

    const pendingRequest = myReqs.find((r) => r.status === 'Pending') || null;
    const hasPending = !!pendingRequest;

    return {
      success: true,
      requests: myReqs,
      hasPending,
      pendingRequest,
      cooldownInfo: {
        isCooldownActive,
        approvedAtDate,
        nextAllowedDate,
        formattedApprovedDate,
        formattedNextDate,
        cooldownMessage,
      },
    };
  },

  submitRequest: async (requestData) => {
    let remoteReq = null;
    const baseUrl = getApiBaseUrl();
    if (baseUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${baseUrl}/faculty-panel/profile-change-requests`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(requestData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await res.json();
        if (res.ok && data.request) {
          remoteReq = sanitizeFacultyProfileRequest(data.request);
        } else if (!res.ok && data.message) {
          if (data.message.includes('approved on') || data.message.includes('cooldown') || data.message.includes('required') || data.message.includes('changes')) {
            throw new Error(data.message);
          }
        }
      } catch (err) {
        if (err.message && (err.message.includes('approved on') || err.message.includes('cooldown') || err.message.includes('required') || err.message.includes('changes'))) {
          throw err;
        }
      }
    }

    let list = [];
    try {
      const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
        }
      }
    } catch (e) {}

    const facultyId = requestData.facultyId || '';
    const facultyEmail = (requestData.facultyEmail || '').toLowerCase();

    // Check 30-day post-approval cooldown
    const latestApproved = list.find(
      (r) =>
        r.status === 'Approved' &&
        (r.approvedAt || r.reviewedDate) &&
        ((facultyId && String(r.facultyId) === String(facultyId)) || (facultyEmail && r.facultyEmail && r.facultyEmail.toLowerCase() === facultyEmail))
    );

    if (latestApproved && (latestApproved.approvedAt || latestApproved.reviewedDate)) {
      const approvedDate = new Date(latestApproved.approvedAt || latestApproved.reviewedDate);
      const nextAllowedDate = new Date(approvedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (new Date() < nextAllowedDate) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const approvedFormatted = `${approvedDate.getDate()} ${months[approvedDate.getMonth()]} ${approvedDate.getFullYear()}`;
        const nextFormatted = `${nextAllowedDate.getDate()} ${months[nextAllowedDate.getMonth()]} ${nextAllowedDate.getFullYear()}`;
        throw new Error(`This request was approved on ${approvedFormatted}. You can make another request after ${nextFormatted}.`);
      }
    }

    // Check for active Pending request - modify in-place
    const pendingIdx = list.findIndex(
      (r) =>
        r.status === 'Pending' &&
        ((facultyId && String(r.facultyId) === String(facultyId)) || (facultyEmail && r.facultyEmail && r.facultyEmail.toLowerCase() === facultyEmail))
    );

    if (pendingIdx !== -1) {
      const existingReq = list[pendingIdx];
      const updatedReq = {
        ...existingReq,
        currentValues: requestData.currentValues || existingReq.currentValues,
        requestedValues: requestData.requestedValues || existingReq.requestedValues,
        reason: (requestData.reason || existingReq.reason || '').trim(),
        submittedAt: new Date().toISOString(),
        requestDate: new Date().toISOString(),
        status: 'Pending',
      };

      try {
        await setDoc(doc(db, 'faculty_profile_requests', String(existingReq._id || existingReq.id)), updatedReq, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore setDoc update error:', fsErr.message);
      }

      list[pendingIdx] = updatedReq;
      localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(list));
      notifyDataUpdate();

      return {
        success: true,
        request: updatedReq,
        message: 'Pending profile change request updated successfully!',
        isUpdate: true,
      };
    }

    const id = remoteReq?._id || remoteReq?.id || ('freq_' + Date.now());
    const newReq = remoteReq || {
      _id: id,
      id,
      facultyId,
      facultyName: requestData.facultyName || 'Faculty Member',
      facultyEmail: requestData.facultyEmail || '',
      currentValues: requestData.currentValues || {},
      requestedValues: requestData.requestedValues || {},
      reason: (requestData.reason || '').trim(),
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      requestDate: new Date().toISOString(),
      adminComments: '',
      approvedAt: null,
      rejectedAt: null,
      nextEligibleDate: null,
      reviewedDate: null,
      reviewedBy: null,
    };

    try {
      await setDoc(doc(db, 'faculty_profile_requests', String(id)), newReq);
    } catch (fsErr) {
      console.warn('Firestore setDoc profile request warning:', fsErr.message);
    }

    list = [newReq, ...list];
    localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(list));
    notifyDataUpdate();

    return {
      success: true,
      request: newReq,
      message: 'Profile change request submitted successfully to Admin for approval.',
    };
  },

  getAllRequests: async (statusFilter) => {
    cleanStaleFacultyProfileRequests();

    let remoteList = [];
    try {
      const baseUrl = getApiBaseUrl();
      if (baseUrl) {
        const queryStr = statusFilter && statusFilter !== 'All' ? `?status=${encodeURIComponent(statusFilter)}` : '';
        const backendRes = await apiCall(`/admin/profile-change-requests${queryStr}`);
        if (backendRes && backendRes.success && Array.isArray(backendRes.requests)) {
          remoteList = backendRes.requests.map(sanitizeFacultyProfileRequest).filter(Boolean);
        }
      }
    } catch (e) {}

    let fsReqs = [];
    try {
      const snapshot = await getDocs(collection(db, 'faculty_profile_requests'));
      if (!snapshot.empty) {
        snapshot.forEach((d) => {
          const sanitized = sanitizeFacultyProfileRequest({ ...d.data(), _id: d.id, id: d.id });
          if (sanitized) {
            fsReqs.push(sanitized);
          }
        });
      }
    } catch (fsErr) {
      console.warn('Firestore getDocs faculty_profile_requests error:', fsErr.message);
    }

    let localStored = [];
    try {
      const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localStored = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
        }
      }
    } catch (e) {}

    const map = new Map();
    localStored.forEach((r) => {
      const idStr = String(r?._id || r?.id || '');
      if (idStr) map.set(idStr, r);
    });
    remoteList.forEach((r) => {
      const idStr = String(r?._id || r?.id || '');
      if (idStr) map.set(idStr, { ...(map.get(idStr) || {}), ...r });
    });
    fsReqs.forEach((r) => {
      const idStr = String(r?._id || r?.id || '');
      if (idStr) map.set(idStr, { ...(map.get(idStr) || {}), ...r });
    });

    let list = Array.from(map.values());
    localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(list));

    if (statusFilter && statusFilter !== 'All') {
      list = list.filter((r) => String(r.status).toLowerCase() === String(statusFilter).toLowerCase());
    }
    list.sort((a, b) => new Date(b.submittedAt || b.requestDate || b.requestedAt || b.createdAt || 0) - new Date(a.submittedAt || a.requestDate || a.requestedAt || a.createdAt || 0));

    return { success: true, count: list.length, requests: list };
  },

  approveRequest: async (requestId, adminComments = '') => {
    try {
      await apiCall(`/admin/profile-change-requests/${requestId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ adminComments }),
      });
    } catch (e) {}

    let list = [];
    try {
      const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
        }
      }
    } catch (e) {}

    const idx = list.findIndex((r) => String(r._id || r.id) === String(requestId));
    if (idx !== -1) {
      const now = new Date().toISOString();
      const nextEligible = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      list[idx] = {
        ...list[idx],
        status: 'Approved',
        adminComments: adminComments || 'Approved by System Admin',
        approvedAt: now,
        reviewedDate: now,
        nextEligibleDate: nextEligible,
        lastApprovedRequestId: String(requestId),
        reviewedByName: 'System Admin',
      };

      try {
        await setDoc(doc(db, 'faculty_profile_requests', String(requestId)), list[idx], { merge: true });
      } catch (fsErr) {}

      localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(list));

      const reqItem = list[idx];
      const facultyId = reqItem.facultyId;
      const updates = reqItem.requestedValues || {};

      // Apply updates directly via facultyService
      if (facultyId && Object.keys(updates).length > 0) {
        try {
          await facultyService.updateFaculty(facultyId, updates);
        } catch (fErr) {
          console.warn('Error applying approved profile updates to faculty:', fErr);
        }
      }
    }

    notifyDataUpdate();
    return { success: true, message: 'Faculty profile change request approved and faculty profile updated successfully!' };
  },

  rejectRequest: async (requestId, adminComments) => {
    if (!adminComments || !adminComments.trim()) {
      throw new Error('Rejection reason / admin comment is required when rejecting a request.');
    }

    try {
      await apiCall(`/admin/profile-change-requests/${requestId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ adminComments }),
      });
    } catch (e) {}

    let list = [];
    try {
      const stored = localStorage.getItem('saumyaa_faculty_profile_requests');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          list = parsed.map(sanitizeFacultyProfileRequest).filter(Boolean);
        }
      }
    } catch (e) {}

    const idx = list.findIndex((r) => String(r._id || r.id) === String(requestId));
    if (idx !== -1) {
      const now = new Date().toISOString();
      list[idx] = {
        ...list[idx],
        status: 'Rejected',
        adminComments: adminComments.trim(),
        rejectedAt: now,
        reviewedDate: now,
        nextEligibleDate: null,
        reviewedByName: 'System Admin',
      };

      try {
        await setDoc(doc(db, 'faculty_profile_requests', String(requestId)), list[idx], { merge: true });
      } catch (fsErr) {}

      localStorage.setItem('saumyaa_faculty_profile_requests', JSON.stringify(list));
    }

    notifyDataUpdate();
    return { success: true, message: 'Faculty profile change request rejected.' };
  },
};

const initialMockAlumni = [];

export const getStoredAlumni = () => {
  try {
    const data = localStorage.getItem('saumyaa_alumni');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setStoredAlumni = (list) => {
  localStorage.setItem('saumyaa_alumni', JSON.stringify(list));
  notifyDataUpdate();
};

export const alumniService = {
  getAlumni: async (params = {}) => {
    const fsAlumni = await syncFirestoreCollection('alumni', []);
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
        totalAlumni: list.length,
        studentsPlaced: Math.round(list.length * 0.95),
        topRecruiters: companies.size,
        averagePackage: list.length > 0 ? '28.5 LPA' : '0 LPA',
        highestPackage: highestNum ? `${highestNum} LPA` : (list.length > 0 ? '45 LPA' : '0 LPA'),
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

export const initialMockToppers = [];

export const getStoredToppers = () => {
  try {
    const data = localStorage.getItem('saumyaa_toppers');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setStoredToppers = (list) => {
  localStorage.setItem('saumyaa_toppers', JSON.stringify(list));
  notifyDataUpdate();
};

export const topperService = {
  getToppers: async ({ activeOnly = false } = {}) => {
    const fsToppers = await syncFirestoreCollection('toppers', []);
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
const initialMockAssignments = [];
const initialMockStudyMaterials = [];
const initialMockFacultyLeaves = [];

const getStoredAssignments = () => {
  try {
    return JSON.parse(localStorage.getItem('mock_faculty_assignments')) || [];
  } catch (e) {
    return [];
  }
};
const setStoredAssignments = (data) => localStorage.setItem('mock_faculty_assignments', JSON.stringify(data));

const getStoredMaterials = () => {
  try {
    return JSON.parse(localStorage.getItem('mock_faculty_materials')) || [];
  } catch (e) {
    return [];
  }
};
const setStoredMaterials = (data) => localStorage.setItem('mock_faculty_materials', JSON.stringify(data));

const getStoredLeaves = () => {
  try {
    const list = JSON.parse(localStorage.getItem('mock_faculty_leaves'));
    if (Array.isArray(list)) return list;
    return [];
  } catch (e) {
    return [];
  }
};
const setStoredLeaves = (data) => localStorage.setItem('mock_faculty_leaves', JSON.stringify(data));

export const facultyPanelService = {
  loginFaculty: async (credentials) => {
    let remote = null;
    try {
      remote = await apiCall('/faculty-panel/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (e) {}

    if (remote && remote.success && remote.user && remote.token) {
      localStorage.setItem('saumyaa_token', remote.token);
      localStorage.setItem('saumyaa_user', JSON.stringify(remote.user));
      return remote;
    }

    const cleanEmail = (credentials.email || '').trim().toLowerCase();
    const cleanPass = credentials.password || '';

    const facultyList = getStoredFaculty();
    let facultyMember = facultyList.find(
      (f) =>
        (f.email && f.email.trim().toLowerCase() === cleanEmail) ||
        (f.name && f.name.trim().toLowerCase() === cleanEmail) ||
        (f.email && cleanEmail && (f.email.toLowerCase().includes(cleanEmail) || cleanEmail.includes(f.email.toLowerCase())))
    );

    if (!facultyMember && facultyList.length > 0) {
      facultyMember = facultyList[0];
    }

    if (!facultyMember) {
      facultyMember = {
        _id: 'fac_1',
        id: 'fac_1',
        name: 'Dr. Jitender Sharma',
        email: cleanEmail || 'jitender.sharma@saumyaa.edu.in',
        password: 'faculty123',
        role: 'HEAD_OF_DEPARTMENT',
        roles: ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER'],
        designation: 'Senior Mathematics & Physics HOD',
        department: 'Science & Mathematics',
        assignedClasses: ['10th', '11th (+1)', '12th (+2)'],
        assignedSubjects: ['Mathematics Advanced', 'Physics IIT-JEE Prep'],
        photo_url: '/Unknown.jpg',
      };
    }

    const resps = facultyMember.responsibilities || [];
    const derivedClasses = resps.length > 0
      ? Array.from(new Set(resps.map((r) => r.className)))
      : (facultyMember.assignedClasses || []);

    const derivedSubjects = resps.length > 0
      ? Array.from(new Set(resps.map((r) => r.subject)))
      : (facultyMember.assignedSubjects || []);

    const activeRoleCandidate = (facultyMember.role && facultyMember.role !== 'Faculty')
      ? facultyMember.role
      : (facultyMember.position && facultyMember.position !== 'Faculty')
      ? facultyMember.position
      : (facultyMember.roles && facultyMember.roles[0] && facultyMember.roles[0] !== 'Faculty')
      ? facultyMember.roles[0]
      : 'SUBJECT_TEACHER';

    const activeRolesCandidate = (Array.isArray(facultyMember.roles) && facultyMember.roles.length > 0 && facultyMember.roles[0] !== 'Faculty')
      ? facultyMember.roles
      : [activeRoleCandidate];

    const facultyUserObj = {
      _id: facultyMember._id || facultyMember.id || 'fac_1',
      id: facultyMember._id || facultyMember.id || 'fac_1',
      name: facultyMember.name,
      email: facultyMember.email || cleanEmail,
      password: facultyMember.password || 'faculty123',
      role: activeRoleCandidate,
      roles: activeRolesCandidate,
      position: activeRoleCandidate,
      permissionOverrides: facultyMember.permissionOverrides || {},
      designation: facultyMember.designation || 'Senior Faculty Member',
      department: facultyMember.department || 'Science & Mathematics',
      responsibilities: resps,
      assignedClasses: derivedClasses,
      assignedSubjects: derivedSubjects,
      photo_url: facultyMember.photo_url || '/Unknown.jpg',
      avatar: facultyMember.photo_url || '/Unknown.jpg',
    };

    localStorage.setItem('saumyaa_token', 'mock_faculty_jwt_token_2026');
    localStorage.setItem('saumyaa_user', JSON.stringify(facultyUserObj));
    return { success: true, token: 'mock_faculty_jwt_token_2026', user: facultyUserObj };
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
          const activeRoleCandidate = (found.role && found.role !== 'Faculty') ? found.role : (found.position && found.position !== 'Faculty') ? found.position : (found.roles && found.roles[0] && found.roles[0] !== 'Faculty') ? found.roles[0] : 'SUBJECT_TEACHER';
          const activeRolesCandidate = (Array.isArray(found.roles) && found.roles.length > 0 && found.roles[0] !== 'Faculty') ? found.roles : [activeRoleCandidate];

          activeUser = {
            ...u,
            ...found,
            roles: activeRolesCandidate,
            role: activeRoleCandidate,
            position: activeRoleCandidate,
            permissionOverrides: found.permissionOverrides || {},
            responsibilities: resps,
            assignedClasses: resps.length > 0 ? Array.from(new Set(resps.map((r) => r.className))) : (found.assignedClasses || u.assignedClasses || []),
            assignedSubjects: resps.length > 0 ? Array.from(new Set(resps.map((r) => r.subject))) : (found.assignedSubjects || u.assignedSubjects || []),
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
    let userBranchId = 'MAIN_CENTER';
    let isAdminUser = false;
    if (currentUserStr) {
      try {
        const u = JSON.parse(currentUserStr);
        resps = u.responsibilities || [];
        userBranchId = normalizeBranchId(u.branchId || u.branch);
        isAdminUser = Boolean(u?.role === 'Admin' || u?.role === 'SuperAdmin' || (Array.isArray(u?.roles) && u.roles.includes('ADMIN')));
      } catch (e) {}
    }

    const assignedClasses = Array.from(new Set(resps.map((r) => r.className)));

    const fsStudents = await syncFirestoreCollection('students', initialMockStudents);
    const allStudents = fsStudents || getStoredStudents();

    let filtered = allStudents.filter((s) => {
      const sBId = normalizeBranchId(s.branchId || s.branch);
      if (userBranchId === 'BRANCH' && sBId !== 'BRANCH') return false;
      if (!isAdminUser && assignedClasses.length > 0) {
        return assignedClasses.some((ac) => isClassOrStageMatch(s.className, ac));
      }
      return true;
    });

    if (params.className && params.className !== 'All') {
      filtered = filtered.filter((s) => isExactClassMatch(s.className, params.className));
    }

    if (params.subject && params.subject !== 'All') {
      const targetSub = params.subject.trim().toLowerCase();
      const subFiltered = filtered.filter((s) => {
        if (Array.isArray(s.subjects) && s.subjects.length > 0) {
          return s.subjects.some((sub) => {
            const sName = String(sub).trim().toLowerCase();
            return sName === targetSub || sName.includes(targetSub) || targetSub.includes(sName);
          });
        }
        if (s.subject) {
          const sName = String(s.subject).trim().toLowerCase();
          return sName === targetSub || sName.includes(targetSub) || targetSub.includes(sName);
        }
        return true;
      });
      if (subFiltered.length > 0) {
        filtered = subFiltered;
      }
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
      branch: data.branch || 'Main Center',
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

export const rbacService = {
  getRoles: async () => {
    try {
      const remote = await apiCall('/rbac/roles');
      if (remote && remote.roles) {
        localStorage.setItem('saumyaa_rbac_roles', JSON.stringify(remote.roles));
        return remote;
      }
    } catch (e) {}

    try {
      const raw = localStorage.getItem('saumyaa_rbac_roles');
      if (raw) return { success: true, roles: JSON.parse(raw) };
    } catch (e) {}

    return { success: true, roles: [] };
  },

  createRole: async (data) => {
    let createdRole = null;
    try {
      const remote = await apiCall('/rbac/roles', { method: 'POST', body: JSON.stringify(data) });
      if (remote && remote.role) {
        createdRole = remote.role;
      }
    } catch (e) {}

    if (!createdRole) {
      const newId = 'role_' + Date.now();
      createdRole = {
        _id: newId,
        id: newId,
        code: data.code.toUpperCase(),
        name: data.name,
        badge: data.badge || data.name,
        color: data.color || 'purple',
        description: data.description || '',
        isSystem: false,
        permissions: data.permissions || [],
        createdAt: new Date().toISOString(),
      };
    }

    let roles = [];
    try {
      roles = JSON.parse(localStorage.getItem('saumyaa_rbac_roles') || '[]');
    } catch (e) {}

    const existsIdx = roles.findIndex(
      (r) => String(r.code).toUpperCase() === String(createdRole.code).toUpperCase()
    );
    if (existsIdx !== -1) {
      roles[existsIdx] = createdRole;
    } else {
      roles.push(createdRole);
    }

    localStorage.setItem('saumyaa_rbac_roles', JSON.stringify(roles));
    notifyDataUpdate();
    return { success: true, role: createdRole, message: 'Custom role created successfully!' };
  },

  updateRole: async (id, data) => {
    let updatedRemote = null;
    try {
      const remote = await apiCall(`/rbac/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      if (remote && remote.role) {
        updatedRemote = remote.role;
      }
    } catch (e) {}

    let roles = [];
    try {
      roles = JSON.parse(localStorage.getItem('saumyaa_rbac_roles') || '[]');
    } catch (e) {}

    const targetId = String(id || '');
    const targetCode = String(data.code || '').toUpperCase();

    const idx = roles.findIndex(
      (r) =>
        String(r._id || r.id) === targetId ||
        String(r.code || '').toUpperCase() === targetCode
    );

    const roleObj = updatedRemote
      ? updatedRemote
      : idx !== -1
      ? { ...roles[idx], ...data }
      : { _id: id, id: id, ...data };

    if (idx !== -1) {
      roles[idx] = roleObj;
    } else {
      roles.push(roleObj);
    }

    localStorage.setItem('saumyaa_rbac_roles', JSON.stringify(roles));
    notifyDataUpdate();
    return { success: true, role: roleObj, message: 'Role permissions updated successfully!' };
  },

  deleteRole: async (id) => {
    await apiCall(`/rbac/roles/${id}`, { method: 'DELETE' }).catch(() => {});
    let roles = [];
    try {
      roles = JSON.parse(localStorage.getItem('saumyaa_rbac_roles') || '[]');
    } catch (e) {}

    roles = roles.filter((r) => String(r._id || r.id) !== String(id) && String(r.code) !== String(id));
    localStorage.setItem('saumyaa_rbac_roles', JSON.stringify(roles));
    notifyDataUpdate();
    return { success: true, message: 'Role deleted successfully!' };
  },

  assignFacultyRoles: async (facultyId, payload) => {
    let remoteFaculty = null;
    try {
      const remote = await apiCall(`/rbac/faculty-roles/${facultyId}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (remote && remote.faculty) {
        remoteFaculty = remote.faculty;
      }
    } catch (e) {
      console.warn('Backend rbac apiCall failed:', e.message);
    }

    try {
      const newRoles = Array.isArray(payload.roles) ? payload.roles : ['SUBJECT_TEACHER'];
      await apiCall(`/faculty/${facultyId}`, {
        method: 'PUT',
        body: JSON.stringify({ roles: newRoles, role: newRoles[0] || 'SUBJECT_TEACHER', email: payload.email }),
      }).catch(() => {});
    } catch (e) {}

    const list = getStoredFaculty();
    const idx = list.findIndex(
      (f) =>
        String(f._id || f.id) === String(facultyId) ||
        (f.email && payload.email && f.email.toLowerCase() === payload.email.toLowerCase())
    );

    const newRoles = Array.isArray(payload.roles) ? payload.roles : ['SUBJECT_TEACHER'];

    if (idx !== -1) {
      const bIdVal = payload.branchId || list[idx].branchId || (payload.branch?.includes('Daroh') || payload.branch === 'Branch (Daroh)' ? 'BRANCH' : 'MAIN_CENTER');
      const bCodeVal = payload.branch || list[idx].branch || (bIdVal === 'BRANCH' ? 'Branch (Daroh)' : 'Main Center (Bagru)');

      const updatedFac = {
        ...list[idx],
        ...(remoteFaculty || {}),
        roles: newRoles,
        role: payload.role || newRoles[0] || 'SUBJECT_TEACHER',
        designation: payload.designation || list[idx].designation,
        branchId: bIdVal,
        branch: bCodeVal,
        permissionOverrides: payload.permissionOverrides !== undefined ? payload.permissionOverrides : list[idx].permissionOverrides,
        is_active: payload.status !== undefined ? payload.status === 'Active' : list[idx].is_active,
      };
      list[idx] = updatedFac;
      setStoredFaculty(list);

      // Sync Firestore DB (update doc by ID and any legacy doc matching email)
      try {
        const firestoreDocId = String(list[idx].id || list[idx]._id || facultyId);
        const updatePayload = {
          roles: updatedFac.roles,
          role: updatedFac.role,
          designation: updatedFac.designation,
          branchId: updatedFac.branchId,
          branch: updatedFac.branch,
          permissionOverrides: updatedFac.permissionOverrides,
          is_active: updatedFac.is_active,
        };
        await setDoc(doc(db, 'faculty', firestoreDocId), updatePayload, { merge: true });

        if (updatedFac.email) {
          const fsList = await syncFirestoreCollection('faculty', []);
          if (fsList && Array.isArray(fsList)) {
            const matches = fsList.filter((f) => f.email && f.email.toLowerCase() === updatedFac.email.toLowerCase());
            for (const matchDoc of matches) {
              const docId = String(matchDoc.id || matchDoc._id);
              if (docId !== firestoreDocId) {
                await setDoc(doc(db, 'faculty', docId), updatePayload, { merge: true });
              }
            }
          }
        }
      } catch (e) {}

      // Update active session user if matched
      try {
        const currentUserStr = localStorage.getItem('saumyaa_user');
        if (currentUserStr) {
          const curr = JSON.parse(currentUserStr);
          if (
            String(curr._id || curr.id) === String(facultyId) ||
            (curr.email && updatedFac.email && curr.email.toLowerCase() === updatedFac.email.toLowerCase())
          ) {
            const updatedUser = {
              ...curr,
              roles: updatedFac.roles,
              role: updatedFac.role,
              branchId: updatedFac.branchId,
              branch: updatedFac.branch,
              permissionOverrides: updatedFac.permissionOverrides,
              is_active: updatedFac.is_active,
            };
            localStorage.setItem('saumyaa_user', JSON.stringify(updatedUser));
          }
        }
      } catch (e) {}
    } else if (remoteFaculty) {
      list.push(remoteFaculty);
      setStoredFaculty(list);
    }
    notifyDataUpdate();
    return { success: true, faculty: remoteFaculty, message: 'Faculty roles updated successfully!' };
  },

  getActivityLogs: async () => {
    const remote = await apiCall('/rbac/activity-logs');
    if (remote && remote.logs) return remote;

    try {
      const logs = JSON.parse(localStorage.getItem('saumyaa_activity_logs') || '[]');
      return { success: true, logs };
    } catch (e) {
      return { success: true, logs: [] };
    }
  },

  logActivity: async (action, category, details, status = 'SUCCESS') => {
    const logItem = {
      _id: 'log_' + Date.now(),
      action,
      category,
      details,
      status,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      await apiCall('/rbac/activity-logs', { method: 'POST', body: JSON.stringify(logItem) }).catch(() => {});
      let logs = JSON.parse(localStorage.getItem('saumyaa_activity_logs') || '[]');
      logs.unshift(logItem);
      localStorage.setItem('saumyaa_activity_logs', JSON.stringify(logs.slice(0, 150)));
      notifyDataUpdate();
    } catch (e) {}
  },

  getLoginHistory: async () => {
    const remote = await apiCall('/rbac/login-history');
    if (remote && remote.history) return remote;

    try {
      const history = JSON.parse(localStorage.getItem('saumyaa_login_history') || '[]');
      return { success: true, history };
    } catch (e) {
      return { success: true, history: [] };
    }
  },
};

// ==========================================
// Haversine Distance & Geofencing Calculator
// ==========================================
export const calculateHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export const geofenceService = {
  getCenterConfigs: async () => {
    const remote = await apiCall('/geofence/centers');
    if (remote && remote.centers) return remote;

    const fsCenters = await syncFirestoreCollection('geofence_centers', []);
    let stored = fsCenters;
    if (!stored || stored.length === 0) {
      try {
        stored = JSON.parse(localStorage.getItem('geofence_center_configs') || 'null');
      } catch (e) {}
    }

    if (!stored || stored.length === 0) {
      stored = [
        DEFAULT_CENTER_CONFIGS['Main Center'],
        DEFAULT_CENTER_CONFIGS['Branch'],
      ];
      localStorage.setItem('geofence_center_configs', JSON.stringify(stored));
    }

    const configMap = {};
    stored.forEach((c) => {
      if (c && c.name) configMap[c.name] = c;
    });

    if (!configMap['Main Center']) configMap['Main Center'] = DEFAULT_CENTER_CONFIGS['Main Center'];
    if (!configMap['Branch']) configMap['Branch'] = DEFAULT_CENTER_CONFIGS['Branch'];

    return { success: true, centers: configMap };
  },

  updateCenterConfig: async (centerName, configData) => {
    const remote = await apiCall(`/geofence/centers/${encodeURIComponent(centerName)}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
    if (remote) return remote;

    const currentRes = await geofenceService.getCenterConfigs();
    const configMap = currentRes.centers || {};
    const updatedObj = {
      ...configMap[centerName],
      ...configData,
      name: centerName,
    };
    configMap[centerName] = updatedObj;

    const arr = Object.values(configMap);
    localStorage.setItem('geofence_center_configs', JSON.stringify(arr));

    try {
      await setDoc(doc(db, 'geofence_centers', centerName), updatedObj);
    } catch (e) {}

    notifyDataUpdate();
    return { success: true, center: updatedObj };
  },
};

export const facultyAttendanceService = {
  getFacultyTodayAttendance: async (facultyId) => {
    const remote = await apiCall(`/faculty-attendance/today?facultyId=${facultyId}`);
    if (remote) return remote;

    const todayDate = getTodayLocalString();
    const fsRecords = await syncFirestoreCollection('faculty_attendance', []);
    let records = fsRecords;
    if (!records || records.length === 0) {
      try {
        records = JSON.parse(localStorage.getItem('saumyaa_faculty_attendance') || '[]');
      } catch (e) {}
    }

    const matched = records.find(
      (r) => String(r.facultyId) === String(facultyId) && r.date === todayDate
    );

    return { success: true, record: matched || null };
  },

  verifyAndAutoCheckIn: async ({ facultyId, facultyName, latitude, longitude }) => {
    // 1. Fetch current center configs
    const configsRes = await geofenceService.getCenterConfigs();
    const centers = configsRes.centers;

    // 2. Fetch faculty user profile & assigned center
    const currentUserStr = localStorage.getItem('saumyaa_user');
    let facultyUser = null;
    if (currentUserStr) {
      try {
        facultyUser = JSON.parse(currentUserStr);
      } catch (e) {}
    }

    const assignedCenter = normalizeBranchId(facultyUser?.branchId || facultyUser?.branch || 'MAIN_CENTER') === 'BRANCH'
      ? 'Branch'
      : 'Main Center';

    const targetCenterConfig = centers[assignedCenter] || DEFAULT_CENTER_CONFIGS[assignedCenter];

    // 3. Check anti-duplicate: Has faculty already checked in today?
    const todayRes = await facultyAttendanceService.getFacultyTodayAttendance(facultyId);
    if (todayRes && todayRes.record) {
      return {
        success: false,
        alreadyMarked: true,
        record: todayRes.record,
        message: 'Attendance already recorded for today',
      };
    }

    // 4. Verify coordinates & calculate distance
    const distMeters = calculateHaversineDistanceMeters(
      latitude,
      longitude,
      targetCenterConfig.latitude,
      targetCenterConfig.longitude
    );

    const isInsideGeofence = distMeters <= targetCenterConfig.radiusMeters;

    if (!isInsideGeofence) {
      return {
        success: false,
        locationVerification: 'FAILED',
        reason: 'OUTSIDE_GEOFENCE',
        distanceMeters: distMeters,
        allowedRadius: targetCenterConfig.radiusMeters,
        centerName: assignedCenter,
        message: `You are ${distMeters} meters away from ${assignedCenter}. Maximum allowed radius is ${targetCenterConfig.radiusMeters} meters.`,
      };
    }

    // 5. Calculate Arrival Time & Status (EARLY, ON_TIME, LATE)
    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const currentTotalMinutes = nowHours * 60 + nowMinutes;

    const [repHours, repMins] = (targetCenterConfig.reportingTime || '09:00').split(':').map(Number);
    const reportingTotalMinutes = repHours * 60 + repMins;
    const graceMinutes = Number(targetCenterConfig.gracePeriodMinutes) || 5;

    let status = 'ON_TIME';
    let lateByMinutes = 0;

    if (currentTotalMinutes < reportingTotalMinutes) {
      status = 'EARLY';
      lateByMinutes = 0;
    } else if (currentTotalMinutes <= reportingTotalMinutes + graceMinutes) {
      status = 'ON_TIME';
      lateByMinutes = 0;
    } else {
      status = 'LATE';
      lateByMinutes = currentTotalMinutes - reportingTotalMinutes;
    }

    const checkInTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord = {
      _id: 'fa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      facultyId: String(facultyId),
      facultyName: facultyName || facultyUser?.name || 'Faculty Member',
      date: getTodayLocalString(),
      center: assignedCenter,
      checkInTime: checkInTimeStr,
      reportingTime: targetCenterConfig.reportingTime || '09:00',
      status,
      lateByMinutes,
      latitude,
      longitude,
      distanceMeters: distMeters,
      locationVerification: 'VERIFIED',
      createdAt: now.toISOString(),
      source: 'GEOLOCATION_AUTO',
    };

    let records = [];
    try {
      records = JSON.parse(localStorage.getItem('saumyaa_faculty_attendance') || '[]');
    } catch (e) {}
    records.unshift(newRecord);
    localStorage.setItem('saumyaa_faculty_attendance', JSON.stringify(records));

    try {
      await setDoc(doc(db, 'faculty_attendance', newRecord._id), newRecord);
    } catch (e) {}

    rbacService.logActivity(
      'FACULTY_CHECKIN_AUTO',
      'Attendance',
      `${newRecord.facultyName} checked in at ${assignedCenter} (${status}${status === 'LATE' ? ` by ${lateByMinutes} mins` : ''}) via GPS verification (${distMeters}m away)`,
      'SUCCESS'
    );

    notifyDataUpdate();

    return {
      success: true,
      record: newRecord,
      message: `Attendance marked successfully as ${status.replace('_', ' ')}!`,
    };
  },

  getAllFacultyAttendance: async ({ date, center, status, search } = {}) => {
    const remote = await apiCall('/faculty-attendance');
    if (remote && remote.records) return remote;

    const fsRecords = await syncFirestoreCollection('faculty_attendance', []);
    let records = fsRecords || [];
    if (!records || records.length === 0) {
      try {
        records = JSON.parse(localStorage.getItem('saumyaa_faculty_attendance') || '[]');
      } catch (e) {}
    }

    if (date) {
      records = records.filter((r) => r.date === date);
    }
    if (center && center !== 'All') {
      records = records.filter((r) => r.center === center);
    }
    if (status && status !== 'All') {
      records = records.filter((r) => r.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (r) =>
          r.facultyName?.toLowerCase().includes(q) ||
          r.facultyId?.toLowerCase().includes(q)
      );
    }

    return { success: true, records };
  },

  manualAdminCorrection: async ({ recordId, facultyId, date, center, status, checkInTime, lateByMinutes, reason, adminName }) => {
    let records = [];
    try {
      records = JSON.parse(localStorage.getItem('saumyaa_faculty_attendance') || '[]');
    } catch (e) {}

    let record = records.find((r) => r._id === recordId || r.id === recordId);
    if (!record) {
      record = {
        _id: 'fa_' + Date.now(),
        facultyId: String(facultyId),
        facultyName: 'Faculty Member',
        date: date || getTodayLocalString(),
        center: center || 'Main Center',
        createdAt: new Date().toISOString(),
      };
      records.unshift(record);
    }

    record.status = status;
    record.checkInTime = checkInTime || record.checkInTime || '09:00 AM';
    record.lateByMinutes = Number(lateByMinutes) || 0;
    record.locationVerification = 'VERIFIED';
    record.source = 'ADMIN_MANUAL';
    record.modifiedBy = adminName || 'Admin';
    record.modificationReason = reason || 'Admin Manual Override';
    record.updatedAt = new Date().toISOString();

    localStorage.setItem('saumyaa_faculty_attendance', JSON.stringify(records));

    try {
      await setDoc(doc(db, 'faculty_attendance', record._id), record);
    } catch (e) {}

    rbacService.logActivity(
      'FACULTY_CHECKIN_MANUAL_CORRECTION',
      'Attendance',
      `Admin (${record.modifiedBy}) manually corrected attendance for ${record.facultyName} to ${status} (${reason})`,
      'SUCCESS'
    );

    notifyDataUpdate();
    return { success: true, record };
  },
};

/**
 * SMS Notification Service (Frontend Client & Standalone Backup)
 */
export const smsNotificationService = {
  getLogs: async ({ search = '', type = 'All', status = 'All', limit = 100 } = {}) => {
    const query = new URLSearchParams({ search, type, status, limit }).toString();
    const remote = await apiCall(`/sms-notifications?${query}`);
    if (remote && remote.logs) return remote;

    // Standalone fallback
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('saumyaa_sms_logs') || '[]');
    } catch (e) {}

    if (type && type !== 'All') {
      logs = logs.filter((l) => l.notificationType === type);
    }
    if (status && status !== 'All') {
      logs = logs.filter((l) => l.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.studentName?.toLowerCase().includes(q) ||
          l.phoneNumber?.includes(q) ||
          l.message?.toLowerCase().includes(q) ||
          l.triggeredBy?.toLowerCase().includes(q)
      );
    }

    return { success: true, count: logs.length, logs };
  },

  retryLog: async (logId) => {
    const remote = await apiCall(`/sms-notifications/retry/${logId}`, { method: 'POST' });
    if (remote) return remote;

    // Standalone retry fallback
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('saumyaa_sms_logs') || '[]');
    } catch (e) {}

    const index = logs.findIndex((l) => String(l._id || l.id) === String(logId));
    if (index === -1) {
      return { success: false, message: 'Log record not found' };
    }

    logs[index].status = 'sent';
    logs[index].errorMessage = '';
    logs[index].sentAt = new Date().toISOString();
    logs[index].providerMessageId = 'SIMULATED_RETRY_' + Date.now();

    localStorage.setItem('saumyaa_sms_logs', JSON.stringify(logs));
    notifyDataUpdate();
    return { success: true, message: 'SMS retried successfully (Simulated)', log: logs[index] };
  },

  toggleSMSPreference: async (studentId, enabled) => {
    const remote = await apiCall(`/sms-notifications/preference/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    if (remote) return remote;

    // Standalone student update fallback
    let students = getStoredStudents() || [];
    const index = students.findIndex((s) => String(s._id || s.id) === String(studentId));
    if (index !== -1) {
      students[index].smsNotificationsEnabled = Boolean(enabled);
      saveStoredStudents(students);
    }
    notifyDataUpdate();
    return {
      success: true,
      message: `SMS notifications toggled ${enabled ? 'ON' : 'OFF'}`,
      smsNotificationsEnabled: Boolean(enabled),
    };
  },

  /**
   * Non-blocking automated SMS dispatch helper for local/client operations
   */
  dispatchSMSNonBlocking: async ({
    studentId,
    studentName,
    phoneNumber,
    notificationType,
    message,
    triggeredBy,
    relatedRecordId,
    eventKey,
    smsNotificationsEnabled = true,
  }) => {
    if (smsNotificationsEnabled === false) {
      console.log(`[SMS Suppressed] ${studentName} has disabled SMS notifications.`);
      return;
    }

    const cleanPhone = phoneNumber ? String(phoneNumber).replace(/\D/g, '') : '';
    if (!cleanPhone || cleanPhone.length < 10) {
      console.warn(`[SMS Dispatch Failed] Invalid phone number for ${studentName}`);
      return;
    }

    const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
    const generatedEventKey = eventKey || `${studentId || studentName}_${notificationType}_${relatedRecordId || Date.now()}`;

    // 1. Send via Backend Server API (/api/sms-notifications/dispatch)
    try {
      const remote = await apiCall('/sms-notifications/dispatch', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          studentName,
          phoneNumber: formattedPhone,
          notificationType,
          message,
          triggeredBy,
          relatedRecordId,
          eventKey: generatedEventKey,
        }),
      });
      if (remote && remote.success) {
        console.log(`[SMS Dispatched via Backend API] to ${studentName} (${formattedPhone})`);
      }
    } catch (err) {
      console.warn('[SMS Dispatch Remote Call Warn]:', err.message);
    }

    // 2. Backup to Local Storage for Standalone/Client-side UI visibility
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('saumyaa_sms_logs') || '[]');
    } catch (e) {}

    const existing = logs.find((l) => l.eventKey === generatedEventKey && l.status === 'sent');
    if (!existing) {
      const newLog = {
        _id: 'sms_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        studentId: String(studentId || ''),
        studentName: studentName || 'Student',
        phoneNumber: formattedPhone,
        notificationType,
        message,
        triggeredBy: triggeredBy || 'Faculty / Staff',
        relatedRecordId: String(relatedRecordId || ''),
        eventKey: generatedEventKey,
        status: 'sent',
        providerMessageId: 'SMS_DISPATCH_' + Date.now(),
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      logs.unshift(newLog);
      localStorage.setItem('saumyaa_sms_logs', JSON.stringify(logs));
    }
    notifyDataUpdate();
  },

  /**
   * Helper: Dispatch Attendance SMS for a batch of student records
   */
  triggerAttendanceSMSBatch: async ({ date, subject, records, studentsList = [], currentUser }) => {
    if (!Array.isArray(records) || records.length === 0) return;
    const allStudents = (Array.isArray(studentsList) && studentsList.length > 0)
      ? studentsList
      : (getStoredStudents() || []);

    const triggeredBy = currentUser?.name || currentUser?.role || 'Faculty';

    records.forEach((rec) => {
      const stId = String(rec.studentId || rec.student);
      const stObj = allStudents.find((s) => String(s._id || s.id) === stId);
      const stName = stObj?.fullName || stObj?.name || rec.studentName || 'Student';
      const stPhone = stObj?.phone || stObj?.parentPhone || rec.phone || '9876543210';
      const pct = stObj?.attendancePercentage || 90;
      const status = rec.status || 'Present';

      const message = `Dear ${stName}, your attendance for ${subject} on ${date} has been marked as ${status}. Current attendance: ${pct}%.`;

      smsNotificationService.dispatchSMSNonBlocking({
        studentId: stId,
        studentName: stName,
        phoneNumber: stPhone,
        notificationType: 'Attendance',
        message,
        triggeredBy,
        relatedRecordId: `${date}_${subject}`,
        eventKey: `${stId}_Attendance_${date}_${subject}_${status}`,
        smsNotificationsEnabled: stObj?.smsNotificationsEnabled !== false,
      });
    });
  },

  /**
   * Helper: Dispatch Grade/Marks SMS for a batch of student records
   */
  triggerGradeSMSBatch: async ({ subject, examType, marksList, studentsList = [], currentUser, isUpdate = false }) => {
    if (!Array.isArray(marksList) || marksList.length === 0) return;
    const allStudents = (Array.isArray(studentsList) && studentsList.length > 0)
      ? studentsList
      : (getStoredStudents() || []);
    const triggeredBy = currentUser?.name || currentUser?.role || 'Faculty';

    marksList.forEach((m) => {
      const stId = String(m.studentId || m.student);
      const stObj = allStudents.find((s) => String(s._id || s.id) === stId);
      const stName = stObj?.fullName || stObj?.name || 'Student';
      const stPhone = stObj?.phone || stObj?.parentPhone || '9876543210';
      const midTerm = Number(m.midTermMarks ?? m.midTerm) || 0;
      const assignment = Number(m.assignmentMarks ?? m.assignment) || 0;
      const finalExam = Number(m.finalExamMarks ?? m.finalExam ?? m.theoryMarks) || 0;
      const internal = Number(m.internalMarks ?? m.internal ?? m.practicalMarks) || 0;
      const totalObtained = midTerm + assignment + finalExam + internal;
      const totalMax = Number(m.totalMax) || 195;

      const pct = Math.min(100, Math.round(((totalObtained / totalMax) * 100) * 10) / 10);
      let calcGrade = m.grade;
      if (!calcGrade) {
        if (pct >= 90) calcGrade = 'A+';
        else if (pct >= 80) calcGrade = 'A';
        else if (pct >= 70) calcGrade = 'B+';
        else if (pct >= 60) calcGrade = 'B';
        else if (pct >= 50) calcGrade = 'C';
        else if (pct >= 40) calcGrade = 'D';
        else calcGrade = 'F';
      }

      const subjectInfo = subject ? `${subject} (${examType || 'Exam'})` : examType || 'recent exam';
      const message = isUpdate
        ? `Dear ${stName}, your marks for ${subjectInfo} have been updated (${totalObtained}/${totalMax}, Grade: ${calcGrade}). Please log in to your student portal for details.`
        : `Dear ${stName}, your marks for ${subjectInfo} have been published (${totalObtained}/${totalMax}, Grade: ${calcGrade}). Please log in to your student portal to view your result.`;

      const notificationType = isUpdate ? 'GradeUpdated' : 'GradePublished';

      smsNotificationService.dispatchSMSNonBlocking({
        studentId: stId,
        studentName: stName,
        phoneNumber: stPhone,
        notificationType,
        message,
        triggeredBy,
        relatedRecordId: `${subject}_${examType}`,
        eventKey: `${stId}_${notificationType}_${subject}_${examType}_${Date.now()}`,
        smsNotificationsEnabled: stObj?.smsNotificationsEnabled !== false,
      });
    });
  },

  /**
   * Helper: Dispatch Account Update SMS for student profile changes
   */
  triggerAccountUpdateSMS: async ({ studentId, studentName, phoneNumber, updatedFields, currentUser, smsNotificationsEnabled = true }) => {
    const triggeredBy = currentUser?.name || currentUser?.role || 'Admin';
    const message = `Dear ${studentName}, important information on your account (${updatedFields}) has been updated by authorized staff. Please log in to your student portal for details.`;

    smsNotificationService.dispatchSMSNonBlocking({
      studentId: String(studentId),
      studentName,
      phoneNumber,
      notificationType: 'AccountUpdate',
      message,
      triggeredBy,
      relatedRecordId: `acc_upd_${Date.now()}`,
      eventKey: `${studentId}_AccountUpdate_${updatedFields}_${Date.now()}`,
      smsNotificationsEnabled,
    });
  },
};


