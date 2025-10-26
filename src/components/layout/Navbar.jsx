// src/components/layout/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useParams, useMatch } from 'react-router-dom';
import { useCart } from '../../context/CartContext'; // Butuh currentStoreId
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

function Navbar() {
  const { itemCount, currentStoreId } = useCart(); // Ambil currentStoreId dari keranjang
  const { currentUser } = useAuth();
  const { storeId: urlStoreId } = useParams(); // Ambil storeId dari URL jika ada, rename ke urlStoreId
  const matchRootRoute = useMatch('/'); // Cek jika kita di halaman root '/'

  // Tentukan ID toko mana yang relevan untuk ditampilkan di branding
  // Prioritas 1: ID dari URL (jika di halaman /toko/...)
  // Prioritas 2: ID dari keranjang (toko terakhir yang relevan)
  const relevantStoreId = urlStoreId || currentStoreId;

  const [storeInfo, setStoreInfo] = useState({ logo: null, name: null });
  const [loadingStoreInfo, setLoadingStoreInfo] = useState(false);

  // useEffect untuk ambil info toko berdasarkan relevantStoreId
  useEffect(() => {
    setStoreInfo({ logo: null, name: null }); // Reset dulu
    // Hanya fetch jika ada ID toko yang relevan DAN kita tidak di halaman root
    if (relevantStoreId && !matchRootRoute) {
      setLoadingStoreInfo(true);
      const fetchStoreInfo = async () => {
        try {
          const storeDocRef = doc(db, "stores", relevantStoreId);
          const docSnap = await getDoc(storeDocRef);
          if (docSnap.exists()) {
            setStoreInfo({
              logo: docSnap.data().logoUrl,
              name: docSnap.data().namaToko
            });
          }
        } catch (error) { console.error(error); }
        finally { setLoadingStoreInfo(false); }
      };
      fetchStoreInfo();
    } else {
      setLoadingStoreInfo(false); // Tidak perlu fetch, pastikan loading selesai
    }
  // Jalankan ulang jika ID toko relevan berubah atau kita pindah ke/dari root
  }, [relevantStoreId, matchRootRoute]);

  // --- Logika Branding Dinamis BARU ---
  let brandLink = "/"; // Default: SuperAdmin LP
  let brandContent = "TokoSaaS"; // Default: SuperAdmin Brand

  // Kondisi 1: JIKA BUKAN di halaman root DAN ada info toko yang relevan...
  if (!matchRootRoute && !loadingStoreInfo && storeInfo.name && relevantStoreId) {
      brandLink = `/toko/${relevantStoreId}`; // Link ke toko terakhir/saat ini
      if (storeInfo.logo) {
          brandContent = <img src={storeInfo.logo} alt={storeInfo.name} style={brandImageStyle} />;
      } else {
          brandContent = storeInfo.name;
      }
  }
  // Kondisi 2: JIKA di halaman root ATAU tidak ada info toko relevan,
  // biarkan menggunakan nilai default ("TokoSaaS" link ke "/")
  // --- Akhir Logika Branding ---

// 5. Add Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  return (
    <nav style={navStyle}>
      <Link to={brandLink} style={brandStyle}>
        {/* Tampilkan loading hanya jika relevan */}
        {!matchRootRoute && loadingStoreInfo ? '...' : brandContent}
      </Link>

      
      {/* Right-side Links */}
      <div style={linksContainerStyle}>
        {/* Cart Link */}
        {(!currentUser || currentUser.role === 'customer') && (
          <Link to="/keranjang" style={linkStyle}> Keranjang ({itemCount}) </Link>
        )}

      {/* Links for Logged-in Users */}
        {currentUser ? (
          <>
            {currentUser.role === 'customer' && ( <Link to="/profil" style={linkStyle}>Profil</Link> )}
            {currentUser.role === 'storeAdmin' && ( <Link to="/dashboard" style={linkStyle}>Dashboard Toko</Link> )}
            {currentUser.role === 'superAdmin' && ( <Link to="/superadmin" style={linkStyle}>Dashboard SuperAdmin</Link> )}
            {/* 6. Add Logout Button */}
            <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
          </>
        ) : (
          // Link for Guests
          <Link to="/login" style={linkStyle}> Login / Daftar </Link>
        )}
      </div>
    </nav>
  );
}


// --- CSS ---
const logoutButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#aaa', // Slightly dimmer color
  cursor: 'pointer',
  fontSize: '1em', // Adjust size as needed
  marginLeft: '10px', // Add some space from other links
  padding: '0', // Remove default button padding
};
const navStyle = { backgroundColor: '#333', color: 'white', padding: '10px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px' }; // Set height
const linksContainerStyle = { display: 'flex', gap: '20px', alignItems: 'center' };
const brandStyle = { color: 'white', textDecoration: 'none', fontSize: '1.5em', fontWeight: 'bold', display: 'flex', alignItems: 'center', height: '100%' };
const brandImageStyle = { height: '40px', maxHeight: '40px', objectFit: 'contain' }; // Style for logo image
const linkStyle = { color: 'white', textDecoration: 'none', fontSize: '1.2em' };

export default Navbar;