// src/pages/cart/CartPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext'; // Pastikan ini diimpor
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../utils/formatRupiah';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

function CartPage() {
  // Pastikan currentStoreId diambil dari useCart di sini
  const { cartItems, removeFromCart, updateQuantity, clearCart, currentStoreId } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [storeWaNumber, setStoreWaNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeInfoError, setStoreInfoError] = useState('');

  // --- useEffect (Tidak berubah, sudah benar) ---
  useEffect(() => {
    setStoreWaNumber('');
    setStoreInfoError('');
    if (currentStoreId) {
      const fetchStoreInfo = async () => {
        try {
          const storeDocRef = doc(db, "stores", currentStoreId);
          const docSnap = await getDoc(storeDocRef);
          if (docSnap.exists()) {
            const storeData = docSnap.data();
            if (storeData && storeData.waNumber && storeData.waNumber.trim() !== '') {
              setStoreWaNumber(storeData.waNumber);
            } else {
              setStoreInfoError("Nomor WhatsApp admin untuk toko ini belum diatur.");
            }
          } else {
            setStoreInfoError("Data toko tidak ditemukan.");
          }
        } catch (error) {
           setStoreInfoError("Gagal mengambil data toko.");
           console.error("CartPage useEffect: Error mengambil data toko:", error);
        }
      };
      fetchStoreInfo();
    }
  }, [currentStoreId]);  // useEffect

  // --- Hitung total harga (Tidak berubah) ---
  const totalPrice = cartItems.reduce((total, item) => {
    return total + (item.harga * item.quantity);
  }, 0);

  // --- Fungsi handleCheckout (DIPERBAIKI) ---
  const handleCheckout = async () => { // Jadikan async
    console.log("Memulai checkout. User saat ini (dari Context):", currentUser);
    // Cek jika user sudah login
    if (!currentUser) {
      navigate('/login', { state: { from: location, message: "Anda harus login sebagai pelanggan untuk menyelesaikan pesanan." } });
      return;
    }

    // Cek jika dia adalah 'customer'
    if (currentUser.role !== 'customer') {
      alert("Hanya pelanggan yang bisa melakukan checkout. Akun Anda adalah " + currentUser.role);
      return;
    }

    // Cek nomor WA
    if (!storeWaNumber) {
      alert("Maaf, nomor admin toko ini tidak tersedia. Tidak dapat melanjutkan pesanan.");
      return;
    }

    setLoading(true); // Mulai loading

    // --- Mulai blok Try ---
    try {
      // Buat Objek Pesanan
      const orderData = {
        customerId: currentUser.uid,
        customerEmail: currentUser.email,
        storeId: currentStoreId,
        items: cartItems.map(item => ({ // Simpan data relevan saja
          id: item.id,
          namaProduk: item.namaProduk,
          harga: item.harga,
          quantity: item.quantity
        })),
        totalPrice: totalPrice,
        status: "Pending",
        createdAt: serverTimestamp(),
      };

      // --- TAMBAHKAN LOGGING DI SINI ---
      console.log("Mencoba menyimpan pesanan:", orderData);
      //console.log("ID User saat ini (Auth):", auth.currentUser?.uid); // Cek ID Auth langsung
      console.log("Role User saat ini (Context):", currentUser?.role); // Cek Role
      // ------------------------------------

      // Simpan ke Firestore
      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("Pesanan berhasil disimpan dengan ID: ", docRef.id);

      // --- Format Pesan Teks (Setelah simpan berhasil) ---
      let message = `*PESANAN BARU (ID: ${docRef.id})*\n\n`;
      message += "Halo Admin,\nSaya ingin memesan barang berikut:\n\n";
      cartItems.forEach(item => {
        message += `*${item.namaProduk}*\n`;
        message += `Qty: ${item.quantity}\n`;
        message += `Harga: ${formatRupiah(item.harga * item.quantity)}\n`;
        message += `------------------------\n`;
      });
      message += `*TOTAL PESANAN: ${formatRupiah(totalPrice)}*\n\n`;
      message += `Email Pelanggan: ${currentUser.email}\n`;
      message += "Mohon konfirmasi ketersediaan dan totalnya.\nTerima kasih.";

      // Encode & Buat link WA
      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${storeWaNumber}?text=${encodedMessage}`;


      // --- TAMBAHKAN LOG INI ---
      console.log("Mencoba membuka URL WA:", waUrl); 
      // --------------------------

      // Buka di tab baru
      window.open(waUrl, '_blank');

      // Kosongkan keranjang & arahkan
      clearCart();
      setLoading(false); // Selesai loading (sukses)
      navigate('/profil', { state: { orderId: docRef.id } }); // Kirim ID Pesanan
      alert("Pesanan berhasil dikirim ke Admin! Anda akan diarahkan ke halaman profil.");

    // --- Tutup blok Try, mulai Catch ---
    } catch (err) {
      console.error("Gagal menyimpan atau memproses pesanan: ", err);
      alert("Terjadi kesalahan saat checkout: " + err.message);
      setLoading(false); // Selesai loading (gagal)
    }// --- Tutup blok Catch ---
  }; // --- Tutup fungsi handleCheckout ---

  // --- Tampilan (UI) ---
  if (cartItems.length === 0) {
    // Tentukan tujuan link:
    // Jika ada currentStoreId, kembali ke toko itu.
    // Jika tidak ada (misal baru buka web), kembali ke home.
    const continueShoppingLink = currentStoreId ? `/toko/${currentStoreId}` : '/';
console.log("Keranjang kosong, link lanjut belanja:", continueShoppingLink); // Tambahkan log ini

    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Keranjang Anda Kosong</h2>
        {/* Gunakan link dinamis */}
        <Link to={continueShoppingLink}>Lanjut Belanja</Link>
      </div>
    );
  } //if (cartItems.length 

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <h1>Keranjang Belanja Anda</h1>
      {/* Tabel <tbody> tidak berubah */}
       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cellStyle}>Produk</th>
            <th style={cellStyle}>Harga</th>
            <th style={cellStyle}>Kuantitas</th>
            <th style={cellStyle}>Subtotal</th>
            <th style={cellStyle}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id}>
              <td style={cellStyle}>{item.namaProduk}</td>
              <td style={cellStyle}>{formatRupiah(item.harga)}</td>
              <td style={cellStyle}>
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  max={item.stok} // Pastikan stok ada di cartItems
                  onChange={(e) => updateQuantity(item.id, e.target.value)}
                  style={{ width: '60px', padding: '5px' }}
                />
              </td>
              <td style={cellStyle}>
                {formatRupiah(item.harga * item.quantity)}
              </td>
              <td style={cellStyle}>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>


      {/* Total Belanja & Tombol Checkout */}
      <div style={{ marginTop: '30px', textAlign: 'right' }}>
        <h2 style={{ margin: 0 }}>Total: {formatRupiah(totalPrice)}</h2>

        {storeInfoError && (
          <p style={{ color: 'red', fontSize: '0.9em' }}>
            {storeInfoError}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading || !!storeInfoError || !storeWaNumber} // Perbaiki disable logic
          style={checkoutButtonStyle}
        >
          {loading ? "Memproses..." :
           currentUser ? "Kirim Pesanan via WhatsApp" :
           "Login untuk Checkout"
          }
        </button>
      </div>
    </div>
  );
}

// --- CSS INLINE (Tidak berubah) ---
const cellStyle = {
  border: '1px solid #ccc',
  padding: '10px',
  textAlign: 'left'
};
const checkoutButtonStyle = {
  marginTop: '10px',
  padding: '12px 25px',
  fontSize: '1.1em',
  backgroundColor: 'green',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

export default CartPage;