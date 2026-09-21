import { Booking, Vehicle, LogisticsRequest, SajiRapatRequest, CinderamataRequest, Complaint } from '../types';

/**
 * Trigger browser file download from string content with UTF-8 BOM
 */
function downloadFile(filename: string, content: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field to handle quotes, commas, and newlines safely
 */
function escapeCsv(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Format timestamp into DD/MM/YYYY HH:mm WITA
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return dateStr;
  }
}

/**
 * Export SIPERUM Bookings to CSV
 */
export function exportBookingsCsv(bookings: Booking[]) {
  const headers = ['No', 'ID Reservasi', 'Ruangan Rapat', 'Tanggal', 'Waktu', 'Agenda / Keperluan', 'Instansi / OPD Pemohon', 'Nama Pemohon', 'Status Persetujuan'];
  const rows = bookings.map((b, idx) => [
    idx + 1,
    escapeCsv(b.id),
    escapeCsv(b.ruang),
    escapeCsv(b.tanggal),
    escapeCsv(b.waktu),
    escapeCsv(b.agenda),
    escapeCsv(b.instansi || '-'),
    escapeCsv(b.pemohon || '-'),
    escapeCsv(b.status)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const filename = `SIPERUM_Rekap_Peminjaman_Ruang_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent);
}

/**
 * Export SIPAKAR Vehicles to CSV
 */
export function exportVehiclesCsv(vehicles: Vehicle[]) {
  const headers = ['No', 'ID Permohonan', 'Armada Kendaraan Dinas', 'Instansi / Bagian', 'Nama Pemohon / Driver', 'Tujuan Operasional', 'Status Validasi'];
  const rows = vehicles.map((v, idx) => [
    idx + 1,
    escapeCsv(v.id),
    escapeCsv(v.kendaraan),
    escapeCsv(v.instansi || '-'),
    escapeCsv(v.pemohon || '-'),
    escapeCsv(v.tujuan),
    escapeCsv(v.status)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const filename = `SIPAKAR_Rekap_Kendaraan_Dinas_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent);
}

/**
 * Export SILOGIS (Logistik & ATK) to CSV
 */
export function exportLogisticsCsv(logistics: LogisticsRequest[]) {
  exportSilogisCsv(logistics);
}

/**
 * Export SILOGIS (Logistik & ATK Perlengkapan) to CSV
 */
export function exportSilogisCsv(requests: LogisticsRequest[]) {
  const headers = ['No', 'ID Permintaan', 'Nama Barang / Logistik', 'Jumlah', 'Keperluan Kegiatan', 'Nama Pemohon', 'Instansi / OPD', 'Kontak', 'Status Permintaan', 'Tanggal'];
  const rows = requests.map((r, idx) => [
    idx + 1,
    escapeCsv(r.id),
    escapeCsv(r.barang),
    escapeCsv(r.jumlah),
    escapeCsv(r.kegiatan || '-'),
    escapeCsv(r.pemohon || '-'),
    escapeCsv(r.instansi || '-'),
    escapeCsv(r.kontak || '-'),
    escapeCsv(r.status),
    escapeCsv(r.createdAt ? formatDate(r.createdAt) : '-')
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const filename = `SILOGIS_Rekap_Logistik_ATK_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent);
}

/**
 * Export SajiRapat (Fasilitasi Konsumsi Rapat) to CSV
 */
export function exportSajiRapatCsv(requests: SajiRapatRequest[]) {
  const headers = ['No', 'ID Permohonan', 'Acara Rapat / Kegiatan', 'Tanggal Rapat', 'Waktu Pelaksanaan', 'Lokasi / Ruang', 'Jumlah Porsi', 'Jenis Konsumsi', 'Nama Pemohon', 'Instansi / Bagian', 'Kontak WhatsApp', 'Catatan / Menu', 'Status'];
  const rows = requests.map((r, idx) => [
    idx + 1,
    escapeCsv(r.id),
    escapeCsv(r.acara || r.barang || '-'),
    escapeCsv(r.tanggal || '-'),
    escapeCsv(r.waktu || '-'),
    escapeCsv(r.lokasi || '-'),
    escapeCsv(r.porsi || r.jumlah || '-'),
    escapeCsv(r.jenisKonsumsi || r.barang || '-'),
    escapeCsv(r.pemohon || '-'),
    escapeCsv(r.instansi || '-'),
    escapeCsv(r.kontak || '-'),
    escapeCsv(r.catatan || r.kegiatan || '-'),
    escapeCsv(r.status)
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const filename = `SajiRapat_Rekap_Konsumsi_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent);
}

/**
 * Export PetaCendera (Permintaan & Pengelolaan Cinderamata) to CSV
 */
export function exportCinderamataCsv(requests: CinderamataRequest[]) {
  const headers = ['No', 'ID Permohonan', 'Keperluan / Acara', 'Tanggal Diperlukan', 'Penerima / Tamu Kehormatan', 'Jenis Cinderamata', 'Jumlah Unit / Paket', 'Nama Pemohon', 'Instansi / Bagian', 'Kontak', 'Catatan Penyerahan', 'Status'];
  const rows = requests.map((c, idx) => [
    idx + 1,
    escapeCsv(c.id),
    escapeCsv(c.keperluan),
    escapeCsv(c.tanggalPerlu),
    escapeCsv(c.penerima),
    escapeCsv(c.jenisCinderamata),
    escapeCsv(c.jumlah),
    escapeCsv(c.pemohon),
    escapeCsv(c.instansi),
    escapeCsv(c.kontak || '-'),
    escapeCsv(c.catatan || '-'),
    escapeCsv(c.status)
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const filename = `PetaCendera_Rekap_Cinderamata_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent);
}

/**
 * Export LAPOR-RT Complaints to CSV
 */
export function exportComplaintsCsv(complaints: Complaint[]) {
  const headers = ['No', 'ID Aduan', 'Waktu Masuk', 'Nama Pelapor', 'NIP', 'Unit / Bagian', 'Kategori Masalah', 'Lokasi Masalah', 'Uraian Pengaduan', 'Status Penanganan'];
  const rows = complaints.map((c, idx) => [
    idx + 1,
    escapeCsv(c.id),
    escapeCsv(formatDate(c.createdAt)),
    escapeCsv(c.name),
    escapeCsv(c.nip || '-'),
    escapeCsv(c.bagian),
    escapeCsv(c.type),
    escapeCsv(c.location || '-'),
    escapeCsv(c.message),
    escapeCsv(c.status)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const filename = `LAPOR-RT_Rekap_Pengaduan_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(filename, csvContent);
}
