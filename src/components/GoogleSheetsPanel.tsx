import { useState, useEffect, FormEvent } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  LogIn, 
  LogOut, 
  CheckCircle, 
  ExternalLink, 
  Database, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  Download, 
  Building2, 
  Car, 
  Package, 
  MessageSquareWarning, 
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  googleSignIn, 
  googleSignOut, 
  initAuth, 
  createServiceSpreadsheet, 
  verifySpreadsheetPermissions,
  appendBookingToSheet,
  appendVehicleToSheet,
  appendLogisticsToSheet
} from '../lib/googleSheets';
import { 
  exportBookingsCsv, 
  exportVehiclesCsv, 
  exportLogisticsCsv, 
  exportComplaintsCsv 
} from '../lib/exportUtils';
import { Booking, Vehicle, LogisticsRequest, Complaint } from '../types';
import { User } from 'firebase/auth';

interface GoogleSheetsPanelProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  logistics: LogisticsRequest[];
  complaints?: Complaint[];
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function GoogleSheetsPanel({
  bookings,
  vehicles,
  logistics,
  complaints = [],
  onShowToast
}: GoogleSheetsPanelProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('pemkot_sheets_id') || '';
  });
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('pemkot_sheets_autosync') === 'true';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputSpreadsheetId, setInputSpreadsheetId] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'export' | 'cloud'>(currentUser ? 'cloud' : 'export');
  const [authErrorReason, setAuthErrorReason] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setActiveTab('cloud');
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Update localStorage when autoSync changes
  useEffect(() => {
    localStorage.setItem('pemkot_sheets_autosync', String(autoSync));
  }, [autoSync]);

  const parseAuthError = (error: any): string => {
    const code = error?.code || '';
    const message = error?.message || '';

    if (code === 'auth/operation-not-allowed') {
      return 'Penyedia Google Sign-In belum diaktifkan di konsol Firebase (Firebase Authentication > Sign-in method > Google).';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Domain aplikasi web ini belum didaftarkan dalam daftar "Authorized Domains" pada konsol Firebase Authentication.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Jendela pop-up Google Sign-In diblokir oleh peramban karena aplikasi dibuka di dalam frame pratinjau (iframe). Buka aplikasi di tab baru agar pop-up diizinkan.';
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'Jendela pop-up Google ditutup sebelum otentikasi akun selesai.';
    }
    return message || 'Koneksi ke server Google terputus atau tidak diizinkan.';
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthErrorReason(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        setActiveTab('cloud');
        onShowToast(`Berhasil terhubung sebagai ${result.user.email}!`, 'success');
      }
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      const friendlyReason = parseAuthError(error);
      setAuthErrorReason(friendlyReason);
      onShowToast(`Gagal menghubungkan Google: ${friendlyReason}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await googleSignOut();
      setCurrentUser(null);
      setAccessToken(null);
      setAuthErrorReason(null);
      onShowToast('Sesi Google Sheets berhasil dikeluarkan.', 'info');
    } catch (error: any) {
      onShowToast('Gagal mengeluarkan sesi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!accessToken) {
      onShowToast('Harap masuk dengan Google terlebih dahulu!', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const newId = await createServiceSpreadsheet(accessToken);
      setSpreadsheetId(newId);
      localStorage.setItem('pemkot_sheets_id', newId);
      onShowToast('Spreadsheet baru berhasil dibuat di Google Drive Anda!', 'success');
    } catch (error: any) {
      console.error(error);
      onShowToast(`Gagal membuat spreadsheet: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkExisting = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      onShowToast('Harap login dahulu!', 'error');
      return;
    }
    if (!inputSpreadsheetId.trim()) {
      onShowToast('Masukkan ID Spreadsheet yang valid!', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifySpreadsheetPermissions(accessToken, inputSpreadsheetId.trim());
      if (isValid) {
        setSpreadsheetId(inputSpreadsheetId.trim());
        localStorage.setItem('pemkot_sheets_id', inputSpreadsheetId.trim());
        setInputSpreadsheetId('');
        onShowToast('Hubungan dengan Spreadsheet sukses terverifikasi!', 'success');
      } else {
        onShowToast('ID Spreadsheet tidak valid atau tidak memiliki akses edit!', 'error');
      }
    } catch (err: any) {
      onShowToast('Terjadi kesalahan verifikasi ID.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnectSpreadsheet = () => {
    if (window.confirm('Apakah Anda yakin ingin melepas tautan lembar kerja Google Sheets saat ini?')) {
      setSpreadsheetId('');
      localStorage.removeItem('pemkot_sheets_id');
      onShowToast('Tautan Spreadsheet berhasil dilepas.', 'info');
    }
  };

  // Direct CSV Downloads (100% Reliable, No OAuth Required)
  const handleDownloadBookings = () => {
    if (bookings.length === 0) {
      onShowToast('Belum ada data reservasi ruang rapat untuk diunduh.', 'info');
      return;
    }
    exportBookingsCsv(bookings);
    onShowToast(`File CSV ${bookings.length} baris data Ruang Rapat berhasil diunduh!`, 'success');
  };

  const handleDownloadVehicles = () => {
    if (vehicles.length === 0) {
      onShowToast('Belum ada data kendaraan dinas untuk diunduh.', 'info');
      return;
    }
    exportVehiclesCsv(vehicles);
    onShowToast(`File CSV ${vehicles.length} baris data Kendaraan Dinas berhasil diunduh!`, 'success');
  };

  const handleDownloadLogistics = () => {
    if (logistics.length === 0) {
      onShowToast('Belum ada data permintaan ATK/logistik untuk diunduh.', 'info');
      return;
    }
    exportLogisticsCsv(logistics);
    onShowToast(`File CSV ${logistics.length} baris data ATK & Logistik berhasil diunduh!`, 'success');
  };

  const handleDownloadComplaints = () => {
    if (complaints.length === 0) {
      onShowToast('Belum ada data pengaduan masuk untuk diunduh.', 'info');
      return;
    }
    exportComplaintsCsv(complaints);
    onShowToast(`File CSV ${complaints.length} baris data Pengaduan LAPOR-RT berhasil diunduh!`, 'success');
  };

  const handleDownloadAll = () => {
    handleDownloadBookings();
    setTimeout(handleDownloadVehicles, 300);
    setTimeout(handleDownloadLogistics, 600);
    setTimeout(handleDownloadComplaints, 900);
    onShowToast('Semua paket rekap data pelayanan (4 file CSV) mulai diunduh!', 'success');
  };

  // Bulk Export Handlers via Direct API
  const handleExportBookings = async () => {
    if (!accessToken || !spreadsheetId) return;
    if (bookings.length === 0) {
      onShowToast('Tidak ada data Peminjaman Ruang untuk diekspor.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      let count = 0;
      for (const booking of bookings) {
        await appendBookingToSheet(accessToken, spreadsheetId, booking);
        count++;
      }
      onShowToast(`Sukses mengekspor ${count} antrean Peminjaman Ruang!`, 'success');
    } catch (error: any) {
      onShowToast(`Gagal mengekspor data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportVehicles = async () => {
    if (!accessToken || !spreadsheetId) return;
    if (vehicles.length === 0) {
      onShowToast('Tidak ada data Peminjaman Kendaraan untuk diekspor.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      let count = 0;
      for (const vehicle of vehicles) {
        await appendVehicleToSheet(accessToken, spreadsheetId, vehicle);
        count++;
      }
      onShowToast(`Sukses mengekspor ${count} antrean Peminjaman Kendaraan!`, 'success');
    } catch (error: any) {
      onShowToast(`Gagal mengekspor data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportLogistics = async () => {
    if (!accessToken || !spreadsheetId) return;
    if (logistics.length === 0) {
      onShowToast('Tidak ada data Permintaan Logistik untuk diekspor.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      let count = 0;
      for (const req of logistics) {
        await appendLogisticsToSheet(accessToken, spreadsheetId, req);
        count++;
      }
      onShowToast(`Sukses mengekspor ${count} antrean Permintaan Logistik!`, 'success');
    } catch (error: any) {
      onShowToast(`Gagal mengekspor data: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="integrasi-sheets" className="bg-white border-2 border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5 relative overflow-hidden transition-all duration-350 mb-10">
      
      {/* Visual background ambient light */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Modul Integrasi Google Sheets &amp; Ekspor Data
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Siap Pakai
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola, unduh, dan arsipkan seluruh data pelayanan publik kota ke format Spreadsheet (Excel/Google Sheets)
            </p>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'export'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel/CSV (Instan)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Google Direct Sync {currentUser && '(Aktif)'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DIRECT EXCEL / CSV EXPORT (100% Guaranteed to work on all machines, no OAuth blocks) */}
      {activeTab === 'export' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Quick Guide & Google Sheets Link */}
          <div className="bg-emerald-50/70 border border-emerald-200/60 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  Cara Membuka di Google Sheets (Hanya 2 Langkah Cepat)
                </h4>
                <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">
                  Unduh file data di bawah ini (otomatis berformat CSV UTF-8 siap pakai). Lalu buka Google Sheets dan pilih menu <strong>File &gt; Import &gt; Upload</strong>. Seluruh kolom dan data langsung tertata rapi!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto">
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>Buka Google Sheets Baru</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleDownloadAll}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Unduh Semua Data</span>
              </button>
            </div>
          </div>

          {/* Cards for each module */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Peminjaman Ruang (SIPERUM) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    SIPERUM
                  </span>
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm">Peminjaman Ruangan</h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Total {bookings.length} baris reservasi ruang rapat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadBookings}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap CSV</span>
              </button>
            </div>

            {/* Card 2: Kendaraan Dinas (SIPAKAR) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Car className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    SIPAKAR
                  </span>
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm">Kendaraan Dinas</h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Total {vehicles.length} baris surat jalan armada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadVehicles}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap CSV</span>
              </button>
            </div>

            {/* Card 3: Permintaan ATK / Logistik (SILOGIS) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-rose-50 text-rose-700 rounded-xl">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                    SILOGIS
                  </span>
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm">Logistik &amp; ATK</h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Total {logistics.length} baris permintaan barang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadLogistics}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap CSV</span>
              </button>
            </div>

            {/* Card 4: Pengaduan Masuk (LAPOR-RT) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <MessageSquareWarning className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    LAPOR-RT
                  </span>
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-900 text-sm">Kotak Pengaduan</h5>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Total {complaints.length} baris aduan prasarana
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadComplaints}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer active:scale-95 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Rekap CSV</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: GOOGLE DIRECT SYNC (OAUTH) */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Diagnostic Error Banner if user encountered error */}
          {authErrorReason && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <h5 className="font-extrabold text-xs">Penyebab Kegagalan Koneksi Google:</h5>
              </div>
              <p className="text-xs font-medium pl-6 leading-relaxed text-rose-800">
                {authErrorReason}
              </p>
              <div className="pl-6 pt-1 text-[11px] text-rose-700">
                💡 <strong>Solusi:</strong> Anda dapat langsung menggunakan tab <strong>"Ekspor Excel/CSV (Instan)"</strong> di atas untuk mengunduh rekap data tanpa terhalang izin akun atau pop-up browser.
              </div>
            </div>
          )}

          {/* User Status Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${currentUser ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Status Otentikasi Google
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {currentUser ? `Terhubung: ${currentUser.email}` : 'Belum Terhubung (Silakan Hubungkan Akun Google)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!currentUser ? (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow cursor-pointer disabled:opacity-50 transition active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Sesi Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Connection Details when not signed in */}
          {!currentUser ? (
            <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Informasi Teknis Mengapa Tombol Gagal Koneksi:
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 font-medium list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>Pop-up Iframe Terblokir:</strong> Di pratinjau AI Studio, peramban membatasi jendela pop-up otentikasi Google demi keamanan.
                    </li>
                    <li>
                      <strong>Google Auth Provider Firebase:</strong> Proyek Firebase memerlukan pengaktifan metode <em>Google Sign-In</em> dan pendaftaran domain di konsol keamanan Firebase Authentication.
                    </li>
                    <li>
                      <strong>Solusi Paling Praktis:</strong> Silakan beralih ke tab <strong>"Ekspor Excel/CSV (Instan)"</strong>. Seluruh data pelayanan dapat langsung diunduh dan dibuka di Google Sheets atau Microsoft Excel secara instan tanpa perlu pengaturan otentikasi rumit.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Spreadsheet configuration when user is logged in */}
              {!spreadsheetId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl">
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black tracking-widest text-amber-800 uppercase flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Lembar Kerja Belum Ditautkan
                      </span>
                      <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                        Akun Google Anda telah terhubung! Buat Spreadsheet baru di Google Drive Anda atau tautkan ID lembar kerja yang telah ada.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateNewSpreadsheet}
                      disabled={isLoading}
                      className="w-full sm:w-auto self-start px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                    >
                      <Database className="w-4 h-4" />
                      <span>Buat Spreadsheet Baru di Drive Saya</span>
                    </button>
                  </div>

                  <form onSubmit={handleLinkExisting} className="bg-white border border-amber-200/40 p-4 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                        Tautkan ID Spreadsheet Eksisting
                      </label>
                      <p className="text-[10px] text-slate-500 leading-normal font-medium">
                        Salin ID dari bilah alamat: docs.google.com/spreadsheets/d/<span className="font-extrabold bg-slate-100 p-0.5 rounded">ID_SPREADSHEET</span>/edit
                      </p>
                      <input
                        type="text"
                        value={inputSpreadsheetId}
                        onChange={(e) => setInputSpreadsheetId(e.target.value)}
                        placeholder="Contoh: 1a2b3c4d5e..."
                        className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isVerifying || isLoading}
                      className="self-end px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-65"
                    >
                      {isVerifying ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Tautkan ID</span>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Connected Active Sheet Indicator */}
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 bg-emerald-200 text-emerald-800 rounded-xl">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[9px] font-black text-emerald-700 tracking-wider uppercase leading-none">
                          Database Google Sheets Aktif
                        </span>
                        <p className="text-xs font-extrabold text-slate-800">
                          ID: <span className="font-mono text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded text-slate-600">{spreadsheetId}</span>
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a 
                            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-extrabold underline cursor-pointer"
                          >
                            <span>Buka Spreadsheet Bapak di Tab Baru</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setAutoSync(!autoSync);
                          onShowToast(
                            !autoSync 
                              ? 'Auto-Sync Diaktifkan! Setiap permohonan baru akan ditulis ke Google Sheets.' 
                              : 'Auto-Sync Dimatikan. Data baru tidak akan otomatis disimpan.', 
                            'info'
                          );
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                          autoSync 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {autoSync ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        <span>Auto-Sync: {autoSync ? 'AKTIF' : 'NONAKTIF'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDisconnectSpreadsheet}
                        className="px-3.5 py-1.5 font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer transition"
                      >
                        Lepas Tautan Sheet
                      </button>
                    </div>
                  </div>

                  {/* Bulk Synchronize Area */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Sinkronisasi Massal ke Google Sheets
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal font-medium">
                      Kirim data tersimpan ke lembar kerja yang sedang terhubung:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      
                      <button
                        type="button"
                        onClick={handleExportBookings}
                        disabled={isLoading}
                        className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition cursor-pointer disabled:opacity-50 space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Peminjaman Ruang</span>
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="text-slate-800 font-extrabold text-sm">{bookings.length} baris data</div>
                        <p className="text-[10px] text-slate-500 leading-tight font-medium">Kirim ke tab "Peminjaman Ruang"</p>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportVehicles}
                        disabled={isLoading}
                        className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition cursor-pointer disabled:opacity-50 space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Peminjaman Mobil</span>
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="text-slate-800 font-extrabold text-sm">{vehicles.length} baris data</div>
                        <p className="text-[10px] text-slate-500 leading-tight font-medium">Kirim ke tab "Peminjaman Kendaraan"</p>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportLogistics}
                        disabled={isLoading}
                        className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left transition cursor-pointer disabled:opacity-50 space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">Logistik &amp; ATK</span>
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="text-slate-800 font-extrabold text-sm">{logistics.length} baris data</div>
                        <p className="text-[10px] text-slate-500 leading-tight font-medium">Kirim ke tab "Permintaan Logistik"</p>
                      </button>

                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
