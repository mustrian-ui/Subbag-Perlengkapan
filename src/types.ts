export type AppCategory = 'internal' | 'logistics' | 'public' | 'consumption' | 'souvenir';

export interface Application {
  id: string;
  title: string;
  category: AppCategory;
  icon: string; // name of Lucide icon or key
  desc: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  date: string;
  url: string;
}

export interface Booking {
  id: string;
  ruang: string;
  tanggal: string;
  waktu: string;
  agenda: string;
  status: 'Disetujui' | 'Menunggu Konfirmasi' | 'Selesai' | 'Ditolak' | string;
  documentUrl?: string;
  documentName?: string;
  pemohon?: string;
  instansi?: string;
  kontak?: string;
  createdAt?: string;
}

export interface Vehicle {
  id: string;
  kendaraan: string;
  pemohon: string;
  tujuan: string;
  status: 'Disetujui' | 'Menunggu Validasi' | 'Menunggu Konfirmasi' | 'Selesai' | 'Ditolak' | string;
  documentUrl?: string;
  documentName?: string;
  instansi?: string;
  kontak?: string;
  createdAt?: string;
}

// SajiRapat (Fasilitasi & Bantuan Konsumsi Rapat)
export interface SajiRapatRequest {
  id: string;
  acara?: string;
  tanggal?: string;
  waktu?: string;
  lokasi?: string;
  pemohon?: string;
  nip?: string;
  kontak?: string;
  instansi?: string;
  porsi?: string | number; // e.g. "45 Porsi" or 45
  jenisKonsumsi?: string; // e.g. "Snack Box & Makan Siang Prasmanan"
  catatan?: string;
  status: 'Menunggu Konfirmasi' | 'Menunggu' | 'Disetujui' | 'Diproses' | 'Selesai' | 'Ditolak' | string;
  documentUrl?: string;
  documentName?: string;
  createdAt?: string;
  barang?: string;
  jumlah?: string | number;
  kegiatan?: string;
}

// LogisticsRequest (Logistik Perlengkapan / SILOGIS)
export interface LogisticsRequest {
  id: string;
  barang: string;
  jumlah: string;
  status: 'Menunggu Konfirmasi' | 'Menunggu' | 'Diproses' | 'Disetujui' | 'Selesai' | 'Ditolak' | string;
  documentUrl?: string;
  documentName?: string;
  kegiatan?: string;
  pemohon?: string;
  instansi?: string;
  kontak?: string;
  nip?: string;
  createdAt?: string;
  acara?: string;
  tanggal?: string;
  waktu?: string;
  lokasi?: string;
  porsi?: string | number;
  jenisKonsumsi?: string;
  catatan?: string;
}

// PetaCendera (Permintaan & Pengelolaan Cinderamata)
export interface CinderamataRequest {
  id: string;
  keperluan: string;
  tanggalPerlu: string;
  pemohon: string;
  nip?: string;
  kontak?: string;
  instansi: string;
  penerima?: string;
  jenisCinderamata: string;
  jumlah: string | number; // e.g. "3 Paket" or 3
  catatan?: string;
  status: 'Menunggu Konfirmasi' | 'Menunggu' | 'Disetujui' | 'Dipersiapkan' | 'Selesai' | 'Ditolak' | string;
  documentUrl?: string;
  documentName?: string;
  createdAt?: string;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface MisiItem {
  id: string;
  title: string;
  desc: string;
}

export interface LandingPageContent {
  heroTagline: string;
  heroTitlePrefix: string;
  heroTitleAccent: string;
  heroDesc: string;
  heroBgUrl: string;
  heroPhone: string;
  visiMisiSubtitle: string;
  visiTitle: string;
  visiText: string;
  misiSubtitle: string;
  misiTitle: string;
  misiItems: MisiItem[];
}

export interface HallSchedule {
  id: string;
  hariTanggal: string; // Hari/Tanggal
  kegiatan: string; // Kegiatan
  instansi: string; // Instansi
  keterangan: string; // Keterangan
}

export interface Complaint {
  id: string;
  name: string;
  nip?: string;
  bagian: string;
  type: string;
  location?: string;
  message: string;
  status: 'Masuk' | 'Diproses' | 'Selesai';
  createdAt: string;
}

