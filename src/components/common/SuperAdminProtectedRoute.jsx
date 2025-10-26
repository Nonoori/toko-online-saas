// src/components/common/SuperAdminProtectedRoute.jsx


import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function SuperAdminProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (currentUser && currentUser.role === 'superAdmin') {
    return children;
  }
  return <Navigate to="/" replace />; // Lempar jika bukan SuperAdmin
}
export default SuperAdminProtectedRoute;