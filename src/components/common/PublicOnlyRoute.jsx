// src/components/common/PublicOnlyRoute.jsx
// (Ini dari Langkah 36, pastikan sudah benar)

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function PublicOnlyRoute({ children }) {
  const { currentUser, loading } = useAuth(); // Ambil status loading

  // Tampilkan loading jika AuthContext belum siap
  if (loading) {
    return <div>Memeriksa autentikasi...</div>;
  }

  if (currentUser) {
    // Jika user SUDAH login, lempar dia ke halamannya masing-masing
    if (currentUser.role === 'storeAdmin' || currentUser.role === 'superAdmin') {
      return <Navigate to="/dashboard" replace />;
    }
    
    if (currentUser.role === 'customer') {
      return <Navigate to="/profil" replace />; // Arahkan ke profil pelanggan
    }

    // Fallback jika peran tidak jelas
    return <Navigate to="/profil" replace />; 
  }

  // Jika TIDAK ADA user (tamu), izinkan dia melihat children (LandingPage)
  return children;
}

export default PublicOnlyRoute;