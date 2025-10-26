// src/pages/dashboard/AdminOrderDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { formatRupiah } from '../../utils/formatRupiah';

function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pemeriksaan awal (tidak berubah)
    if (!currentUser || !currentUser.storeId || !orderId) {
      setError("Informasi tidak lengkap untuk memuat pesanan.");
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');
      setOrder(null);
      setCustomerInfo(null);
      let fetchedOrderData = null; // Variabel sementara untuk data order

      // --- Blok TRY Diperbarui ---
      try {
        // 1. Ambil data pesanan
        console.log(`[DEBUG] AdminOrderDetailPage: Mencoba getDoc untuk /orders/${orderId}`);
        const orderDocRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderDocRef);
        console.log("[DEBUG] AdminOrderDetailPage: getDoc(order) selesai."); // Konfirmasi getDoc selesai

        if (orderSnap.exists()) {
          fetchedOrderData = { id: orderSnap.id, ...orderSnap.data() }; // Simpan data sementara
          console.log("[DEBUG] AdminOrderDetailPage: Data Order Ditemukan:", fetchedOrderData);

          // 2. Verifikasi Kepemilikan Toko
          console.log(`[DEBUG] AdminOrderDetailPage: Cek Keamanan - Order StoreID: ${fetchedOrderData.storeId}, Admin StoreID: ${currentUser.storeId}`);
          if (fetchedOrderData.storeId === currentUser.storeId) {
            console.log("[DEBUG] AdminOrderDetailPage: Keamanan Toko Lolos.");
            setOrder(fetchedOrderData); // Set state order HANYA jika lolos

            // 3. Ambil data pelanggan (hanya jika order berhasil diambil & diverifikasi)
            if (fetchedOrderData.customerId) {
              console.log(`[DEBUG] AdminOrderDetailPage: Mencoba getDoc untuk /users/${fetchedOrderData.customerId}`);
              const customerDocRef = doc(db, "users", fetchedOrderData.customerId);
              const customerSnap = await getDoc(customerDocRef);
              console.log("[DEBUG] AdminOrderDetailPage: getDoc(customer) selesai.");

              if (customerSnap.exists()) {
                 console.log("[DEBUG] AdminOrderDetailPage: Data Pelanggan Ditemukan:", customerSnap.data());
                setCustomerInfo(customerSnap.data());
              } else {
                console.warn("[DEBUG] AdminOrderDetailPage: Profil pelanggan tidak ditemukan:", fetchedOrderData.customerId);
              }
            } else {
                 console.log("[DEBUG] AdminOrderDetailPage: Tidak ada customerId di data order.");
            }
          } else {
            // StoreId tidak cocok
            console.error("[DEBUG] AdminOrderDetailPage: Keamanan Toko GAGAL! Store ID tidak cocok.");
            setError("Anda tidak punya izin melihat pesanan ini (Store ID tidak cocok).");
          }
        } else {
          // Pesanan tidak ditemukan
          console.warn(`[DEBUG] AdminOrderDetailPage: Dokumen pesanan /orders/${orderId} tidak ditemukan.`);
          setError("Pesanan tidak ditemukan.");
        }

      // --- Blok CATCH Diperbarui ---
      } catch (err) {
        console.error("--- !!! ERROR KRITIS saat Fetch Order Details !!! ---");
        console.error("[DEBUG] Error Object:", err);
        console.error(`[DEBUG] Pesan Error: ${err.message}`);
        console.error(`[DEBUG] Kode Error: ${err.code}`);
        console.error("[DEBUG] Detail Permintaan:");
        console.error(`  - Mencoba akses: /orders/${orderId}`);
        console.error(`  - Sebagai User (UID): ${currentUser?.uid}`);
        console.error(`  - Dengan Peran (Role): ${currentUser?.role}`);
        console.error(`  - Dengan Store ID: ${currentUser?.storeId}`);
        console.error("-----------------------------------------------------");

        if (err.code === 'permission-denied' || err.message.includes('permission')) {
             setError("Gagal memuat detail pesanan: IZIN DITOLAK. Periksa Security Rules Firestore Anda (allow get untuk /orders/{orderId}).");
        } else {
             setError(`Gagal memuat detail pesanan: Terjadi kesalahan (${err.code || 'unknown'}). ${err.message}`);
        }
        // Pastikan state di-reset jika terjadi error
        setOrder(null);
        setCustomerInfo(null);
      } finally {
        console.log("[DEBUG] AdminOrderDetailPage: fetchOrderDetails selesai. Loading: false.");
        setLoading(false);
      }
    }; // Akhir fetchOrderDetails

    fetchOrderDetails();

  }, [currentUser, orderId]); // Jalankan ulang jika user atau orderId berubah

  // Tampilan Loading
  if (loading) {
    return <div style={pageStyle}>Memuat detail pesanan...</div>;
  }

  // Tampilan Error
  if (error) {
    return (
      <div style={pageStyle}>
        <Link to="/dashboard/pesanan">&larr; Kembali ke Daftar Pesanan</Link>
        <h1 style={{ color: 'red' }}>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Tampilan Pesanan Tidak Ditemukan (jika getDoc berhasil tapi data null)
  if (!order) {
     return (
       <div style={pageStyle}>
         <Link to="/dashboard/pesanan">&larr; Kembali ke Daftar Pesanan</Link>
         <h1>Pesanan Tidak Ditemukan</h1>
       </div>
     );
  }

  // Tampilan Detail Pesanan (jika semua berhasil)
  const orderDate = order.createdAt?.toDate();
  return (
    <div style={pageStyle}>
      <Link to="/dashboard/pesanan">&larr; Kembali ke Daftar Pesanan</Link>
      <h1>Detail Pesanan</h1>
      <p style={statusStyle(order.status)}>STATUS: {order.status.toUpperCase()}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9em', color: '#555' }}>
        <span><strong>ID:</strong> {order.id}</span>
        <span><strong>Tanggal:</strong> {orderDate?.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) || '-'}</span>
      </div>

      {/* Info Pelanggan */}
      <section style={sectionStyle}>
        <h2>Info Pelanggan</h2>
        <p><strong>Email:</strong> {order.customerEmail || '-'}</p>
        <p><strong>Nama:</strong> {customerInfo?.namaLengkap || '(Tidak ada info profil)'}</p>
        <p><strong>No. WA:</strong> {customerInfo?.wa || '(Tidak ada info profil)'}</p>
        <p><strong>Alamat Kirim:</strong> {customerInfo?.alamat || '(Tidak ada info profil)'}</p>
      </section>

      {/* Item Pesanan */}
      <section style={sectionStyle}>
        <h2>Item Pesanan</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4' }}>
              <th style={cellStyle}>Produk</th>
              <th style={cellStyle}>Qty</th>
              <th style={cellStyle}>Harga Satuan</th>
              <th style={cellStyle}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id || index}>
                <td style={cellStyle}>{item.namaProduk}</td>
                <td style={cellStyle}>{item.quantity}</td>
                <td style={cellStyle}>{formatRupiah(item.harga)}</td>
                <td style={cellStyle}>{formatRupiah(item.harga * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Total */}
      <section style={{ textAlign: 'right' }}>
        <h3>Total Pesanan: {formatRupiah(order.totalPrice)}</h3>
      </section>

      {/* Tambahkan Aksi lain jika perlu, misal tombol ubah status */}

    </div>
  );
}

// --- CSS Sederhana ---
const pageStyle = { padding: '20px', maxWidth: '900px', margin: 'auto' };
const sectionStyle = { marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' };
const cellStyle = { border: '1px solid #ccc', padding: '8px', textAlign: 'left', fontSize: '0.9em' };
const statusStyle = (status) => ({
    display: 'inline-block', padding: '5px 10px', borderRadius: '4px', color: 'white', fontWeight: 'bold',
    backgroundColor: status === 'Completed' ? 'green' : (status === 'Cancelled' ? 'red' : (status === 'Pending' ? 'grey' : 'orange')), // Contoh warna
    marginBottom: '20px'
});

export default AdminOrderDetailPage;