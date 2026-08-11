import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { PERMISSIONS, SYSTEM_ROLES, computePermissionsForUser } from '../config/rbacConfig';
import { rbacService } from '../services/api';

const RBACContext = createContext();

export function RBACProvider({ children }) {
  const { user } = useAuth();
  const [customRoles, setCustomRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [systemRoleOverrides, setSystemRoleOverrides] = useState({});

  const loadCustomRoles = async () => {
    try {
      const res = await rbacService.getRoles();
      if (res && res.roles) {
        setCustomRoles(res.roles.filter((r) => !r.isSystem));

        const overrides = {};
        res.roles.filter((r) => r.isSystem).forEach((sys) => {
          overrides[sys.code] = sys.permissions;
        });
        setSystemRoleOverrides(overrides);
      }
    } catch (e) {
      console.warn('Error loading custom roles in RBACContext:', e);
    }
  };

  const resolveUserRoles = () => {
    if (!user) {
      setUserRoles([]);
      return;
    }

    let roles = [];

    // Try finding live assigned roles from stored faculty list first
    try {
      const storedRaw = localStorage.getItem('saumyaa_faculty');
      if (storedRaw) {
        const facultyList = JSON.parse(storedRaw);
        const match = facultyList.find(
          (f) =>
            String(f._id || f.id) === String(user._id || user.id) ||
            (f.email && user.email && f.email.toLowerCase() === user.email.toLowerCase())
        );
        if (match && Array.isArray(match.roles) && match.roles.length > 0) {
          roles = match.roles;
        }
      }
    } catch (e) {}

    // Fallback to user object roles if not found in list
    if (roles.length === 0) {
      if (Array.isArray(user.roles) && user.roles.length > 0) {
        roles = user.roles;
      } else if (user.role && user.role !== 'Faculty' && user.role !== 'Admin' && user.role !== 'SuperAdmin') {
        roles = [user.role];
      } else if (user.designation) {
        if (user.designation.includes('HOD') || user.designation.includes('Head')) {
          roles = ['HEAD_OF_DEPARTMENT', 'SENIOR_FACULTY', 'SUBJECT_TEACHER'];
        } else if (user.designation.includes('Senior')) {
          roles = ['SENIOR_FACULTY', 'SUBJECT_TEACHER'];
        } else if (user.designation.includes('Coordinator')) {
          roles = ['ACADEMIC_COORDINATOR'];
        } else {
          roles = ['SUBJECT_TEACHER'];
        }
      } else {
        roles = ['SUBJECT_TEACHER'];
      }
    }

    if (user.role === 'SuperAdmin' || user.role === 'Admin') {
      roles.push('ADMIN');
    }

    setUserRoles(roles);
  };

  useEffect(() => {
    resolveUserRoles();
    loadCustomRoles();

    const handleUpdate = () => {
      resolveUserRoles();
      loadCustomRoles();
    };

    window.addEventListener('saumyaa_data_updated', handleUpdate);
    return () => window.removeEventListener('saumyaa_data_updated', handleUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const allRoles = useMemo(() => {
    const sysMerged = SYSTEM_ROLES.map((sys) => {
      if (systemRoleOverrides[sys.code]) {
        return { ...sys, permissions: systemRoleOverrides[sys.code] };
      }
      return sys;
    });
    return [...sysMerged, ...customRoles];
  }, [customRoles, systemRoleOverrides]);

  // Compiled unique permission list for current active user
  const activePermissions = useMemo(() => {
    if (!user) return [];

    const isAdmin = Boolean(
      user.role === 'SuperAdmin' ||
      user.role === 'Admin' ||
      userRoles.includes('ADMIN') ||
      userRoles.includes('SuperAdmin')
    );

    if (isAdmin) {
      return Object.values(PERMISSIONS);
    }

    const customOverrides = user.permissionOverrides || {};
    return computePermissionsForUser(userRoles, customOverrides, user.role, customRoles);
  }, [user, userRoles, customRoles, systemRoleOverrides]);

  /**
   * Check if active user has a specific permission code
   */
  const hasPermission = (permissionCode) => {
    if (!user) return false;

    const isAdmin = Boolean(
      user.role === 'SuperAdmin' ||
      user.role === 'Admin' ||
      userRoles.includes('ADMIN') ||
      userRoles.includes('SuperAdmin')
    );

    if (isAdmin) {
      // If admin user has additionalPermissions specified, check if permission is present
      if (Array.isArray(user.additionalPermissions) && user.additionalPermissions.length > 0) {
        return (
          user.additionalPermissions.includes(permissionCode) ||
          user.additionalPermissions.includes(permissionCode.toUpperCase()) ||
          activePermissions.includes(permissionCode)
        );
      }
      return true;
    }

    return activePermissions.includes(permissionCode);
  };

  /**
   * Check if active user has any of the specified permission codes
   */
  const hasAnyPermission = (permissionCodes = []) => {
    if (!permissionCodes || permissionCodes.length === 0) return true;
    return permissionCodes.some((code) => hasPermission(code));
  };

  /**
   * Check if active user has a specific role
   */
  const hasRole = (roleCode) => {
    if (!user) return false;
    if (user.role === 'SuperAdmin' || user.role === 'Admin') return true;
    return userRoles.includes(roleCode);
  };

  const value = {
    user,
    userRoles,
    activePermissions,
    hasPermission,
    hasAnyPermission,
    hasRole,
    customRoles,
    setCustomRoles,
    allRoles,
    SYSTEM_ROLES,
    PERMISSIONS,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
}
