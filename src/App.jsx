// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Layouts ---
import PublicLayout from './components/layout/PublicLayout';

// --- Pelindung Rute ---
import CustomerProtectedRoute from './components/common/CustomerProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import PublicOnlyRoute from './components/common/PublicOnlyRoute';
import SuperAdminProtectedRoute from './components/common/SuperAdminProtectedRoute';

// --- Halaman Publik & Otorisasi ---
import LandingPage from './pages/LandingPage';
import StoreFrontPage from './pages/store/StoreFrontPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// --- Halaman Pelanggan ---
import CartPage from './pages/cart/CartPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import OrderSuccessPage from './pages/order/OrderSuccessPage';
import OrderDetailPage from './pages/order/OrderDetailPage'; 
import InvoicePage from './pages/order/InvoicePage';    

// --- Halaman Admin Toko ---
import DashboardPage from './pages/dashboard/DashboardPage';
import ProdukPage from './pages/dashboard/ProdukPage';
import PengaturanTokoPage from './pages/dashboard/PengaturanTokoPage';
import PesananPage from './pages/dashboard/PesananPage';
import AdminOrderDetailPage from './pages/dashboard/AdminOrderDetailPage'; 
import LaporanPage from './pages/dashboard/LaporanPage'; 
import PengaturanOngkirPage from './pages/dashboard/PengaturanOngkirPage'; 
import VoucherPage from './pages/dashboard/VoucherPage'; 

// --- Halaman Super Admin ---
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

function App() {
  return (
    <Routes> {/* <-- Tag pembuka utama */}

      {/* --- Grup 1: Rute dengan Layout Publik (Navbar) --- */}
      {/* Semua rute di dalam sini akan memiliki Navbar + Footer */}
      <Route element={<PublicLayout />}>

        {/* Rute Landing Page (Hanya Tamu) */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />

        {/* Rute Profil (Hanya Pelanggan) */}
        <Route
          path="/profil"
          element={
            <CustomerProtectedRoute>
              <CustomerProfilePage />
            </CustomerProtectedRoute>
          }
        />

         {/* Rute Sukses Order (Hanya Pelanggan) */}
        <Route
          path="/pesanan-berhasil"
          element={ <CustomerProtectedRoute> <OrderSuccessPage /> </CustomerProtectedRoute> }
        />

        <Route
          path="/pesanan/:orderId"
          element={ <CustomerProtectedRoute> <OrderDetailPage /> </CustomerProtectedRoute> }
        />
         <Route
          path="/faktur/:orderId"
          element={ <CustomerProtectedRoute> <InvoicePage /> </CustomerProtectedRoute> }
        />

        {/* --- UBAH RUTE INI --- */}
        <Route
          path="/keranjang"
          element={
            <CustomerProtectedRoute>
              <CartPage />
            </CustomerProtectedRoute>
          }
        />
        {/* ------------------- */}
        
        {/* Rute Etalase (Tamu & Pelanggan) */}
        <Route path="/toko/:storeId" element={<StoreFrontPage />} />

      </Route> {/* <-- Tag penutup untuk Grup 1 HARUS DI SINI */}


      {/* --- Grup 2: Rute Otorisasi (Polos, Tanpa Navbar) --- */}
      {/* Rute-rute ini HANYA untuk Tamu */}
      <Route
        path="/login"
        element={ <PublicOnlyRoute> <Login /> </PublicOnlyRoute> }
      />
      <Route
        path="/register"
        element={ <PublicOnlyRoute> <Register /> </PublicOnlyRoute> }
      />
      <Route
        path="/forgot-password"
        element={ <PublicOnlyRoute> <ForgotPassword /> </PublicOnlyRoute> }
      />

      {/* --- Grup 3: Rute Admin (Polos, Tanpa Navbar) --- */}
      <Route
        path="/dashboard"
        element={ <AdminProtectedRoute> <DashboardPage /> </AdminProtectedRoute> }
      />
      <Route
        path="/dashboard/produk"
        element={ <AdminProtectedRoute> <ProdukPage /> </AdminProtectedRoute> }
      />
      <Route
        path="/dashboard/pengaturan"
        element={ <AdminProtectedRoute> <PengaturanTokoPage /> </AdminProtectedRoute> }
      />
      <Route
        path="/dashboard/pesanan"
        element={ <AdminProtectedRoute> <PesananPage /> </AdminProtectedRoute> }
      />
      <Route path="/dashboard/pesanan/:orderId" element={ <AdminProtectedRoute> <AdminOrderDetailPage /> </AdminProtectedRoute> } />
      <Route path="/dashboard/laporan" element={ <AdminProtectedRoute> <LaporanPage /> </AdminProtectedRoute> } />
      <Route path="/dashboard/ongkir" element={ <AdminProtectedRoute> <PengaturanOngkirPage /> </AdminProtectedRoute> } />
      <Route path="/dashboard/voucher" element={ <AdminProtectedRoute> <VoucherPage /> </AdminProtectedRoute> } />



      {/* --- Grup 4: Rute Super Admin (Polos, Tanpa Navbar) --- */}
      <Route
        path="/superadmin"
        element={ <SuperAdminProtectedRoute> <SuperAdminDashboard /> </SuperAdminProtectedRoute> }
      />

      {/* Nanti kita tambahkan Rute 404 Not Found di sini */}

    </Routes> 
  );
}

export default App;