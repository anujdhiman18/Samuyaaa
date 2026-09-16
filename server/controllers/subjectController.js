import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';

// @desc    Get all subjects with filters, dynamic enrollment counts, and search
// @route   GET /api/subjects
export const getSubjects = async (req, res) => {
  try {
    const { search, className, category, categoryCode, stream, teacherName, branch, includeInactive } = req.query;
    const query = {};

    if (includeInactive !== 'true') {
      query.isActive = { $ne: false };
    }

    if (className && className !== 'All') {
      query.className = className;
    }

    if (categoryCode && categoryCode !== 'All') {
      query.categoryCode = categoryCode;
    }

    if (category && category !== 'All' && !categoryCode) {
      query.$or = [{ category: category }, { categoryCode: category }];
    }

    if (stream && stream !== 'All') {
      query.stream = stream;
    }

    if (teacherName && teacherName !== 'All') {
      query.teacherName = teacherName;
    }

    if (branch && branch !== 'All') {
      query.branch = branch;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subjectCode: { $regex: search, $options: 'i' } },
        { teacherName: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
        { stream: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const subjects = await Subject.find(query).sort({ createdAt: -1 });
    const allStudents = await Student.find({ status: 'Active' });

    // Compute live real-time enrollments for each subject
    const enrichedSubjects = subjects.map((sub) => {
      const subObj = sub.toObject();
      const subNameLower = (sub.name || '').trim().toLowerCase();
      const subCat = (sub.categoryCode || '').toUpperCase();

      const enrolledStudents = allStudents.filter((st) => {
        if (!Array.isArray(st.subjects) || st.subjects.length === 0) return false;
        return st.subjects.some((s) => {
          const sLower = String(s).trim().toLowerCase();
          return sLower === subNameLower || subNameLower.includes(sLower) || sLower.includes(subNameLower);
        });
      });

      subObj.totalEnrolled = enrolledStudents.length;
      return subObj;
    });

    res.json({ success: true, count: enrichedSubjects.length, subjects: enrichedSubjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dynamic Subject Catalog Statistics & Stage Breakdowns
// @route   GET /api/subjects/stats
export const getSubjectStats = async (req, res) => {
  try {
    const activeSubjects = await Subject.find({ isActive: { $ne: false } });
    const activeStudents = await Student.find({ status: 'Active' });

    const totalActiveSubjects = activeSubjects.length;

    // S1, S2, S3, S4 breakdown
    const stageCounts = {
      S1: activeSubjects.filter((s) => s.categoryCode === 'S1' || (s.className && s.className.includes('S1'))).length,
      S2: activeSubjects.filter((s) => s.categoryCode === 'S2' || (s.className && s.className.includes('S2'))).length,
      S3: activeSubjects.filter((s) => s.categoryCode === 'S3' || (s.className && s.className.includes('S3'))).length,
      S4: activeSubjects.filter((s) => s.categoryCode === 'S4' || (s.className && s.className.includes('S4'))).length,
    };

    // Calculate unique faculty assigned
    const uniqueFaculty = new Set(activeSubjects.map((s) => (s.teacherName || '').trim()).filter(Boolean));
    const facultyAssigned = uniqueFaculty.size;

    // Total enrolled students across all offerings
    let totalEnrollmentInstances = 0;
    activeSubjects.forEach((sub) => {
      const subNameLower = (sub.name || '').trim().toLowerCase();
      const enrolled = activeStudents.filter((st) => {
        if (!Array.isArray(st.subjects)) return false;
        return st.subjects.some((s) => {
          const sLower = String(s).trim().toLowerCase();
          return sLower === subNameLower || subNameLower.includes(sLower) || sLower.includes(subNameLower);
        });
      });
      totalEnrollmentInstances += enrolled.length;
    });

    const avgBatchSize = totalActiveSubjects > 0 ? Math.round(totalEnrollmentInstances / totalActiveSubjects) : 0;

    res.json({
      success: true,
      stats: {
        activeSubjects: totalActiveSubjects,
        totalEnrolled: totalEnrollmentInstances,
        facultyAssigned,
        avgBatchSize,
        stageCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
export const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const allStudents = await Student.find({ status: 'Active' });
    const subNameLower = (subject.name || '').trim().toLowerCase();
    const enrolledStudents = allStudents.filter((st) => {
      if (!Array.isArray(st.subjects)) return false;
      return st.subjects.some((s) => {
        const sLower = String(s).trim().toLowerCase();
        return sLower === subNameLower || subNameLower.includes(sLower) || sLower.includes(subNameLower);
      });
    });

    const subObj = subject.toObject();
    subObj.enrolledStudents = enrolledStudents;
    subObj.totalEnrolled = enrolledStudents.length;

    res.json({ success: true, subject: subObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
export const createSubject = async (req, res) => {
  try {
    const { name, categoryCode, category, className, teacherName, maxCapacity, stream, batchTime, description, branch } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    const catCode = categoryCode || (category && ['S1', 'S2', 'S3', 'S4'].includes(category) ? category : 'S2');

    const subject = await Subject.create({
      name: name.trim(),
      subjectCode: req.body.subjectCode || `${name.trim().substring(0, 4).toUpperCase()}-${catCode}`,
      category: category || 'Foundation',
      categoryCode: catCode,
      className: className || `Class ${catCode}`,
      stream: stream || 'CBSE Board',
      teacherName: teacherName || 'Jitender Sharma',
      batchTime: batchTime || '5:00 PM – 6:30 PM',
      description: description || '',
      maxCapacity: Number(maxCapacity) || 20,
      branch: branch || 'Main Center (Bagru)',
      isActive: true,
    });

    res.status(201).json({ success: true, subject, message: 'Subject created successfully in database' });
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
    res.json({ success: true, subject, message: 'Subject updated successfully in database' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete subject (Permanent deletion or soft-delete)
// @route   DELETE /api/subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    const { permanent } = req.query;
    if (permanent === 'true') {
      await Subject.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Subject offering permanently deleted from database' });
    }

    const subject = await Subject.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.json({ success: true, message: 'Subject offering archived/deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear All Subjects (Database reset for subjects)
// @route   DELETE /api/subjects/all
export const clearAllSubjects = async (req, res) => {
  try {
    await Subject.deleteMany({});
    res.json({ success: true, message: 'All subject records cleared from database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
