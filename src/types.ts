export type AppCategory = 'internal' | 'logistics' | 'public';

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
  status: 'Disetujui' | 'Menunggu Konfirmasi';
  documentUrl?: string;
  documentName?: string;
  pemohon?: string;
  instansi?: string;
}

export interface Vehicle {
  id: string;
  kendaraan: string;
  pemohon: string;
  tujuan: string;
  status: 'Disetujui' | 'Menunggu Validasi' | 'Menunggu Konfirmasi';
  documentUrl?: string;
  documentName?: string;
  instansi?: string;
}

export interface LogisticsRequest {
  id: string;
  barang: string;
  jumlah: string;
  status: 'Selesai' | 'Diproses';
  documentUrl?: string;
  documentName?: string;
  kegiatan?: string;
  pemohon?: string;
  instansi?: string;
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

