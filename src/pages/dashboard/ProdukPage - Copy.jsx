// src/pages/dashboard/ProdukPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../firebaseConfig'; // <-- 1. Impor 'storage'
import { 
  collection, addDoc, query, where, onSnapshot, 
  serverTimestamp, doc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { 
  ref, uploadBytes, getDownloadURL 
} from 'firebase/storage'; // <-- 2. Impor fungsi Storage
import { formatRupiah } from '../../utils/formatRupiah';

// --- (CSS untuk Modal ada di paling bawah) ---

function ProdukPage() {
  const { currentUser } = useAuth();
  
  // --- State Form Tambah Produk ---
  const [namaProduk, setNamaProduk] = useState('');
  const [harga, setHarga] = useState('');
  const [stok, setStok] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [imageFile, setImageFile] = useState(null); // <-- 3. State BARU untuk file gambar
  
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [formError, setFormError] = useState('');

  // --- State Daftar Produk ---
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [listError, setListError] = useState('');

  // --- State Modal Edit ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); 
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [imageFileUpdate, setImageFileUpdate] = useState(null); // <-- State gambar untuk modal edit

  // --- ( useEffect READ tetap sama ) ---
  useEffect(() => {
    if (!currentUser || !currentUser.storeId) return; 
    setLoadingProducts(true);
    const q = query(
      collection(db, "products"), 
      where("storeId", "==", currentUser.storeId)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
      setLoadingProducts(false);
    }, (err) => {
      console.error("Error fetching products: ", err);
      setListError("Gagal memuat produk.");
      setLoadingProducts(false);
    });
    return () => unsubscribe(); 
  }, [currentUser]);

  // --- 4. LOGIKA BARU: handleAddProduct (CREATE) dengan Upload Gambar ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!namaProduk || !harga || !stok || !imageFile) {
      setFormError("Semua field (termasuk Gambar) wajib diisi.");
      return;
    }
    
    setLoadingAdd(true);

    try {
      // --- Upload Gambar DULU ---
      let imageUrl = '';
      if (imageFile) {
        // Buat path file yang unik
        // Format: products/{storeId}/{timestamp}_{namaFile}
        const filePath = `products/${currentUser.storeId}/${Date.now()}_${imageFile.name}`;
        
        // Buat referensi ke Firebase Storage
        const storageRef = ref(storage, filePath);
        
        // Upload file
        // Security Rules akan mengecek (request.auth.uid == storeId) di sini
        await uploadBytes(storageRef, imageFile);
        
        // Dapatkan URL download publik
        imageUrl = await getDownloadURL(storageRef);
        console.log("Gambar berhasil di-upload: ", imageUrl);
      }

      // --- Simpan Produk ke Firestore (setelah URL didapat) ---
      const newProduct = {
        namaProduk: namaProduk,
        harga: Number(harga),
        stok: Number(stok),
        deskripsi: deskripsi,
        imageUrl: imageUrl, // <-- Simpan URL gambar
        storeId: currentUser.storeId, 
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "products"), newProduct);
      
      // Bersihkan form
      setNamaProduk('');
      setHarga('');
      setStok('');
      setDeskripsi('');
      setImageFile(null);
      document.getElementById('file-input-add').value = null; // Reset input file

    } catch (err) {
      console.error("Error adding product: ", err);
      setFormError(`Gagal menambah produk: ${err.message}`);
    }
    setLoadingAdd(false);
  };

  // --- 5. LOGIKA BARU: handleDeleteProduct (DELETE) ---
  // (Kita akan tambahkan logika hapus gambar dari storage nanti, 
  //  untuk sekarang kita hanya hapus data firestore)
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      return;
    }
    try {
      // TODO: Hapus gambar dari Firebase Storage
      // const productToDelete = products.find(p => p.id === productId);
      // if (productToDelete && productToDelete.imageUrl) {
      //   const imageRef = ref(storage, productToDelete.imageUrl);
      //   await deleteObject(imageRef);
      // }
      
      await deleteDoc(doc(db, "products", productId));
      console.log("Produk berhasil dihapus!");
    } catch (err) {
      console.error("Error deleting product: ", err);
      alert("Gagal menghapus produk: " + err.message);
    }
  };

  // --- 6. LOGIKA BARU: handleUpdateProduct (UPDATE) dengan Upload Gambar ---
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const { id, namaProduk, harga, stok, deskripsi } = editingProduct;
    if (!namaProduk || !harga || !stok) {
      alert("Nama, Harga, dan Stok tidak boleh kosong.");
      return;
    }
    setLoadingUpdate(true);
    
    try {
      let updatedProductData = {
        namaProduk: namaProduk,
        harga: Number(harga),
        stok: Number(stok),
        deskripsi: deskripsi || "",
      };

      // Cek jika ada file gambar BARU yang di-upload
      if (imageFileUpdate) {
        // TODO: Hapus gambar lama dari Storage
        
        // Upload gambar baru
        const filePath = `products/${currentUser.storeId}/${Date.now()}_${imageFileUpdate.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, imageFileUpdate);
        const newImageUrl = await getDownloadURL(storageRef);
        
        // Tambahkan URL baru ke data update
        updatedProductData.imageUrl = newImageUrl;
      }

      // Update dokumen di Firestore
      const productDocRef = doc(db, "products", id);
      await updateDoc(productDocRef, updatedProductData);

      console.log("Produk berhasil diperbarui!");
      closeEditModal(); 

    } catch (err) {
      console.error("Error updating product: ", err);
      alert("Gagal memperbarui produk: " + err.message);
      setLoadingUpdate(false);
    }
  };


  // --- Helper Functions (Modal) ---
  const openEditModal = (product) => {
    setEditingProduct(product);
    setImageFileUpdate(null); // Reset file input modal
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setLoadingUpdate(false);
    setImageFileUpdate(null);
  };
  
  const handleModalFormChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct({ ...editingProduct, [name]: value });
  };
  
  // Helper untuk file input
  const handleFileChangeAdd = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };
  const handleFileChangeUpdate = (e) => {
    if (e.target.files[0]) {
      setImageFileUpdate(e.target.files[0]);
    }
  };

  // --- 7. TAMPILAN (UI) ---
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '30px', position: 'relative' }}>
      <Link to="/dashboard" style={{ position: 'absolute', top: 10, left: 10 }}>&larr; Kembali</Link>

      {/* Bagian Kiri: Form Tambah Produk */}
      <div style={{ flex: 1, marginTop: '30px' }}>
        <h2>Tambah Produk Baru</h2>
        <form onSubmit={handleAddProduct} style={formStyle}>
          {/* ... input nama, harga, stok, deskripsi ... */}
          <input type="text" placeholder="Nama Produk" value={namaProduk} onChange={(e) => setNamaProduk(e.target.value)} style={inputStyle} />
          <input type="number" placeholder="Harga (mis: 150000)" value={harga} onChange={(e) => setHarga(e.target.value)} style={inputStyle} />
          <input type="number" placeholder="Stok (mis: 50)" value={stok} onChange={(e) => setStok(e.target.value)} style={inputStyle} />
          <textarea placeholder="Deskripsi Produk" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} style={inputStyle} />
          
          {/* --- Input File BARU --- */}
          <label>Gambar Produk:</label>
          <input 
            id="file-input-add"
            type="file" 
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChangeAdd}
            style={inputStyle}
          />
          
          {formError && <p style={{ color: 'red' }}>{formError}</p>}
          <button type="submit" disabled={loadingAdd} style={buttonStyle('blue')}>
            {loadingAdd ? 'Menyimpan...' : 'Tambah Produk'}
          </button>
        </form>
      </div>

      {/* Bagian Kanan: Daftar Produk */}
      <div style={{ flex: 2, marginTop: '30px' }}>
        <h2>Daftar Produk Anda</h2>
        {loadingProducts ? <p>Memuat produk...</p> : listError ? <p style={{ color: 'red' }}>{listError}</p> : products.length === 0 ? <p>Anda belum memiliki produk.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f4' }}>
                {/* --- Kolom Gambar BARU --- */}
                <th style={cellStyle}>Gambar</th> 
                <th style={cellStyle}>Nama</th>
                <th style={cellStyle}>Harga</th>
                <th style={cellStyle}>Stok</th>
                <th style={cellStyle}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  {/* --- Tampilkan Gambar --- */}
                  <td style={cellStyle}>
                    <img 
                      src={product.imageUrl} 
                      alt={product.namaProduk} 
                      style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                    />
                  </td>
                  <td style={cellStyle}>{product.namaProduk}</td>
                  <td style={cellStyle}>{formatRupiah(product.harga)}</td>
                  <td style={cellStyle}>{product.stok}</td>
                  <td style={cellStyle}>
                    <button onClick={() => openEditModal(product)} style={{ marginRight: '5px' }}>Edit</button>
                    <button onClick={() => handleDeleteProduct(product.id)} style={{ backgroundColor: 'red', color: 'white' }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- 8. TAMPILAN MODAL EDIT (Diperbarui) --- */}
      {isModalOpen && editingProduct && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Edit Produk: {editingProduct.namaProduk}</h2>
            
            <form onSubmit={handleUpdateProduct} style={formStyle}>
              {/* ... form input nama, harga, stok, deskripsi ... */}
              <label>Nama Produk:</label>
              <input type="text" name="namaProduk" value={editingProduct.namaProduk} onChange={handleModalFormChange} style={inputStyle} />
              <label>Harga:</label>
              <input type="number" name="harga" value={editingProduct.harga} onChange={handleModalFormChange} style={inputStyle} />
              <label>Stok:</label>
              <input type="number" name="stok" value={editingProduct.stok} onChange={handleModalFormChange} style={inputStyle} />
              <label>Deskripsi:</label>
              <textarea name="deskripsi" value={editingProduct.deskripsi || ''} onChange={handleModalFormChange} style={inputStyle} />

              {/* --- Input File BARU (Modal) --- */}
              <label>Ubah Gambar (Opsional):</label>
              <img src={editingProduct.imageUrl} alt="Gambar lama" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChangeUpdate}
                style={inputStyle}
              />
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={closeEditModal} style={{ flex: 1, padding: '10px' }}>Batal</button>
                <button type="submit" disabled={loadingUpdate} style={{ ...buttonStyle('green'), flex: 2 }}>
                  {loadingUpdate ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- (CSS INLINE tidak berubah) ---
const cellStyle = { border: '1px solid #ccc', padding: '8px', textAlign: 'left', verticalAlign: 'middle' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' };
const buttonStyle = (color) => ({ padding: '10px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' });
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '20px 30px', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)', maxHeight: '90vh', overflowY: 'auto' };

export default ProdukPage;