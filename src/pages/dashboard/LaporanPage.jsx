// src/pages/dashboard/LaporanPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  Timestamp, // Impor Timestamp untuk query tanggal
  getDocs
} from 'firebase/firestore';
import { formatRupiah } from '../../utils/formatRupiah';

// Impor Chart.js (pastikan sudah diinstal)
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Daftarkan komponen Chart.js yang akan digunakan
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function LaporanPage() {
  const { currentUser } = useAuth();
  const [allCompletedOrders, setAllCompletedOrders] = useState([]); // Simpan semua order selesai
  const [filteredOrders, setFilteredOrders] = useState([]); // Order setelah difilter tanggal
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- State untuk Filter Tanggal ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- State untuk Kalkulasi ---
  const [totalPendapatan, setTotalPendapatan] = useState(0);
  const [jumlahPesananSelesai, setJumlahPesananSelesai] = useState(0);
  const [produkTerlaris, setProdukTerlaris] = useState([]);

  // 1. useEffect untuk Fetch Awal (ambil SEMUA pesanan selesai)
  useEffect(() => {
    if (!currentUser || !currentUser.storeId) return;

    const fetchAllCompletedOrders = async () => {
      setLoading(true);
      setError('');
      try {
        // Query HANYA berdasarkan storeId dan status Completed, urutkan
        const q = query(
          collection(db, "orders"),
          where("storeId", "==", currentUser.storeId),
          where("status", "==", "Completed"),
          orderBy("createdAt", "desc") // Perlu index: storeId ASC, status ASC, createdAt DESC
        );

        const querySnapshot = await getDocs(q);
        const completedOrders = [];
        querySnapshot.forEach((doc) => {
          completedOrders.push({ id: doc.id, ...doc.data() });
        });

        setAllCompletedOrders(completedOrders); // Simpan semua data awal
        setFilteredOrders(completedOrders); // Awalnya, tampilkan semua

      } catch (err) {
        console.error("Error fetching initial orders:", err);
        // Tangani error index atau permissions
        if (err.code === 'failed-precondition') {
             setError("Gagal memuat laporan: Index Firestore diperlukan. Cek console browser untuk link pembuatan index (storeId, status, createdAt).");
        } else if (err.code === 'permission-denied') {
             setError("Gagal memuat laporan: Izin ditolak (cek Security Rules).");
        } else {
             setError("Gagal memuat laporan awal.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllCompletedOrders();
  }, [currentUser]);

  // 2. useEffect untuk Filter dan Kalkulasi Ulang
  // Berjalan saat data awal berubah ATAU filter tanggal berubah
  useEffect(() => {
    // Filter data berdasarkan startDate dan endDate
    let filtered = allCompletedOrders;
    if (startDate) {
      const startTimestamp = Timestamp.fromDate(new Date(startDate + "T00:00:00")); // Mulai hari
      filtered = filtered.filter(order => order.createdAt && order.createdAt >= startTimestamp);
    }
    if (endDate) {
      const endTimestamp = Timestamp.fromDate(new Date(endDate + "T23:59:59")); // Akhir hari
      filtered = filtered.filter(order => order.createdAt && order.createdAt <= endTimestamp);
    }
    setFilteredOrders(filtered);

    // Kalkulasi ulang total pendapatan
    const total = filtered.reduce((sum, order) => sum + order.totalPrice, 0);
    setTotalPendapatan(total);
    setJumlahPesananSelesai(filtered.length);

    // Kalkulasi ulang produk terlaris
    const productCounts = {};
    filtered.forEach(order => {
      order.items.forEach(item => {
        const key = item.namaProduk; // Atau gunakan item.id jika lebih unik
        productCounts[key] = (productCounts[key] || 0) + item.quantity;
      });
    });
    const sortedProducts = Object.entries(productCounts)
      .sort(([, qtyA], [, qtyB]) => qtyB - qtyA) // Urutkan descending berdasarkan qty
      .slice(0, 5); // Ambil top 5
    setProdukTerlaris(sortedProducts);

  }, [allCompletedOrders, startDate, endDate]); // Dependensi

  // 3. Data dan Opsi untuk Grafik
  const chartData = useMemo(() => {
      // Kelompokkan pendapatan per hari (contoh sederhana)
      const dailyRevenue = {};
      filteredOrders.forEach(order => {
          if (order.createdAt) {
              const dateKey = order.createdAt.toDate().toLocaleDateString('id-ID');
              dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + order.totalPrice;
          }
      });
      // Urutkan berdasarkan tanggal (opsional tapi lebih baik)
      const sortedDates = Object.keys(dailyRevenue).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

      return {
          labels: sortedDates, // Tanggal
          datasets: [
              {
                  label: 'Pendapatan Harian',
                  data: sortedDates.map(date => dailyRevenue[date]), // Jumlah pendapatan
                  backgroundColor: 'rgba(0, 123, 255, 0.6)', // Warna biru
                  borderColor: 'rgba(0, 123, 255, 1)',
                  borderWidth: 1,
              },
          ],
      };
  }, [filteredOrders]); // Kalkulasi ulang jika filteredOrders berubah

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Grafik Pendapatan Harian (Pesanan Selesai)' },
    },
    scales: { y: { beginAtZero: true } } // Mulai sumbu Y dari nol
  };


  if (loading && allCompletedOrders.length === 0) { // Tampilkan loading hanya saat fetch awal
    return <div style={{ padding: '20px' }}>Memuat laporan keuangan...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">&larr; Kembali ke Dashboard</Link>
      <h1>Laporan Keuangan</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* --- Filter Tanggal --- */}
      <div style={filterBoxStyle}>
        <h3>Filter Laporan</h3>
        <label> Dari Tanggal:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={dateInputStyle} />
        </label>
        <label> Sampai Tanggal:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={dateInputStyle} />
        </label>
         <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{marginLeft: '10px'}}>Reset Filter</button>
      </div>

      {/* --- Ringkasan --- */}
      <div style={summaryBoxStyle}>
        <h2>Ringkasan {startDate || endDate ? `(${startDate} - ${endDate})` : '(Semua Waktu)'}</h2>
        <p>Total Pendapatan (Pesanan Selesai): <strong>{formatRupiah(totalPendapatan)}</strong></p>
        <p>Jumlah Pesanan Selesai: <strong>{jumlahPesananSelesai}</strong></p>
      </div>

      {/* --- Grafik Pendapatan --- */}
       <div style={{ marginTop: '40px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
         <h2>Grafik Pendapatan</h2>
         {filteredOrders.length > 0 ? (
           <Bar options={chartOptions} data={chartData} />
         ) : (
           <p>Tidak ada data pesanan selesai untuk ditampilkan dalam grafik.</p>
         )}
       </div>

      {/* --- Produk Terlaris --- */}
      <div style={{ marginTop: '40px' }}>
        <h2>Produk Terlaris (Top 5) {startDate || endDate ? `(${startDate} - ${endDate})` : ''}</h2>
        {produkTerlaris.length === 0 ? (
          <p>Belum ada produk yang terjual dalam periode ini.</p>
        ) : (
          <ol style={{ paddingLeft: '20px' }}>
            {produkTerlaris.map(([namaProduk, qty]) => (
              <li key={namaProduk} style={{ marginBottom: '5px' }}>
                {namaProduk} - Terjual: <strong>{qty}</strong>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* --- Detail Pesanan Selesai (Difilter) --- */}
      <h2 style={{ marginTop: '40px' }}>Detail Pesanan Selesai {startDate || endDate ? `(${startDate} - ${endDate})` : ''}</h2>
      {filteredOrders.length === 0 && !error ? (
        <p>Tidak ada pesanan selesai dalam rentang tanggal yang dipilih.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
           {/* ... (thead tabel pesanan tidak berubah) ... */}
           <thead><tr style={{ backgroundColor: '#f4f4f4' }}><th style={cellStyle}>Tanggal Selesai</th><th style={cellStyle}>ID Pesanan</th><th style={cellStyle}>Pelanggan</th><th style={cellStyle}>Total</th><th style={cellStyle}>Aksi</th></tr></thead>
          <tbody>
            {filteredOrders.map((order) => ( // Gunakan filteredOrders
              <tr key={order.id}>
                <td style={cellStyle}>{order.createdAt?.toDate().toLocaleDateString('id-ID') || '-'}</td>
                <td style={cellStyle}>{order.id}</td>
                <td style={cellStyle}>{order.customerEmail}</td>
                <td style={cellStyle}>{formatRupiah(order.totalPrice)}</td>
                <td style={cellStyle}><Link to={`/dashboard/pesanan/${order.id}`} target="_blank" rel="noopener noreferrer" style={linkButtonStyle}>Lihat Detail</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- CSS ---
const filterBoxStyle = { backgroundColor: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' };
const dateInputStyle = { marginLeft: '5px', padding: '5px' };
const summaryBoxStyle = {
  backgroundColor: '#e9ecef',
  padding: '20px',
  borderRadius: '8px',
  marginTop: '20px',
  border: '1px solid #ced4da'
};
const cellStyle = {
  border: '1px solid #ccc',
  padding: '10px',
  textAlign: 'left'
};
const linkButtonStyle = {
  fontSize: '0.9em',
  padding: '3px 8px',
  textDecoration: 'none',
  backgroundColor: '#6c757d',
  color: 'white',
  borderRadius: '3px'
};

export default LaporanPage;