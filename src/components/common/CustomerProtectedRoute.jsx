// src/components/common/CustomerProtectedRoute.jsx

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function CustomerProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // 1. Jika belum login, paksa ke halaman login
    // 'state: { from: location }' berguna untuk mengembalikan user
    // ke halaman keranjang setelah dia berhasil login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.role === 'customer') {
    // 2. Jika sudah login DAN perannya 'customer', izinkan
    return children;
  }

  if (currentUser.role === 'storeAdmin' || currentUser.role === 'superAdmin') {
    // 3. Jika dia admin, lempar ke dashboard (admin tidak punya keranjang)
    return <Navigate to="/dashboard" replace />;
  }

  // Fallback (seharusnya tidak terjadi)
  return <Navigate to="/" replace />;
}

export default CustomerProtectedRoute;