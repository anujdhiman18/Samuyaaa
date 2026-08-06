import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../context/RBACContext';
import AccessDenied from './AccessDenied';

export default function ProtectedRoute({ children, requiredPermission = '', requiredRole = '' }) {
  const { user } = useAuth();
  const { hasPermission, hasRole } = useRBAC();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check required permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDenied requiredPermission={requiredPermission} />;
  }

  // Check required role if specified
  if (requiredRole && !hasRole(requiredRole)) {
    return <AccessDenied requiredRole={requiredRole} />;
  }

  return children;
}
