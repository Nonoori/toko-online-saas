// src/pages/dashboard/PesananPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore';
// Hapus impor storage jika fitur gambar ditunda
// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { formatRupiah } from '../../utils/formatRupiah';

// Definisikan urutan status yang diinginkan
const STATUS_ORDER = ['Pending', 'Harus Dibayar', 'Sudah Dibayar', 'Processing', 'Shipped', 'Completed', 'Complain', 'Cancelled'];

function PesananPage() {
  const { currentUser } = useAuth();


// --- State Form Tambah Produk ---
  const [namaProduk, setNamaProduk] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [berat, setBerat] = useState(''); // <-- 1. State BARU untuk berat
  // const [imageFile, setImageFile] = useState(null); // Komentari jika gambar ditunda

  const [loadingAdd, setLoadingAdd] = useState(false);
  const [formError, setFormError] = useState('');
  const [groupedOrders, setGroupedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- State Daftar Produk ---
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [listError, setListError] = useState('');

  // --- State Modal Edit ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  // const [imageFileUpdate, setImageFileUpdate] = useState(null); // Komentari jika gambar ditunda



  // 1. Ambil Pesanan dan Kelompokkan (HANYA SATU useEffect)
  useEffect(() => {
    console.log("PesananPage: useEffect started. CurrentUser:", currentUser); // Log User

    if (!currentUser) {
      console.warn("PesananPage: useEffect stopped - No current user.");
      setLoading(false);
      setError("User tidak login.");
      return;
    }
    if (!currentUser.storeId) {
      console.warn("PesananPage: useEffect stopped - User has no storeId.");
      setLoading(false);
      setError("Admin tidak memiliki ID toko terkait.");
      return;
    }

    setLoading(true);
    setError(''); // Reset error

    // --- LOG SEBELUM QUERY ---
    const adminStoreId = currentUser.storeId;
    console.log(`PesananPage: Membuat query onSnapshot untuk orders where storeId == ${adminStoreId}`);
    // -------------------------

    const q = query(
      collection(db, "orders"),
      where("storeId", "==", adminStoreId), // Gunakan variabel
      //orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        console.log("PesananPage: onSnapshot received data. Count:", querySnapshot.size); // Log Jumlah Data
        const ordersData = [];
        querySnapshot.forEach((doc) => {
          ordersData.push({ id: doc.id, ...doc.data() });
        });

        // --- Logika Pengelompokan ---
        const grouped = {};
        STATUS_ORDER.forEach(status => grouped[status] = []); // Inisialisasi
        ordersData.forEach(order => {
          const statusKey = order.status || 'Pending';
          if (grouped[statusKey]) {
            grouped[statusKey].push(order);
          } else {
            grouped['Pending'].push(order);
          }
        });
        // --------------------------

        setGroupedOrders(grouped);
        setLoading(false);
      },
      (err) => {
        // --- LOG ERROR DARI LISTENER ---
        console.error("PesananPage: Error listener onSnapshot:", err);
        setError(`Gagal memuat pesanan: ${err.message} (Code: ${err.code})`);
        setLoading(false);
      }
    ); // <-- Akhir onSnapshot

    // Fungsi cleanup
    return () => {
      console.log("PesananPage: useEffect cleanup - unsubscribing listener."); // Log Cleanup
      unsubscribe();
    };
  }, [currentUser]); // <-- PENUTUP useEffect YANG BENAR (hanya satu) // Dependensi




  // 2. Fungsi update status (tetap sama, tapi kita perbarui tombolnya)
  const handleUpdateStatus = async (orderId, newStatus) => {
     if (!window.confirm(`Ubah status pesanan ini menjadi "${newStatus}"?`)) return;
     const orderDocRef = doc(db, "orders", orderId);
     try {
       await updateDoc(orderDocRef, { status: newStatus });
       alert("Status pesanan berhasil diperbarui!");
     } catch (err) {
       console.error("Error updating order status:", err);
       alert("Gagal memperbarui status: " + err.message);
     }
  };

  // 3. Helper function untuk merender tabel pesanan per status
  const renderOrderTable = (status, orders) => {
    if (orders.length === 0) {
      return <p>Tidak ada pesanan dengan status "{status}".</p>;
    }
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th style={cellStyle}>Tanggal</th>
            <th style={cellStyle}>Pelanggan</th>
            <th style={cellStyle}>Total</th>
            <th style={cellStyle}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={cellStyle}>
                <p>{order.createdAt?.toDate().toLocaleDateString('id-ID', { /*...*/ }) || '-'}</p>
              <p>ID: {order.id}</p>
              </td>
              
              <td style={cellStyle}>
                <p>{order.customerEmail}</p>
                <p>{order.customerName}</p>
                <p>{order.customerAddress}</p>
                <p>{order.customerWa}</p>
              </td>
              <td style={cellStyle}>{formatRupiah(order.totalPrice)}</td>
              <td style={cellStyle}>
                {/* Tombol Aksi berdasarkan Status Saat Ini */}
                {status === 'Pending' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'Harus Dibayar')} style={buttonStyle('orange')}>Konfirmasi (Kirim Tagihan)</button>
                )}
                {status === 'Harus Dibayar' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'Sudah Dibayar')} style={buttonStyle('green')}>Tandai Sudah Bayar</button>
                )}
                 {status === 'Sudah Dibayar' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'Processing')} style={buttonStyle('blue')}>Proses Pesanan</button>
                )}
                 {status === 'Processing' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'Shipped')} style={buttonStyle('purple')}>Tandai Dikirim</button>
                )}
                 {status === 'Shipped' && (
                  <button onClick={() => handleUpdateStatus(order.id, 'Completed')} style={buttonStyle('teal')}>Selesaikan Pesanan</button>
                )}
                {/* Tombol aksi lain (bisa muncul di semua status) */}
                 <button onClick={() => handleUpdateStatus(order.id, 'Cancelled')} style={{...buttonStyle('red'), marginLeft: '5px'}}>Batalkan</button>
                 <button onClick={() => handleUpdateStatus(order.id, 'Complain')} style={{...buttonStyle('grey'), marginLeft: '5px'}}>Komplain</button>
              

              {/* --- 2. CHANGE THIS BUTTON --- */}
                <Link
                  to={`/dashboard/pesanan/${order.id}`} // Link to the detail page
                  target="_blank" // Open in new tab
                  rel="noopener noreferrer"
                  style={{...buttonStyle('grey'), marginLeft: '5px', textDecoration: 'none'}} // Style as button
                >
                  Detail
                </Link>
                {/* --------------------------- */}



              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Memuat pesanan masuk...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">&larr; Kembali ke Dashboard</Link>
      <h1>Pesanan Masuk</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* 4. Render bagian untuk setiap status */}
      {STATUS_ORDER.map((status) => (
        <section key={status} style={{ marginBottom: '40px' }}>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '5px' }}>
            {status} ({groupedOrders[status]?.length || 0})
          </h2>
          {renderOrderTable(status, groupedOrders[status] || [])}
        </section>
      ))}

    </div>
  );
}

// --- CSS ---
const cellStyle = {
  border: '1px solid #ccc',
  padding: '10px',
  textAlign: 'left',
  verticalAlign: 'top' // Agar tombol rapi
};
const buttonStyle = (color) => ({
  backgroundColor: color,
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9em',
  marginBottom: '5px', // Beri jarak jika tombol jadi 2 baris
  marginRight: '5px'
});

// Tambahkan warna spesifik jika perlu
buttonStyle.orange = { ...buttonStyle('orange') };
buttonStyle.green = { ...buttonStyle('green') };
buttonStyle.blue = { ...buttonStyle('blue') };
buttonStyle.purple = { ...buttonStyle('#6f42c1') }; // Contoh warna ungu
buttonStyle.teal = { ...buttonStyle('teal') };
buttonStyle.red = { ...buttonStyle('red') };
buttonStyle.grey = { ...buttonStyle('grey') };


export default PesananPage;