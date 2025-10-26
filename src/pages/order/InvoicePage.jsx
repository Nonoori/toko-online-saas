// src/pages/order/InvoicePage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { formatRupiah } from '../../utils/formatRupiah';

function InvoicePage() {
  const { orderId } = useParams();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null); // Untuk info toko (nama)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ambil data pesanan DAN data toko
  useEffect(() => {
    if (!currentUser || !orderId) return;

    const fetchInvoiceData = async () => {
      setLoading(true);
      setError('');
      try {
        // Ambil data pesanan
        const orderDocRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderDocRef);

        if (!orderSnap.exists()) {
          setError("Pesanan tidak ditemukan.");
          setLoading(false);
          return;
        }

        const orderData = { id: orderSnap.id, ...orderSnap.data() };

        // Verifikasi izin & status
        if (orderData.customerId !== currentUser.uid) {
          setError("Akses ditolak.");
          setLoading(false);
          return;
        }
        // Faktur idealnya hanya untuk pesanan selesai, tapi bisa fleksibel
        // if (orderData.status !== 'Completed') {
        //   setError("Faktur hanya tersedia untuk pesanan yang sudah selesai.");
        //   setLoading(false); return;
        // }
        setOrder(orderData);

        // Ambil data toko (untuk nama penjual)
        if (orderData.storeId) {
          const storeDocRef = doc(db, "stores", orderData.storeId);
          const storeSnap = await getDoc(storeDocRef);
          if (storeSnap.exists()) {
            setStoreInfo(storeSnap.data());
          }
        }

      } catch (err) {
        setError("Gagal memuat data faktur.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceData();
  }, [currentUser, orderId]);

  if (loading) return <div style={pageStyle}>Memuat faktur...</div>;
  if (error) return <div style={{ ...pageStyle, color: 'red' }}>Error: {error}</div>;
  if (!order) return <div style={pageStyle}>Data tidak ditemukan.</div>;

  const orderDate = order.createdAt?.toDate();

  return (
    <div style={pageStyle}>
      {/* Tombol Aksi */}
      <div style={{ marginBottom: '20px', textAlign: 'right', borderBottom: '1px solid #eee', paddingBottom: '10px' }} className="no-print">
        <button onClick={() => window.print()} style={{ marginRight: '10px', padding: '8px 12px' }}>Cetak</button>
        {/* <button style={{ padding: '8px 12px' }}>Kirim ke Email</button> */}
      </div>

      {/* Header Faktur */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h2>Nota Pesanan / Faktur</h2>
          <p><strong>No. Pesanan:</strong> {order.id}</p>
          <p><strong>Tanggal:</strong> {orderDate?.toLocaleDateString('id-ID') || '-'}</p>
        </div>
        <div>
          <p><strong>Penjual:</strong> {storeInfo?.namaToko || 'Toko'}</p>
          {/* Tambahkan alamat toko jika ada */}
        </div>
      </div>

      {/* Info Pembeli */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Informasi Pembeli</h3>
        <p><strong>Nama:</strong> {currentUser?.namaLengkap || currentUser?.email}</p>
        <p><strong>Email:</strong> {currentUser?.email}</p>
        <p><strong>Alamat:</strong> {currentUser?.alamat || "Belum diatur"}</p>
        <p><strong>No. HP:</strong> {currentUser?.wa || "Belum diatur"}</p>
      </div>

      {/* Rincian Item */}
      <h3>Rincian Pesanan</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th style={cellStyle}>Nama Produk</th>
            <th style={cellStyle}>Kuantitas</th>
            <th style={cellStyle}>Harga Satuan</th>
            <th style={cellStyle}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map(item => (
            <tr key={item.id}>
              <td style={cellStyle}>{item.namaProduk}</td>
              <td style={cellStyle}>{item.quantity}</td>
              <td style={cellStyle}>{formatRupiah(item.harga)}</td>
              <td style={cellStyle}>{formatRupiah(item.harga * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rincian Total */}
      <div style={{ textAlign: 'right' }}>
        <p><strong>Subtotal Produk:</strong> {formatRupiah(order.totalPrice)}</p>
        {/* Tambahkan biaya lain jika ada */}
        <h3>Total Pembayaran: {formatRupiah(order.totalPrice)}</h3>
      </div>

      {/* CSS untuk menyembunyikan tombol saat cetak */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 20px; } /* Atur margin cetak */
        }
      `}</style>
    </div>
  );
}

// CSS
const pageStyle = { padding: '30px', maxWidth: '800px', margin: 'auto', fontFamily: 'sans-serif' };
const cellStyle = { border: '1px solid #ccc', padding: '8px', textAlign: 'left' };


export default InvoicePage;