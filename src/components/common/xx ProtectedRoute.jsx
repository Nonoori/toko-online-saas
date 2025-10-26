// src/components/common/ProtectedRoute.jsx

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext' // Pastikan path ini benar!

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth(); 

  if (!currentUser) {
    // Jika TIDAK ADA user yang login,
    // "lempar" (redirect) mereka ke halaman /login
    return <Navigate to="/login" replace />;
  }

  // Jika ADA user yang login, tampilkan "children"
  return children;
}

{/*}
// 1. Impor AuthProvider yang baru kita buat
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
  */}


export default ProtectedRoute;