// src/pages/superadmin/SuperAdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, auth } from '../../firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function SuperAdminDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // useEffect untuk ambil data toko (tidak berubah)
  useEffect(() => {
    setLoading(true);
    const q = collection(db, "stores");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const storesList = [];
      querySnapshot.forEach((doc) => {
        storesList.push({ id: doc.id, ...doc.data() });
      });
      setStores(storesList);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Gagal mengambil data toko.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fungsi untuk mengubah status toko (tidak berubah)
  const handleUpdateStatus = async (storeId, newStatus) => {
    if (!window.confirm(`Anda yakin ingin mengubah status toko ini menjadi "${newStatus}"?`)) {
      return;
    }
    const storeDocRef = doc(db, "stores", storeId);
    try {
      await updateDoc(storeDocRef, { status: newStatus });
      alert("Status berhasil diperbarui!");
    } catch (err) {
      console.error("Gagal update status: ", err);
      alert("Error: " + err.message);
    }
  };

  // Fungsi untuk memperpanjang trial (STRUKTUR DIPERBAIKI)
  const handleExtendTrial = async (storeId, currentExpiryDate) => {
    const daysToAdd = 30;
    const startDate = currentExpiryDate ? currentExpiryDate.toDate() : new Date();
    const newExpiryDate = new Date(startDate.setDate(startDate.getDate() + daysToAdd));

    if (!window.confirm(`Perpanjang trial toko ini hingga ${newExpiryDate.toLocaleDateString('id-ID')}?`)) { // Gunakan locale
      return;
    }

    // Blok try...catch SEKARANG ADA DI DALAM handleExtendTrial
    const storeDocRef = doc(db, "stores", storeId);
    try {
      await updateDoc(storeDocRef, {
        expiryDate: Timestamp.fromDate(newExpiryDate)
      });
      alert("Trial berhasil diperpanjang!");
    } catch (err) {
      console.error("Gagal perpanjang trial: ", err);
      alert("Error: " + err.message);
    }
  }; // <-- Kurung kurawal penutup untuk handleExtendTrial

  // --- Fungsi Logout (SEKARANG DI LUAR handleExtendTrial) ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error("Error logging out:", err);
    }
  }; // <-- Kurung kurawal penutup untuk handleLogout


  // --- Tampilan Loading ---
  if (loading) {
    return <div style={{padding: '20px'}}>Memuat data...</div>; // Beri return JSX yang valid
  }

  // --- Tampilan Utama ---
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Super Admin</h1>
      {/* Cek currentUser sebelum akses email */}
      <p>Selamat datang, <strong>{currentUser?.email || 'Admin'}</strong>. Anda mengelola {stores.length} toko.</p>
      <button onClick={handleLogout} style={logoutButtonStyle}>
        Logout
      </button>

      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}

    
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th style={cellStyle}>Nama Toko</th>
            <th style={cellStyle}>Email Pemilik</th>
            <th style={cellStyle}>Status</th>
            <th style={cellStyle}>Trial Habis Pada</th>
            <th style={cellStyle}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => {
            const isExpired = store.expiryDate && store.expiryDate.toDate() < new Date();
            return (
              <tr key={store.id}>
                <td style={cellStyle}>{store.namaToko}</td>
                {/* Kita belum simpan email di 'stores', jadi kita tampilkan UID dulu */}
                {/* Nanti kita bisa 'join' data ini */}
                <td style={cellStyle}>{store.ownerUid}</td>
                <td style={{ ...cellStyle, 
                  color: isExpired ? 'red' : (store.status === 'active' ? 'green' : 'orange'),
                  fontWeight: 'bold'
                }}>
                  {store.status.toUpperCase()}
                  {isExpired && " (EXPIRED)"}
                </td>
                <td style={cellStyle}>
                  {store.expiryDate ? 
                    store.expiryDate.toDate().toLocaleDateString('id-ID') : 
                    'N/A'}
                </td>
                <td style={cellStyle}>
                  {store.status !== 'active' && (
                    <button onClick={() => handleUpdateStatus(store.id, 'active')} style={{...buttonStyle('green'), marginRight: '5px'}}>
                      Aktifkan
                    </button>
                  )}
                  {store.status === 'active' && (
                    <button onClick={() => handleUpdateStatus(store.id, 'inactive')} style={{...buttonStyle('red'), marginRight: '5px'}}>
                      Nonaktifkan
                    </button>
                  )}
                  <button onClick={() => handleExtendTrial(store.id, store.expiryDate)} style={buttonStyle('blue')}>
                    Perpanjang
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- CSS ---
const cellStyle = {
  border: '1px solid #ccc',
  padding: '10px',
  textAlign: 'left'
};
const buttonStyle = (color) => ({
  backgroundColor: color,
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '4px',
  cursor: 'pointer'
});

const logoutButtonStyle = {
  background: '#dc3545', // Warna merah
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.9em',
  padding: '8px 15px',
  borderRadius: '4px',
  marginTop: '5px', // Beri sedikit jarak
  marginBottom: '20px'
};

export default SuperAdminDashboard;