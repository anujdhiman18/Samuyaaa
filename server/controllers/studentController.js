import Student from '../models/Student.js';

// @desc    Get all students with filter, search, pagination
// @route   GET /api/students
export const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, className, status } = req.query;

    const query = {};

    if (className && className !== 'All') {
      query.className = className;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { parentPhone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Student.countDocuments(query);
    const students = await Student.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    res.json({
      success: true,
      students,
      page,
      pages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create student
// @route   POST /api/students
export const createStudent = async (req, res) => {
  try {
    const { rollNumber } = req.body;

    // Check duplicate roll number
    const existing = await Student.findOne({ rollNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Roll number ${rollNumber} already exists` });
    }

    const student = await Student.create(req.body);
    res.status(201).json({ success: true, student, message: 'Student registered successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
export const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check duplicate roll number if updated
    if (req.body.rollNumber && req.body.rollNumber !== student.rollNumber) {
      const existing = await Student.findOne({ rollNumber: req.body.rollNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: `Roll number ${req.body.rollNumber} already exists` });
      }
    }

    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, student: updated, message: 'Student updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
