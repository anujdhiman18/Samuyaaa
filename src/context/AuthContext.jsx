import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeBranchId, getBranchCode, getBranchLabel } from '../config/rbacConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('saumyaa_user') || localStorage.getItem('saumyaa_admin');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        const bId = normalizeBranchId(parsed?.branchId || parsed?.branch);
        return {
          ...parsed,
          branchId: bId,
          branch: getBranchCode(bId),
          branchLabel: getBranchLabel(bId),
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const t = localStorage.getItem('saumyaa_token');
      return t && t !== 'undefined' ? t : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('saumyaa_token', token);
    } else {
      localStorage.removeItem('saumyaa_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('saumyaa_user', JSON.stringify(user));
      localStorage.setItem('saumyaa_admin', JSON.stringify(user));
    } else {
      localStorage.removeItem('saumyaa_user');
      localStorage.removeItem('saumyaa_admin');
    }
  }, [user]);

  const login = (userData, authToken) => {
    const isFacultyUser = Boolean(
      userData?.isFaculty ||
        userData?.role === 'Faculty' ||
        ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR'].includes(userData?.role) ||
        (Array.isArray(userData?.roles) && userData.roles.some((r) => ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR', 'FACULTY'].includes(r)))
    );

    const bId = normalizeBranchId(userData?.branchId || userData?.branch);

    const normalizedUser = {
      ...userData,
      isFaculty: isFacultyUser,
      branchId: bId,
      branch: getBranchCode(bId),
      branchLabel: getBranchLabel(bId),
    };
    setUser(normalizedUser);
    setToken(authToken);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      if (!prev) return updatedData;
      const merged = { ...prev, ...updatedData };
      const bId = normalizeBranchId(merged.branchId || merged.branch);
      return {
        ...merged,
        branchId: bId,
        branch: getBranchCode(bId),
        branchLabel: getBranchLabel(bId),
      };
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('saumyaa_token');
    localStorage.removeItem('saumyaa_user');
    localStorage.removeItem('saumyaa_admin');
  };

  const isFaculty = Boolean(
    user &&
      !user.isStudent &&
      (user.isFaculty ||
        user.role === 'Faculty' ||
        ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR'].includes(user.role) ||
        (Array.isArray(user.roles) && user.roles.some((r) => ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER', 'ACADEMIC_COORDINATOR', 'FACULTY'].includes(r))))
  );
  const isAdmin = Boolean(user && (user.role === 'Admin' || user.role === 'SuperAdmin' || (Array.isArray(user.roles) && user.roles.includes('ADMIN'))));

  const branchId = user ? normalizeBranchId(user.branchId || user.branch) : 'MAIN_BRANCH';
  const branchName = getBranchCode(branchId);
  const branchLabel = getBranchLabel(branchId);
  const isChildBranch = branchId === 'CHILD_BRANCH';
  const isMainBranch = branchId === 'MAIN_BRANCH';

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: user, // Alias for backwards compatibility
        token,
        isAuthenticated: !!token && !!user,
        isFaculty,
        isAdmin,
        branchId,
        branchName,
        branchLabel,
        isChildBranch,
        isMainBranch,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
