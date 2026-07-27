import Subject from '../models/Subject.js';

// @desc    Get all subjects
// @route   GET /api/subjects
export const getSubjects = async (req, res) => {
  try {
    const { search, className } = req.query;
    const query = {};

    if (className && className !== 'All') {
      query.className = className;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { teacherName: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
      ];
    }

    const subjects = await Subject.find(query).sort({ createdAt: -1 });
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
export const createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, subject, message: 'Subject created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, subject, message: 'Subject updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
