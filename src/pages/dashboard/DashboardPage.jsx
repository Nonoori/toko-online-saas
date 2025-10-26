// src/pages/dashboard/DashboardPage.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebaseConfig'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'; 
import styles from './DashboardPage.module.css'; 

function DashboardPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [storeData, setStoreData] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true); // Tetap true di awal

  useEffect(() => {
    const fetchStoreData = async (storeId) => {
      try {
        const storeDocRef = doc(db, "stores", storeId);
        const docSnap = await getDoc(storeDocRef);

        if (docSnap.exists()) {
          setStoreData(docSnap.data());
        } else {
          console.error("Data toko tidak ditemukan!");
        }
      } catch (err) {
        console.error("Error mengambil data toko:", err);
      }
      // Set loading ke false SETELAH selesai (baik berhasil atau gagal)
      setLoadingStore(false); 
    };

    // Ini adalah logika yang diperbaiki:
    if (currentUser && currentUser.storeId) {
      // Jika user ada DAN punya storeId, ambil datanya
      fetchStoreData(currentUser.storeId);
    } else if (currentUser) {
      // Jika user ada TAPI TIDAK punya storeId (kasus akun lama),
      // kita tidak perlu fetch apa-apa, langsung set loading ke false.
      setLoadingStore(false);
    }
    // Jika !currentUser, ProtectedRoute akan mengurusnya
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Tampilkan loading HANYA jika currentUser ada DAN kita sedang loading
  if (!currentUser || loadingStore) {
return <div className={styles.dashboardContainer}>Memuat data dashboard...</div>;
  }

  // Render halaman utama
  return (
<div className={styles.dashboardContainer}>
{/* Header */}
      <div className={styles.header}>
        <h1>
          Dashboard Admin: {storeData?.namaToko || 'Toko Anda'}
        </h1>
      </div>

      {/* Info User */}
      <div className={styles.userInfo}>
        {currentUser && (
          <>
            <p>Anda login sebagai: <strong>{currentUser.email}</strong></p>
            <p>Peran Anda: <strong>{currentUser.role}</strong></p>
            <p>ID Toko Anda: <strong>{currentUser.storeId}</strong></p>
            <Link
              to={`/toko/${currentUser.storeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.etalaseLink} // <-- Gunakan class
            >
              Lihat Etalase Publik Toko Anda &rarr;
            </Link>
          </>
        )}
      </div>

      {/* Navigasi Dashboard */}
      <nav className={styles.navigation}> {/* <-- Gunakan class */}
        <ul className={styles.navList}> {/* <-- Gunakan class */}
          <li><Link to="/dashboard" className={styles.navLink}>Home</Link></li>
          <li><Link to="/dashboard/produk" className={styles.navLink}>Manajemen Produk</Link></li>
          <li><Link to="/dashboard/pengaturan" className={styles.navLink}>Pengaturan Toko</Link></li>
          <li><Link to="/dashboard/pesanan" className={styles.navLink}>Pesanan Masuk</Link></li>
          <li><Link to="/dashboard/laporan" className={styles.navLink}>Laporan Keuangan</Link></li>
          <li><Link to="/dashboard/ongkir" className={styles.navLink}>Pengaturan Ongkir</Link></li>


          {/* Tambahkan link menu lain di sini */}
        </ul>
        <ul className={styles.navList}> {/* <-- Gunakan class */}
          <li><Link to="/dashboard" className={styles.navLink}>Home</Link></li>
          <li><Link to="/dashboard/produk" className={styles.navLink}>Manajemen Produk</Link></li>
          <li><Link to="/dashboard/pengaturan" className={styles.navLink}>Pengaturan Toko</Link></li>
          <li><Link to="/dashboard/pesanan" className={styles.navLink}>Pesanan Masuk</Link></li>
          <li><Link to="/dashboard/laporan" className={styles.navLink}>Laporan Keuangan</Link></li>
          <li><Link to="/dashboard/ongkir" className={styles.navLink}>Pengaturan Ongkir</Link></li>

          
          {/* Tambahkan link menu lain di sini */}
        </ul>
      </nav>

      {/* Tombol Logout */}
      <button
        onClick={handleLogout}
        className={styles.logoutButton} // <-- Gunakan class
      >
        Logout
      </button>

      {/* Konten dashboard lainnya bisa ditambahkan di sini */}


    </div>
  );
}

// Hapus definisi const linkStyle jika masih ada

export default DashboardPage;




