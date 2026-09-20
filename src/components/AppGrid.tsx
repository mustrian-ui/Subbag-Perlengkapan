import { useState, FormEvent, MouseEvent } from 'react';
import { 
  Briefcase, 
  Car, 
  Box, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Plus, 
  X, 
  Layers,
  Utensils,
  Gift
} from 'lucide-react';
import { 
  Application, 
  AppCategory, 
  Booking, 
  Vehicle, 
  LogisticsRequest,
  Complaint,
  SajiRapatRequest,
  CinderamataRequest
} from '../types';
import { AppFilterType } from './ServiceReportsModal';
import ServicePortalModal, { getServiceType } from './ServicePortalModal';

interface AppGridProps {
  isAdminActive: boolean;
  applications: Application[];
  onAddApplication: (app: Application) => void;
  onEditApplication: (app: Application) => void;
  onDeleteApplication: (id: string) => void;
  
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  onUpdateBookingStatus?: (id: string, status: string) => Promise<void>;
  onDeleteBooking?: (id: string) => Promise<void>;
  
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateVehicleStatus?: (id: string, status: string) => Promise<void>;
  onDeleteVehicle?: (id: string) => Promise<void>;
  
  logistics: LogisticsRequest[];
  onAddLogistics: (req: LogisticsRequest) => void;
  onUpdateLogisticsStatus?: (id: string, status: string) => Promise<void>;
  onDeleteLogistics?: (id: string) => Promise<void>;

  sajiRapat?: SajiRapatRequest[];
  onAddSajiRapat?: (req: SajiRapatRequest) => void;
  onUpdateSajiRapatStatus?: (id: string, status: string) => Promise<void>;
  onDeleteSajiRapat?: (id: string) => Promise<void>;

  cinderamata?: CinderamataRequest[];
  onAddCinderamata?: (req: CinderamataRequest) => void;
  onUpdateCinderamataStatus?: (id: string, status: string) => Promise<void>;
  onDeleteCinderamata?: (id: string) => Promise<void>;

  complaints?: Complaint[];
  onOpenComplaintsModal?: () => void;
  onAddComplaint?: (complaint: Complaint) => void;
  onUpdateComplaintStatus?: (id: string, status: 'Masuk' | 'Diproses' | 'Selesai') => Promise<void>;
  onDeleteComplaint?: (id: string) => Promise<void>;

  onOpenServiceReportsModal?: (appFilter?: AppFilterType) => void;
  
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Map icon string descriptor to proper Lucide Icon component
export function renderAppIcon(iconName: string, className: string = "w-6 h-6") {
  const normalized = iconName.toLowerCase();
  if (normalized.includes('couch') || normalized.includes('room') || normalized.includes('meeting') || normalized.includes('briefcase')) {
    return <Briefcase className={className} />;
  }
  if (normalized.includes('car') || normalized.includes('vehicle') || normalized.includes('pakara')) {
    return <Car className={className} />;
  }
  if (normalized.includes('utensil') || normalized.includes('food') || normalized.includes('saji') || normalized.includes('catering') || normalized.includes('konsumsi')) {
    return <Utensils className={className} />;
  }
  if (normalized.includes('gift') || normalized.includes('cinderamata') || normalized.includes('cendera') || normalized.includes('souvenir')) {
    return <Gift className={className} />;
  }
  if (normalized.includes('box') || normalized.includes('package') || normalized.includes('logis')) {
    return <Box className={className} />;
  }
  if (normalized.includes('alert') || normalized.includes('exclamation') || normalized.includes('lapor') || normalized.includes('warning')) {
    return <AlertTriangle className={className} />;
  }
  return <FileText className={className} />;
}

export default function AppGrid({
  isAdminActive,
  applications,
  onAddApplication,
  onEditApplication,
  onDeleteApplication,
  
  bookings,
  onAddBooking,
  onUpdateBookingStatus,
  onDeleteBooking,
  
  vehicles,
  onAddVehicle,
  onUpdateVehicleStatus,
  onDeleteVehicle,
  
  logistics,
  onAddLogistics,
  onUpdateLogisticsStatus,
  onDeleteLogistics,

  sajiRapat = [],
  onAddSajiRapat,
  onUpdateSajiRapatStatus,
  onDeleteSajiRapat,

  cinderamata = [],
  onAddCinderamata,
  onUpdateCinderamataStatus,
  onDeleteCinderamata,

  complaints = [],
  onOpenComplaintsModal,
  onAddComplaint,
  onUpdateComplaintStatus,
  onDeleteComplaint,

  onOpenServiceReportsModal,
  
  showToast
}: AppGridProps) {
  // Navigation categories
  const [activeTab, setActiveTab] = useState<AppCategory | 'all'>('all');
  
  // Selection state for opening a micro-app popup
  const [activeMicroApp, setActiveMicroApp] = useState<Application | null>(null);
  
  // Admin App Form state
  const [isAppFormOpen, setIsAppFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [appFormName, setAppFormName] = useState('');
  const [appFormCategory, setAppFormCategory] = useState<AppCategory>('internal');
  const [appFormIcon, setAppFormIcon] = useState('couch');
  const [appFormDesc, setAppFormDesc] = useState('');

  // Admin App Form actions
  const triggerAddApp = () => {
    setEditingApp(null);
    setAppFormName('');
    setAppFormCategory('internal');
    setAppFormIcon('couch');
    setAppFormDesc('');
    setIsAppFormOpen(true);
  };

  const triggerEditApp = (app: Application, e: MouseEvent) => {
    e.stopPropagation();
    setEditingApp(app);
    setAppFormName(app.title);
    setAppFormCategory(app.category);
    setAppFormIcon(app.icon);
    setAppFormDesc(app.desc);
    setIsAppFormOpen(true);
  };

  const handleRemoveApp = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus tautan aplikasi ini dari dashboard portal?')) {
      onDeleteApplication(id);
      showToast('Aplikasi dihapus dari dashboard.', 'info');
    }
  };

  const handleAdminAppSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!appFormName.trim()) {
      showToast('Nama aplikasi tidak boleh kosong!', 'error');
      return;
    }

    if (editingApp) {
      const updated: Application = {
        ...editingApp,
        title: appFormName.trim(),
        category: appFormCategory,
        icon: appFormIcon,
        desc: appFormDesc.trim()
      };
      onEditApplication(updated);
      showToast(`Aplikasi ${appFormName} berhasil diperbarui!`, 'success');
    } else {
      const newApp: Application = {
        id: `app_${Date.now()}`,
        title: appFormName.trim(),
        category: appFormCategory,
        icon: appFormIcon,
        desc: appFormDesc.trim()
      };
      onAddApplication(newApp);
      showToast(`Aplikasi ${appFormName} berhasil ditambahkan!`, 'success');
    }

    setIsAppFormOpen(false);
  };

  // Filter application cards based on selection
  const filteredApps = activeTab === 'all' 
    ? applications 
    : applications.filter(a => a.category === activeTab);

  return (
    <section id="aplikasi" className="py-24 bg-slate-50 relative overflow-hidden">
      
      {/* Background Decorative Spark */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-teal-600 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 rounded-full bg-blue-700 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-widest text-teal-600 uppercase block">
              Portal Sistem Internal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Aplikasi Layanan Digital
            </h2>
            <div className="w-16 h-1 bg-teal-600 rounded-full"></div>
            <p className="text-slate-500 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed">
              Subbag Rumah Tangga &amp; Perlengkapan Setda Kota Tarakan — Gunakan portal di bawah ini untuk reservasi ruang rapat, peminjaman kendaraan dinas, permohonan konsumsi rapat, permintaan cinderamata daerah, logistik ATK, serta aduan perbaikan fasilitas.
            </p>
          </div>
          
          {/* Filtering Categories Panel */}
          <div className="flex flex-wrap gap-2 self-start md:self-end">
            {[
              { id: 'all', label: 'Semua Layanan' },
              { id: 'internal', label: 'Ruang & Kendaraan' },
              { id: 'consumption', label: 'Konsumsi Rapat' },
              { id: 'souvenir', label: 'Cinderamata' },
              { id: 'logistics', label: 'Logistik & ATK' },
              { id: 'public', label: 'LAPOR-RT' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AppCategory | 'all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md shadow-blue-900/15'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Administrator Insertion Button */}
        {isAdminActive && (
          <div className="mb-8 animate-in fade-in duration-300">
            <button
              onClick={triggerAddApp}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/10 cursor-pointer hover:translate-y-[-1px] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aplikasi Baru</span>
            </button>
          </div>
        )}

        {/* Grid Container for Application Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApps.map((app) => {
            // Distinct decorative styling for each app category
            let badgeStyle = 'bg-teal-50 text-teal-800 border-teal-100';
            let iconBoxStyle = 'bg-teal-500/10 text-teal-700 border-teal-500/15';

            if (app.category === 'consumption') {
              badgeStyle = 'bg-orange-50 text-orange-800 border-orange-100';
              iconBoxStyle = 'bg-orange-500/10 text-orange-600 border-orange-500/15';
            } else if (app.category === 'souvenir') {
              badgeStyle = 'bg-purple-50 text-purple-800 border-purple-100';
              iconBoxStyle = 'bg-purple-500/10 text-purple-600 border-purple-500/15';
            } else if (app.category === 'logistics') {
              badgeStyle = 'bg-amber-50 text-amber-800 border-amber-100';
              iconBoxStyle = 'bg-amber-500/10 text-amber-600 border-amber-500/15';
            } else if (app.category === 'public') {
              badgeStyle = 'bg-rose-50 text-rose-800 border-rose-100';
              iconBoxStyle = 'bg-rose-500/10 text-rose-600 border-rose-500/15';
            }

            return (
              <div
                key={app.id}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 hover:border-slate-250 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
              >
                
                {/* Admin Management Controls overlay */}
                {isAdminActive && (
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    <button
                      onClick={(e) => triggerEditApp(app, e)}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs cursor-pointer"
                      title="Edit Aplikasi"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleRemoveApp(app.id, e)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs cursor-pointer"
                      title="Hapus Aplikasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className={`w-14 h-14 rounded-2xl ${iconBoxStyle} border flex items-center justify-center text-2xl group-hover:scale-110 transition duration-300`}>
                      {renderAppIcon(app.icon, "w-6 h-6")}
                    </div>
                    <span className={`px-2.5 py-1 text-[9px] font-black tracking-wider uppercase border rounded-full ${badgeStyle}`}>
                      {app.category === 'internal' ? 'Fasilitas' : 
                       app.category === 'consumption' ? 'Konsumsi' :
                       app.category === 'souvenir' ? 'Cinderamata' :
                       app.category === 'logistics' ? 'Logistik' : 'Aduan'}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className="text-slate-900 font-extrabold text-base sm:text-lg group-hover:text-blue-900 transition duration-300">
                      {app.title}
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                      {app.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => {
                      showToast(`Memuat Portal ${app.title}...`, 'info');
                      setActiveMicroApp(app);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-blue-900 hover:text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer border border-slate-200"
                  >
                    <span>Buka Portal Layanan</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {isAdminActive && (
                    <button
                      onClick={() => {
                        const filter = getServiceType(app);
                        if (onOpenServiceReportsModal) {
                          onOpenServiceReportsModal(filter);
                        } else if (filter === 'lapor' && onOpenComplaintsModal) {
                          onOpenComplaintsModal();
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 transition border border-emerald-300 cursor-pointer shadow-sm"
                      title="Lihat rekap dan ambil tindakan langsung seperti LAPOR-RT"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rekap Laporan &amp; Tindakan</span>
                    </button>
                  )}
                </div>
                
              </div>
            );
          })}

          {filteredApps.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white border border-slate-150 rounded-3xl">
              <AlertTriangle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium">Belum ada layanan aplikasi pada kategori ini.</p>
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* 1. ADMIN FORM MODAL: ADD / EDIT APPLICATION */}
      {/* ======================================================== */}
      {isAppFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="bg-emerald-600 text-white p-6 relative">
              <button
                onClick={() => setIsAppFormOpen(false)}
                className="absolute right-4 top-4 text-white hover:opacity-100 transition duration-200"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200">
                  Panel Administrator
                </span>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  {editingApp ? 'Ubah Informasi Aplikasi' : 'Tambahkan Aplikasi Baru'}
                </h3>
              </div>
            </div>

            <form onSubmit={handleAdminAppSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nama Aplikasi / Portal
                </label>
                <input
                  type="text"
                  value={appFormName}
                  onChange={(e) => setAppFormName(e.target.value)}
                  required
                  placeholder="Contoh: SajiRapat (Bantuan Konsumsi Rapat)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Kategori Layanan
                  </label>
                  <select
                    value={appFormCategory}
                    onChange={(e) => setAppFormCategory(e.target.value as AppCategory)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none text-sm transition bg-white"
                  >
                    <option value="internal">Fasilitas & Ruangan</option>
                    <option value="consumption">Konsumsi Rapat (SajiRapat)</option>
                    <option value="souvenir">Cinderamata & Souvenir (PetaCendera)</option>
                    <option value="logistics">Arsip Logistik</option>
                    <option value="public">Form Pengaduan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Ikon Aplikasi (Keyword)
                  </label>
                  <select
                    value={appFormIcon}
                    onChange={(e) => setAppFormIcon(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none text-sm transition bg-white"
                  >
                    <option value="couch">Couch (Ruang Rapat)</option>
                    <option value="car">Car (Mobil Dinas)</option>
                    <option value="utensils">Utensils (Konsumsi Rapat)</option>
                    <option value="gift">Gift (Cinderamata / Souvenir)</option>
                    <option value="box">Box (ATK & Logistik)</option>
                    <option value="alert">Alert (Pengaduan/Lapor)</option>
                    <option value="file">File (Dokumen Lain)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Deskripsi Singkat Pelayanan
                </label>
                <textarea
                  value={appFormDesc}
                  onChange={(e) => setAppFormDesc(e.target.value)}
                  required
                  rows={3}
                  placeholder="Jelaskan secara ringkas fungsionalitas utama dari portal ini..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm transition"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppFormOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition"
                >
                  Simpan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. INTERACTIVE MODAL FOR MICRO-APPLICATIONS PORTAL */}
      {/* ======================================================== */}
      <ServicePortalModal
        activeMicroApp={activeMicroApp}
        onClose={() => setActiveMicroApp(null)}
        isAdminActive={isAdminActive}
        onOpenServiceReportsModal={onOpenServiceReportsModal}
        onOpenComplaintsModal={onOpenComplaintsModal}
        bookings={bookings}
        onAddBooking={onAddBooking}
        onUpdateBookingStatus={onUpdateBookingStatus}
        onDeleteBooking={onDeleteBooking}
        vehicles={vehicles}
        onAddVehicle={onAddVehicle}
        onUpdateVehicleStatus={onUpdateVehicleStatus}
        onDeleteVehicle={onDeleteVehicle}
        logistics={logistics}
        onAddLogistics={onAddLogistics}
        onUpdateLogisticsStatus={onUpdateLogisticsStatus}
        onDeleteLogistics={onDeleteLogistics}
        sajiRapat={sajiRapat}
        onAddSajiRapat={onAddSajiRapat}
        onUpdateSajiRapatStatus={onUpdateSajiRapatStatus}
        onDeleteSajiRapat={onDeleteSajiRapat}
        cinderamata={cinderamata}
        onAddCinderamata={onAddCinderamata}
        onUpdateCinderamataStatus={onUpdateCinderamataStatus}
        onDeleteCinderamata={onDeleteCinderamata}
        complaints={complaints}
        onAddComplaint={onAddComplaint}
        onUpdateComplaintStatus={onUpdateComplaintStatus}
        onDeleteComplaint={onDeleteComplaint}
        showToast={showToast}
      />

    </section>
  );
}
