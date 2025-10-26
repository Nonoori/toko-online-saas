// src/pages/order/OrderSuccessPage.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function OrderSuccessPage() {
  const location = useLocation();
  // Kita bisa ambil ID pesanan jika dikirim lewat state saat navigasi
  const orderId = location.state?.orderId; 

  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: 'auto' }}>
      <h1 style={{ color: 'green' }}>✅ Pesanan Berhasil!</h1>
      {orderId && (
        <p>ID Pesanan Anda: <strong>{orderId}</strong></p>
      )}
      <p>
        Pesanan Anda telah berhasil disimpan dan dikirimkan ke Admin Toko via WhatsApp 
        untuk konfirmasi lebih lanjut (ketersediaan, ongkir, dll.).
      </p>
      <p>
        Admin akan segera menghubungi Anda. Anda juga dapat melihat riwayat pesanan Anda di halaman profil.
      </p>
      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link to="/pesanan" style={buttonStyle('blue')}>
          Lihat Riwayat Pesanan 
        </Link>
        <Link to="/" style={buttonStyle('grey')}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

// CSS
const buttonStyle = (color) => ({
  display: 'inline-block',
  padding: '10px 18px',
  backgroundColor: color,
  color: 'white',
  textDecoration: 'none',
  borderRadius: '5px',
  fontWeight: 'bold'
});

export default OrderSuccessPage;