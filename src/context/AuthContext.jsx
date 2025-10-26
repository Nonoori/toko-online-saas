// src/context/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // --- FUNGSI HELPER BARU YANG LEBIH "SABAR" ---
  const getUserProfile = async (user, retries = 3) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // --- KASUS NORMAL ---
        // Profil ditemukan! Gabungkan data.
        return { ...user, ...docSnap.data() };
      } else {
        // --- KASUS: Profil belum ada (mungkin race condition) ---
        if (retries > 0) {
          // Jika kita masih punya jatah percobaan,
          // tunggu 1 detik dan coba lagi.
          console.warn(`Profil belum ditemukan (UID: ${user.uid}), mencoba lagi... Sisa ${retries} percobaan.`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await getUserProfile(user, retries - 1);
        } else {
          // --- KASUS ZOMBIE (Setelah 3x coba, beneran tidak ada) ---
          console.error(`Error: User ${user.uid} ada di Auth tapi profil tidak ditemukan. Logout paksa.`);
          await signOut(auth);
          return null;
        }
      }
    } catch (error) {
      // Jika ada error saat mengambil data (misal: jaringan)
      console.error("Error fetching user profile:", error);
      await signOut(auth);
      return null;
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // --- User baru saja login ---
        // Panggil helper function kita yang "sabar"
        const userProfile = await getUserProfile(user);
        setCurrentUser(userProfile);
      } else {
        // --- User baru saja logout ---
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []); 

  const value = {
    currentUser,
    loading 
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div>Memeriksa autentikasi...</div> : children}
    </AuthContext.Provider>
  );
}