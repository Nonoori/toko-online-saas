// src/pages/LandingPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  // Halaman ini HANYA akan dilihat oleh Tamu (Guest)
  // karena dilindungi oleh <PublicOnlyRoute>
  return (
    <div style={pageStyle}>
      {/* --- Copywriting --- */}
      <h1>Sewa MarketPlace Pribadi Anda</h1>
      <p style={{ fontSize: '1.2em', margin: '20px 0' }}>
        Miliki toko online profesional Anda sendiri dengan manajemen lengkap.
        Platform kami siap pakai, aman, dan cepat.
      </p>
      
      {/* --- INI ADALAH TOMBOL REGISTRASI KAMU --- */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'center' }}>
        <Link to="/register?role=storeAdmin" style={buttonStyle}>
          Coba GRATIS 7 Hari (Daftar Sekarang)
        </Link>
      </div>
      
      <p style={{ marginTop: '30px' }}>
        Sudah punya akun? <Link to="/login">Login di sini</Link>
      </p>
    </div>
  );
}

// --- CSS Inline ---
const pageStyle = {
  padding: '60px 40px',
  textAlign: 'center',
  maxWidth: '800px',
  margin: 'auto',
  minHeight: '60vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};
const buttonStyle = {
  display: 'inline-block',
  padding: '12px 25px',
  backgroundColor: '#007bff',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '5px',
  fontWeight: 'bold',
  fontSize: '1.1em'
};

export default LandingPage;