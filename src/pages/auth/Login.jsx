// src/pages/auth/Login.jsx

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useCart } from '../../context/CartContext'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart(); 

  const message = location.state?.message;
  const fromPage = location.state?.from;
  
  // --- FUNGSI HELPER BARU UNTUK CEK STATUS TOKO ---
  const checkStoreStatus = async (storeId) => {
    const storeDocRef = doc(db, "stores", storeId);
    const storeSnap = await getDoc(storeDocRef);

    if (!storeSnap.exists()) {
      return { ok: false, message: "Data toko Anda tidak ditemukan." };
    }

    const storeData = storeSnap.data();
    
    // 1. Cek jika dinonaktifkan manual
    if (storeData.status === 'inactive') {
      return { ok: false, message: "Akun toko Anda telah dinonaktifkan." };
    }

    // 2. Cek jika trial sudah habis
    if (storeData.status === 'trial' && storeData.expiryDate) {
      // expiryDate dari Firestore adalah objek Timestamp, ubah ke Date
      const expiryDate = storeData.expiryDate.toDate();
      const now = new Date();
      
      if (now > expiryDate) {
        // SUDAH HANGUS
        return { 
          ok: false, 
          message: "Masa trial 7 hari Anda telah berakhir. Silakan hubungi SuperAdmin untuk aktivasi." 
        };
      }
    }
    
    // 3. Jika status 'active' atau trial masih berlaku
    return { ok: true, message: "Status OK" };
  };


  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    setLoading(true);

    try {
      // 1. Coba Login (Auth)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Ambil Profil User (Firestore)
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role;

        // --- 3. LOGIKA PENGALIHAN BERBASIS PERAN ---
        
        // --- 3. Logika Tambah Item Tertunda (HANYA UNTUK CUSTOMER) ---
        if (role === 'customer') {
          try {
            const pendingItemJSON = sessionStorage.getItem('pendingCartItem');
            if (pendingItemJSON) {
              const pendingItem = JSON.parse(pendingItemJSON);
              console.log("Menambahkan item tertunda ke keranjang:", pendingItem);
              addToCart(pendingItem); // Tambahkan ke keranjang
              sessionStorage.removeItem('pendingCartItem'); // Hapus dari session storage
            }
          } catch (e) {
            console.error("Gagal memproses item tertunda:", e);
            sessionStorage.removeItem('pendingCartItem'); // Hapus jika error
          }
        }
        // -----------------------------------------------------

        // 4. Arahkan berdasarkan Peran (Redirect)
        if (role === 'storeAdmin' || role === 'superAdmin') {
          window.location.assign(role === 'superAdmin' ? '/superadmin' : '/dashboard');
        } else { // Customer
          // Arahkan kembali ke halaman asal (misal /keranjang) atau default ke /profil
          window.location.assign(fromPage ? fromPage.pathname : '/profil');
        }

     
      } else {
        setError('Profil pengguna tidak ditemukan. Melakukan logout...');
        await signOut(auth);
        setLoading(false);
      }
      
    } catch (err) {
      console.error("Error login:", err);
      setError('Email atau password yang Anda masukkan salah.');
      setLoading(false);
    }
  };

  //  (JSX )

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      
      {message && (
        <p style={{ padding: '10px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}>
          {message}
        </p>
      )}
      
      <h2>Login</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <div style={{ marginBottom: '15px', textAlign: 'right' }}>
          <Link to="/forgot-password">Lupa Password?</Link>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px' }}>
          {loading ? 'Memeriksa...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        Belum punya akun? <Link to="/register">Daftar di sini</Link>
      </p>
    </div>
  )
}

export default Login