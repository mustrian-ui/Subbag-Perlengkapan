import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Search, 
  Filter, 
  Building2, 
  User, 
  MapPin, 
  ExternalLink,
  Briefcase,
  Car,
  Utensils,
  Gift,
  MessageSquareText,
  Calendar,
  XCircle,
  Layers,
  ChevronRight,
  Phone,
  Package
} from 'lucide-react';
import { Booking, Vehicle, LogisticsRequest, SajiRapatRequest, CinderamataRequest, Complaint } from '../types';

export type AppFilterType = 'all' | 'siperum' | 'sipakar' | 'sajirapat' | 'silogis' | 'petacendera' | 'lapor';
export type StatusFilterType = 'all' | 'pending' | 'process' | 'done' | 'rejected';

interface ServiceReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAppFilter?: AppFilterType;
  isAdminActive: boolean;
  bookings: Booking[];
  vehicles: Vehicle[];
  logistics: LogisticsRequest[];
  sajiRapat?: SajiRapatRequest[];
  cinderamata?: CinderamataRequest[];
  complaints: Complaint[];
  onUpdateBookingStatus: (id: string, status: string) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
  onUpdateVehicleStatus: (id: string, status: string) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
  onUpdateLogisticsStatus: (id: string, status: string) => Promise<void>;
  onDeleteLogistics: (id: string) => Promise<void>;
  onUpdateSajiRapatStatus?: (id: string, status: string) => Promise<void>;
  onDeleteSajiRapat?: (id: string) => Promise<void>;
  onUpdateCinderamataStatus?: (id: string, status: string) => Promise<void>;
  onDeleteCinderamata?: (id: string) => Promise<void>;
  onUpdateComplaintStatus: (id: string, status: 'Masuk' | 'Diproses' | 'Selesai') => Promise<void>;
  onDeleteComplaint: (id: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface UnifiedReportItem {
  uid: string;
  sourceId: string;
  appType: 'siperum' | 'sipakar' | 'sajirapat' | 'silogis' | 'petacendera' | 'lapor';
  appName: string;
  badgeLabel: string;
  title: string;
  requester: string;
  department: string;
  details: string;
  phone?: string;
  dateStr: string;
  status: string;
  statusCategory: 'pending' | 'process' | 'done' | 'rejected';
  documentUrl?: string;
  documentName?: string;
  raw: any;
}

export default function ServiceReportsModal({
  isOpen,
  onClose,
  initialAppFilter = 'all',
  isAdminActive,
  bookings,
  vehicles,
  logistics,
  sajiRapat,
  cinderamata = [],
  complaints,
  onUpdateBookingStatus,
  onDeleteBooking,
  onUpdateVehicleStatus,
  onDeleteVehicle,
  onUpdateLogisticsStatus,
  onDeleteLogistics,
  onUpdateSajiRapatStatus,
  onDeleteSajiRapat,
  onUpdateCinderamataStatus,
  onDeleteCinderamata,
  onUpdateComplaintStatus,
  onDeleteComplaint,
  showToast
}: ServiceReportsModalProps) {
  const [appFilter, setAppFilter] = useState<AppFilterType>(initialAppFilter);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setAppFilter(initialAppFilter);
    }
  }, [isOpen, initialAppFilter]);

  if (!isOpen) return null;

  // Transform all items into unified schema for unified filtering & display
  const unifiedItems: UnifiedReportItem[] = [];

  // 1. SIPERUM
  bookings.forEach(b => {
    let cat: 'pending' | 'process' | 'done' | 'rejected' = 'pending';
    const s = (b.status || '').toLowerCase();
    if (s.includes('selesai')) cat = 'done';
    else if (s.includes('tolak')) cat = 'rejected';
    else if (s.includes('setuju')) cat = 'process';
    else cat = 'pending';

    unifiedItems.push({
      uid: `siperum_${b.id}`,
      sourceId: b.id,
      appType: 'siperum',
      appName: 'SIPERUM',
      badgeLabel: 'Peminjaman Ruang',
      title: `${b.ruang} - ${b.agenda}`,
      requester: b.pemohon || 'Pejabat/Staff Setda',
      department: b.instansi || 'Organisasi Perangkat Daerah',
      phone: b.kontak,
      details: `Jadwal: ${b.tanggal} (${b.waktu}) | Ruangan: ${b.ruang}`,
      dateStr: b.tanggal || (b.createdAt ? new Date(b.createdAt).toLocaleDateString('id-ID') : 'Terjadwal'),
      status: b.status,
      statusCategory: cat,
      documentUrl: b.documentUrl,
      documentName: b.documentName,
      raw: b
    });
  });

  // 2. SIPAKAR
  vehicles.forEach(v => {
    let cat: 'pending' | 'process' | 'done' | 'rejected' = 'pending';
    const s = (v.status || '').toLowerCase();
    if (s.includes('selesai')) cat = 'done';
    else if (s.includes('tolak')) cat = 'rejected';
    else if (s.includes('setuju')) cat = 'process';
    else cat = 'pending';

    unifiedItems.push({
      uid: `sipakar_${v.id}`,
      sourceId: v.id,
      appType: 'sipakar',
      appName: 'SIPAKAR',
      badgeLabel: 'Kendaraan Dinas',
      title: `${v.kendaraan} - ${v.tujuan}`,
      requester: v.pemohon || 'Driver/Pejabat',
      department: v.instansi || 'Bagian Terkait',
      phone: v.kontak,
      details: `Armada: ${v.kendaraan} | Tujuan: ${v.tujuan}`,
      dateStr: v.createdAt ? new Date(v.createdAt).toLocaleDateString('id-ID') : 'Aktif',
      status: v.status,
      statusCategory: cat,
      documentUrl: v.documentUrl,
      documentName: v.documentName,
      raw: v
    });
  });

  // 3. SajiRapat
  const cateringList = sajiRapat || [];
  cateringList.forEach(item => {
    let cat: 'pending' | 'process' | 'done' | 'rejected' = 'pending';
    const s = (item.status || '').toLowerCase();
    if (s.includes('selesai')) cat = 'done';
    else if (s.includes('tolak')) cat = 'rejected';
    else if (s.includes('menunggu')) cat = 'pending';
    else cat = 'process';

    unifiedItems.push({
      uid: `sajirapat_${item.id}`,
      sourceId: item.id,
      appType: 'sajirapat',
      appName: 'SajiRapat',
      badgeLabel: 'Konsumsi Rapat',
      title: `${item.acara} (${item.porsi} Porsi - ${item.jenisKonsumsi})`,
      requester: item.pemohon || 'Staff Pemohon',
      department: item.instansi || 'Bagian / OPD',
      phone: item.kontak,
      details: `Konsumsi: ${item.jenisKonsumsi} | Jumlah: ${item.porsi} Porsi | Jadwal: ${item.tanggal} ${item.waktu} | Lokasi: ${item.lokasi}${item.catatan ? ` | Catatan: ${item.catatan}` : ''}`,
      dateStr: item.tanggal || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : 'Aktif'),
      status: item.status,
      statusCategory: cat,
      documentUrl: item.documentUrl,
      documentName: item.documentName,
      raw: item
    });
  });

  // 4. SILOGIS (Logistik & ATK Perlengkapan)
  logistics.forEach(l => {
    let cat: 'pending' | 'process' | 'done' | 'rejected' = 'pending';
    const s = (l.status || '').toLowerCase();
    if (s.includes('selesai')) cat = 'done';
    else if (s.includes('tolak')) cat = 'rejected';
    else if (s.includes('setuju') || s.includes('proses')) cat = 'process';
    else cat = 'pending';

    unifiedItems.push({
      uid: `silogis_${l.id}`,
      sourceId: l.id,
      appType: 'silogis',
      appName: 'SILOGIS',
      badgeLabel: 'Logistik & ATK',
      title: `${l.barang} (${l.jumlah})`,
      requester: l.pemohon || 'Staff Pemohon',
      department: l.instansi || 'Bagian / OPD',
      phone: l.kontak,
      details: `Barang: ${l.barang} | Jumlah: ${l.jumlah} | Keperluan: ${l.kegiatan || '-'}`,
      dateStr: l.createdAt ? new Date(l.createdAt).toLocaleDateString('id-ID') : 'Aktif',
      status: l.status,
      statusCategory: cat,
      documentUrl: l.documentUrl,
      documentName: l.documentName,
      raw: l
    });
  });

  // 4. PetaCendera (Permintaan & Pengelolaan Cinderamata)
  cinderamata.forEach(c => {
    let cat: 'pending' | 'process' | 'done' | 'rejected' = 'pending';
    const s = (c.status || '').toLowerCase();
    if (s.includes('selesai')) cat = 'done';
    else if (s.includes('tolak')) cat = 'rejected';
    else if (s.includes('setuju') || s.includes('persiap') || s.includes('proses')) cat = 'process';
    else cat = 'pending';

    unifiedItems.push({
      uid: `cinderamata_${c.id}`,
      sourceId: c.id,
      appType: 'petacendera',
      appName: 'PetaCendera',
      badgeLabel: 'Cinderamata & Souvenir',
      title: `${c.jenisCinderamata} (${c.jumlah}) - Penerima: ${c.penerima}`,
      requester: `${c.pemohon}${c.nip ? ` (NIP: ${c.nip})` : ''}`,
      department: c.instansi,
      phone: c.kontak,
      details: `Keperluan: ${c.keperluan} | Tanggal Diperlukan: ${c.tanggalPerlu} | Tamu/Penerima: ${c.penerima}${c.catatan ? ` | Catatan: ${c.catatan}` : ''}`,
      dateStr: c.tanggalPerlu || (c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID') : 'Aktif'),
      status: c.status,
      statusCategory: cat,
      documentUrl: c.documentUrl,
      documentName: c.documentName,
      raw: c
    });
  });

  // 5. LAPOR-RT
  complaints.forEach(c => {
    let cat: 'pending' | 'process' | 'done' | 'rejected' = 'pending';
    if (c.status === 'Selesai') cat = 'done';
    else if (c.status === 'Diproses') cat = 'process';
    else cat = 'pending';

    unifiedItems.push({
      uid: `lapor_${c.id}`,
      sourceId: c.id,
      appType: 'lapor',
      appName: 'LAPOR-RT',
      badgeLabel: 'Aduan Sarpras',
      title: c.message,
      requester: `${c.name}${c.nip ? ` (NIP: ${c.nip})` : ''}`,
      department: c.bagian,
      details: `Lokasi: ${c.location || '-'} | Jenis: ${c.type}`,
      dateStr: c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'Baru saja',
      status: c.status,
      statusCategory: cat,
      raw: c
    });
  });

  // Metrics across currently selected app filter
  const itemsInCurrentApp = unifiedItems.filter(item => {
    if (appFilter === 'all') return true;
    return item.appType === appFilter;
  });

  const totalCount = itemsInCurrentApp.length;
  const countPending = itemsInCurrentApp.filter(i => i.statusCategory === 'pending').length;
  const countProcess = itemsInCurrentApp.filter(i => i.statusCategory === 'process').length;
  const countDone = itemsInCurrentApp.filter(i => i.statusCategory === 'done').length;

  // Filtered List for Display
  const filteredItems = itemsInCurrentApp.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.statusCategory === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const matchesSearch = 
      item.title.toLowerCase().includes(q) ||
      item.requester.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      item.appName.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Action Handlers for each application type
  const handleAction = async (item: UnifiedReportItem, newStatus: string) => {
    setLoadingId(item.uid);
    try {
      if (item.appType === 'siperum') {
        await onUpdateBookingStatus(item.sourceId, newStatus);
      } else if (item.appType === 'sipakar') {
        await onUpdateVehicleStatus(item.sourceId, newStatus);
      } else if (item.appType === 'sajirapat') {
        if (onUpdateSajiRapatStatus) {
          await onUpdateSajiRapatStatus(item.sourceId, newStatus);
        } else {
          await onUpdateLogisticsStatus(item.sourceId, newStatus);
        }
      } else if (item.appType === 'silogis') {
        await onUpdateLogisticsStatus(item.sourceId, newStatus);
      } else if (item.appType === 'petacendera') {
        if (onUpdateCinderamataStatus) {
          await onUpdateCinderamataStatus(item.sourceId, newStatus);
        }
      } else if (item.appType === 'lapor') {
        await onUpdateComplaintStatus(item.sourceId, newStatus as any);
      }
      showToast(`[${item.appName}] Status permohonan berhasil diubah menjadi: ${newStatus}`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Gagal memperbarui status ${item.appName}.`, 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteItem = async (item: UnifiedReportItem) => {
    if (!window.confirm(`Hapus permohonan/laporan ini (${item.title})?`)) return;
    setLoadingId(item.uid);
    try {
      if (item.appType === 'siperum') {
        await onDeleteBooking(item.sourceId);
      } else if (item.appType === 'sipakar') {
        await onDeleteVehicle(item.sourceId);
      } else if (item.appType === 'sajirapat') {
        if (onDeleteSajiRapat) {
          await onDeleteSajiRapat(item.sourceId);
        } else {
          await onDeleteLogistics(item.sourceId);
        }
      } else if (item.appType === 'silogis') {
        await onDeleteLogistics(item.sourceId);
      } else if (item.appType === 'petacendera') {
        if (onDeleteCinderamata) {
          await onDeleteCinderamata(item.sourceId);
        }
      } else if (item.appType === 'lapor') {
        await onDeleteComplaint(item.sourceId);
      }
      showToast(`Data [${item.appName}] berhasil dihapus.`, 'info');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus data.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300 my-8 max-h-[92vh] flex flex-col">
        
        {/* Header with App Filters */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 relative flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                Pusat Rekap &amp; Tindakan
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Kelola Seluruh Laporan Layanan Subbag Rumah Tangga
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2 font-display">
              <Layers className="w-6 h-6 text-emerald-400" />
              Laporan Pelayanan &amp; Pengambilan Tindakan Langsung
            </h3>
          </div>

          <button
            onClick={onClose}
            className="self-end md:self-auto text-white/80 hover:text-white transition p-2 bg-white/10 hover:bg-white/20 rounded-2xl cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Micro-App Navigation Tabs */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setAppFilter('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              appFilter === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Layanan ({unifiedItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAppFilter('siperum')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              appFilter === 'siperum'
                ? 'bg-teal-700 text-white shadow'
                : 'bg-white text-teal-800 hover:bg-teal-50 border border-teal-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-teal-500" />
            <span>SIPERUM - Ruang ({bookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAppFilter('sipakar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              appFilter === 'sipakar'
                ? 'bg-amber-700 text-white shadow'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-amber-500" />
            <span>SIPAKAR - Kendaraan ({vehicles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAppFilter('sajirapat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              appFilter === 'sajirapat'
                ? 'bg-orange-700 text-white shadow'
                : 'bg-white text-orange-800 hover:bg-orange-50 border border-orange-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-orange-500" />
            <span>SajiRapat - Konsumsi ({cateringList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAppFilter('silogis')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              appFilter === 'silogis'
                ? 'bg-blue-700 text-white shadow'
                : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-blue-500" />
            <span>SILOGIS - Logistik ({logistics.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAppFilter('petacendera')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              appFilter === 'petacendera'
                ? 'bg-purple-700 text-white shadow'
                : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-purple-500" />
            <span>PetaCendera - Cinderamata ({cinderamata.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAppFilter('lapor')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              appFilter === 'lapor'
                ? 'bg-rose-700 text-white shadow'
                : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-rose-500" />
            <span>LAPOR-RT - Aduan ({complaints.length})</span>
          </button>
        </div>

        {/* Top Metric Strip & Controls */}
        <div className="p-6 bg-slate-50 border-b border-slate-200/80 space-y-4 flex-shrink-0">
          
          {/* Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Masuk</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Perlu Tindakan</p>
                <p className="text-2xl font-black text-amber-600 mt-0.5">{countPending}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-blue-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Sedang Berjalan</p>
                <p className="text-2xl font-black text-blue-600 mt-0.5">{countProcess}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Telah Selesai</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{countDone}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter Tabs and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Perlu Tindakan ({countPending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('process')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === 'process'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Diproses / Disetujui ({countProcess})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('done')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === 'done'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Selesai ({countDone})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari pemohon, instansi, agenda, unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 text-xs absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Main List of Actionable Reports */}
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Filter className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Tidak ada permohonan atau laporan</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                {searchQuery 
                  ? 'Tidak ada data yang cocok dengan kata kunci pencarian Anda.' 
                  : 'Belum ada permohonan masuk pada kategori atau status ini.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isPending = item.statusCategory === 'pending';
              const isProcess = item.statusCategory === 'process';
              const isDone = item.statusCategory === 'done';
              const isRejected = item.statusCategory === 'rejected';

              const appColors = 
                item.appType === 'siperum'
                  ? 'border-teal-500/40 bg-teal-50/20'
                  : item.appType === 'sipakar'
                    ? 'border-amber-500/40 bg-amber-50/20'
                    : item.appType === 'sajirapat'
                      ? 'border-orange-500/40 bg-orange-50/20'
                      : item.appType === 'silogis'
                        ? 'border-blue-500/40 bg-blue-50/20'
                        : item.appType === 'petacendera'
                          ? 'border-purple-500/40 bg-purple-50/20'
                          : 'border-rose-500/40 bg-rose-50/20';

              const appBadge = 
                item.appType === 'siperum'
                  ? 'bg-teal-100 text-teal-800 border-teal-200'
                  : item.appType === 'sipakar'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : item.appType === 'sajirapat'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : item.appType === 'silogis'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : item.appType === 'petacendera'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200';

              return (
                <div 
                  key={item.uid}
                  className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition duration-200 space-y-4 ${appColors}`}
                >
                  {/* Card Header & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      
                      {/* App Origin Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${appBadge}`}>
                        {item.appType === 'siperum' && <Briefcase className="w-3 h-3" />}
                        {item.appType === 'sipakar' && <Car className="w-3 h-3" />}
                        {item.appType === 'sajirapat' && <Utensils className="w-3 h-3" />}
                        {item.appType === 'silogis' && <Package className="w-3 h-3" />}
                        {item.appType === 'petacendera' && <Gift className="w-3 h-3" />}
                        {item.appType === 'lapor' && <MessageSquareText className="w-3 h-3" />}
                        <span>{item.appName}: {item.badgeLabel}</span>
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isProcess
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : isDone
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isPending ? 'bg-amber-500 animate-pulse' : isProcess ? 'bg-blue-500' : isDone ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        {item.status}
                      </span>

                      {/* Date Indicator */}
                      <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.dateStr}</span>
                      </span>

                    </div>

                    {/* Direct Action Buttons - LANGSUNG BISA DIAMBIL TINDAKAN */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      
                      {/* Action 1: Setujui / Proses */}
                      {item.appType === 'siperum' && item.status !== 'Disetujui' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Disetujui')}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                          title="Setujui Peminjaman Ruang"
                        >
                          Setujui
                        </button>
                      )}

                      {item.appType === 'sipakar' && item.status !== 'Disetujui' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Disetujui')}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                          title="Validasi & Setujui Surat Jalan"
                        >
                          Setujui Jalan
                        </button>
                      )}

                      {item.appType === 'sajirapat' && item.status !== 'Diproses' && item.status !== 'Disiapkan' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Disiapkan')}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-orange-600 hover:bg-orange-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                          title="Siapkan Konsumsi Rapat"
                        >
                          Siapkan Konsumsi
                        </button>
                      )}

                      {item.appType === 'silogis' && item.status !== 'Diproses' && item.status !== 'Disiapkan' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Disiapkan')}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                          title="Proses Kebutuhan Logistik"
                        >
                          Proses Logistik
                        </button>
                      )}

                      {item.appType === 'petacendera' && item.status !== 'Diproses' && item.status !== 'Dipersiapkan' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Dipersiapkan')}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                          title="Siapkan Cinderamata"
                        >
                          Siapkan Souvenir
                        </button>
                      )}

                      {item.appType === 'lapor' && item.status !== 'Diproses' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Diproses')}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                          title="Tandai Sedang Diproses"
                        >
                          Diproses
                        </button>
                      )}

                      {/* Action 2: Selesai */}
                      {item.status !== 'Selesai' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Selesai')}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-sm active:scale-95"
                          title="Tandai Pelayanan Selesai"
                        >
                          Selesai
                        </button>
                      )}

                      {/* Action 3: Tolak (untuk reservasi/kendaraan/logistik/cinderamata) */}
                      {item.status !== 'Ditolak' && item.appType !== 'lapor' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Ditolak')}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 transition cursor-pointer"
                          title="Tolak Permohonan"
                        >
                          Tolak
                        </button>
                      )}

                      {/* Action 4: Kembalikan ke Masuk (untuk pengaduan) */}
                      {item.appType === 'lapor' && item.status !== 'Masuk' && (
                        <button
                          type="button"
                          disabled={loadingId === item.uid}
                          onClick={() => handleAction(item, 'Masuk')}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition cursor-pointer"
                          title="Tandai Masuk Kembali"
                        >
                          Masuk
                        </button>
                      )}

                      {/* Action 5: Hapus Record */}
                      <button
                        type="button"
                        disabled={loadingId === item.uid}
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-1 cursor-pointer"
                        title="Hapus Laporan / Permohonan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>

                  {/* Requester & Department Information Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Nama Pemohon:</span>
                        <span className="font-bold text-slate-800">{item.requester}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Instansi / Unit Kerja:</span>
                        <span className="font-semibold text-slate-700">{item.department}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Fasilitas / Lokasi:</span>
                        <span className="font-semibold text-slate-700">{item.details}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content / Agenda / Message Details */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Uraian Agenda / Keperluan / Rincian:
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-150">
                      {item.title}
                    </p>
                  </div>

                  {/* Document Attachment Preview if available */}
                  {item.documentUrl && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Lampiran Surat Tugas / Dokumen:
                      </span>
                      <a 
                        href={item.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-extrabold bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Surat / Dokumen Permohonan</span>
                      </a>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-500 font-medium">
            💡 Setiap perubahan status langsung tersimpan ke database &amp; dapat diunduh melalui panel Ekspor Excel/CSV.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
