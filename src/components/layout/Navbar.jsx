// src/components/layout/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useParams, useMatch } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

function Navbar() {
  const { itemCount, currentStoreId } = useCart(); // Ambil ID toko terakhir dari keranjang
  const { currentUser } = useAuth();
  const { storeId: urlStoreId } = useParams(); // Ambil ID toko dari URL (jika ada)
  const matchRootRoute = useMatch('/'); // Cek jika kita di halaman root '/'

  // Tentukan ID toko yang relevan: Prioritaskan URL, fallback ke CartContext
  const relevantStoreId = urlStoreId || currentStoreId;

  const [storeInfo, setStoreInfo] = useState({ logo: null, name: null });
  const [loadingStoreInfo, setLoadingStoreInfo] = useState(false);

  // useEffect untuk ambil info toko berdasarkan relevantStoreId
  useEffect(() => {
    setStoreInfo({ logo: null, name: null }); // Reset
    // Hanya fetch jika ada ID toko relevan DAN kita BUKAN di root
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
        } catch (error) { console.error("Error fetching store info:", error); }
        finally { setLoadingStoreInfo(false); }
      };
      fetchStoreInfo();
    } else {
      setLoadingStoreInfo(false); // Tidak fetch, pastikan loading false
    }
  }, [relevantStoreId, matchRootRoute]); // Dependensi

  // --- Logika Branding Dinamis BARU ---
  let brandLink = "/"; // Default ke SuperAdmin LP
  let brandContent = "TokoSaaS"; // Default brand SuperAdmin

  // Kondisi: JIKA TIDAK di root ('/') DAN ada ID toko yang relevan...
  if (!matchRootRoute && relevantStoreId) {
      brandLink = `/toko/${relevantStoreId}`; // Link selalu ke toko relevan
      // Tampilkan nama/logo jika sudah dimuat, jika tidak tampilkan loading/default
      if (loadingStoreInfo) {
          brandContent = '...'; // Indikator loading
      } else if (storeInfo.name) {
          brandContent = storeInfo.logo
              ? <img src={storeInfo.logo} alt={storeInfo.name} style={brandImageStyle} />
              : storeInfo.name;
      } else {
          // Fallback jika fetch gagal tapi ID ada (jarang terjadi)
          brandContent = 'Toko';
      }
  }
  // JIKA di root ('/'), gunakan default ("TokoSaaS" link ke "/")
  // --- Akhir Logika Branding ---


// 5. Add Logout Handler
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error("Error logging out:", err);
    }
  }


  return (
    <nav style={navStyle}>
      <Link to={brandLink} style={brandStyle}>
        {/* Tampilkan loading hanya jika relevan */}
        {/* !matchRootRoute && loadingStoreInfo ? '...' : brandContent */}
                {brandContent}
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