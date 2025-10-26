// src/utils/formatRupiah.js

export const formatRupiah = (angka) => {
  if (angka === null || angka === undefined) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};