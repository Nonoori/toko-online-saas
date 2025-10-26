// src/pages/dashboard/PengaturanTokoPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebaseConfig'; // <-- 1. Impor 'storage'
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // <-- 2. Impor fungsi Storage

function PengaturanTokoPage() {
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    namaToko: '',
    waNumber: '',
    themeColor: '#007bff'
  });
  const [logoUrl, setLogoUrl] = useState(''); // State untuk preview logo
  const [logoFile, setLogoFile] = useState(null); // State untuk file yg akan di-upload
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Ambil data toko (READ)
  useEffect(() => {
    if (!currentUser) return;
    const fetchStoreData = async () => {
      setLoading(true);
      const storeDocRef = doc(db, "stores", currentUser.storeId);
      const docSnap = await getDoc(storeDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          namaToko: data.namaToko || '',
          waNumber: data.waNumber || '',
          themeColor: data.themeColor || '#007bff'
        });
        setLogoUrl(data.logoUrl || ''); // <-- Ambil URL logo yang ada
      }
      setLoading(false);
    };
    fetchStoreData();
  }, [currentUser]);

  // 2. Handle perubahan input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 3. Handle pemilihan file logo
  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file); // Simpan file
      setLogoUrl(URL.createObjectURL(file)); // Buat preview URL sementara
    }
  };

  // 4. Simpan perubahan (UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const storeDocRef = doc(db, "stores", currentUser.storeId);
      let newLogoUrl = logoUrl; // URL logo lama (jika tidak ganti)

      // --- Logika Upload Logo BARU ---
      if (logoFile) {
        // Path: logos/{storeId}/logo_{timestamp}
        // Kita pakai storeId (yang == user.uid) untuk lolos Security Rules Storage
        const filePath = `logos/${currentUser.storeId}/logo_${Date.now()}`;
        const storageRef = ref(storage, filePath);
        
        // TODO: Hapus logo lama dari storage jika ada
        
        // Upload file baru
        await uploadBytes(storageRef, logoFile);
        
        // Dapatkan URL download
        newLogoUrl = await getDownloadURL(storageRef);
      }
      // --- Selesai Upload ---

      // Update dokumen Firestore
      await updateDoc(storeDocRef, {
        namaToko: formData.namaToko,
        waNumber: formData.waNumber,
        themeColor: formData.themeColor,
        logoUrl: newLogoUrl // <-- Simpan URL logo baru (atau lama)
      });
      
      setSuccess("Pengaturan berhasil disimpan!");
      setLogoFile(null); // Reset file
    } catch (err) {
      setError("Gagal menyimpan: " + err.message);
    }
    setLoading(false);
  };

  if (loading && !formData.namaToko) {
    return <div style={{ padding: '20px' }}>Memuat pengaturan...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <Link to="/dashboard">&larr; Kembali ke Dashboard</Link>
      <h1 style={{ textAlign: 'center' }}>Pengaturan Toko</h1>
      
      {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* --- 5. Form Upload Logo --- */}
        <div style={inputGroupStyle}>
          <label>Logo Toko:</label>
          {logoUrl && (
            <img 
              src={logoUrl} 
              alt="Logo Preview" 
              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} 
            />
          )}
          <input 
            type="file" 
            name="logo"
            accept="image/png, image/jpeg"
            onChange={handleLogoChange}
            style={inputStyle}
          />
        </div>
        
        {/* ... (Form Nama Toko, WA, Warna Tema tetap sama) ... */}
        <div style={inputGroupStyle}>
          <label>Nama Toko Anda:</label>
          <input type="text" name="namaToko" value={formData.namaToko} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={inputGroupStyle}>
          <label>Nomor WA Admin (diawali 62):</label>
          <input type="tel" name="waNumber" value={formData.waNumber} onChange={handleChange} style={inputStyle} />
        </div>
        <div style={inputGroupStyle}>
          <label>Warna Tema Toko:</label>
          <input type="color" name="themeColor" value={formData.themeColor} onChange={handleChange} style={{ ...inputStyle, height: '50px' }} />
        </div>

        <button type="submit" disabled={loading} style={buttonStyle(formData.themeColor)}>
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </div>
  );
}

// --- CSS Inline (tidak berubah) ---
const inputGroupStyle = { display: 'flex', flexDirection: 'column' };
const inputStyle = { width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' };
const buttonStyle = (color) => ({
  padding: '12px',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1.1em',
  fontWeight: 'bold'
});

export default PengaturanTokoPage;