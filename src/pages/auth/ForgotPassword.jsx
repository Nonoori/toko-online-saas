// src/pages/auth/ForgotPassword.jsx

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../../firebaseConfig';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // Untuk pesan sukses
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // 1. Kirim email reset password menggunakan Firebase
      await sendPasswordResetEmail(auth, email);
      
      // 2. Beri pesan sukses
      setMessage('Berhasil! Silakan cek email Anda untuk link reset password.');
      setLoading(false);

    } catch (err) {
      console.error("Error sending password reset email:", err);
      if (err.code === 'auth/user-not-found') {
        setError('Email tidak terdaftar.');
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Reset Password Anda</h2>
      <p>Kami akan mengirimkan link ke email Anda untuk mereset password.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email Terdaftar:</label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="masukkan@email.com"
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}

        <button type-="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '5px' }}>
          {loading ? 'Mengirim...' : 'Kirim Link Reset'}
        </button>
      </form>

      <p style={{ marginTop: '20px' }}>
        <Link to="/login">&larr; Kembali ke Login</Link>
      </p>
    </div>
  )
}

export default ForgotPassword