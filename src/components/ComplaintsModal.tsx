import React, { useState } from 'react';
import { X, AlertCircle, Clock, CheckCircle2, Trash2, Search, Filter, Building2, User, MapPin, MessageSquareText } from 'lucide-react';
import { Complaint } from '../types';

interface ComplaintsModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: Complaint[];
  onUpdateStatus: (id: string, status: 'Masuk' | 'Diproses' | 'Selesai') => Promise<void>;
  onDeleteComplaint: (id: string) => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ComplaintsModal({
  isOpen,
  onClose,
  complaints,
  onUpdateStatus,
  onDeleteComplaint,
  showToast
}: ComplaintsModalProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'Masuk' | 'Diproses' | 'Selesai'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalComplaints = complaints.length;
  const countMasuk = complaints.filter(c => c.status === 'Masuk').length;
  const countDiproses = complaints.filter(c => c.status === 'Diproses').length;
  const countSelesai = complaints.filter(c => c.status === 'Selesai').length;

  const filteredComplaints = complaints.filter(c => {
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      c.name.toLowerCase().includes(query) ||
      c.bagian.toLowerCase().includes(query) ||
      c.type.toLowerCase().includes(query) ||
      c.message.toLowerCase().includes(query) ||
      (c.location && c.location.toLowerCase().includes(query)) ||
      (c.nip && c.nip.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (id: string, status: 'Masuk' | 'Diproses' | 'Selesai') => {
    try {
      setLoadingId(id);
      await onUpdateStatus(id, status);
      showToast(`Status pengaduan berhasil diperbarui ke: ${status}`, 'success');
    } catch (err) {
      showToast('Gagal memperbarui status pengaduan.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus laporan dari ${name}?`)) return;
    try {
      setLoadingId(id);
      await onDeleteComplaint(id);
      showToast('Laporan pengaduan berhasil dihapus.', 'info');
    } catch (err) {
      showToast('Gagal menghapus laporan.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300 my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-900 text-white p-6 relative flex items-center justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-rose-500/30 text-rose-200 border border-rose-400/30">
                LAPOR-RT Admin
              </span>
              <span className="text-xs text-slate-300 font-medium">Kotak Masuk Aduan Pegawai &amp; Masyarakat</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2 font-display">
              <AlertCircle className="w-6 h-6 text-rose-400" /> Pusat Pengaduan Sarana &amp; Prasarana
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-2 bg-white/10 hover:bg-white/20 rounded-2xl cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Strip & Controls */}
        <div className="p-6 bg-slate-50 border-b border-slate-200/80 space-y-4 flex-shrink-0">
          
          {/* Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Laporan</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{totalComplaints}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                <MessageSquareText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Perlu Tindakan</p>
                <p className="text-2xl font-black text-amber-600 mt-0.5">{countMasuk}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-blue-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Sedang Diproses</p>
                <p className="text-2xl font-black text-blue-600 mt-0.5">{countDiproses}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Telah Selesai</p>
                <p className="text-2xl font-black text-emerald-600 mt-0.5">{countSelesai}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({totalComplaints})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Masuk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStatus === 'Masuk'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Masuk ({countMasuk})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Diproses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStatus === 'Diproses'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Diproses ({countDiproses})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('Selesai')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterStatus === 'Selesai'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Selesai ({countSelesai})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari pelapor, bagian, masalah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 text-xs absolute right-3 top-1/2 -translate-y-1/2"
                >
                  &times;
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Main Complaints List */}
        <div className="p-6 overflow-y-auto flex-grow space-y-4">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Filter className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Tidak ada laporan yang ditemukan</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery 
                  ? 'Tidak ada pengaduan yang sesuai dengan kata kunci pencarian Anda.' 
                  : 'Belum ada pengaduan yang masuk pada kategori status ini.'}
              </p>
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <div 
                key={c.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition duration-200 space-y-4"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      c.status === 'Masuk'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : c.status === 'Diproses'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        c.status === 'Masuk' ? 'bg-amber-500' : c.status === 'Diproses' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      {c.status}
                    </span>

                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {c.type}
                    </span>

                    <span className="text-xs text-slate-400 font-medium">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Baru saja'}
                    </span>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {c.status !== 'Masuk' && (
                      <button
                        type="button"
                        disabled={loadingId === c.id}
                        onClick={() => handleStatusChange(c.id, 'Masuk')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition cursor-pointer"
                        title="Tandai Masuk / Baru"
                      >
                        Masuk
                      </button>
                    )}

                    {c.status !== 'Diproses' && (
                      <button
                        type="button"
                        disabled={loadingId === c.id}
                        onClick={() => handleStatusChange(c.id, 'Diproses')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                        title="Tandai Sedang Diproses"
                      >
                        Diproses
                      </button>
                    )}

                    {c.status !== 'Selesai' && (
                      <button
                        type="button"
                        disabled={loadingId === c.id}
                        onClick={() => handleStatusChange(c.id, 'Selesai')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                        title="Tandai Selesai"
                      >
                        Selesai
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={loadingId === c.id}
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-1 cursor-pointer"
                      title="Hapus Laporan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submitter & Location Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-150">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">{c.name}</span>
                      {c.nip && <span className="text-[10px] text-slate-400">NIP: {c.nip}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Unit / Bagian:</span>
                      <span className="font-semibold text-slate-700">{c.bagian}</span>
                    </div>
                  </div>

                  {c.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Lokasi Gangguan:</span>
                        <span className="font-semibold text-slate-700">{c.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rincian Pengaduan &amp; Deskripsi Masalah:</p>
                  <p className="text-sm text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-150 whitespace-pre-wrap leading-relaxed">
                    {c.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>Data terhubung secara langsung (live real-time) dengan Google Cloud Firestore.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>

      </div>
    </div>
  );
}
