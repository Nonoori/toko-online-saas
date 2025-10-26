// src/components/layout/PublicLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer'; // <-- 1. Import Footer

function PublicLayout() {
  return (
    <div>
      <Navbar />
      <main style={{ minHeight: '70vh' }}> {/* Optional: ensure content pushes footer down */}
        <Outlet />
      </main>
      <Footer /> {/* <-- 2. Add Footer here */}
    </div>
  );
}

export default PublicLayout;