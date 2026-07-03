import { useState, useEffect, FormEvent } from 'react';
import { FileSpreadsheet, RefreshCw, LogIn, LogOut, CheckCircle, ExternalLink, Database, AlertCircle, ToggleLeft, ToggleRight, HelpCircle } from 'lucide-react';
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
import { Booking, Vehicle, LogisticsRequest, ToastMessage } from '../types';
import { User } from 'firebase/auth';

interface GoogleSheetsPanelProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  logistics: LogisticsRequest[];
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function GoogleSheetsPanel({
  bookings,
  vehicles,
  logistics,
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

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
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

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        onShowToast(`Berhasil masuk sebagai ${result.user.email}!`, 'success');
      }
    } catch (error: any) {
      console.error(error);
      onShowToast(`Google Sign-In gagal: ${error.message || 'Error'}`, 'error');
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

  // Bulk Export Handlers
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
    <div className="bg-white border-2 border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5 relative overflow-hidden transition-all duration-350 mb-10">
      
      {/* Visual background badges */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-55 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center shadow-inner">
            <FileSpreadsheet className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Modul Integrasi Google Sheets</h3>
              <span className="text-[9px] bg-red-100 text-red-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Direct Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Hubungkan langsung sistem pelayanan kota ke Google Drive &amp; Spreadsheet pribadi Bapak</p>
          </div>
        </div>

        {/* User login info or login button */}
        {!currentUser ? (
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-950/15 cursor-pointer disabled:opacity-50 transition active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Hubungkan Akun Google</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-slate-50 p-2 pl-3 rounded-2xl border border-slate-200">
            <div className="text-left">
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Petugas Terhubung</span>
              <span className="text-xs font-bold text-slate-700">{currentUser.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="p-2 text-rose-600 hover:text-white hover:bg-rose-600 border border-slate-200 hover:border-transparent rounded-xl transition cursor-pointer"
              title="Putuskan Hubungan Google"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Detailed connection details */}
      {!currentUser ? (
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Langkah Sinkronisasi Mudah</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Wujudkan kemudahan pengarsipan data pelayanan dengan menghubungkan akun Google Anda. Sistem akan membuatkan Spreadsheet baru di Drive yang akan di-update secara otomatis setiap kali ada permohonan baru dari klien.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action states based on Spreadsheet setting */}
          {!spreadsheetId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl animate-in fade-in duration-300">
              
              <div className="space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black tracking-widest text-amber-800 uppercase flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Lembar Kerja Belum Set
                  </span>
                  <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                    Anda sudah masuk dengan Google! Selanjutnya, silakan buat Spreadsheet baru untuk menampung database di Drive Anda, atau tautkan lembar kerja yang sudah Anda miliki sebelumnya di bawah ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateNewSpreadsheet}
                  disabled={isLoading}
                  className="w-full sm:w-auto self-start px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>Buat Spreadsheet Baru di Drive Saya</span>
                </button>
              </div>

              {/* Form Tautkan ID yang sudah ada */}
              <form onSubmit={handleLinkExisting} className="bg-white border border-amber-200/40 p-4 rounded-2xl flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Atau Hubungkan ID Spreadsheet Eksisting</label>
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">Bapak dapat mempaste ID sheet yang ada dari bilah address: https://docs.google.com/spreadsheets/d/<span className="font-extrabold bg-slate-100 p-0.5 rounded">ID_SPREADSHEET</span>/edit</p>
                  <input
                    type="text"
                    value={inputSpreadsheetId}
                    onChange={(e) => setInputSpreadsheetId(e.target.value)}
                    placeholder="Contoh: 1a2b3c4d5e..."
                    className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-250 focus:border-emerald-500 outline-none"
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
              <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 animate-in fade-in duration-300">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-emerald-55 bg-emerald-200 text-emerald-800 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[9px] font-black text-emerald-700 tracking-wider uppercase leading-none">Database Google Sheets Aktif</span>
                    <p className="text-xs font-extrabold text-slate-800">
                      ID: <span className="font-mono text-[11px] bg-emerald-100/50 px-1.5 py-0.5 rounded text-slate-600">{spreadsheetId}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a 
                        href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-extrabold underline cursor-pointer"
                      >
                        <span>Buka Spreadsheet Bapak</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Autosync Toggle Button */}
                  <button
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
                    onClick={handleDisconnectSpreadsheet}
                    className="px-3.5 py-1.5 font-bold text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer transition"
                  >
                    Lepas Tautan Sheet
                  </button>
                </div>
              </div>

              {/* Bulk Synchronize Area */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Ekspor / Unggah Data Eksisting</h4>
                <p className="text-xs text-slate-500 leading-normal font-medium">
                  Apakah data di bawah ini belum tersimpan di Google Sheets? Silakan unggah semua baris data yang ada secara massal ke lembar kerja masing-masing tab:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  
                  {/* Sync Peminjaman Ruang */}
                  <button
                    onClick={handleExportBookings}
                    disabled={isLoading}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-2xl text-left hover:scale-[1.01] transition active:scale-100 cursor-pointer disabled:opacity-50 space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Peminjaman Ruang</span>
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-slate-800 font-extrabold text-sm">{bookings.length} baris data</div>
                    <p className="text-[10px] text-slate-500 leading-tight font-medium">Unggah semua antrean jadwal rapat ke tab "Peminjaman Ruang"</p>
                  </button>

                  {/* Sync Peminjaman Kendaraan */}
                  <button
                    onClick={handleExportVehicles}
                    disabled={isLoading}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-2xl text-left hover:scale-[1.01] transition active:scale-100 cursor-pointer disabled:opacity-50 space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Peminjaman Mobil</span>
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-slate-800 font-extrabold text-sm">{vehicles.length} baris data</div>
                    <p className="text-[10px] text-slate-500 leading-tight font-medium">Unggah semua logs operasional armada ke tab "Peminjaman Kendaraan"</p>
                  </button>

                  {/* Sync Permintaan Logistik */}
                  <button
                    onClick={handleExportLogistics}
                    disabled={isLoading}
                    className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-2xl text-left hover:scale-[1.01] transition active:scale-100 cursor-pointer disabled:opacity-50 space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">Logistik &amp; ATK</span>
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-slate-800 font-extrabold text-sm">{logistics.length} baris data</div>
                    <p className="text-[10px] text-slate-500 leading-tight font-medium">Unggah semua dokumen permohonan logistik ke tab "Permintaan Logistik"</p>
                  </button>

                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
