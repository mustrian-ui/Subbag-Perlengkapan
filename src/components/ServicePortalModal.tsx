import { useState, useEffect, FormEvent } from 'react';
import { 
  Briefcase, 
  Car, 
  Box, 
  Package,
  FileText, 
  ChevronRight, 
  Trash2, 
  X, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Paperclip,
  Loader2,
  ExternalLink,
  MessageSquareText,
  Utensils,
  Gift,
  AlertTriangle,
  ArrowLeft,
  Home,
  Shield,
  Layers
} from 'lucide-react';
import { 
  Application, 
  Booking, 
  Vehicle, 
  LogisticsRequest,
  Complaint,
  SajiRapatRequest,
  CinderamataRequest
} from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  getAccessToken, 
  getOrCreateDriveFolder, 
  uploadFileToDrive,
  appendBookingToSheet,
  appendVehicleToSheet,
  appendSajiRapatToSheet,
  appendCinderamataToSheet,
  appendLogisticsToSheet,
  appendComplaintToSheet
} from '../lib/googleSheets';
import { AppFilterType } from './ServiceReportsModal';

export const getServiceType = (app: Application | null): AppFilterType => {
  if (!app) return 'sajirapat';
  const id = (app.id || '').toLowerCase();
  const rawTitle = (app.title || '').toLowerCase();
  const titleClean = rawTitle.replace(/[\s\-_()]+/g, '');
  const cat = (app.category || '').toLowerCase();

  // 1. SajiRapat / Konsumsi Rapat (prioritize detection)
  if (
    id.includes('saji') ||
    id.includes('app_5') ||
    cat === 'consumption' ||
    titleClean.includes('sajirapat') ||
    rawTitle.includes('saji rapat') ||
    rawTitle.includes('saji') ||
    rawTitle.includes('konsumsi') ||
    rawTitle.includes('makan') ||
    rawTitle.includes('snack') ||
    rawTitle.includes('prasmanan') ||
    rawTitle.includes('catering')
  ) {
    return 'sajirapat';
  }

  // 2. PetaCendera / Cinderamata & Plakat
  if (
    id.includes('cender') ||
    id.includes('app_6') ||
    cat === 'souvenir' ||
    titleClean.includes('petacendera') ||
    rawTitle.includes('peta cendera') ||
    rawTitle.includes('cinderamata') ||
    rawTitle.includes('cendera') ||
    rawTitle.includes('plakat') ||
    rawTitle.includes('souvenir') ||
    rawTitle.includes('singal') ||
    rawTitle.includes('padaw')
  ) {
    return 'petacendera';
  }

  // 3. SILOGIS / Logistik & ATK
  if (
    id.includes('logis') ||
    id.includes('app_3') ||
    cat === 'logistics' ||
    titleClean.includes('silogis') ||
    rawTitle.includes('logistik') ||
    rawTitle.includes('atk') ||
    rawTitle.includes('inventaris')
  ) {
    return 'silogis';
  }

  // 4. SIPAKAR / Kendaraan Dinas
  if (
    id.includes('pakar') ||
    id.includes('app_2') ||
    titleClean.includes('sipakar') ||
    rawTitle.includes('kendaraan') ||
    rawTitle.includes('mobil') ||
    rawTitle.includes('armada') ||
    rawTitle.includes('jalan')
  ) {
    return 'sipakar';
  }

  // 5. LAPOR-RT / Pengaduan
  if (
    id.includes('lapor') ||
    id.includes('app_4') ||
    cat === 'public' ||
    titleClean.includes('laporrt') ||
    rawTitle.includes('lapor') ||
    rawTitle.includes('pengaduan') ||
    rawTitle.includes('aduan')
  ) {
    return 'lapor';
  }

  // 6. SIPERUM / Ruangan
  if (
    id.includes('perum') ||
    id.includes('app_1') ||
    titleClean.includes('siperum') ||
    rawTitle.includes('ruang') ||
    rawTitle.includes('gedung')
  ) {
    return 'siperum';
  }

  return 'siperum';
};

interface ServicePortalModalProps {
  activeMicroApp: Application | null;
  onClose: () => void;
  isAdminActive: boolean;
  onOpenServiceReportsModal?: (filter: AppFilterType) => void;
  onOpenComplaintsModal?: () => void;
  isFullPage?: boolean;

  bookings: Booking[];
  onAddBooking: (b: Booking) => void;
  onUpdateBookingStatus?: (id: string, status: string) => Promise<void>;
  onDeleteBooking?: (id: string) => Promise<void>;

  vehicles: Vehicle[];
  onAddVehicle: (v: Vehicle) => void;
  onUpdateVehicleStatus?: (id: string, status: string) => Promise<void>;
  onDeleteVehicle?: (id: string) => Promise<void>;

  logistics: LogisticsRequest[];
  onAddLogistics: (l: LogisticsRequest) => void;
  onUpdateLogisticsStatus?: (id: string, status: string) => Promise<void>;
  onDeleteLogistics?: (id: string) => Promise<void>;

  sajiRapat?: SajiRapatRequest[];
  onAddSajiRapat?: (s: SajiRapatRequest) => void;
  onUpdateSajiRapatStatus?: (id: string, status: string) => Promise<void>;
  onDeleteSajiRapat?: (id: string) => Promise<void>;

  cinderamata?: CinderamataRequest[];
  onAddCinderamata?: (c: CinderamataRequest) => void;
  onUpdateCinderamataStatus?: (id: string, status: string) => Promise<void>;
  onDeleteCinderamata?: (id: string) => Promise<void>;

  complaints?: Complaint[];
  onAddComplaint?: (c: Complaint) => void;
  onUpdateComplaintStatus?: (id: string, status: 'Masuk' | 'Diproses' | 'Selesai') => Promise<void>;
  onDeleteComplaint?: (id: string) => Promise<void>;

  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ServicePortalModal({
  activeMicroApp,
  onClose,
  isAdminActive,
  onOpenServiceReportsModal,
  onOpenComplaintsModal,
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
  onAddComplaint,
  onUpdateComplaintStatus,
  onDeleteComplaint,
  showToast,
  isFullPage = true
}: ServicePortalModalProps) {
  const [activeServiceType, setActiveServiceType] = useState<AppFilterType>(() => activeMicroApp ? getServiceType(activeMicroApp) : 'siperum');

  useEffect(() => {
    if (activeMicroApp) {
      setActiveServiceType(getServiceType(activeMicroApp));
    }
  }, [activeMicroApp]);

  const [isUploading, setIsUploading] = useState(false);

  // Form states - SIPERUM
  const [sipRuang, setSipRuang] = useState('Gedung Lubung');
  const [sipTgl, setSipTgl] = useState('');
  const [sipJam, setSipJam] = useState('');
  const [sipAgenda, setSipAgenda] = useState('');
  const [sipPemohon, setSipPemohon] = useState('');
  const [sipInstansi, setSipInstansi] = useState('');
  const [sipFile, setSipFile] = useState<File | null>(null);
  const [sipDragOver, setSipDragOver] = useState(false);

  // Form states - SIPAKAR
  const [sipCarUnit, setSipCarUnit] = useState('');
  const [sipCarDest, setSipCarDest] = useState('');
  const [sipCarUser, setSipCarUser] = useState('');
  const [sipCarInstansi, setSipCarInstansi] = useState('');
  const [sipCarFile, setSipCarFile] = useState<File | null>(null);
  const [sipCarDragOver, setSipCarDragOver] = useState(false);

  // Form states - SajiRapat
  const [sajiAcara, setSajiAcara] = useState('');
  const [sajiTgl, setSajiTgl] = useState('');
  const [sajiWaktu, setSajiWaktu] = useState('');
  const [sajiLokasi, setSajiLokasi] = useState('');
  const [sajiJenisKonsumsi, setSajiJenisKonsumsi] = useState('Nasi Kotak');
  const [sajiLainnya, setSajiLainnya] = useState('');
  const [sajiPorsi, setSajiPorsi] = useState('');
  const [sajiPemohon, setSajiPemohon] = useState('');
  const [sajiNip, setSajiNip] = useState('');
  const [sajiInstansi, setSajiInstansi] = useState('');
  const [sajiKontak, setSajiKontak] = useState('');
  const [sajiCatatan, setSajiCatatan] = useState('');
  const [sajiFile, setSajiFile] = useState<File | null>(null);
  const [sajiDragOver, setSajiDragOver] = useState(false);

  // Form states - PetaCendera
  const [cendJenis, setCendJenis] = useState('Plakat');
  const [cendJumlah, setCendJumlah] = useState('');
  const [cendKeperluan, setCendKeperluan] = useState('');
  const [cendPenerima, setCendPenerima] = useState('');
  const [cendTglPerlu, setCendTglPerlu] = useState('');
  const [cendPemohon, setCendPemohon] = useState('');
  const [cendNip, setCendNip] = useState('');
  const [cendInstansi, setCendInstansi] = useState('');
  const [cendKontak, setCendKontak] = useState('');
  const [cendCatatan, setCendCatatan] = useState('');
  const [cendFile, setCendFile] = useState<File | null>(null);
  const [cendDragOver, setCendDragOver] = useState(false);

  // Form states - SILOGIS
  const [silItem, setSilItem] = useState('Kursi');
  const [silQty, setSilQty] = useState('');
  const [silDest, setSilDest] = useState('');
  const [silPemohon, setSilPemohon] = useState('');
  const [silInstansi, setSilInstansi] = useState('');
  const [silFile, setSilFile] = useState<File | null>(null);
  const [silDragOver, setSilDragOver] = useState(false);

  // Form states - LAPOR-RT
  const [lapLoc, setLapLoc] = useState('');
  const [lapProblem, setLapProblem] = useState('');
  const [lapMemo, setLapMemo] = useState('');
  const [lapBagian, setLapBagian] = useState('');
  const [lapPemohon, setLapPemohon] = useState('');

  // Reusable File Upload Drag-and-drop Component
  const renderFileUpload = (
    file: File | null,
    setFile: (f: File | null) => void,
    dragOver: boolean,
    setDragOver: (b: boolean) => void,
    accentColor: string = 'border-teal-300 hover:border-teal-500 hover:bg-slate-50',
    customLabel: string = 'Surat Permohonan / Dokumen Resmi',
    requiredBadge: string = 'Wajib Diunggah'
  ) => (
    <div className="space-y-1.5 mt-2">
      <label className="block text-xs font-black text-slate-700 flex items-center justify-between">
        <span className="uppercase tracking-wider">{customLabel}</span>
        <span className="text-[10px] font-extrabold text-rose-500 uppercase">{requiredBadge}</span>
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
        className={`relative border-2 border-dashed rounded-xl p-3.5 transition-all text-center cursor-pointer ${
          dragOver ? 'border-teal-500 bg-teal-50/50 scale-[1.01]' : accentColor
        }`}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
              showToast(`Berkas ${e.target.files[0].name} siap diunggah!`, 'info');
            }
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        {file ? (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
            <Paperclip className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
            <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
              {(file.size / 1024).toFixed(0)} KB
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-slate-400 hover:text-rose-500 p-1"
              title="Batalkan berkas"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <Upload className="w-5 h-5 text-slate-400 mb-1" />
            <p className="text-xs font-bold text-slate-700">Tarik berkas permohonan ke sini, atau klik untuk memilih</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Format didukung: PDF, DOC, DOCX, JPG, PNG (Maks 10 MB)</p>
          </div>
        )}
      </div>
    </div>
  );

  // Helper for background auto-sync to Google Sheets if configured
  const tryAutoSyncToSheet = async (syncFn: (token: string, sheetId: string) => Promise<any>) => {
    try {
      const isAutoSync = localStorage.getItem('pemkot_sheets_autosync') === 'true';
      const sheetId = localStorage.getItem('pemkot_sheets_id');
      if (isAutoSync && sheetId) {
        const token = await getAccessToken();
        if (token) {
          await syncFn(token, sheetId);
        }
      }
    } catch (err) {
      console.warn('Background auto-sync to Google Sheets error (non-fatal):', err);
    }
  };

  // SUBMIT HANDLERS
  const handleSiperumSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sipTgl || !sipJam || !sipAgenda || !sipPemohon || !sipInstansi) {
      showToast('Harap lengkapi semua kolom reservasi ruangan!', 'error');
      return;
    }
    if (!sipFile) {
      showToast('Harap unggah berkas surat permohonan resmi!', 'error');
      return;
    }
    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';
    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah dokumen ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, sipFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(sipFile);
        finalDocName = sipFile.name;
      }
    } catch (err) {
      console.error(err);
      finalDocUrl = URL.createObjectURL(sipFile);
      finalDocName = sipFile.name;
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
      status: 'Menunggu',
      documentUrl: finalDocUrl,
      documentName: finalDocName
    };
    onAddBooking(newBooking);
    tryAutoSyncToSheet((token, sId) => appendBookingToSheet(token, sId, newBooking));
    showToast(`Reservasi ${sipRuang} berhasil diajukan!`, 'success');
    setSipTgl('');
    setSipJam('');
    setSipAgenda('');
    setSipPemohon('');
    setSipInstansi('');
    setSipFile(null);
    onClose();
  };

  const handleSipakarSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sipCarUnit || !sipCarDest || !sipCarUser || !sipCarInstansi) {
      showToast('Harap lengkapi data permohonan kendaraan!', 'error');
      return;
    }
    if (!sipCarFile) {
      showToast('Harap unggah surat tugas / permohonan kendaraan!', 'error');
      return;
    }
    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';
    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah berkas ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, sipCarFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(sipCarFile);
        finalDocName = sipCarFile.name;
      }
    } catch (err) {
      console.error(err);
      finalDocUrl = URL.createObjectURL(sipCarFile);
      finalDocName = sipCarFile.name;
    } finally {
      setIsUploading(false);
    }

    const newVehicle: Vehicle = {
      id: `veh_${Date.now()}`,
      kendaraan: sipCarUnit,
      pemohon: sipCarUser,
      instansi: sipCarInstansi,
      tujuan: sipCarDest,
      status: 'Menunggu Validasi',
      documentUrl: finalDocUrl,
      documentName: finalDocName
    };
    onAddVehicle(newVehicle);
    tryAutoSyncToSheet((token, sId) => appendVehicleToSheet(token, sId, newVehicle));
    showToast(`Permohonan armada ${sipCarUnit} berhasil didaftarkan!`, 'success');
    setSipCarUnit('');
    setSipCarDest('');
    setSipCarUser('');
    setSipCarInstansi('');
    setSipCarFile(null);
    onClose();
  };

  const handleSajiRapatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sajiJenisKonsumsi || !sajiTgl || !sajiWaktu || !sajiLokasi || !sajiPorsi || !sajiAcara || !sajiPemohon || !sajiInstansi) {
      showToast('Harap lengkapi semua kolom isian form Saji Rapat!', 'error');
      return;
    }
    if (sajiJenisKonsumsi === 'Lainnya' && !sajiLainnya.trim()) {
      showToast('Harap sebutkan jenis konsumsi lainnya!', 'error');
      return;
    }
    if (!sajiFile) {
      showToast('Surat / Dokumen Resmi (Srikandi) WAJIB DIUNGGAH!', 'error');
      return;
    }
    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';
    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah Dokumen Srikandi ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, sajiFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(sajiFile);
        finalDocName = sajiFile.name;
      }
    } catch (err) {
      console.error(err);
      finalDocUrl = URL.createObjectURL(sajiFile);
      finalDocName = sajiFile.name;
    } finally {
      setIsUploading(false);
    }

    const finalJenis = sajiJenisKonsumsi === 'Lainnya' ? `Lainnya (${sajiLainnya.trim()})` : sajiJenisKonsumsi;

    const newSajiReq: SajiRapatRequest = {
      id: `saji_${Date.now()}`,
      acara: sajiAcara,
      tanggal: sajiTgl,
      waktu: sajiWaktu,
      lokasi: sajiLokasi,
      jenisKonsumsi: finalJenis,
      porsi: parseInt(sajiPorsi, 10) || 0,
      pemohon: sajiPemohon,
      nip: sajiNip || undefined,
      instansi: sajiInstansi,
      kontak: sajiKontak || undefined,
      catatan: sajiCatatan || undefined,
      status: 'Menunggu',
      documentUrl: finalDocUrl,
      documentName: finalDocName,
      createdAt: new Date().toISOString()
    };

    if (onAddSajiRapat) {
      onAddSajiRapat(newSajiReq);
    } else {
      await setDoc(doc(db, 'sajirapat', newSajiReq.id), newSajiReq);
    }
    tryAutoSyncToSheet((token, sId) => appendSajiRapatToSheet(token, sId, newSajiReq));
    showToast(`Permintaan konsumsi ${finalJenis} untuk ${sajiAcara} (${sajiPorsi}) berhasil dikirim!`, 'success');
    setSajiAcara('');
    setSajiTgl('');
    setSajiWaktu('');
    setSajiLokasi('');
    setSajiJenisKonsumsi('Nasi Kotak');
    setSajiLainnya('');
    setSajiPorsi('');
    setSajiPemohon('');
    setSajiNip('');
    setSajiInstansi('');
    setSajiKontak('');
    setSajiCatatan('');
    setSajiFile(null);
    onClose();
  };

  const handleCinderamataSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cendJenis || !cendJumlah || !cendKeperluan || !cendTglPerlu || !cendPemohon || !cendInstansi) {
      showToast('Harap lengkapi data permohonan cinderamata!', 'error');
      return;
    }
    if (!cendFile) {
      showToast('Harap unggah Surat Pengantar / Disposisi Permintaan Cinderamata!', 'error');
      return;
    }
    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';
    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah berkas ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, cendFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(cendFile);
        finalDocName = cendFile.name;
      }
    } catch (err) {
      console.error(err);
      finalDocUrl = URL.createObjectURL(cendFile);
      finalDocName = cendFile.name;
    } finally {
      setIsUploading(false);
    }

    const newCendReq: CinderamataRequest = {
      id: `cend_${Date.now()}`,
      jenisCinderamata: cendJenis,
      jumlah: parseInt(cendJumlah, 10) || 1,
      keperluan: cendKeperluan,
      penerima: cendPenerima || 'Tamu Resmi Pemerintah Kota Tarakan',
      tanggalPerlu: cendTglPerlu,
      pemohon: cendPemohon,
      nip: cendNip || undefined,
      instansi: cendInstansi,
      kontak: cendKontak || undefined,
      catatan: cendCatatan || undefined,
      status: 'Menunggu',
      documentUrl: finalDocUrl,
      documentName: finalDocName,
      createdAt: new Date().toISOString()
    };

    if (onAddCinderamata) {
      onAddCinderamata(newCendReq);
    } else {
      await setDoc(doc(db, 'cinderamata', newCendReq.id), newCendReq);
    }
    tryAutoSyncToSheet((token, sId) => appendCinderamataToSheet(token, sId, newCendReq));
    showToast(`Permohonan cinderamata (${cendJenis}) berhasil didaftarkan!`, 'success');
    setCendJumlah('');
    setCendKeperluan('');
    setCendPenerima('');
    setCendTglPerlu('');
    setCendPemohon('');
    setCendNip('');
    setCendInstansi('');
    setCendKontak('');
    setCendCatatan('');
    setCendFile(null);
    onClose();
  };

  const handleSilogisSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!silItem || !silQty || !silDest || !silPemohon || !silInstansi) {
      showToast('Harap lengkapi semua kolom permintaan logistik!', 'error');
      return;
    }
    if (!silFile) {
      showToast('Harap unggah surat permintaan logistik resmi!', 'error');
      return;
    }
    setIsUploading(true);
    let finalDocUrl = '';
    let finalDocName = '';
    try {
      const token = await getAccessToken();
      if (token) {
        showToast('Mengunggah berkas ke Google Drive...', 'info');
        const folderId = await getOrCreateDriveFolder(token);
        const uploadRes = await uploadFileToDrive(token, folderId, silFile);
        finalDocUrl = uploadRes.webViewLink;
        finalDocName = uploadRes.name;
      } else {
        finalDocUrl = URL.createObjectURL(silFile);
        finalDocName = silFile.name;
      }
    } catch (err) {
      console.error(err);
      finalDocUrl = URL.createObjectURL(silFile);
      finalDocName = silFile.name;
    } finally {
      setIsUploading(false);
    }

    const newLogistics: LogisticsRequest = {
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
    onAddLogistics(newLogistics);
    tryAutoSyncToSheet((token, sId) => appendLogisticsToSheet(token, sId, newLogistics));
    showToast(`Permintaan logistik ${silItem} (${silQty}) berhasil dikirim!`, 'success');
    setSilQty('');
    setSilDest('');
    setSilPemohon('');
    setSilInstansi('');
    setSilFile(null);
    onClose();
  };

  const handleLaporSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lapLoc || !lapProblem || !lapBagian || !lapPemohon) {
      showToast('Harap lengkapi lokasi, rincian masalah, dan nama pelapor!', 'error');
      return;
    }

    const newComplaint: Complaint = {
      id: `comp_${Date.now()}`,
      name: lapPemohon,
      bagian: lapBagian,
      type: 'Gangguan Gedung / Fasilitas',
      location: lapLoc,
      message: `${lapProblem}${lapMemo ? ` (Memo: ${lapMemo})` : ''}`,
      status: 'Masuk',
      createdAt: new Date().toISOString()
    };

    if (onAddComplaint) {
      onAddComplaint(newComplaint);
    } else {
      await setDoc(doc(db, 'complaints', newComplaint.id), newComplaint);
    }
    tryAutoSyncToSheet((token, sId) => appendComplaintToSheet(token, sId, newComplaint));
    showToast('Laporan pengaduan berhasil disampaikan ke Subbag RT!', 'success');
    setLapLoc('');
    setLapProblem('');
    setLapMemo('');
    setLapBagian('');
    setLapPemohon('');
    onClose();
  };

  // Get active service details for dynamic header & navigation
  const getActiveServiceInfo = () => {
    switch (activeServiceType) {
      case 'sajirapat':
        return {
          title: 'SajiRapat (Konsumsi Rapat)',
          desc: 'Fasilitasi penyediaan snack dan konsumsi makan rapat dinas, sosialisasi, dan agenda resmi Sekretariat Daerah Kota Tarakan.',
          gradient: 'bg-gradient-to-r from-orange-950 via-amber-900 to-slate-900'
        };
      case 'sipakar':
        return {
          title: 'SIPAKAR (Layanan Kendaraan Dinas)',
          desc: 'Permohonan surat izin jalan, peminjaman kendaraan operasional dinas, serta pemantauan armada dinas Setda.',
          gradient: 'bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900'
        };
      case 'petacendera':
        return {
          title: 'PetaCendera (Cinderamata & Plakat)',
          desc: 'Permohonan cinderamata resmi daerah, plakat khas Kota Tarakan, dan souvenir kehormatan tamu dinas.',
          gradient: 'bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900'
        };
      case 'silogis':
        return {
          title: 'SILOGIS (Inventaris & ATK)',
          desc: 'Portal permintaan barang inventaris, alat tulis kantor (ATK), dan logistik rumah tangga secara digital & transparan.',
          gradient: 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900'
        };
      case 'lapor':
        return {
          title: 'LAPOR-RT (Layanan Pengaduan)',
          desc: 'Platform pelaporan kerusakan prasarana, gangguan kebersihan, dan perbaikan fasilitas gedung kantor Setda.',
          gradient: 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900'
        };
      case 'siperum':
      default:
        return {
          title: 'SIPERUM (Pinjam Ruang Rapat)',
          desc: 'Sistem Elektronik Reservasi Ruang Rapat pada Sekretariat Daerah Kota Tarakan. Lacak jadwal ruangan secara live.',
          gradient: 'bg-gradient-to-r from-blue-900 to-teal-800'
        };
    }
  };

  if (!activeMicroApp) return null;

  const activeServiceInfo = getActiveServiceInfo();

  const handleTabChange = (newType: AppFilterType) => {
    setActiveServiceType(newType);
    if (typeof window !== 'undefined') {
      window.location.hash = `portal/${newType}`;
    }
  };

  return (
    <div className={isFullPage ? "min-h-screen bg-slate-100/70 pb-20 animate-fade-in text-slate-800" : "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto"}>
      
      {/* Dedicated Breadcrumb / Return Top Bar when rendered as Full Page */}
      {isFullPage && (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs backdrop-blur-md bg-white/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer border border-slate-200 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Kembali ke Beranda</span>
              </button>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <button onClick={onClose} className="hover:text-blue-900 cursor-pointer flex items-center gap-1 font-semibold">
                  <Home className="w-3.5 h-3.5" />
                  <span>Beranda</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Portal Layanan</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-extrabold text-blue-950 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {activeServiceInfo.title}
                </span>
              </nav>
            </div>

            <div className="flex items-center gap-2.5">
              {isAdminActive && (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mode Administrator</span>
                </span>
              )}
              {isAdminActive && onOpenServiceReportsModal && (
                <button
                  type="button"
                  onClick={() => onOpenServiceReportsModal(activeServiceType)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Buka Pusat Rekapitulasi Data & Tindakan"
                >
                  <Layers className="w-4 h-4 text-emerald-100" />
                  <span>Rekap &amp; Tindakan Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={isFullPage ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" : "bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300 my-8"}>
        <div className={isFullPage ? "bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden" : ""}>
        
          {/* Dynamic Header matching application title */}
          <div className={`${isFullPage ? 'p-6 sm:p-8' : 'p-6'} text-white relative flex flex-col md:flex-row md:items-center justify-between gap-4 ${activeServiceInfo.gradient}`}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-300 bg-black/25 px-2.5 py-0.5 rounded-full border border-white/15 backdrop-blur-xs">
                  Portal Layanan Digital
                </span>
                <span className="text-[11px] font-bold text-slate-200">
                  Subbag RT &amp; Perlengkapan Setda Kota Tarakan
                </span>
              </div>
              <h1 className={`${isFullPage ? 'text-xl sm:text-3xl' : 'text-lg sm:text-2xl'} font-black flex items-center gap-2.5 font-display tracking-tight`}>
                {activeServiceInfo.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 max-w-3xl leading-relaxed">
                {activeServiceInfo.desc}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-white font-bold text-xs transition cursor-pointer border border-white/20 backdrop-blur-xs"
                title="Kembali ke Beranda"
              >
                {isFullPage ? (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Beranda</span>
                  </>
                ) : (
                  <X className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Service Switcher Tabs */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 shrink-0 hidden sm:inline">Pilih Layanan:</span>
            {[
              { id: 'sajirapat' as AppFilterType, label: 'SajiRapat (Konsumsi)', icon: Utensils, count: sajiRapat.length, activeClass: 'text-orange-950 bg-orange-100 border-orange-400 shadow-sm' },
              { id: 'siperum' as AppFilterType, label: 'SIPERUM (Ruang Rapat)', icon: Briefcase, count: bookings.length, activeClass: 'text-teal-950 bg-teal-100 border-teal-400 shadow-sm' },
              { id: 'sipakar' as AppFilterType, label: 'SIPAKAR (Kendaraan)', icon: Car, count: vehicles.length, activeClass: 'text-amber-950 bg-amber-100 border-amber-400 shadow-sm' },
              { id: 'petacendera' as AppFilterType, label: 'PetaCendera (Plakat)', icon: Gift, count: cinderamata.length, activeClass: 'text-purple-950 bg-purple-100 border-purple-400 shadow-sm' },
              { id: 'silogis' as AppFilterType, label: 'SILOGIS (ATK/Logistik)', icon: Package, count: logistics.length, activeClass: 'text-blue-950 bg-blue-100 border-blue-400 shadow-sm' },
              { id: 'lapor' as AppFilterType, label: 'LAPOR-RT (Pengaduan)', icon: AlertTriangle, count: complaints.length, activeClass: 'text-rose-950 bg-rose-100 border-rose-400 shadow-sm' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeServiceType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isActive
                      ? `${tab.activeClass} ring-1 ring-black/5 scale-[1.02]`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-black/10' : 'bg-slate-100 text-slate-500'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Modal / Page Content Body */}
          <div className="p-6 sm:p-8">

          {/* ======================================================== */}
          {/* SERVICE 1: SIPERUM (Pinjam Ruang Rapat) */}
          {/* ======================================================== */}
          {activeServiceType === 'siperum' && (
            <div className="space-y-6">
              {isAdminActive && onOpenServiceReportsModal && (
                <div className="p-4 bg-gradient-to-r from-teal-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-teal-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-black flex-shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Pusat Tindakan &amp; Rekap Layanan: {activeMicroApp.title}</p>
                      <p className="text-[11px] text-slate-300">Terdapat {bookings.length} permohonan reservasi ruangan yang tercatat di sistem</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenServiceReportsModal('siperum');
                    }}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Buka Rekap &amp; Tindakan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form */}
                <form onSubmit={handleSiperumSubmit} className="lg:col-span-5 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Formulir Layanan: {activeMicroApp.title}</span>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      Subbag RT &amp; Perlengkapan
                    </span>
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
                      <option value="Ruang Rapat Imbaya Lt. 2">Ruang Rapat Imbaya Lt. 2</option>
                      <option value="Ruang Rapat Datu Adil Lt. 1">Ruang Rapat Datu Adil Lt. 1</option>
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
                    <span>{isUploading ? 'Mengunggah Berkas...' : `Kirim Permohonan (${activeMicroApp.title})`}</span>
                  </button>
                </form>

                {/* Right Log Table */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Jadwal &amp; Agenda Terdaftar ({activeMicroApp.title})</span>
                    <span className="text-[9px] bg-slate-100 tracking-wide text-slate-500 font-bold px-2 py-0.5 rounded-md">Live Update</span>
                  </h4>
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                          <th className="py-3 px-3">Nama Ruang</th>
                          <th className="py-3 px-3">Tanggal / Waktu</th>
                          <th className="py-3 px-3">Acara &amp; Instansi</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.map((b) => (
                          <tr key={b.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                            <td className="py-3.5 px-3 font-extrabold text-slate-800">{b.ruang}</td>
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-1 font-bold text-slate-700">
                                <Calendar className="w-3 h-3 text-teal-600" />
                                {b.tanggal}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {b.waktu}
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-700 line-clamp-1">{b.agenda}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">{b.instansi} ({b.pemohon})</div>
                              {b.documentUrl && (
                                <a 
                                  href={b.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-teal-700 hover:text-teal-900 font-extrabold bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-md transition"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span>Lihat Surat</span>
                                </a>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  b.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700' :
                                  b.status === 'Selesai' ? 'bg-blue-50 text-blue-700' :
                                  b.status === 'Ditolak' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {b.status}
                                </span>
                                {isAdminActive && onUpdateBookingStatus && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {b.status !== 'Disetujui' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateBookingStatus(b.id, 'Disetujui')}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                      >
                                        Setujui
                                      </button>
                                    )}
                                    {onDeleteBooking && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteBooking(b.id)}
                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SERVICE 2: SIPAKAR (Layanan Kendaraan Dinas) */}
          {/* ======================================================== */}
          {activeServiceType === 'sipakar' && (
            <div className="space-y-6">
              {isAdminActive && onOpenServiceReportsModal && (
                <div className="p-4 bg-gradient-to-r from-amber-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-amber-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black flex-shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Pusat Tindakan &amp; Rekap Layanan: {activeMicroApp.title}</p>
                      <p className="text-[11px] text-slate-300">Terdapat {vehicles.length} permohonan kendaraan yang tercatat di sistem</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenServiceReportsModal('sipakar');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Buka Rekap &amp; Tindakan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleSipakarSubmit} className="lg:col-span-5 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Formulir Layanan: {activeMicroApp.title}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Subbag RT &amp; Perlengkapan
                    </span>
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Unit Kendaraan</label>
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
                  {renderFileUpload(sipCarFile, setSipCarFile, sipCarDragOver, setSipCarDragOver, 'border-amber-200 hover:border-amber-500 hover:bg-slate-50')}
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md transition duration-200 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isUploading ? 'Mengunggah Berkas...' : `Daftarkan Izin Jalan (${activeMicroApp.title})`}</span>
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Log Penggunaan Armada ({activeMicroApp.title})</span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md">Live Update</span>
                  </h4>
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                          <th className="py-3 px-3">Kendaraan</th>
                          <th className="py-3 px-3">Tujuan &amp; Pemohon</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicles.map((v) => (
                          <tr key={v.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                            <td className="py-3.5 px-3 font-extrabold text-slate-800">{v.kendaraan}</td>
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-700">{v.tujuan}</div>
                              <div className="text-[10px] text-slate-500">{v.pemohon} ({v.instansi})</div>
                              {v.documentUrl && (
                                <a 
                                  href={v.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-700 hover:text-amber-900 font-extrabold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span>Surat Jalan</span>
                                </a>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  v.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700' :
                                  v.status === 'Selesai' ? 'bg-blue-50 text-blue-700' :
                                  v.status === 'Ditolak' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {v.status}
                                </span>
                                {isAdminActive && onUpdateVehicleStatus && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {v.status !== 'Disetujui' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateVehicleStatus(v.id, 'Disetujui')}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                      >
                                        Setujui
                                      </button>
                                    )}
                                    {onDeleteVehicle && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteVehicle(v.id)}
                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SERVICE 3: SAJIRAPAT (Konsumsi Rapat) */}
          {/* ======================================================== */}
          {activeServiceType === 'sajirapat' && (
            <div className="space-y-6">
              {isAdminActive && onOpenServiceReportsModal && (
                <div className="p-4 bg-gradient-to-r from-orange-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-orange-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-300 flex items-center justify-center font-black flex-shrink-0">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Pusat Tindakan &amp; Rekap Layanan: {activeMicroApp.title}</p>
                      <p className="text-[11px] text-slate-300">Terdapat {sajiRapat.length} permohonan konsumsi rapat tercatat di sistem</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenServiceReportsModal('sajirapat');
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Buka Rekap &amp; Tindakan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleSajiRapatSubmit} className="lg:col-span-5 space-y-3.5 bg-slate-50/80 p-5 rounded-2xl border border-orange-200/70 shadow-sm">
                  <div className="pb-2.5 border-b border-orange-200 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-orange-950">
                      <Utensils className="w-4 h-4 text-orange-600" />
                      Form Layanan SajiRapat
                    </span>
                    <span className="text-[10px] font-black text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-300">
                      Subbag RT &amp; Perlengkapan
                    </span>
                  </div>

                  {/* 1. Pilih Konsumsi */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>Pilih Konsumsi :</span>
                      <span className="text-[10px] text-orange-600 font-extrabold uppercase">Wajib Dipilih</span>
                    </label>

                    {/* Interactive Selection Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                      {[
                        { id: 'Nasi Kotak', label: 'Nasi Kotak', icon: '🍱' },
                        { id: 'Snack KotaK', label: 'Snack KotaK', icon: '🥪' },
                        { id: 'Air Mineral', label: 'Air Mineral', icon: '💧' },
                        { id: 'Prasmanan', label: 'Prasmanan', icon: '🍽️' },
                        { id: 'Lainnya', label: 'Lainnya', icon: '✨' }
                      ].map((opt) => {
                        const isSelected = sajiJenisKonsumsi === opt.id || (opt.id === 'Snack KotaK' && sajiJenisKonsumsi.toLowerCase().includes('snack'));
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSajiJenisKonsumsi(opt.id)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                              isSelected
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-500/20 ring-2 ring-orange-400/40'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/40'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fallback Dropdown Select */}
                    <select
                      value={sajiJenisKonsumsi}
                      onChange={(e) => setSajiJenisKonsumsi(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-bold text-slate-800"
                    >
                      <option value="Nasi Kotak">Nasi Kotak</option>
                      <option value="Snack KotaK">Snack KotaK</option>
                      <option value="Air Mineral">Air Mineral</option>
                      <option value="Prasmanan">Prasmanan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>

                    {sajiJenisKonsumsi === 'Lainnya' && (
                      <input
                        type="text"
                        required
                        placeholder="Sebutkan rincian jenis konsumsi lainnya..."
                        value={sajiLainnya}
                        onChange={(e) => setSajiLainnya(e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-orange-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-orange-50/40"
                      />
                    )}
                  </div>

                  {/* 2. Tgl. Kegiatan */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Tgl. Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={sajiTgl}
                      onChange={(e) => setSajiTgl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* 3. Jam Kegiatan/Acara */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Jam Kegiatan/Acara <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 09:00 - 12:00 WITA"
                      value={sajiWaktu}
                      onChange={(e) => setSajiWaktu(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* 4. Lokasi Kegiatan */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Lokasi Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ruang Rapat Imbaya Lt. 2 Kantor Walikota"
                      value={sajiLokasi}
                      onChange={(e) => setSajiLokasi(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* 5. Jumlah Permintaan */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Jumlah Permintaan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Contoh: 50"
                      value={sajiPorsi}
                      onChange={(e) => setSajiPorsi(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* 6. Agenda/Nama Kegiatan */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Agenda/Nama Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rapat Koordinasi Forum Komunikasi Pimpinan Daerah"
                      value={sajiAcara}
                      onChange={(e) => setSajiAcara(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* 7. Nama Pejabat / Staff Pemohon */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Nama Pejabat / Staff Pemohon <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: H. Ahmad Rifai, S.STP"
                      value={sajiPemohon}
                      onChange={(e) => setSajiPemohon(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* 8. Dinas / Instansi */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Dinas / Instansi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bagian Umum / Diskominfo Kota Tarakan"
                      value={sajiInstansi}
                      onChange={(e) => setSajiInstansi(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-medium"
                    />
                  </div>

                  {/* 9. Upload Surat / Dokumen Resmi (Srikandi) (WAJIB DIUNGGAH) */}
                  {renderFileUpload(
                    sajiFile,
                    setSajiFile,
                    sajiDragOver,
                    setSajiDragOver,
                    'border-orange-300 hover:border-orange-500 hover:bg-orange-50/30',
                    'Upload Surat / Dokumen Resmi (Srikandi)',
                    'WAJIB DIUNGGAH'
                  )}

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-lg shadow-orange-600/20 transition duration-200 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isUploading ? 'Mengunggah Berkas Srikandi...' : 'Kirim Permohonan Konsumsi (SajiRapat)'}</span>
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Daftar Permohonan Konsumsi ({activeMicroApp.title})</span>
                    <span className="text-[9px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-md">Live Update</span>
                  </h4>
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                          <th className="py-3 px-3">Acara &amp; Lokasi</th>
                          <th className="py-3 px-3">Porsi &amp; Menu</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sajiRapat.map((s) => (
                          <tr key={s.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                            <td className="py-3.5 px-3">
                              <div className="font-extrabold text-slate-800 line-clamp-1">{s.acara}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{s.tanggal} ({s.waktu}) • {s.lokasi}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{s.pemohon} ({s.instansi})</div>
                              {s.documentUrl && (
                                <a 
                                  href={s.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-orange-700 hover:text-orange-900 font-extrabold bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-md transition"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span>Nota Dinas</span>
                                </a>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 font-black text-[10px] border border-orange-200">
                                {s.porsi} Porsi
                              </span>
                              <div className="text-[10px] font-semibold text-slate-600 mt-1">{s.jenisKonsumsi}</div>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  s.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700' :
                                  s.status === 'Selesai' ? 'bg-blue-50 text-blue-700' :
                                  s.status === 'Ditolak' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {s.status}
                                </span>
                                {isAdminActive && onUpdateSajiRapatStatus && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {s.status !== 'Disetujui' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateSajiRapatStatus(s.id, 'Disetujui')}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                      >
                                        Setujui
                                      </button>
                                    )}
                                    {onDeleteSajiRapat && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteSajiRapat(s.id)}
                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SERVICE 4: PETACENDERA (Cinderamata & Plakat) */}
          {/* ======================================================== */}
          {activeServiceType === 'petacendera' && (
            <div className="space-y-6">
              {isAdminActive && onOpenServiceReportsModal && (
                <div className="p-4 bg-gradient-to-r from-purple-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-purple-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black flex-shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Pusat Tindakan &amp; Rekap Layanan: {activeMicroApp.title}</p>
                      <p className="text-[11px] text-slate-300">Terdapat {cinderamata.length} permohonan cinderamata daerah tercatat di sistem</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenServiceReportsModal('petacendera');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Buka Rekap &amp; Tindakan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleCinderamataSubmit} className="lg:col-span-5 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Formulir Layanan: {activeMicroApp.title}</span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      Subbag RT &amp; Perlengkapan
                    </span>
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Cinderamata</label>
                    <select
                      value={cendJenis}
                      onChange={(e) => setCendJenis(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white font-semibold text-slate-800"
                    >
                      <option value="Plakat">Plakat</option>
                      <option value="Padaw">Padaw</option>
                      <option value="Singal">Singal</option>
                      <option value="Syal">Syal</option>
                      <option value="Kain Batik">Kain Batik</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Unit</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Contoh: 2"
                        value={cendJumlah}
                        onChange={(e) => setCendJumlah(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Diperlukan</label>
                      <input
                        type="date"
                        required
                        value={cendTglPerlu}
                        onChange={(e) => setCendTglPerlu(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Penerima Cinderamata / Tamu Daerah</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sekretaris Daerah Kabupaten Berau"
                      value={cendPenerima}
                      onChange={(e) => setCendPenerima(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Keperluan / Agenda Kunjungan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kunjungan Kerja Studi Banding Layanan Publik"
                      value={cendKeperluan}
                      onChange={(e) => setCendKeperluan(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Pejabat / Pemohon</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Pemohon"
                        value={cendPemohon}
                        onChange={(e) => setCendPemohon(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dinas / Instansi</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bagian Protokol"
                        value={cendInstansi}
                        onChange={(e) => setCendInstansi(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {renderFileUpload(cendFile, setCendFile, cendDragOver, setCendDragOver, 'border-purple-200 hover:border-purple-500 hover:bg-purple-50/20')}
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md transition duration-200 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isUploading ? 'Mengunggah Berkas...' : `Kirim Permohonan Cinderamata (${activeMicroApp.title})`}</span>
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Daftar Permohonan Cinderamata ({activeMicroApp.title})</span>
                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-md">Live Update</span>
                  </h4>
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                          <th className="py-3 px-3">Cinderamata</th>
                          <th className="py-3 px-3">Penerima &amp; Agenda</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cinderamata.map((c) => (
                          <tr key={c.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                            <td className="py-3.5 px-3">
                              <div className="font-extrabold text-slate-800">{c.jenisCinderamata}</div>
                              <div className="text-[10px] text-purple-700 font-black mt-0.5">Jumlah: {c.jumlah} Unit</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">Diperlukan: {c.tanggalPerlu}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-700">{c.penerima}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-1">{c.keperluan}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{c.pemohon} ({c.instansi})</div>
                              {c.documentUrl && (
                                <a 
                                  href={c.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-purple-700 hover:text-purple-900 font-extrabold bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md transition"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span>Disposisi</span>
                                </a>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  c.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-700' :
                                  c.status === 'Selesai' ? 'bg-blue-50 text-blue-700' :
                                  c.status === 'Ditolak' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {c.status}
                                </span>
                                {isAdminActive && onUpdateCinderamataStatus && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {c.status !== 'Disetujui' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateCinderamataStatus(c.id, 'Disetujui')}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                      >
                                        Setujui
                                      </button>
                                    )}
                                    {onDeleteCinderamata && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteCinderamata(c.id)}
                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SERVICE 5: SILOGIS (Inventaris & ATK) */}
          {/* ======================================================== */}
          {activeServiceType === 'silogis' && (
            <div className="space-y-6">
              {isAdminActive && onOpenServiceReportsModal && (
                <div className="p-4 bg-gradient-to-r from-amber-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-amber-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black flex-shrink-0">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Pusat Tindakan &amp; Rekap Layanan: {activeMicroApp.title}</p>
                      <p className="text-[11px] text-slate-300">Terdapat {logistics.length} permohonan logistik &amp; ATK tercatat di sistem</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenServiceReportsModal('silogis');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Buka Rekap &amp; Tindakan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleSilogisSubmit} className="lg:col-span-5 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Formulir Layanan: {activeMicroApp.title}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      Subbag RT &amp; Perlengkapan
                    </span>
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Barang / Logistik</label>
                    <select
                      value={silItem}
                      onChange={(e) => setSilItem(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none bg-white font-semibold text-slate-800"
                    >
                      <option value="Kursi Lipat / Susun">Kursi Lipat / Susun</option>
                      <option value="Meja Rapat / Meja Stand">Meja Rapat / Meja Stand</option>
                      <option value="Microphone Wireless & Sound System">Microphone Wireless &amp; Sound System</option>
                      <option value="Tenda Lipat Operasional">Tenda Lipat Operasional</option>
                      <option value="Karpet / Ambal Pertemuan">Karpet / Ambal Pertemuan</option>
                      <option value="Paket Kertas & ATK Rapat">Paket Kertas &amp; ATK Rapat</option>
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
                    <label className="block text-xs font-bold text-slate-600 mb-1">Kegiatan / Peruntukan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sosialisasi Penilaian Kinerja ASN"
                      value={silDest}
                      onChange={(e) => setSilDest(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pejabat / Pemohon</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Akhmad Fauzi, S.Kom"
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
                      placeholder="Contoh: Badan Kepegawaian Daerah"
                      value={silInstansi}
                      onChange={(e) => setSilInstansi(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  {renderFileUpload(silFile, setSilFile, silDragOver, setSilDragOver, 'border-amber-200 hover:border-amber-500 hover:bg-slate-50')}
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md transition duration-200 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isUploading ? 'Mengunggah Berkas...' : `Kirim Permohonan Logistik (${activeMicroApp.title})`}</span>
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Daftar Distribusi Logistik ({activeMicroApp.title})</span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md">Live Update</span>
                  </h4>
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                          <th className="py-3 px-3">Nama Barang</th>
                          <th className="py-3 px-3">Jumlah &amp; Peruntukan</th>
                          <th className="py-3 px-3 text-right">Status Distribusi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {logistics.map((l) => (
                          <tr key={l.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                            <td className="py-3.5 px-3 font-extrabold text-slate-800">{l.barang}</td>
                            <td className="py-3.5 px-3">
                              <div className="font-bold">{l.jumlah}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{l.kegiatan}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{l.pemohon} ({l.instansi})</div>
                              {l.documentUrl && (
                                <a 
                                  href={l.documentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 mt-1 text-[10px] text-amber-700 hover:text-amber-900 font-extrabold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span>Surat Logistik</span>
                                </a>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  l.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' :
                                  l.status === 'Diproses' ? 'bg-blue-50 text-blue-700' :
                                  l.status === 'Ditolak' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {l.status}
                                </span>
                                {isAdminActive && onUpdateLogisticsStatus && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {l.status !== 'Selesai' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateLogisticsStatus(l.id, 'Selesai')}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                      >
                                        Selesai
                                      </button>
                                    )}
                                    {onDeleteLogistics && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteLogistics(l.id)}
                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SERVICE 6: LAPOR-RT (Layanan Pengaduan) */}
          {/* ======================================================== */}
          {activeServiceType === 'lapor' && (
            <div className="space-y-6">
              {isAdminActive && (
                <div className="p-4 bg-gradient-to-r from-rose-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-rose-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-black flex-shrink-0">
                      <MessageSquareText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm">Pusat Tindakan &amp; Rekap Layanan: {activeMicroApp.title}</p>
                      <p className="text-[11px] text-slate-300">Terdapat {complaints.length} laporan kerusakan &amp; aduan kebersihan masuk</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenServiceReportsModal) {
                        onOpenServiceReportsModal('lapor');
                      } else if (onOpenComplaintsModal) {
                        onOpenComplaintsModal();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Buka Rekap &amp; Tindakan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start text-rose-900">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-xs sm:text-sm">Pelaporan Cepat Kerusakan &amp; Pemeliharaan Fasilitas ({activeMicroApp.title})</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Setiap aduan yang dikirimkan melalui portal ini terhubung langsung ke staf teknis gedung dan regu kebersihan Subbag Rumah Tangga &amp; Perlengkapan Setda Tarakan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleLaporSubmit} className="lg:col-span-5 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Formulir Layanan: {activeMicroApp.title}</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Subbag RT &amp; Perlengkapan
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Dari Bagian</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Bagian Umum"
                        value={lapBagian}
                        onChange={(e) => setLapBagian(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Pejabat / Staf</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Lengkap"
                        value={lapPemohon}
                        onChange={(e) => setLapPemohon(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Lokasi Persis Gangguan / Fasilitas</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Toilet Lantai 2 Sayap Barat Gedung Utama"
                      value={lapLoc}
                      onChange={(e) => setLapLoc(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Rincian Masalah / Kerusakan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pendingin AC menetes dan mengeluarkan suara bising"
                      value={lapProblem}
                      onChange={(e) => setLapProblem(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Memo Tambahan Urgensi (Opsional)</label>
                    <textarea
                      rows={2}
                      placeholder="Detail tambahan situasi kerusakan..."
                      value={lapMemo}
                      onChange={(e) => setLapMemo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition duration-200 cursor-pointer"
                  >
                    Kirim Laporan Pengaduan ({activeMicroApp.title})
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Daftar Pengaduan Terkini ({activeMicroApp.title})</span>
                    <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">Live Update</span>
                  </h4>
                  <div className="overflow-hidden border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-150">
                          <th className="py-3 px-3">Lokasi &amp; Masalah</th>
                          <th className="py-3 px-3">Pelapor</th>
                          <th className="py-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {complaints.slice(0, 10).map((c) => (
                          <tr key={c.id} className="text-xs text-slate-600 hover:bg-slate-50/50">
                            <td className="py-3.5 px-3">
                              <div className="font-extrabold text-slate-800">{c.location}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{c.message}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-700">{c.name}</div>
                              <div className="text-[10px] text-slate-400">{c.bagian || 'Setda'}</div>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                                  c.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700' :
                                  c.status === 'Diproses' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {c.status}
                                </span>
                                {isAdminActive && onUpdateComplaintStatus && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {c.status !== 'Selesai' && (
                                      <button
                                        type="button"
                                        onClick={() => onUpdateComplaintStatus(c.id, 'Selesai')}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                                      >
                                        Selesai
                                      </button>
                                    )}
                                    {onDeleteComplaint && (
                                      <button
                                        type="button"
                                        onClick={() => onDeleteComplaint(c.id)}
                                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        </div>
      </div>
    </div>
  );
}
