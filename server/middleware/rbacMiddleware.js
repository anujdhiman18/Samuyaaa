const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware to check if authenticated user has required permission(s)
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Admins bypass all permission checks
      if (user.role === 'SuperAdmin' || user.role === 'Admin' || (user.roles && user.roles.includes('ADMIN'))) {
        return next();
      }

      const userPermissions = user.permissions || [];
      const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

      if (!hasPermission) {
        // Log unauthorized access attempt
        try {
          await ActivityLog.create({
            userId: user._id || user.id || 'unknown',
            userName: user.name || user.fullName || 'User',
            userRole: user.role || 'Faculty',
            action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
            category: 'SECURITY',
            details: `Attempted to access ${req.originalUrl} without permission: ${requiredPermissions.join(', ')}`,
            status: 'DENIED',
            ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          });
        } catch (logErr) {
          console.warn('Activity log write error:', logErr.message);
        }

        return res.status(403).json({
          success: false,
          message: `Access Denied: Missing required permission [${requiredPermissions.join(', ')}]`,
          requiredPermissions,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Authorization check failed: ' + err.message });
    }
  };
};

/**
 * Middleware to check if authenticated user has required role(s)
 */
const requireRole = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      if (user.role === 'SuperAdmin' || user.role === 'Admin') {
        return next();
      }

      const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: Required role [${requiredRoles.join(', ')}]`,
          requiredRoles,
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Role authorization check failed' });
    }
  };
};

module.exports = {
  requirePermission,
  requireRole,
};
