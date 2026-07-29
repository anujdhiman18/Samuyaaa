import Faculty from '../models/Faculty.js';

// @desc    Get all faculty members
// @route   GET /api/faculty
export const getFaculty = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { is_active: true } : {};

    const faculty = await Faculty.find(filter).sort({ display_order: 1, createdAt: -1 });

    res.json({ success: true, count: faculty.length, faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new faculty member
// @route   POST /api/faculty
export const createFaculty = async (req, res) => {
  try {
    const { name, designation, subject, qualification, experience, photo_url, display_order, is_active } = req.body;

    if (!name || !photo_url) {
      return res.status(400).json({ success: false, message: 'Name and photo URL are required' });
    }

    const newFaculty = await Faculty.create({
      name,
      designation: designation || 'Senior Faculty Member',
      subject: subject || 'General Academics',
      qualification: qualification || 'Master’s Degree',
      experience: experience || '5+ Years',
      photo_url,
      display_order: Number(display_order) || 1,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    res.status(201).json({ success: true, faculty: newFaculty, message: 'Faculty member added successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update faculty member
// @route   PUT /api/faculty/:id
export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    const updated = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, faculty: updated, message: 'Faculty updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete faculty member
// @route   DELETE /api/faculty/:id
export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Faculty member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
