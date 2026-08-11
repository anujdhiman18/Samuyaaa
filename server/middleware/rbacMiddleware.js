/**
 * Helper function to check if a user object has a specific permission code.
 * Supports Admin users with additional permissions, Faculty users, and full Admins.
 */
export const hasPermission = (user, permissionCode) => {
  if (!user) return false;

  // Students cannot access Admin/Faculty permissions
  if (user.role === 'Student' || user.isStudent) {
    return false;
  }

  const isAdmin = Boolean(
    user.role === 'SuperAdmin' ||
    user.role === 'Admin' ||
    (Array.isArray(user.roles) && (user.roles.includes('ADMIN') || user.roles.includes('SuperAdmin')))
  );

  const userPerms = Array.isArray(user.additionalPermissions) && user.additionalPermissions.length > 0
    ? user.additionalPermissions
    : Array.isArray(user.permissions)
    ? user.permissions
    : [];

  if (isAdmin) {
    // Admin has full access or matching additional permissions
    if (userPerms && userPerms.length > 0) {
      return userPerms.includes(permissionCode) || userPerms.includes(permissionCode.toUpperCase());
    }
    return true;
  }

  return userPerms.includes(permissionCode);
};

/**
 * Middleware to check if authenticated user has required permission(s)
 */
export const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user || req.admin;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Explicitly block student access to admin/faculty academic endpoints
      if (user.role === 'Student' || user.isStudent) {
        return res.status(403).json({ success: false, message: 'Access Denied: Students are not permitted.' });
      }

      // Admins and users with matching permissions proceed
      const userPermissions = Array.isArray(user.additionalPermissions) && user.additionalPermissions.length > 0
        ? user.additionalPermissions
        : Array.isArray(user.permissions)
        ? user.permissions
        : [];

      const isAdmin = Boolean(
        user.role === 'SuperAdmin' ||
        user.role === 'Admin' ||
        (Array.isArray(user.roles) && (user.roles.includes('ADMIN') || user.roles.includes('SuperAdmin')))
      );

      const isPermitted = isAdmin || requiredPermissions.some((perm) => userPermissions.includes(perm));

      if (!isPermitted) {
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
export const requireRole = (...requiredRoles) => {
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

