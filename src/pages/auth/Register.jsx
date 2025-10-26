// src/pages/auth/Register.jsx

import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom' // 1. Impor useSearchParams
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../../firebaseConfig';

function Register() {
  // 2. Baca parameter ?role= dari URL
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState('customer'); // Default adalah 'customer'

  useEffect(() => {
    // Set peran berdasarkan URL, tapi pastikan valid
    const urlRole = searchParams.get('role');
    if (urlRole === 'storeAdmin' || urlRole === 'superAdmin') {
      setRole(urlRole);
    } else {
      setRole('customer');
    }
  }, [searchParams]);

  // --- State untuk Form ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // State khusus Admin Toko
  const [storeName, setStoreName] = useState('');
  const [waNumber, setWaNumber] = useState('');
  // State khusus Super Admin
  const [secretCode, setSecretCode] = useState(''); 
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    
    
    // Validasi Kode Rahasia Super Admin
    const superAdminCode = import.meta.env.VITE_SUPERADMIN_SECRET_CODE;
    if (role === 'superAdmin' && secretCode !== superAdminCode) {
      setError('Kode Rahasia Super Admin salah!');
      setLoading(false);
      return;
    }

    try {
      // --- Langkah 1: Buat Akun Auth (Sama untuk semua) ---
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // --- Langkah 2: Buat Dokumen Firestore (Berdasarkan Peran) ---
      
      // Siapkan data user dasar
      const userData = {
        uid: user.uid,
        email: user.email,
        role: role, // 'customer', 'storeAdmin', atau 'superAdmin'
        createdAt: new Date(),
      };

      // Jika dia 'storeAdmin', buat juga dokumen 'stores'
      if (role === 'storeAdmin') {
        const storeId = user.uid; // Kita masih pakai UID user sebagai ID toko
        userData.storeId = storeId; // Tambahkan storeId ke data user
        


        // --- LOGIKA BARU: 7-Day Trial ---
        const now = new Date();
        const expiryDate = new Date(now.setDate(now.getDate() + 7));
        // --------------------------------
        
        // Buat dokumen toko
        const storeDocRef = doc(db, "stores", storeId);
        await setDoc(storeDocRef, {
          storeId: storeId, 
          ownerUid: user.uid,
          namaToko: storeName,
          waNumber: waNumber,
          createdAt: new Date(), // Tanggal dibuat
          expiryDate: expiryDate, // <-- Tanggal Kedaluwarsa!
          status: "trial", // Statusnya "trial"
        });
      }
      
      // Simpan dokumen 'users' (untuk SEMUA peran)
      await setDoc(doc(db, "users", user.uid), userData);

      console.log(`User ${role} berhasil dibuat:`, user.uid);
      
      // --- Langkah 3: Arahkan (Redirect) ---
          setLoading(false);
          
          if (role === 'storeAdmin' || role === 'superAdmin') {
            window.location.assign('/dashboard');
          } else {
            // UBAH BARIS INI:
            // window.location.assign('/'); 
            // MENJADI INI:
            window.location.assign('/profil'); // Arahkan ke profil pelanggan
          }
          
    } catch (err) {
      setLoading(false);
      console.error('Error pendaftaran:', err.message);
      setError(err.message); 
    }
  };

  // --- 4. Tampilan (UI) Dinamis ---
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Daftar sebagai: <span style={{ textTransform: 'capitalize' }}>{role}</span></h2>
      
      <form onSubmit={handleSubmit}>
        
        {/* Input yang tampil untuk 'storeAdmin' */}
        {role === 'storeAdmin' && (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label>Nama Toko Anda:</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required style={inputStyle} placeholder="Contoh: Toko Berkah Jaya" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label>Nomor WhatsApp Admin (diawali 62):</label>
              <input type="tel" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} required style={inputStyle} placeholder="Contoh: 6281234567890" />
            </div>
            <hr style={{ margin: '20px 0' }} />
          </>
        )}

        {/* Input yang tampil untuk 'superAdmin' */}
        {role === 'superAdmin' && (
          <div style={{ marginBottom: '15px' }}>
            <label>Kode Rahasia Super Admin:</label>
            <input type="password" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} required style={inputStyle} placeholder="Masukkan kode rahasia" />
          </div>
        )}

        {/* Input yang tampil untuk SEMUA peran */}
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="email@anda.com" />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} placeholder="Minimal 6 karakter" />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}>
          {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        Sudah punya akun? <Link to="/login">Login di sini</Link>
      </p>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '8px', marginTop: '5px' };

export default Register