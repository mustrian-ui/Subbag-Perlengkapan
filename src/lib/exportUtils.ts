import { Booking, Vehicle, LogisticsRequest, Complaint } from '../types';

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
 * Export SILOGIS Logistics to CSV
 */
export function exportLogisticsCsv(logistics: LogisticsRequest[]) {
  const headers = ['No', 'ID Permintaan', 'Nama Barang / ATK', 'Jumlah / Volume', 'Instansi / Bagian Pemohon', 'Nama Pemohon', 'Peruntukan / Kegiatan', 'Status Pemenuhan'];
  const rows = logistics.map((l, idx) => [
    idx + 1,
    escapeCsv(l.id),
    escapeCsv(l.barang),
    escapeCsv(l.jumlah),
    escapeCsv(l.instansi || '-'),
    escapeCsv(l.pemohon || '-'),
    escapeCsv(l.kegiatan || '-'),
    escapeCsv(l.status)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const filename = `SILOGIS_Rekap_Logistik_ATK_${new Date().toISOString().slice(0, 10)}.csv`;
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
