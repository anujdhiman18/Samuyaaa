import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';

const JWT_SECRET = process.env.JWT_SECRET || 'saumyaa_secret_jwt_key_2026';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Universal Login (Admin, Faculty, Student)
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide identifier/email and password' });
    }

    const cleanIdentifier = String(email).trim().toLowerCase();

    // 1. Check Admin Collection
    const admin = await Admin.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: cleanIdentifier },
      ],
    });

    if (admin) {
      const isMatch = await admin.matchPassword(password);
      if (isMatch) {
        const token = generateToken({
          id: admin._id,
          role: admin.role || 'SuperAdmin',
          email: admin.email,
        });

        return res.json({
          success: true,
          token,
          user: {
            id: admin._id,
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role || 'SuperAdmin',
            avatar: admin.avatar,
            phone: admin.phone,
            department: admin.department,
            permissions: admin.permissions || [],
          },
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role || 'SuperAdmin',
            avatar: admin.avatar,
          },
        });
      }
    }

    // 2. Check Faculty Collection
    const faculty = await Faculty.findOne({
      $or: [
        { email: cleanIdentifier },
        { phone: cleanIdentifier },
        { name: new RegExp(`^${cleanIdentifier}$`, 'i') },
      ],
      is_active: { $ne: false },
    });

    if (faculty) {
      let isMatch = false;
      if (faculty.password) {
        if (faculty.password.startsWith('$2a$') || faculty.password.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(password, faculty.password);
        } else {
          isMatch = faculty.password === password;
        }
      } else {
        isMatch = password === 'faculty123' || password === 'admin123';
      }

      if (isMatch) {
        const userRoles = Array.isArray(faculty.roles) && faculty.roles.length > 0
          ? faculty.roles
          : [faculty.role || 'SUBJECT_TEACHER'];

        const token = generateToken({
          id: faculty._id,
          role: 'Faculty',
          roles: userRoles,
          email: faculty.email,
        });

        return res.json({
          success: true,
          token,
          user: {
            id: faculty._id,
            _id: faculty._id,
            name: faculty.name,
            email: faculty.email,
            role: 'Faculty',
            roles: userRoles,
            designation: faculty.designation,
            department: faculty.department,
            branch: faculty.branch,
            branchId: faculty.branchId,
            assignedClasses: faculty.assignedClasses,
            assignedSubjects: faculty.assignedSubjects,
            responsibilities: faculty.responsibilities || [],
            avatar: faculty.photo_url || '/Unknown.jpg',
            photo_url: faculty.photo_url || '/Unknown.jpg',
          },
        });
      }
    }

    // 3. Check Student Collection
    const student = await Student.findOne({
      $or: [
        { email: cleanIdentifier },
        { rollNumber: new RegExp(`^${cleanIdentifier}$`, 'i') },
        { admissionNumber: new RegExp(`^${cleanIdentifier}$`, 'i') },
        { phone: cleanIdentifier },
        { parentPhone: cleanIdentifier },
      ],
      status: { $ne: 'Suspended' },
    });

    if (student) {
      let isMatch = false;
      if (student.password) {
        if (student.password.startsWith('$2a$') || student.password.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(password, student.password);
        } else {
          isMatch = student.password === password;
        }
      } else {
        isMatch = password === 'Student123' || password === student.initialPassword;
      }

      if (isMatch) {
        const token = generateToken({
          id: student._id,
          role: 'Student',
          rollNumber: student.rollNumber,
          email: student.email,
        });

        return res.json({
          success: true,
          token,
          user: {
            id: student._id,
            _id: student._id,
            name: student.fullName,
            fullName: student.fullName,
            rollNumber: student.rollNumber,
            admissionNumber: student.admissionNumber,
            email: student.email,
            phone: student.phone,
            parentPhone: student.parentPhone,
            className: student.className,
            academicStage: student.academicStage,
            course: student.course,
            batch: student.batch,
            branch: student.branch,
            role: 'Student',
            monthlyFee: student.monthlyFee,
            feesPaid: student.feesPaid,
            paidTillMonth: student.paidTillMonth,
            attendancePercentage: student.attendancePercentage,
            avatar: student.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
            mustChangePassword: student.mustChangePassword,
          },
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials. Please verify your identifier and password.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
export const loginAdmin = login;

// @desc    Get Admin/User Profile
// @route   GET /api/auth/profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user?.id || req.admin?.id).select('-password');
    if (admin) {
      return res.json({ success: true, admin, user: admin });
    }
    const faculty = await Faculty.findById(req.user?.id).select('-password');
    if (faculty) {
      return res.json({ success: true, user: faculty, role: 'Faculty' });
    }
    const student = await Student.findById(req.user?.id).select('-password');
    if (student) {
      return res.json({ success: true, user: student, role: 'Student' });
    }
    res.status(404).json({ success: false, message: 'Profile not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Admin Profile
// @route   PUT /api/auth/profile
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?.id || req.admin?._id || req.admin?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin record not found in database' });
    }

    const { name, email, phone, avatar, role, department, bio } = req.body;

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase();
    if (phone) admin.phone = phone;
    if (avatar) admin.avatar = avatar;
    if (role) admin.role = role;
    if (department) admin.department = department;
    if (bio !== undefined) admin.bio = bio;

    const updatedAdmin = await admin.save();

    res.json({
      success: true,
      message: 'Admin profile updated successfully',
      admin: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        role: updatedAdmin.role,
        avatar: updatedAdmin.avatar,
        department: updatedAdmin.department,
        bio: updatedAdmin.bio,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const userId = req.user?.id || req.admin?._id || req.admin?.id;
    const admin = await Admin.findById(userId);
    if (admin) {
      const isMatch = await admin.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      admin.password = newPassword;
      await admin.save();
      return res.json({ success: true, message: 'Password changed successfully!' });
    }

    const faculty = await Faculty.findById(userId);
    if (faculty) {
      let isMatch = false;
      if (faculty.password?.startsWith('$2a$') || faculty.password?.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(currentPassword, faculty.password);
      } else {
        isMatch = faculty.password === currentPassword;
      }
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      faculty.password = await bcrypt.hash(newPassword, 10);
      faculty.mustChangePassword = false;
      await faculty.save();
      return res.json({ success: true, message: 'Password changed successfully!' });
    }

    const student = await Student.findById(userId);
    if (student) {
      let isMatch = false;
      if (student.password?.startsWith('$2a$') || student.password?.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(currentPassword, student.password);
      } else {
        isMatch = student.password === currentPassword;
      }
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      student.password = await bcrypt.hash(newPassword, 10);
      student.mustChangePassword = false;
      await student.save();
      return res.json({ success: true, message: 'Password changed successfully!' });
    }

    res.status(404).json({ success: false, message: 'User not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
