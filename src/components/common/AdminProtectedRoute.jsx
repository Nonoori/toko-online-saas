// src/components/common/AdminProtectedRoute.jsx
// (Nama file sebelumnya ProtectedRoute.jsx)

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // 1. Jika belum login, paksa ke halaman login
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'storeAdmin' || currentUser.role === 'superAdmin') {
    // 2. Jika dia admin atau superadmin, izinkan
    return children;
  }

  if (currentUser.role === 'customer') {
    // 3. Jika dia pelanggan, lempar ke profil (pelanggan tidak punya dashboard)
    return <Navigate to="/profil" replace />;
  }

  // Fallback (jika role aneh / sedang loading)
  // Kita bisa tambahkan cek 'loading' dari useAuth() nanti
  return <Navigate to="/" replace />;
}

export default AdminProtectedRoute;