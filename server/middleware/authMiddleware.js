import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Faculty from '../models/Faculty.js';

const JWT_SECRET = process.env.JWT_SECRET || 'saumyaa_secret_jwt_key_2026';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      let foundUser = await Admin.findById(decoded.id).select('-password');
      if (!foundUser) {
        foundUser = await Faculty.findById(decoded.id).select('-password');
      }

      if (!foundUser) {
        return res.status(401).json({ success: false, message: 'Authenticated user account not found' });
      }

      const branchVal = foundUser.branch || 'Main Center (Bagru)';
      const branchIdVal = foundUser.branchId || (String(branchVal).toLowerCase().includes('branch') ? 'BRANCH' : 'MAIN_CENTER');

      req.user = {
        ...foundUser.toObject(),
        branch: branchVal,
        branchId: branchIdVal,
      };

      if (foundUser.role === 'Admin' || foundUser.role === 'SuperAdmin') {
        req.admin = req.user;
      } else {
        req.faculty = req.user;
      }

      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};
