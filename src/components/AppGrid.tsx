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
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Paperclip,
  Loader2,
  ExternalLink,
  MessageSquareText
} from 'lucide-react';
import { 
  Application, 
  AppCategory, 
  Booking, 
  Vehicle, 
  LogisticsRequest,
  Complaint
} from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  getAccessToken, 
  getOrCreateDriveFolder, 
  uploadFileToDrive 
} from '../lib/googleSheets';

interface AppGridProps {
  isAdminActive: boolean;
  applications: Application[];
  onAddApplication: (app: Application) => void;
  onEditApplication: (app: Application) => void;
  onDeleteApplication: (id: string) => void;
  
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Vehicle) => void;
  
  logistics: LogisticsRequest[];
  onAddLogistics: (req: LogisticsRequest) => void;

  complaints?: Complaint[];
  onOpenComplaintsModal?: () => void;
  onAddComplaint?: (complaint: Complaint) => void;
  
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
  
  vehicles,
  onAddVehicle,
  
  logistics,
  onAddLogistics,

  complaints = [],
  onOpenComplaintsModal,
  onAddComplaint,
  
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

  // MICRO-APP FORMS LOCAL STATE
  const [isUploading, setIsUploading] = useState(false);

  // SIPERUM states
  const [sipRuang, setSipRuang] = useState('Gedung Lubung');
  const [sipTgl, setSipTgl] = useState('');
  const [sipJam, setSipJam] = useState('');
  const [sipAgenda, setSipAgenda] = useState('');
  const [sipPemohon, setSipPemohon] = useState('');
  const [sipInstansi, setSipInstansi] = useState('');
  const [sipFile, setSipFile] = useState<File | null>(null);
  const [sipDragOver, setSipDragOver] = useState(false);

  // SIPAKAR states
  const [sipCarUnit, setSipCarUnit] = useState('');
  const [sipCarDest, setSipCarDest] = useState('');
  const [sipCarUser, setSipCarUser] = useState('');
  const [sipCarInstansi, setSipCarInstansi] = useState('');
  const [sipCarFile, setSipCarFile] = useState<File | null>(null);
  const [sipCarDragOver, setSipCarDragOver] = useState(false);

  // SILOGIS states
  const [silItem, setSilItem] = useState('Kursi');
  const [silQty, setSilQty] = useState('');
  const [silDest, setSilDest] = useState('');
  const [silPemohon, setSilPemohon] = useState('');
  const [silInstansi, setSilInstansi] = useState('');
  const [silFile, setSilFile] = useState<File | null>(null);
  const [silDragOver, setSilDragOver] = useState(false);

  // LAPOR-RT states
  const [lapLoc, setLapLoc] = useState('');
  const [lapProblem, setLapProblem] = useState('');
  const [lapMemo, setLapMemo] = useState('');
  const [lapBagian, setLapBagian] = useState('');
  const [lapPemohon, setLapPemohon] = useState('');

  // Renders a high-quality upload box that handles dragging and clicking
  const renderFileUpload = (
    file: File | null,
    setFile: (f: File | null) => void,
    dragOver: boolean,
    setDragOver: (b: boolean) => void,
    accentColor: string = 'border-teal-300 hover:border-teal-500 hover:bg-slate-50'
  ) => {
    return (
      <div className="space-y-1.5 mt-2">
        <label className="block text-xs font-black text-slate-700 flex items-center justify-between">
          <span className="uppercase tracking-wider">Surat Permohonan / Dokumen Resmi</span>
          <span className="text-[10px] font-extrabold text-rose-500 uppercase">Wajib Diunggah</span>
        </label>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              setFile(e.dataTransfer.files[0]);
              showToast(`Berkas ${e.dataTransfer.files[0].name} terpilih!`, 'info');
            }
          }}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 relative ${
            dragOver 
              ? 'border-emerald-500 bg-emerald-50/20 shadow-inner' 
              : file 
              ? 'border-emerald-400 bg-emerald-50/5' 
              : `border-slate-200 bg-white ${accentColor}`
          }`}
        >
          <input
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
                showToast(`Berkas ${e.target.files[0].name} terpilih!`, 'info');
              }
            }}
            accept=".pdf,image/*,.doc,.docx"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className={`p-2 bg-slate-50 border border-slate-100 rounded-xl shadow-sm ${file ? 'text-emerald-600' : 'text-slate-400'}`}>
              <Upload className="w-4 h-4" />
            </div>
            {file ? (
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800 max-w-[200px] sm:max-w-[250px] truncate mx-auto flex items-center gap-1 justify-center">
                  <Paperclip className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{file.name}</span>
                </p>
                <p className="text-[10px] text-emerald-600 font-black bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full inline-block">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Siap
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-slate-700">Tarik dokumen ke sini atau klik pilih</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">PDF, JPG, PNG, DOCX (Maks 5MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Trigger admin add view
  const triggerAddApp = () => {
    setEditingApp(null);
    setAppFormName('');
    setAppFormCategory('internal');
    setAppFormIcon('couch');
    setAppFormDesc('');
    setIsAppFormOpen(true);
  };

  // Trigger admin edit view
  const triggerEditApp = (app: Application, e: MouseEvent) => {
    e.stopPropagation();
    setEditingApp(app);
    setAppFormName(app.title);
    setAppFormCategory(app.category);
    setAppFormIcon(app.icon);
    setAppFormDesc(app.desc);
    setIsAppFormOpen(true);
  };

  const handleAdminAppSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!appFormName.trim() || !appFormDesc.trim()) {
      showToast('Harap isi semua kolom formulir!', 'error');
      return;
    }

    const appData: Application = {
      id: editingApp ? editingApp.id : `app_${Date.now()}`,
      title: appFormName,
      category: appFormCategory,
      icon: appFormIcon,
      desc: appFormDesc
    };

    if (editingApp) {
      onEditApplication(appData);
      showToast('Aplikasi layanan berhasil diperbaharui!', 'success');
    } else {
      onAddApplication(appData);
      showToast('Layanan aplikasi baru sukses didaftarkan!', 'success');
    }

    setIsAppFormOpen(false);
  };

  const handleRemoveApp = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus portal layanan ini dari dasbor?');
    if (confirmDelete) {
      onDeleteApplication(id);
      showToast('Aplikasi berhasil dihapus dari daftar.', 'info');
    }
  };

  // MICRO-APP FORM SUBMISSIONS
  const handleSiperumSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sipTgl || !sipJam || !sipAgenda || !sipPemohon || !sipInstansi) {
      showToast('Harap lengkapi isian kosong!', 'error');
      return;
    }
    if (!sipFile) {
      showToast('Harap unggah Surat Permohonan terlebih dahulu!', 'error');
      return;
    }

    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';

    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah Surat Permohonan ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, sipFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(sipFile);
        finalDocName = sipFile.name;
        showToast('Dokumen tersimpan di browser (GDrive Admin belum siap).', 'info');
      }
    } catch (err) {
      console.error('Failed to sync to Google Drive:', err);
      // Fallback
      finalDocUrl = URL.createObjectURL(sipFile);
      finalDocName = sipFile.name;
      showToast('Upload Google Drive gagal, menyimpan berkas secara lokal.', 'info');
    } finally {
      setIsUploading(false);
    }

    const newBooking: Booking = {
      id: `book_${Date.now()}`,
      ruang: sipRuang,
      tanggal: sipTgl,
      waktu: sipJam,
      agenda: sipAgenda,
      pemohon: sipPemohon,
      instansi: sipInstansi,
      status: 'Menunggu Konfirmasi',
      documentUrl: finalDocUrl,
      documentName: finalDocName
    };

    onAddBooking(newBooking);
    showToast(`Reservasi ${sipRuang} sukses dikirim ke Subbag Rumah Tangga!`, 'success');
    
    // reset
    setSipTgl('');
    setSipJam('');
    setSipAgenda('');
    setSipPemohon('');
    setSipInstansi('');
    setSipFile(null);
    setActiveMicroApp(null);
  };

  const handleSipakarSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sipCarUnit || !sipCarDest || !sipCarUser || !sipCarInstansi) {
      showToast('Harap lengkapi isian kosong!', 'error');
      return;
    }
    if (!sipCarFile) {
      showToast('Harap unggah Surat Tugas / Surat Permohonan Kendaraan!', 'error');
      return;
    }

    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';

    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah Surat Tugas ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, sipCarFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(sipCarFile);
        finalDocName = sipCarFile.name;
        showToast('Dokumen tersimpan di browser (GDrive Admin belum siap).', 'info');
      }
    } catch (err) {
      console.error('Failed to sync vehicle doc to Google Drive:', err);
      finalDocUrl = URL.createObjectURL(sipCarFile);
      finalDocName = sipCarFile.name;
      showToast('Upload Google Drive gagal, menyimpan dokumen secara lokal.', 'info');
    } finally {
      setIsUploading(false);
    }

    const newVehicleReq: Vehicle = {
      id: `veh_${Date.now()}`,
      kendaraan: sipCarUnit,
      pemohon: sipCarUser,
      instansi: sipCarInstansi,
      tujuan: sipCarDest,
      status: 'Menunggu Validasi',
      documentUrl: finalDocUrl,
      documentName: finalDocName
    };

    onAddVehicle(newVehicleReq);
    showToast(`Permohonan armada ${sipCarUnit} berhasil didaftarkan!`, 'success');
    
    // reset
    setSipCarUnit('');
    setSipCarDest('');
    setSipCarUser('');
    setSipCarInstansi('');
    setSipCarFile(null);
    setActiveMicroApp(null);
  };

  const handleSilogisSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!silItem || !silQty || !silDest || !silPemohon || !silInstansi) {
      showToast('Harap lengkapi data barang dan pemohon!', 'error');
      return;
    }
    if (!silFile) {
      showToast('Harap unggah Surat Permintaan Logistik!', 'error');
      return;
    }

    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';

    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah Surat Permintaan ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, silFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(silFile);
        finalDocName = silFile.name;
        showToast('Dokumen tersimpan di browser (GDrive Admin belum siap).', 'info');
      }
    } catch (err) {
      console.error('Failed to sync logistics file to Google Drive:', err);
      finalDocUrl = URL.createObjectURL(silFile);
      finalDocName = silFile.name;
      showToast('Upload Google Drive gagal, menyimpan berkas secara lokal.', 'info');
    } finally {
      setIsUploading(false);
    }

    const newReq: LogisticsRequest = {
      id: `log_${Date.now()}`,
      barang: silItem,
      jumlah: silQty,
      kegiatan: silDest,
      pemohon: silPemohon,
      instansi: silInstansi,
      status: 'Diproses',
      documentUrl: finalDocUrl,
      documentName: finalDocName
    };

    onAddLogistics(newReq);
    showToast(`Permintaan barang ${silItem} telah dikirim ke gudang perlengkapan!`, 'success');

    // reset
    setSilItem('Kursi');
    setSilQty('');
    setSilDest('');
    setSilPemohon('');
    setSilInstansi('');
    setSilFile(null);
    setActiveMicroApp(null);
  };

  const handleLaporSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lapLoc || !lapProblem || !lapBagian || !lapPemohon) {
      showToast('Harap lengkapi semua isian kosong!', 'error');
      return;
    }

    const complaintId = `comp_${Date.now()}`;
    const newComplaint: Complaint = {
      id: complaintId,
      name: lapPemohon.trim(),
      bagian: lapBagian.trim(),
      location: lapLoc.trim(),
      type: 'Kerusakan Fasilitas',
      message: `${lapProblem.trim()}${lapMemo ? ` (Catatan: ${lapMemo.trim()})` : ''}`,
      status: 'Masuk',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'complaints', complaintId), newComplaint);
      if (onAddComplaint) {
        onAddComplaint(newComplaint);
      }
      showToast('Laporan kerusakan terkirim dan tersimpan di database Subbag RT!', 'success');
    } catch (err) {
      console.error('Failed to submit lapor:', err);
      showToast('Gagal menyimpan laporan ke server.', 'error');
    }
    
    // reset
    setLapLoc('');
    setLapProblem('');
    setLapMemo('');
    setLapBagian('');
    setLapPemohon('');
    setActiveMicroApp(null);
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
              Gunakan portal di bawah ini untuk memesan ruang rapat Setda, mengesahkan armada operasional, meminta ATK logistik, dan melaporkan aduan kerusakan.
            </p>
          </div>
          
          {/* Filtering Categories Panel */}
          <div className="flex flex-wrap gap-2 self-start md:self-end">
            {[
              { id: 'all', label: 'Semu' },
              { id: 'internal', label: 'Fasilitas & Ruang' },
              { id: 'logistics', label: 'Arsip Logistik' },
              { id: 'public', label: 'Form Pengaduan' }
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
            let badgeStyle = 'bg-teal-55 bg-teal-50 text-teal-800 border-teal-100';
            let iconBoxStyle = 'bg-teal-500/10 text-teal-700 border-teal-500/15';

            if (app.category === 'logistics') {
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
                      {app.category === 'internal' ? 'Fasilitas' : app.category === 'logistics' ? 'Logistik' : 'Aduan'}
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

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <button
                    onClick={() => {
                      showToast(`Memuat Portal ${app.title}...`, 'info');
                      setActiveMicroApp(app);
                    }}
                    className="w-full py-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-blue-900 hover:text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer"
                  >
                    <span>Buka Portal Layanan</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
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
                  placeholder="Contoh: SIPAKAR (Layanan Kendaraan)"
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
      {activeMicroApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300 my-8">
            
            {/* Modal Header dynamically colored */}
            <div className={`p-6 text-white relative flex items-center justify-between ${
              activeMicroApp.category === 'internal' 
                ? 'bg-gradient-to-r from-blue-900 to-teal-800' 
                : activeMicroApp.category === 'logistics' 
                  ? 'bg-gradient-to-r from-slate-900 to-amber-700' 
                  : 'bg-gradient-to-r from-slate-900 to-rose-700'
            }`}>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-200 block">
                  {activeMicroApp.category === 'internal' ? 'Fasilitas & Penjadwalan' : activeMicroApp.category === 'logistics' ? 'Logistik Perlengkapan' : 'Pusat Pengaduan'}
                </span>
                <h3 className="text-lg sm:text-2xl font-black flex items-center gap-2 font-display">
                  {renderAppIcon(activeMicroApp.icon, "w-6 h-6 sm:w-7 sm:h-7")} {activeMicroApp.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveMicroApp(null)}
                className="text-white/80 hover:text-white transition p-1.5 bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Micro-App Content body */}
            <div className="p-6 sm:p-8">
              
              {/* MICRO-APP 1: SIPERUM (Meeting room reservation) */}
              {activeMicroApp.id.includes('app_1') && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Reservation Request Form */}
                  <form onSubmit={handleSiperumSubmit} className="lg:col-span-5 space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Formulir Reservasi Ruangan
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Ruang Rapat</label>
                      <select
                        value={sipRuang}
                        onChange={(e) => setSipRuang(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-semibold text-slate-800"
                      >
                        <option value="Gedung Lubung">Gedung Lubung</option>
                        <option value="Gedung Serbaguna">Gedung Serbaguna</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal</label>
                        <input
                          type="date"
                          required
                          value={sipTgl}
                          onChange={(e) => setSipTgl(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Jam Rapat / Kegiatan</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 09:00 - 12:00 WITA"
                          value={sipJam}
                          onChange={(e) => setSipJam(e.target.value)}
                          className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Agenda / Nama Kegiatan</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rapat Koordinasi Anggaran"
                        value={sipAgenda}
                        onChange={(e) => setSipAgenda(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pejabat / Staff Pemohon</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Drs. Heri Supriyadi"
                        value={sipPemohon}
                        onChange={(e) => setSipPemohon(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dinas / Instansi</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Dinas Komunikasi dan Informatika"
                        value={sipInstansi}
                        onChange={(e) => setSipInstansi(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {renderFileUpload(sipFile, setSipFile, sipDragOver, setSipDragOver, 'border-teal-200 hover:border-teal-500 hover:bg-slate-50')}

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md transition duration-200 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isUploading ? 'Mengunggah Berkas...' : 'Kirim Formulir Pengajuan'}</span>
                    </button>
                  </form>

                  {/* Active Calendars Table */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span>Jadwal Ruangan Aktif</span>
                      <span className="text-[9px] bg-slate-100 tracking-wide text-slate-500 font-bold px-2 py-0.5 rounded-md">Live Update</span>
                    </h4>

                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                            <th className="py-3 px-3">Nama Ruang</th>
                            <th className="py-3 px-3">Tanggal / Waktu</th>
                            <th className="py-3 px-3">Acara & Instansi</th>
                            <th className="py-3 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                              <td className="py-3.5 px-3 font-extrabold text-slate-800">
                                {booking.ruang}
                              </td>
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{booking.tanggal}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-450 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{booking.waktu}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-3 font-medium">
                                <div>{booking.agenda}</div>
                                {(booking.pemohon || booking.instansi) && (
                                  <div className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold">
                                    Pemohon: {booking.pemohon || '-'} ({booking.instansi || '-'})
                                  </div>
                                )}
                                {booking.documentUrl && (
                                  <a 
                                    href={booking.documentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 mt-1 text-[10px] text-teal-650 hover:text-teal-800 font-extrabold bg-teal-50 hover:bg-teal-100 border border-teal-100 px-2 py-0.5 rounded-md transition duration-150 inline-flex"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                    <span>Lihat Surat</span>
                                  </a>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  booking.status === 'Disetujui' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {booking.status === 'Disetujui' ? (
                                    <CheckCircle className="w-2.5 h-2.5" />
                                  ) : (
                                    <Clock className="w-2.5 h-2.5 animate-pulse" />
                                  )}
                                  {booking.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* MICRO-APP 2: SIPAKAR (Vehicle log / booking) */}
              {activeMicroApp.id.includes('app_2') && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Request Form */}
                  <form onSubmit={handleSipakarSubmit} className="lg:col-span-5 space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Peminjaman Kendaraan Dinas
                    </h4>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kendaraan</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Toyota Innova (KU 1045 A) / Avanza Silver"
                        value={sipCarUnit}
                        onChange={(e) => setSipCarUnit(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Tujuan / Kegiatan</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Kantor Gubernur Kaltara (Tanjung Selor)"
                        value={sipCarDest}
                        onChange={(e) => setSipCarDest(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pejabat / Staff Pemohon</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Drs. Heri Supriyadi (Asisten I)"
                        value={sipCarUser}
                        onChange={(e) => setSipCarUser(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dinas / Instansi</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Dinas Perhubungan"
                        value={sipCarInstansi}
                        onChange={(e) => setSipCarInstansi(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    {renderFileUpload(sipCarFile, setSipCarFile, sipCarDragOver, setSipCarDragOver, 'border-blue-200 hover:border-blue-500 hover:bg-slate-50')}

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-slate-900 text-white text-xs font-extrabold shadow-md transition disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isUploading ? 'Mengunggah Berkas...' : 'Daftarkan Surat Jalan Dinas'}</span>
                    </button>
                  </form>

                  {/* Active Vehicle Status List */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Log Penggunaan Armada Aktif
                    </h4>

                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                            <th className="py-3 px-3">Kendaraan</th>
                            <th className="py-3 px-3">Nama Pemohon</th>
                            <th className="py-3 px-3">Tujuan Organisasi</th>
                            <th className="py-3 px-3 text-right">Status Jalan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {vehicles.map((v) => (
                            <tr key={v.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                              <td className="py-3.5 px-3 font-extrabold text-slate-800">{v.kendaraan}</td>
                              <td className="py-3.5 px-3">
                                <div>{v.pemohon}</div>
                                {v.instansi && (
                                  <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">{v.instansi}</div>
                                )}
                              </td>
                              <td className="py-3.5 px-3 font-medium">
                                <div>{v.tujuan}</div>
                                {v.documentUrl && (
                                  <a 
                                    href={v.documentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-650 hover:text-blue-800 font-extrabold bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2 py-0.5 rounded-md transition duration-150 inline-flex"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                    <span>Lihat Surat</span>
                                  </a>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  v.status === 'Disetujui' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  <Clock className="w-2.5 h-2.5" />
                                  {v.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* MICRO-APP 3: SILOGIS (Inventory distribution log) */}
              {activeMicroApp.id.includes('app_3') && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* logistics form */}
                  <form onSubmit={handleSilogisSubmit} className="lg:col-span-5 space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Permintaan ATK & Logistik
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Barang</label>
                      <select
                        value={silItem}
                        onChange={(e) => setSilItem(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-800"
                      >
                        <option value="Kursi">Kursi</option>
                        <option value="Meja">Meja</option>
                        <option value="Mic">Mic</option>
                        <option value="Sound">Sound</option>
                        <option value="Tenda">Tenda</option>
                        <option value="Karpet/Ambal">Karpet/Ambal</option>
                        <option value="Snack Kotak">Snack Kotak</option>
                        <option value="Nasi Kotak">Nasi Kotak</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 100 Unit"
                        value={silQty}
                        onChange={(e) => setSilQty(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Kegiatan</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Sosialisasi APBD / Rapat Koordinasi"
                        value={silDest}
                        onChange={(e) => setSilDest(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pejabat / Staff Pemohon</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Drs. Heri Supriyadi"
                        value={silPemohon}
                        onChange={(e) => setSilPemohon(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dinas / Instansi</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bagian Organisasi Setda"
                        value={silInstansi}
                        onChange={(e) => setSilInstansi(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {renderFileUpload(silFile, setSilFile, silDragOver, setSilDragOver, 'border-amber-200 hover:border-amber-500 hover:bg-slate-50')}

                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md transition disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isUploading ? 'Mengunggah Berkas...' : 'Kirim Permintaan Distribusi'}</span>
                    </button>
                  </form>

                  {/* Stock delivery logs */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                      Daftar Distribusi Logistik Setda
                    </h4>

                    <div className="overflow-hidden border border-slate-100 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                            <th className="py-3 px-3">Nama Barang</th>
                            <th className="py-3 px-3">Jumlah & Peruntukan</th>
                            <th className="py-3 px-3 text-right">Status Distribusi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {logistics.map((log) => (
                            <tr key={log.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                              <td className="py-3.5 px-3 font-extrabold text-slate-800">{log.barang}</td>
                              <td className="py-3.5 px-3">
                                <div className="font-bold">{log.jumlah}</div>
                                {log.kegiatan && (
                                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Kegiatan: {log.kegiatan}</div>
                                )}
                                {(log.pemohon || log.instansi) && (
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Pemohon: {log.pemohon || '-'} ({log.instansi || '-'})</div>
                                )}
                                {log.documentUrl && (
                                  <a 
                                    href={log.documentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-655 hover:text-amber-800 font-extrabold bg-amber-50 hover:bg-amber-100 border border-amber-100 px-2 py-0.5 rounded-md transition duration-150 inline-flex"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                    <span>Lihat Surat</span>
                                  </a>
                                )}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  log.status === 'Selesai' 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-amber-50 text-amber-700'
                                }`}>
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* MICRO-APP 4: LAPOR-RT (Technical failure report) */}
              {activeMicroApp.id.includes('app_4') && (
                <div className="space-y-6">
                  {isAdminActive && onOpenComplaintsModal && (
                    <div className="p-4 bg-gradient-to-r from-rose-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-rose-800/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-black flex-shrink-0">
                          <MessageSquareText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm">Pusat Kotak Masuk Pengaduan (LAPOR-RT)</p>
                          <p className="text-[11px] text-slate-300">Terdapat {complaints.length} total laporan warga &amp; pegawai yang tersimpan</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMicroApp(null);
                          onOpenComplaintsModal();
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                      >
                        <span>Buka Kotak Pengaduan</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start text-rose-900">
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm">Pelaporan Kebersihan &amp; Kerusakan Fasilitas Kantor</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Formulir aduan cepat ini terintegrasi langsung dengan staf pemeliharaan teknis gedung dan armada kebersihan Subbag Rumah Tangga Setda Tarakan.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleLaporSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Dari Bagian
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Bagian Umum / Organisasi"
                          value={lapBagian}
                          onChange={(e) => setLapBagian(e.target.value)}
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Nama Pejabat / Staff
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Drs. Heri Supriyadi"
                          value={lapPemohon}
                          onChange={(e) => setLapPemohon(e.target.value)}
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Lokasi Persis Gangguan / Ruangan (e.g. Lantai 1 Koridor Timur)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Toilet Lantai 2 Sayap Barat"
                          value={lapLoc}
                          onChange={(e) => setLapLoc(e.target.value)}
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Rincian Masalah / Fasilitas Rusak (e.g. Lampu Pijar Padam / AC Panas)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Pendingin AC bocor dan menetes"
                          value={lapProblem}
                          onChange={(e) => setLapProblem(e.target.value)}
                          className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Memo Tambahan Urgensi (Jika Ada)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Berikan detail tambahan tentang situasi kerusakan..."
                        value={lapMemo}
                        onChange={(e) => setLapMemo(e.target.value)}
                        className="w-full px-3.5 py-2.5 border rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveMicroApp(null)}
                        className="px-4 py-2 text-slate-550 hover:text-slate-800 text-xs font-bold"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition"
                      >
                        Adukan Kendala Pemeliharaan
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </section>
  );
}
