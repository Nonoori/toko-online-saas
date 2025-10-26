// src/pages/order/OrderDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { formatRupiah } from '../../utils/formatRupiah';

// Status aktif dimana tombol WA muncul
const ACTIVE_STATUSES = ['Pending', 'Harus Dibayar', 'Sudah Dibayar', 'Processing', 'Shipped', 'Complain'];

function OrderDetailPage() {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null); // State untuk info toko (termasuk WA)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ambil data pesanan DAN data toko
  useEffect(() => {
    if (!currentUser || !orderId) return;

    const fetchOrderAndStore = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Ambil data pesanan
        const orderDocRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderDocRef);

        if (!orderSnap.exists()) {
          setError("Pesanan tidak ditemukan."); setLoading(false); return;
        }

        const orderData = { id: orderSnap.id, ...orderSnap.data() };

        // Verifikasi izin
        if (orderData.customerId !== currentUser.uid) {
          setError("Akses ditolak."); setLoading(false); return;
        }
        setOrder(orderData);

        // 2. Ambil data toko (untuk nomor WA)
        if (orderData.storeId) {
          const storeDocRef = doc(db, "stores", orderData.storeId);
          const storeSnap = await getDoc(storeDocRef);
          if (storeSnap.exists()) {
            setStoreInfo(storeSnap.data());
          } else {
             console.warn("Info toko untuk pesanan ini tidak ditemukan.");
             // Tombol WA tidak akan berfungsi tanpa nomor
          }
        }

      } catch (err) {
        setError("Gagal memuat detail pesanan."); console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderAndStore();
  }, [currentUser, orderId]);


 // Fungsi untuk membuka chat WA ke admin
  const handleContactAdmin = () => {
    if (!storeInfo || !storeInfo.waNumber) {
      alert("Nomor WhatsApp admin toko ini tidak tersedia.");
      return;
    }
    if (!order) return;

    // Format pesan
    let message = `Halo Admin ${storeInfo.namaToko || ''},\n\n`;
    message += `Saya ingin bertanya mengenai pesanan saya dengan ID: *${order.id}*\n\n`;
    message += `Detail Pesanan:\n`;
    order.items.forEach(item => {
        message += `- ${item.namaProduk} (Qty: ${item.quantity})\n`;
    });
    message += `Total: ${formatRupiah(order.totalPrice)}\n`;
    message += `Status Saat Ini: ${order.status}\n\n`;
    message += `Mohon informasinya. Terima kasih.`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${storeInfo.waNumber}?text=${encodedMessage}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };


  // Fungsi untuk membuka faktur di tab baru
  const openInvoice = () => {
    window.open(`/faktur/${orderId}`, '_blank', 'noopener,noreferrer');
  };

  // --- Tampilan ---
  if (loading) return <div style={pageStyle}>Memuat detail pesanan...</div>;
  if (error) return <div style={{ ...pageStyle, color: 'red' }}>Error: {error}</div>;
  if (!order) return <div style={pageStyle}>Pesanan tidak ditemukan.</div>;

  const canContactAdmin = ACTIVE_STATUSES.includes(order.status);


  // Tampilan Detail (mirip screenshot Anda)
  return (
    <div style={pageStyle}>
      <Link to="/profil">&larr; Kembali ke Riwayat Pesanan</Link>
      <h1>Rincian Pesanan</h1>
      <p style={statusStyle(order.status)}>{order.status.toUpperCase()}</p>

      {/* --- Info Pengiriman (Contoh) --- */}
      <section style={sectionStyle}>
        <h2>Info Pengiriman</h2>
        {/* Kita ambil dari profil user, atau minta input saat checkout nanti */}
        <p><strong>Alamat:</strong> {currentUser?.alamat || "Belum diatur"}</p>
        <p><strong>Penerima:</strong> {currentUser?.namaLengkap || currentUser?.email}</p>
        <p><strong>No. HP:</strong> {currentUser?.wa || "Belum diatur"}</p>
        {/* Tambahkan info kurir/resi jika ada */}
      </section>

      {/* --- Rincian Item Pesanan --- */}
      <section style={sectionStyle}>
        <h2>Rincian Pesanan</h2>
        {order.items.map(item => (
          <div key={item.id} style={itemStyle}>
            <div>
              <strong>{item.namaProduk}</strong> <br />
              <small>Qty: {item.quantity}</small>
            </div>
            <span>{formatRupiah(item.harga * item.quantity)}</span>
          </div>
        ))}
      </section>

       {/* --- Rincian Pembayaran --- */}
       <section style={sectionStyle}>
         <h2>Rincian Pembayaran</h2>
         <div style={paymentDetailStyle}><span>Subtotal Produk</span> <span>{formatRupiah(order.totalPrice)}</span></div>
         {/* Tambahkan biaya lain jika ada */}
         {/* <div style={paymentDetailStyle}><span>Biaya Pengiriman</span> <span>Rp 29.000</span></div> */}
         {/* <div style={paymentDetailStyle}><span>Diskon</span> <span>- Rp 20.000</span></div> */}
         <hr/>
         <div style={{...paymentDetailStyle, fontWeight: 'bold', fontSize: '1.2em'}}>
           <span>Total Pembayaran</span>
           <span>{formatRupiah(order.totalPrice)}</span> {/* Sesuaikan jika ada biaya lain */}
         </div>
       </section>

{/* --- Tombol Aksi --- */}
       <div style={{ marginTop: '20px' }}>
         {/* Tombol WA (kondisional) */}
         {canContactAdmin && storeInfo?.waNumber && (
           <button onClick={handleContactAdmin} style={{...buttonStyle('green'), marginRight: '10px'}}>
             Hubungi Admin Toko (WA)
           </button>
         )}


       {/* --- Tombol Faktur (jika selesai) --- */}
       {order.status === 'Completed' && (
         <button onClick={openInvoice} style={buttonStyle('blue')}>
           Lihat Nota Pesanan / Faktur
         </button>
       )}
       </div>
    </div>
  );
}

// --- CSS Inline ---
const pageStyle = { padding: '20px', maxWidth: '800px', margin: 'auto' };
const sectionStyle = { marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' };
const itemStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #eee' };
const paymentDetailStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' };
const buttonStyle = (color) => ({ padding: '10px 15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1em', marginTop: '10px' });
const statusStyle = (status) => ({
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '4px',
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: status === 'Completed' ? 'green' : (status === 'Cancelled' ? 'red' : 'orange'),
    marginBottom: '20px'
});


export default OrderDetailPage;