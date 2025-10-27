// src/context/CartContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

// Helper untuk mengambil data dari Local Storage
const getLocalData = (key) => {
  try {
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : null;
  } catch (error) {
    console.error(`Gagal parse ${key} dari local storage`, error);
    return null;
  }
};

export function CartProvider({ children }) {
  // Ambil keranjang DAN storeId dari local storage
  const [cartItems, setCartItems] = useState(getLocalData('shoppingCart') || []);

// --- TAMBAHKAN LOG DI SINI ---
  const initialStoreId = getLocalData('currentStoreId');
  //console.log("CartContext Init: Reading 'currentStoreId' from LS:", initialStoreId);
  const [currentStoreId, setCurrentStoreId] = useState(initialStoreId || null);
  // -----------------------------


  // Simpan KEDUA state ke Local Storage saat berubah
  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    //console.log("CartContext Effect: Saving 'currentStoreId' to LS:", currentStoreId); // Log saat menyimpan
    localStorage.setItem('currentStoreId', JSON.stringify(currentStoreId));
  }, [currentStoreId]);


  const addToCart = (product) => {
    // --- Logika BARU: Cek Toko ---
    // Cek apakah keranjang kosong ATAU item baru berasal dari toko yg sama
    if (cartItems.length === 0 || product.storeId === currentStoreId) {
      
      // Jika keranjang kosong, set storeId toko ini
      if (cartItems.length === 0) {
        setCurrentStoreId(product.storeId);
      }

      // Lanjutkan logika tambah ke keranjang
      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === product.id);
        if (existingItem) {
          return prevItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          return [...prevItems, { ...product, quantity: 1 }];
        }
      });
      //console.log("Produk ditambahkan:", product.namaProduk);

    } else {
      // --- Logika Gagal: Beda Toko ---
      // Jika item baru berasal dari toko BERBEDA
      alert(
        "Anda hanya dapat membeli dari satu toko dalam satu waktu.\n\n" +
        "Harap selesaikan pembelian Anda dari toko sebelumnya atau kosongkan keranjang Anda untuk memulai dari toko ini."
      );
    }
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => {
      const newItems = prevItems.filter((item) => item.id !== productId);
      // Jika keranjang jadi kosong, reset storeId
      //if (newItems.length === 0) {
      //  setCurrentStoreId(null);
      //}
      return newItems;
    });
  };
  
  // Fungsi untuk mengosongkan keranjang (akan kita pakai setelah checkout)
  const clearCart = () => {
    //console.log("clearCart called."); // Tambahkan log jika perlu
    setCartItems([]);
    // Pastikan TIDAK ada setCurrentStoreId(null);
  };

  const updateQuantity = (productId, newQuantity) => {
    const qty = Number(newQuantity);
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) => {
      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      );
    });
  };

  const value = {
    cartItems,
    currentStoreId, // <-- Ekspor storeId
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart, // <-- Ekspor fungsi baru
    itemCount: cartItems.reduce((total, item) => total + item.quantity, 0)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}