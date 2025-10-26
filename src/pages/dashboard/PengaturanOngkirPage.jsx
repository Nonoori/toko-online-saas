// src/pages/dashboard/PengaturanOngkirPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

// Ambil URL dan Key dari environment variables
const RAJAONGKIR_API_URL = import.meta.env.VITE_RAJAONGKIR_API_URL;
const RAJAONGKIR_API_KEY = import.meta.env.VITE_RAJAONGKIR_API_KEY;

// --- Data Placeholder Kota/Kabupaten ---
// Ganti atau tambahkan sesuai kebutuhan awal Anda.
// Idealnya nanti diambil dari API RajaOngkir.
/*
const placeholderCities = [
  // Contoh beberapa kota besar di Indonesia
  { city_id: '152', province_id: '6', province: 'DKI Jakarta', type: 'Kota', city_name: 'Jakarta Pusat', postal_code: '10110' },
  { city_id: '151', province_id: '6', province: 'DKI Jakarta', type: 'Kota', city_name: 'Jakarta Barat', postal_code: '11110' },
  { city_id: '22', province_id: '9', province: 'Jawa Barat', type: 'Kabupaten', city_name: 'Bandung', postal_code: '40111' },
  { city_id: '23', province_id: '9', province: 'Jawa Barat', type: 'Kota', city_name: 'Bandung', postal_code: '40111' },
  { city_id: '444', province_id: '10', province: 'Jawa Timur', type: 'Kota', city_name: 'Surabaya', postal_code: '60119' },
  { city_id: '255', province_id: '13', province: 'Kalimantan Timur', type: 'Kota', city_name: 'Balikpapan', postal_code: '76111' },
  { city_id: '278', province_id: '21', province: 'Nanggroe Aceh Darussalam (NAD)', type: 'Kota', city_name: 'Banda Aceh', postal_code: '23111' },
  // Tambahkan kota/kabupaten lain yang relevan di sini
];
*/
// ------------------------------------


function PengaturanOngkirPage() {
  const { currentUser } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [originProvinceId, setOriginProvinceId] = useState('');
  const [originCityId, setOriginCityId] = useState('');
  const [originCityName, setOriginCityName] = useState('');

  // State untuk dropdown
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // --- Hapus state 'loading' duplikat ---
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


// --- Fungsi Fetch API RajaOngkir (dengan useCallback) ---
  const fetchRajaOngkir = useCallback(async (endpoint) => {
    if (!RAJAONGKIR_API_KEY) {
      setError("API Key RajaOngkir belum diatur di file .env");
      return null;
    }
    // Perhatikan: Penggunaan 'cors-anywhere' atau proxy sejenis MUNGKIN diperlukan
    // jika RajaOngkir memblokir request langsung dari browser.
    // URL proxy contoh: `https://cors-anywhere.herokuapp.com/${RAJAONGKIR_API_URL}/${endpoint}`
    // Anda perlu setup proxy sendiri atau cari yg aktif.
    // Untuk pengembangan lokal, ekstensi browser CORS Unblock mungkin bisa.
    const url = `${RAJAONGKIR_API_URL}/${endpoint}`;
    console.log("Fetching:", url); // Log URL

    try {
      const response = await fetch(url, { method: 'GET', headers: { 'key': RAJAONGKIR_API_KEY } });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("RajaOngkir API Error:", errorData);
        throw new Error(`RajaOngkir API Error (${response.status}): ${errorData?.rajaongkir?.status?.description || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      return data?.rajaongkir?.results || null;
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(`Gagal mengambil data dari RajaOngkir: ${err.message}. Mungkin perlu CORS proxy?`);
      return null;
    }
  }, []); // useCallback agar fungsi tidak dibuat ulang terus


useEffect(() => {
    // ... (Logika fetch data awal tidak berubah) ...
    // Pastikan setLoadingInitial(false) dipanggil di finally
     let isMounted = true;
     if (!currentUser || !currentUser.storeId) return;
     const loadInitialData = async () => { /* ... fetch store settings AND provinces ... */ };
     loadInitialData();
     return () => { isMounted = false; };
  }, [currentUser, fetchRajaOngkir]);


// 2. Ambil Daftar Kota saat Provinsi Dipilih
  useEffect(() => {
    // ... (Logika fetch kota tidak berubah) ...
     let isMounted = true;
     if (originProvinceId) {
       setLoadingCities(true);
       setCities([]);
       const loadCities = async () => {
        const cityData = await fetchRajaOngkir(`city?province=${originProvinceId}`);
        if (cityData && isMounted) {
          setCities(cityData);
        }
        setLoadingCities(false);
      };
      loadCities();
    } else {
      setCities([]); // Kosongkan jika provinsi tidak dipilih
    }
     return () => { isMounted = false; };
  }, [originProvinceId, fetchRajaOngkir]);


/*

  // 1. Ambil Pengaturan Tersimpan & Daftar Provinsi Awal
  useEffect(() => {
    let isMounted = true; // Flag untuk mencegah update state jika komponen unmount
    if (!currentUser || !currentUser.storeId) return;

    const loadInitialData = async () => {
      setLoadingInitial(true);
      setError('');
      try {
        // Ambil pengaturan toko
        const storeDocRef = doc(db, "stores", currentUser.storeId);
        const docSnap = await getDoc(storeDocRef);
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data();
          setApiKey(data.rajaOngkirApiKey || '');
          setOriginProvinceId(data.originProvinceId || '');
          setOriginCityId(data.originCityId || '');
          setOriginCityName(data.originCityName || '');
        }

        // Ambil daftar provinsi
        setLoadingProvinces(true);
        const provinceData = await fetchRajaOngkir('province');
        if (provinceData && isMounted) {
          setProvinces(provinceData);
        }
        setLoadingProvinces(false);

      } catch (err) {
        // Error sudah ditangani di fetchRajaOngkir atau getDoc
         if (isMounted) setError("Gagal memuat data awal.");
         console.error(err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };
    loadInitialData();
    return () => { isMounted = false; }; // Cleanup function
  }, [currentUser, fetchRajaOngkir]);


  // 2. Ambil Daftar Kota saat Provinsi Dipilih
  useEffect(() => {
     let isMounted = true;
    if (originProvinceId) {
      setLoadingCities(true);
      setCities([]); // Kosongkan kota lama
      const loadCities = async () => {
        const cityData = await fetchRajaOngkir(`city?province=${originProvinceId}`);
        if (cityData && isMounted) {
          setCities(cityData);
        }
        setLoadingCities(false);
      };
      loadCities();
    } else {
      setCities([]); // Kosongkan jika provinsi tidak dipilih
    }
     return () => { isMounted = false; };
  }, [originProvinceId, fetchRajaOngkir]);

// 2. Handle Perubahan Dropdown Kota
  const handleCityChange = (e) => {
    const selectedId = e.target.value;
    setOriginCityId(selectedId);
    // Cari nama kota berdasarkan ID yang dipilih dari placeholder
    const selectedCity = placeholderCities.find(city => city.city_id === selectedId);
    setOriginCityName(selectedCity ? `${selectedCity.type} ${selectedCity.city_name}` : '');
  };

*/

  // 3. Handle Simpan Pengaturan
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!originCityId) { setError("Silakan pilih kota/kabupaten asal."); return; }
    setSaving(true);
    setError('');
    setSuccess('');

    // Dapatkan nama kota berdasarkan ID yang dipilih DARI STATE 'cities'
    const selectedCity = cities.find(city => city.city_id === originCityId);
    // Jika kota tidak ditemukan di state (jarang terjadi), coba cari di placeholder
    const cityName = selectedCity ? `${selectedCity.type} ${selectedCity.city_name}`
                       : (placeholderCities.find(c => c.city_id === originCityId)?.city_name || ''); // Fallback

    try {
      const storeDocRef = doc(db, "stores", currentUser.storeId);
      await setDoc(storeDocRef, {
        rajaOngkirApiKey: apiKey.trim(),
        originProvinceId: originProvinceId,
        originCityId: originCityId,
        originCityName: cityName, // Simpan nama yang benar
      }, { merge: true });


      setOriginCityName(cityName); // Update state nama kota setelah simpan
      setSuccess("Pengaturan ongkir berhasil disimpan!");
    } catch (err) {
      console.error("Error saving ongkir settings:", err);
      setError("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  if (loadingInitial) {
    return <div style={{ padding: '20px' }}>Memuat pengaturan ongkir...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto' }}>
      <Link to="/dashboard">&larr; Kembali ke Dashboard</Link>
      <h1 style={{ textAlign: 'center' }}>Pengaturan Ongkos Kirim</h1>


        <p style={{ textAlign: 'center', color: '#666' }}>
        Masukkan API Key RajaOngkir Anda dan pilih kota asal pengiriman.
      </p>

      {success && <p style={{ color: 'green', textAlign: 'center', fontWeight: 'bold' }}>{success}</p>}
      {error && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={inputGroupStyle}>
          <label htmlFor="apiKey">API Key RajaOngkir:</label>
          <input
            type="text"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Masukkan API Key Anda (dari RajaOngkir)"
            style={inputStyle}
          />
           <small>Dapatkan API Key di <a href="https://rajaongkir.com/" target="_blank" rel="noopener noreferrer">RajaOngkir.com</a> (Paket Starter gratis)</small>
        </div>

        <div style={inputGroupStyle}>
          <label htmlFor="originCity">Kota/Kabupaten Asal Pengiriman:</label>
          {/* Idealnya, ini dropdown yang datanya diambil dari API RajaOngkir */}
          {/* Untuk sekarang, kita pakai placeholder */}
          <select
            id="originCity"
            value={originCityId}
            onChange={(e) => setOriginCityId(e.target.value)}
            style={inputStyle}
            required // Wajib diisi
          >
            <option value="" disabled>-- Pilih Kota/Kabupaten --</option>
            {placeholderCities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
            {/* Tambahkan opsi lain jika perlu */}
          </select>
          {originCityName && <small>Kota terpilih: {originCityName}</small>}
        </div>
        {/* Dropdown Provinsi */}
        <div style={inputGroupStyle}>
          <label htmlFor="originProvince">Provinsi Asal Pengiriman:</label>
          <select
            id="originProvince"
            value={originProvinceId}
            onChange={(e) => { setOriginProvinceId(e.target.value); setOriginCityId(''); }} // Reset kota saat provinsi ganti
            style={inputStyle}
            disabled={loadingProvinces}
            required
          >
            <option value="" disabled>{loadingProvinces ? 'Memuat...' : '-- Pilih Provinsi --'}</option>
            {provinces.map(prov => (
              <option key={prov.province_id} value={prov.province_id}>
                {prov.province}
              </option>
            ))}
          </select>
        </div>
        {/* Dropdown Kota/Kabupaten */}
        <div style={inputGroupStyle}>
          <label htmlFor="originCity">Kota/Kabupaten Asal Pengiriman:</label>
          <select
            id="originCity"
            value={originCityId}
            onChange={(e) => setOriginCityId(e.target.value)}
            style={inputStyle}
            disabled={!originProvinceId || loadingCities} // Disable jika provinsi belum dipilih atau sedang loading kota
            required
          >
            <option value="" disabled>
              {loadingCities ? 'Memuat...' : (originProvinceId ? '-- Pilih Kota/Kabupaten --' : 'Pilih Provinsi dulu')}
            </option>
            {cities.map(city => (
              <option key={city.city_id} value={city.city_id}>
                {city.type} {city.city_name} {/* Tampilkan tipe (Kabupaten/Kota) */}
              </option>
            ))}
          </select>
          {originCityName && <small>Kota terpilih: {originCityName}</small>}
        </div>

        <button type="submit" disabled={saving} style={buttonStyle('#007bff')}>
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan Ongkir'}
        </button>
      </form>
    </div>
  );
}

// --- CSS ---
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '1em' };
const buttonStyle = (color) => ({
    padding: '12px 20px',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1.1em',
    fontWeight: 'bold'
});

export default PengaturanOngkirPage;