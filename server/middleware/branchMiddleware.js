/**
 * Branch Access Control Middleware
 * Enforces strict branch-level data isolation.
 * Admin: Full access to both Main Branch and Child Branch.
 * Main Branch Faculty: Locked to MAIN_BRANCH (Bagru).
 * Child Branch Faculty: Locked strictly to CHILD_BRANCH (Daroh). Rejects cross-branch requests with 403 Forbidden.
 */

export const normalizeBranch = (input) => {
  if (!input) return { branchId: 'MAIN_BRANCH', branch: 'Bagru' };
  const str = String(input).trim().toLowerCase();
  if (str === 'child_branch' || str === 'daroh' || str.includes('daroh') || str.includes('child')) {
    return { branchId: 'CHILD_BRANCH', branch: 'Daroh' };
  }
  return { branchId: 'MAIN_BRANCH', branch: 'Bagru' };
};

export const enforceFacultyBranchAccess = (req, res, next) => {
  const user = req.user || req.admin || req.faculty;

  // Unauthenticated requests pass through to auth middleware
  if (!user) {
    return next();
  }

  const isAdmin = Boolean(
    user.role === 'Admin' ||
    user.role === 'SuperAdmin' ||
    (Array.isArray(user.roles) && user.roles.includes('ADMIN'))
  );

  // Admins retain full access to both branches
  if (isAdmin) {
    req.isBranchAdmin = true;
    const requested = req.query.branchId || req.query.branch || req.body.branchId || req.body.branch;
    if (requested) {
      const norm = normalizeBranch(requested);
      req.enforcedBranchId = norm.branchId;
      req.enforcedBranch = norm.branch;
    }
    return next();
  }

  // Resolve user's authenticated branch assignment
  const userBranchNorm = normalizeBranch(user.branchId || user.branch);
  const userBranchId = userBranchNorm.branchId;
  const userBranchName = userBranchNorm.branch;

  // Extract requested branch if explicitly passed in query, body, or params
  const requestedRaw = req.query.branchId || req.query.branch || req.body.branchId || req.body.branch || req.params.branchId;

  if (requestedRaw) {
    const requestedNorm = normalizeBranch(requestedRaw);
    if (requestedNorm.branchId !== userBranchId) {
      return res.status(403).json({
        success: false,
        message: `403 Forbidden: Your account is assigned to ${userBranchNorm.branch} (${userBranchId}). Access to ${requestedNorm.branch} (${requestedNorm.branchId}) data is strictly forbidden.`,
      });
    }
  }

  // Enforce authenticated branch onto request context
  req.enforcedBranchId = userBranchId;
  req.enforcedBranch = userBranchName;
  next();
};
