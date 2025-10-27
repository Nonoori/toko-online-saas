// src/pages/dashboard/VoucherPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function VoucherPage() {
  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">&larr; Kembali ke Dashboard</Link>
      <h1>Manajemen Voucher Diskon</h1>
      <p>
        Buat dan kelola kode voucher diskon untuk toko Anda.
      </p>

      {/* Bagian Tambah Voucher (Akan diisi nanti) */}
      <div style={{ marginTop: '30px', marginBottom: '30px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2>Buat Voucher Baru</h2>
        {/* Form akan ada di sini */}
        <p>Formulir pembuatan voucher...</p>
      </div>

      {/* Bagian Daftar Voucher Aktif (Akan diisi nanti) */}
      <div>
        <h2>Voucher Aktif Anda</h2>
        {/* Tabel/daftar voucher akan ada di sini */}
        <p>Daftar voucher...</p>
      </div>
    </div>
  );
}

export default VoucherPage;