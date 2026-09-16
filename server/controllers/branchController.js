import Branch from '../models/Branch.js';

// @desc    Get all branches
// @route   GET /api/branches
export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: { $ne: false } }).sort({ createdAt: 1 });
    if (branches.length === 0) {
      // Auto-populate default institute branches if empty
      const defaultBranches = [
        { name: 'Main Center (Bagru)', code: 'MAIN_CENTER', address: 'Bagru Campus, Main Road', city: 'Bagru', state: 'Himachal Pradesh', phone: '+91 9816001122' },
        { name: 'Branch (Daroh)', code: 'BRANCH_DAROH', address: 'Daroh Market Complex', city: 'Daroh', state: 'Himachal Pradesh', phone: '+91 9816003344' },
      ];
      const inserted = await Branch.insertMany(defaultBranches);
      return res.json({ success: true, count: inserted.length, branches: inserted });
    }
    res.json({ success: true, count: branches.length, branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create branch
// @route   POST /api/branches
export const createBranch = async (req, res) => {
  try {
    const { name, code, address, city, state, phone, email } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Branch name and code are required' });
    }

    const branch = await Branch.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address || '',
      city: city || '',
      state: state || 'Himachal Pradesh',
      phone: phone || '',
      email: email ? email.toLowerCase() : '',
    });

    res.status(201).json({ success: true, branch, message: 'Branch created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
