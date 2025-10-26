// src/pages/store/StoreFrontPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // <-- 1. Impor useNavigate
import { db } from '../../firebaseConfig';
import { 
  doc, getDoc, collection, query, where, getDocs 
} from 'firebase/firestore';
import { formatRupiah } from '../../utils/formatRupiah';
import { useCart } from '../../context/CartContext'; // <-- 2. Impor useCart lengkap
//import { useAuth } from '../../context/AuthContext'; // <-- 2. Impor Auth

function StoreFrontPage() {
  const { storeId } = useParams(); 
  const navigate = useNavigate(); // <-- 3. Panggil hook navigasi
  const location = useLocation(); // <-- 3. Untuk mengingat halaman ini

  // 4. Ambil data lengkap dari keranjang
  const { cartItems, currentStoreId, clearCart, addToCart } = useCart();

  const [storeInfo, setStoreInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // --- 5. LOGIKA BARU: Cek Konflik Keranjang ---
    // Cek jika:
    // 1. Ada storeId di keranjang (currentStoreId != null)
    // 2. storeId di keranjang BERBEDA dgn storeId di URL
    // 3. Keranjang TIDAK kosong
    if (currentStoreId && currentStoreId !== storeId && cartItems.length > 0) {
      
      // Tampilkan konfirmasi
      if (window.confirm(
        "Anda memiliki item dari toko lain di keranjang.\n\n" +
        "Pindah ke toko ini akan mengosongkan keranjang Anda. Lanjutkan?"
      )) {
        // Jika "OK", kosongkan keranjang
        clearCart();
        // (useEffect akan lanjut menjalankan sisa kodenya)
      } else {
        // Jika "Cancel", kembalikan user ke halaman sebelumnya
        navigate(-1); // -1 berarti "kembali"
        return; // Hentikan eksekusi useEffect ini
      }
    }
    // --- Akhir Logika Baru ---


    // Sisa logika pengambilan data (fetchData)
    if (!storeId) {
      setLoading(false);
      setError("ID Toko tidak ditemukan.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // ... (Logika getDoc storeInfo & getDocs products tetap sama) ...
        const storeDocRef = doc(db, "stores", storeId);
        const storeDocSnap = await getDoc(storeDocRef);

        if (!storeDocSnap.exists()) {
          setLoading(false);
          setError("Toko ini tidak (lagi) ada.");
          return;
        }
        setStoreInfo(storeDocSnap.data());

        const productsQuery = query(
          collection(db, "products"),
          where("storeId", "==", storeId)
        );
        const productsSnapshot = await getDocs(productsQuery);
        
        const productsData = [];
        productsSnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() });
        });
        setProducts(productsData);

      } catch (err) {
        console.error("Error fetching store data:", err);
        setError("Gagal memuat data toko.");
      }
      setLoading(false);
    };

    fetchData();
    
  // 6. Tambahkan dependensi baru ke useEffect
  }, [storeId, currentStoreId, cartItems, clearCart, navigate]); 

  // --- 5. Buat fungsi handle klik keranjang ---
  const handleAddToCartClick = (product) => {
    if (currentUser && currentUser.role === 'customer') {
      // KASUS 1: Dia adalah Pelanggan
      addToCart(product);
    } else {
      // KASUS 2: Dia adalah Tamu (atau Admin)
      // Kita paksa dia ke halaman login
      navigate('/login', { 
        state: { 
          // Kirim pesan & halaman asal
          message: "Silakan login sebagai pelanggan untuk mulai berbelanja.",
          from: location 
        } 
      });
    }
  };
  
  //  (Tampilan UI tidak berubah) 
  
  if (loading) {
    return <div style={{ padding: '20px' }}>Memuat toko...</div>;
  }
  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }
  if (!storeInfo) {
    return <div style={{ padding: '20px' }}>Toko tidak ditemukan.</div>;
  }



  // --- Ambil Warna Tema ---
  const themeColor = storeInfo.themeColor || '#007bff'; // Ambil warna, atau pakai default

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
        

        {/* --- TAMBAHKAN LOGO DI SINI --- */}
        {storeInfo.logoUrl && (
          <img 
            src={storeInfo.logoUrl} 
            alt={storeInfo.namaToko}
            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '50%', margin: '0 auto 15px' }}
          />
        )}
        {/* ----------------------------- */}


        <h1 style={{ color: themeColor }}> {/* <-- 1. Terapkan di Judul */}
          Selamat Datang di {storeInfo.namaToko}</h1>
        <p>Lihat koleksi produk kami di bawah ini!</p>
      </div>

      <h2>Produk Kami</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {products.length === 0 ? (
          <p>Toko ini belum memiliki produk.</p>
        ) : (
          products.map((product) => (
            <div key={product.id} style={productCardStyle}>
              <div style={productCardContentStyle}>
                <h3>{product.namaProduk}</h3>
                <p style={{ color: '#666', fontSize: '0.9em' }}>
                  {product.deskripsi || "Tidak ada deskripsi."}
                </p>
                <div style={productCardFooterStyle}>
                  <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                    {formatRupiah(product.harga)}
                  </span>
                  <span style={{ fontSize: '0.9em', color: product.stok > 0 ? 'green' : 'red' }}>
                    Stok: {product.stok}
                  </span>
                </div>
                {product.stok > 0 ? (
                  <button 
                    style={buttonStyle('blue')} 
                    onClick={() => addToCart(product)} // <-- Panggil addToCart di sini
                  >
                    + Keranjang
                  </button>
                ) : (
                  <button style={{...buttonStyle('grey'), cursor: 'not-allowed'}} disabled>Stok Habis</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- (CSS INLINE tetap sama) ---
const productCardStyle = { border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const productCardContentStyle = { padding: '15px', flexGrow: 1, display: 'flex', flexDirection: 'column' };
const productCardFooterStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', marginBottom: '15px' };
const buttonStyle = (color) => ({ width: '100%', padding: '10px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1em' });

export default StoreFrontPage;