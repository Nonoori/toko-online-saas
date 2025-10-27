// src/pages/customer/CustomerProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { signOut, updatePassword } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { useNavigate, useLocation, Link } from 'react-router-dom'; 
import { formatRupiah } from '../../utils/formatRupiah';

// Definisikan urutan status (opsional, bisa disesuaikan)
const CUSTOMER_STATUS_ORDER = ['Pending', 'Harus Dibayar', 'Sudah Dibayar', 'Processing', 'Shipped', 'Completed', 'Complain', 'Cancelled'];

function CustomerProfilePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 2. Dapatkan location state

  // --- State Form Profil & Password ---
// --- State Form Profil (DIPERBARUI) ---
  const [profileData, setProfileData] = useState({
    namaLengkap: '',
    wa: '',
    alamatLengkap: '', // Ganti 'alamat'
    provinsi: '',
    kotaKabupaten: '',
    kecamatan: '',
    kodePos: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [groupedOrders, setGroupedOrders] = useState({});
  const newOrderId = location.state?.newOrderId;

  // --- useEffect Mengambil Profil (DIPERBARUI) ---
  useEffect(() => {
    if (currentUser) {
      setLoadingProfile(true);
      const fetchProfile = async () => {
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Isi state dengan data dari Firestore, gunakan '' jika field belum ada
            setProfileData({
              namaLengkap: data.namaLengkap || '',
              wa: data.wa || '',
              alamatLengkap: data.alamatLengkap || '',
              provinsi: data.provinsi || '',
              kotaKabupaten: data.kotaKabupaten || '',
              kecamatan: data.kecamatan || '',
              kodePos: data.kodePos || '',
            });
          }
        } catch (err) { console.error("Error fetching profile:", err); }
        finally { setLoadingProfile(false); }
      };
      fetchProfile();
    } else { setLoadingProfile(false); }
  }, [currentUser]);


// --- 4. useEffect BARU untuk Mengambil Riwayat Pesanan ---
  useEffect(() => {
    if (currentUser) {
      setLoadingOrders(true);
      // Query (tetap di sini)
      const q = query(
        collection(db, "orders"),
        where("customerId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );

      // Definisikan fungsi async fetchOrders (tetap di sini)
      const fetchOrders = async () => {
        try {
          // --- PINDAHKAN getDocs KE DALAM SINI ---
          const querySnapshot = await getDocs(q); // Pakai getDocs, tidak perlu real-time
          // ------------------------------------

          const ordersData = [];
          querySnapshot.forEach((doc) => {
            ordersData.push({ id: doc.id, ...doc.data() });
          });
          setOrders(ordersData);

          // Logika Pengelompokan (tetap di sini)
          const grouped = {};
          CUSTOMER_STATUS_ORDER.forEach(status => grouped[status] = []);
          ordersData.forEach(order => {
            const statusKey = order.status || 'Pending';
            if (grouped[statusKey]) {
              grouped[statusKey].push(order);
            } else {
              grouped['Pending'].push(order);
            }
          });
          setGroupedOrders(grouped);

        } catch (err) {
          console.error("Error fetching orders:", err);
          setError("Gagal memuat riwayat pesanan.");
        } finally {
          setLoadingOrders(false);
        }
      }; // <-- Akhir fungsi fetchOrders

      // Panggil fetchOrders (tetap di sini)
      fetchOrders();

    } else {
      setLoadingOrders(false);
    }
  }, [currentUser]); // Jalankan saat currentUser tersedia

  /// --- Fungsi Simpan Profil (DIPERBARUI) ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoadingProfile(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      // Simpan SEMUA field profileData ke Firestore
      await updateDoc(userDocRef, profileData);
      setSuccess('Profil berhasil diperbarui!');
    } catch (err) { console.error("Error updating profile:", err); setError(err.message); }
    setLoadingProfile(false);
  };


  // 5. Fungsi untuk MENGUBAH PASSWORD
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword.length < 6) {
      setError('Password baru harus minimal 6 karakter.');
      return;
    }
    
    setLoadingPassword(true);
    try {
      // Gunakan 'auth.currentUser' untuk aksi sensitif
      await updatePassword(auth.currentUser, newPassword);
      setSuccess('Password berhasil diubah! Silakan login kembali.');
      setNewPassword('');
      // Logout paksa setelah ganti password untuk keamanan
      setTimeout(async () => {
        await signOut(auth);
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error("Error updating password:", err);
      // Jika butuh login ulang, kode errornya 'auth/requires-recent-login'
      setError('Gagal mengubah password. Error: ' + err.message);
    }
    setLoadingPassword(false);
  };

  // Helper untuk update state form
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Arahkan ke home setelah logout
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // --- Tampilan (UI) ---
  // --- 5. Helper function render tabel riwayat (mirip admin tapi lebih simpel) ---
  const renderOrderHistoryTable = (statusGroup, ordersList) => {
    if (ordersList.length === 0) {
      return null;
    }
    return (
      <div key={statusGroup} style={{ marginBottom: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
          {statusGroup} ({ordersList.length})
        </h3>
        <table style={{ width: '100%', fontSize: '0.9em' }}>
          <thead>
            <tr>
              <th style={cellStyle}>Tanggal</th>

              {/* === TAMBAHKAN KOLOM PRODUK (UTAMA) === */}
              <th style={cellStyle}>Nama Produk</th>
              {/* ==================================== */}
              <th style={cellStyle}>Total</th>
              <th style={cellStyle}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {ordersList.map((order) => {
              // Ambil nama produk pertama (jika ada)
              const firstItemName = order.items && order.items.length > 0
                                    ? order.items[0].namaProduk
                                    : '(Detail tidak tersedia)';
              // Tambahkan '...' jika ada lebih dari 1 item
              const displayItemName = order.items && order.items.length > 1
                                      ? `${firstItemName}...`
                                      : firstItemName;
              const firstItemHarga = order.items && order.items.length > 0
                                    ? order.items[0].harga
                                    : '(Detail tidak tersedia)';
              const displayItemHarga = order.items && order.items.length > 1
                                      ? `${firstItemHarga}...`
                                      : firstItemHarga;
              const firstItemQuantity = order.items && order.items.length > 0
                                    ? order.items[0].quantity
                                    : '(Detail tidak tersedia)';
              const displayItemQuantity = order.items && order.items.length > 1
                                      ? `${firstItemQuantity}...`
                                      : firstItemQuantity;


              return (
                <tr key={order.id} style={{ backgroundColor: order.id === newOrderId ? '#e6ffed' : 'transparent' }}>
                  <td style={cellStyle}>
                    <p>{order.createdAt?.toDate().toLocaleDateString('id-ID') || '-'}</p>
                    <p>{order.id}</p>
                  </td>

                  {/* === TAMPILKAN NAMA PRODUK PERTAMA === */}
                  <td style={cellStyle}>
                    <p>{displayItemName}</p>
                    <p>{formatRupiah(displayItemHarga)}</p>
                    <p>{displayItemQuantity}</p>
                  </td>
                  {/* ================================== */}
                  
                  <td style={cellStyle}>
                    <p>{formatRupiah(order.totalPrice)}</p>
                    <p style={{ ...cellStyle, fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {order.status || 'Pending'}</p>
                  </td>
                  <td style={cellStyle}>
                    <Link
                      to={`/pesanan/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8em', padding: '3px 8px', textDecoration: 'none', backgroundColor: '#6c757d', color: 'white', borderRadius: '7px' }} // Styling Link
                    >
                      Lihat Detail
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }; // Akhir renderOrderHistoryTable


  // --- Tampilan (UI) ---
  if (loadingProfile && !profileData.namaLengkap) {
     return <div style={{ padding: '20px' }}>Memuat profil...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: 'auto' }}>
      <h1>Profil Saya</h1>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Kolom Kiri: Form Profil (DIPERBARUI) */}
        <div style={{ flex: '1 1 400px' }}>
          <h2>Informasi Akun & Pengiriman</h2>
          {currentUser && (<p>Email: <strong>{currentUser.email}</strong></p>)}
          <form onSubmit={handleProfileSubmit}>
            <div style={inputGroupStyle}><label>Nama Lengkap:</label><input type="text" name="namaLengkap" value={profileData.namaLengkap} onChange={handleProfileChange} style={inputStyle} /></div>
            <div style={inputGroupStyle}><label>Nomor WA (Aktif):</label><input type="tel" name="wa" value={profileData.wa} onChange={handleProfileChange} style={inputStyle} placeholder="Contoh: 62812..."/></div>
            <hr style={{ margin: '20px 0'}} />
            <h3 style={{marginBottom: '10px'}}>Alamat Pengiriman Utama</h3>
            <div style={inputGroupStyle}><label>Alamat Lengkap (Jalan, No Rumah, RT/RW):</label><textarea name="alamatLengkap" value={profileData.alamatLengkap} onChange={handleProfileChange} style={{...inputStyle, minHeight: '60px'}} /></div>
            <div style={inputGroupStyle}><label>Provinsi:</label><input type="text" name="provinsi" value={profileData.provinsi} onChange={handleProfileChange} style={inputStyle} /></div>
            <div style={inputGroupStyle}><label>Kota / Kabupaten:</label><input type="text" name="kotaKabupaten" value={profileData.kotaKabupaten} onChange={handleProfileChange} style={inputStyle} /></div>
            <div style={inputGroupStyle}><label>Kecamatan:</label><input type="text" name="kecamatan" value={profileData.kecamatan} onChange={handleProfileChange} style={inputStyle} /></div>
            <div style={inputGroupStyle}><label>Kode Pos:</label><input type="text" name="kodePos" value={profileData.kodePos} onChange={handleProfileChange} style={inputStyle} /></div>

            <button type="submit" disabled={loadingProfile} style={buttonStyle('blue')}>
              {loadingProfile ? 'Menyimpan...' : 'Simpan Profil & Alamat'}
            </button>
          </form>

        


          <h2>Ganti Password</h2>
          <form onSubmit={handlePasswordSubmit}>
             {/* ... (Input Password Baru) ... */}
             <div style={inputGroupStyle}><label>Password Baru:</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} placeholder="Min 6 karakter"/></div>
            <button type="submit" disabled={loadingPassword} style={buttonStyle('green')}>
              {loadingPassword ? 'Mengubah...' : 'Ubah Password'}
            </button>
          </form>

          <hr style={{ margin: '30px 0' }}/>
          <button onClick={handleLogout} style={buttonStyle('red')}> Logout </button>
        </div>

        {/* Kolom Kanan: Riwayat Pesanan */}
        <div style={{ flex: '2 1 500px' }}>
          <h2>Riwayat Pesanan</h2>
          {loadingOrders ? (
            <p>Memuat riwayat pesanan...</p>
          ) : orders.length === 0 ? (
            <p>Anda belum memiliki riwayat pesanan.</p>
          ) : (
            // Render tabel per status
            CUSTOMER_STATUS_ORDER.map(status => renderOrderHistoryTable(status, groupedOrders[status] || []))
          )}
        </div>
      </div>
    </div>
  );
}

// --- CSS Inline ---
const inputGroupStyle = { marginBottom: '15px' };
const inputStyle = { width: '100%', padding: '8px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' };
const buttonStyle = (color) => ({ width: '100%', padding: '10px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '10px' });
const cellStyle = { borderBottom: '5px solid #eee', padding: '8px 5px', textAlign: 'left' };


export default CustomerProfilePage;
