// src/pages/superadmin/SuperAdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  Timestamp // Impor Timestamp untuk update tanggal
} from 'firebase/firestore';

function SuperAdminDashboard() {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Ambil SEMUA toko dari koleksi 'stores'
  useEffect(() => {
    setLoading(true);
    // Kita ambil semua dari koleksi 'stores'
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

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // 2. Fungsi untuk mengubah status toko
  const handleUpdateStatus = async (storeId, newStatus) => {
    if (!window.confirm(`Anda yakin ingin mengubah status toko ini menjadi "${newStatus}"?`)) {
      return;
    }
    
    const storeDocRef = doc(db, "stores", storeId);
    try {
      // Security Rules akan mengecek (isSuperAdmin() == true) di sini
      await updateDoc(storeDocRef, {
        status: newStatus
      });
      alert("Status berhasil diperbarui!");
    } catch (err) {
      console.error("Gagal update status: ", err);
      alert("Error: " + err.message);
    }
  };

  // 3. Fungsi untuk memperpanjang trial (Contoh: +30 hari)
  const handleExtendTrial = async (storeId, currentExpiryDate) => {
    const daysToAdd = 30; // Atau ambil dari input
    
    // Konversi Timestamp Firestore ke Date JS, atau gunakan Date.now() jika tidak ada
    const startDate = currentExpiryDate ? currentExpiryDate.toDate() : new Date();
    const newExpiryDate = new Date(startDate.setDate(startDate.getDate() + daysToAdd));

    if (!window.confirm(`Perpanjang trial toko ini hingga ${newExpiryDate.toLocaleDateString()}?`)) {
      return;
    }
    
    const storeDocRef = doc(db, "stores", storeId);
    try {
      await updateDoc(storeDocRef, {
        expiryDate: Timestamp.fromDate(newExpiryDate) // Kirim kembali sebagai Timestamp
      });
      alert("Trial berhasil diperpanjang!");
    } catch (err) {
      console.error("Gagal perpanjang trial: ", err);
      alert("Error: " + err.message);
    }
  };


  if (loading) {
    return <div style={{padding: '20px'}}>Memuat data...</div>;
  }
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard Super Admin</h1>
      <p>Selamat datang, **{currentUser.email}**. Anda mengelola {stores.length} toko.</p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
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

export default SuperAdminDashboard;