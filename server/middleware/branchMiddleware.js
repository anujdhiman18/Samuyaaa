/**
 * Center Access Control Middleware
 * Enforces strict center-level data isolation.
 * Main Center: Full access to Main Center data and administrative oversight.
 * Branch: Locked strictly to Branch. Rejects cross-center requests with 403 Forbidden.
 */

export const normalizeBranch = (input) => {
  if (!input) return { branchId: 'MAIN_CENTER', branch: 'Main Center (Bagru)' };
  const str = String(input).trim().toLowerCase();
  if (
    str === 'branch' ||
    str === 'child_branch' ||
    str === 'daroh' ||
    str.includes('daroh') ||
    (str.includes('branch') && !str.includes('main'))
  ) {
    return { branchId: 'BRANCH', branch: 'Branch (Daroh)' };
  }
  return { branchId: 'MAIN_CENTER', branch: 'Main Center (Bagru)' };
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
