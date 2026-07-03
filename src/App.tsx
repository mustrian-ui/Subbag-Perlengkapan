import { useState } from 'react';
import Navbar from './components/Navbar';
import AdminBar from './components/AdminBar';
import Hero from './components/Hero';
import VisiMisi from './components/VisiMisi';
import AppGrid from './components/AppGrid';
import GallerySection from './components/GallerySection';
import ContactForm from './components/ContactForm';
import AdminLoginModal from './components/AdminLoginModal';
import Toast from './components/Toast';
import { Application, GalleryItem, Booking, Vehicle, LogisticsRequest, ToastMessage, LandingPageContent, HallSchedule } from './types';
import LandingEditModal from './components/LandingEditModal';
import GoogleSheetsPanel from './components/GoogleSheetsPanel';
import GedungSchedule from './components/GedungSchedule';
import { getAccessToken, appendBookingToSheet, appendVehicleToSheet, appendLogisticsToSheet } from './lib/googleSheets';

const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  heroTagline: "Sekretariat Daerah Kota Tarakan",
  heroTitlePrefix: "Subbagian Rumah Tangga",
  heroTitleAccent: "& Perlengkapan",
  heroDesc: "Berkomitmen tinggi menyelenggarakan pelayanan rumah tangga, akomodasi keprotokolan negara, pemeliharaan sarana prasarana vital, serta tata kelola logistik perlengkapan guna mendukung kelancaran administrasi pemerintahan Kota Tarakan yang mandiri dan dinamis.",
  heroBgUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600",
  heroPhone: "(0551) 21122",
  visiMisiSubtitle: "Arah Pembangunan Daerah",
  visiTitle: "Visi & Misi Kota Tarakan",
  visiText: "Terwujudnya Tarakan sebagai Kota Maju dan Sejahtera dengan Sentra Nilai Tambah Industri, Perdagangan, dan Jasa Berbasis Sumber Daya Lokal.",
  misiSubtitle: "Langkah Strategis Pencapaian",
  misiTitle: "Misi Pemerintah Kota Tarakan",
  misiItems: [
    {
      id: "misi_1",
      title: "Tata Kelola Pemerintahan yang Bersih & Akuntabel",
      desc: "Meningkatkan kualitas pelayanan publik melalui birokrasi yang responsif, transparan, serta mengedepankan digitalisasi sistem."
    },
    {
      id: "misi_2",
      title: "Pembangunan Infrastruktur Terpadu & Tepat Sasaran",
      desc: "Mengakselerasi pembangunan sarana fisik penunjang yang mendukung percepatan pusat industri serta distribusi logistik daerah."
    },
    {
      id: "misi_3",
      title: "Pemberdayaan Ekonomi Masyarakat & Ekosistem UMKM",
      desc: "Mewujudkan daya saing jasa lokal secara subur dengan mengintegrasikan nilai tambah industri komparatif Kota Tarakan."
    },
    {
      id: "misi_4",
      title: "Penguatan Kinerja Aparatur & Prasarana Setda",
      desc: "Meningkatkan standarisasi kebersihan, penataan ruangan, serta armada operasional guna memicu produktivitas pelayanan publik tertinggi."
    }
  ]
};

// Standard building block layouts
export default function App() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isAdminActive, setIsAdminActive] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Landing Page customizable content state from localStorage for state retention
  const [landingContent, setLandingContent] = useState<LandingPageContent>(() => {
    const saved = localStorage.getItem('pemkot_landing_content');
    if (saved) {
      try {
        return { ...DEFAULT_LANDING_CONTENT, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved landing page content:', e);
      }
    }
    return DEFAULT_LANDING_CONTENT;
  });

  const [isLandingEditOpen, setIsLandingEditOpen] = useState<boolean>(false);
  const [landingEditTab, setLandingEditTab] = useState<'hero' | 'visimisi'>('hero');

  // Application Dataset State
  const [applications, setApplications] = useState<Application[]>([
    {
      id: 'app_1',
      title: 'SIPERUM (Pinjam Ruang Rapat)',
      category: 'internal',
      icon: 'couch',
      desc: 'Sistem Elektronik Reservasi Ruang Rapat pada Sekretariat Daerah Kota Tarakan. Lacak jadwal ruangan secara live.'
    },
    {
      id: 'app_2',
      title: 'SIPAKAR (Layanan Kendaraan Dinas)',
      category: 'internal',
      icon: 'car',
      desc: 'Permohonan surat izin jalan, peminjaman kendaraan operasional dinas, serta pemantauan armada dinas Setda.'
    },
    {
      id: 'app_3',
      title: 'SILOGIS (Inventaris & ATK)',
      category: 'logistics',
      icon: 'box',
      desc: 'Portal permintaan barang inventaris, alat tulis kantor (ATK), dan logistik rumah tangga secara digital & transparan.'
    },
    {
      id: 'app_4',
      title: 'LAPOR-RT (Layanan Pengaduan)',
      category: 'public',
      icon: 'alert',
      desc: 'Platform pelaporan kerusakan prasarana, gangguan kebersihan, dan perbaikan fasilitas gedung kantor Setda.'
    }
  ]);

  // Gallery Dataset State
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([
    {
      id: 'gal_1',
      title: 'Rapat Koordinasi Optimalisasi Pengelolaan Aset Daerah',
      category: 'Koordinasi',
      date: '2026-05-15',
      url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'gal_2',
      title: 'Pemeliharaan Rutin Pendingin Ruangan (AC) Aula Serbaguna',
      category: 'Pemeliharaan',
      date: '2026-05-18',
      url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'gal_3',
      title: 'Pendistribusian Logistik & Paket ATK Bulanan ke Bagian Organisasi',
      category: 'Logistik',
      date: '2026-05-20',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'gal_4',
      title: 'Sinergitas Keprotokolan Kunjungan Kerja Delegasi Pemerintah Pusat',
      category: 'Keprotokolan',
      date: '2026-05-22',
      url: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=800'
    }
  ]);

  // Transaction bookings array
  const [bookings, setBookings] = useState<Booking[]>([
    { 
      id: 'book_1', 
      ruang: 'Ruang Rapat Sembakung', 
      tanggal: '2026-05-25', 
      waktu: '09:00 - 12:00 WITA', 
      agenda: 'Bagian Tata Pemerintahan - Rapat RKPD Dinas Kaltara', 
      status: 'Disetujui' 
    },
    { 
      id: 'book_2', 
      ruang: 'Aula Serbaguna Gedung Setda', 
      tanggal: '2026-05-26', 
      waktu: '13:00 - 16:00 WITA', 
      agenda: 'Subbag Protokol - Sosialisasi Digitalisasi Birokrasi', 
      status: 'Menunggu Konfirmasi' 
    }
  ]);

  // Vehicular requests array
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { 
      id: 'veh_1', 
      kendaraan: 'Toyota Innova (KU 1045 A)', 
      pemohon: 'Drs. Heri Supriyadi (Bagian Organisasi)', 
      tujuan: 'Bandara Juwata (Penjemputan DPR RI)', 
      status: 'Disetujui' 
    }
  ]);

  // Logistics requirements array
  const [logistics, setLogistics] = useState<LogisticsRequest[]>([
    { 
      id: 'log_1', 
      barang: 'Kertas HVS A4 80g', 
      jumlah: '5 Rim (Bagian Hukum)', 
      status: 'Selesai' 
    },
    { 
      id: 'log_2', 
      barang: 'Toner Ink HP Deskjet', 
      jumlah: '2 Box (Bagian Kesejahteraan Rakyat)', 
      status: 'Diproses' 
    }
  ]);

  // Hall schedules dataset
  const [schedules, setSchedules] = useState<HallSchedule[]>(() => {
    const saved = localStorage.getItem('pemkot_hall_schedules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved schedules:', e);
      }
    }
    return [
      {
        id: 'sched_1',
        hariTanggal: 'Senin, 15 Juni 2026',
        kegiatan: 'Rapat Rencana Kerja Anggaran APBD-Perubahan 2026',
        instansi: 'Bappeda Litbang Kota Tarakan',
        keterangan: 'Lengkap'
      },
      {
        id: 'sched_2',
        hariTanggal: 'Selasa, 16 Juni 2026',
        kegiatan: 'Pembekalan Teknis Aplikasi SIPERUM & SIPAKAR Internal Setda',
        instansi: 'Subbag Rumah Tangga & Perlengkapan',
        keterangan: 'Lengkap'
      },
      {
        id: 'sched_3',
        hariTanggal: 'Rabu, 17 Juni 2026',
        kegiatan: 'Audiensi Pemangku Kepentingan Pariwisata Bersama Walikota Tarakan',
        instansi: 'Bagian Protokol dan Komunikasi Pimpinan',
        keterangan: 'Lengkap'
      },
      {
        id: 'sched_4',
        hariTanggal: 'Jumat, 19 Juni 2026',
        kegiatan: 'Bimbingan Teknis Penginputan e-Monev Kota Tarakan',
        instansi: 'Bagian Organisasi Setda',
        keterangan: 'Tunda / Reschedule'
      }
    ];
  });

  const handleAddSchedule = (newSched: HallSchedule) => {
    setSchedules((prev) => {
      const updated = [newSched, ...prev];
      localStorage.setItem('pemkot_hall_schedules', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateSchedule = (updatedSched: HallSchedule) => {
    setSchedules((prev) => {
      const updated = prev.map((item) => (item.id === updatedSched.id ? updatedSched : item));
      localStorage.setItem('pemkot_hall_schedules', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('pemkot_hall_schedules', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper trigger callback for toaster messages
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // State adjustment callbacks
  const handleAddApplication = (newApp: Application) => {
    setApplications((prev) => [...prev, newApp]);
  };

  const handleEditApplication = (editedApp: Application) => {
    setApplications((prev) => prev.map((app) => (app.id === editedApp.id ? editedApp : app)));
  };

  const handleDeleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleAddGalleryItem = (newItem: GalleryItem) => {
    setGalleryItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteGalleryItem = (id: string) => {
    setGalleryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddBooking = async (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
    
    // Auto-sync to Google Sheet if configured
    const spreadsheetId = localStorage.getItem('pemkot_sheets_id');
    const autoSync = localStorage.getItem('pemkot_sheets_autosync') === 'true';
    if (spreadsheetId && autoSync) {
      try {
        const token = await getAccessToken();
        if (token) {
          await appendBookingToSheet(token, spreadsheetId, newBooking);
          triggerToast('Data permohonan ruang sukses disinkronkan ke Google Sheet!', 'success');
        }
      } catch (err) {
        console.error('Failed to auto-sync booking to sheet:', err);
      }
    }
  };

  const handleAddVehicle = async (newVeh: Vehicle) => {
    setVehicles((prev) => [newVeh, ...prev]);
    
    // Auto-sync to Google Sheet if configured
    const spreadsheetId = localStorage.getItem('pemkot_sheets_id');
    const autoSync = localStorage.getItem('pemkot_sheets_autosync') === 'true';
    if (spreadsheetId && autoSync) {
      try {
        const token = await getAccessToken();
        if (token) {
          await appendVehicleToSheet(token, spreadsheetId, newVeh);
          triggerToast('Data permohonan kendaraan dinas disinkronkan ke Google Sheet!', 'success');
        }
      } catch (err) {
        console.error('Failed to auto-sync vehicle to sheet:', err);
      }
    }
  };

  const handleAddLogistics = async (newReq: LogisticsRequest) => {
    setLogistics((prev) => [newReq, ...prev]);
    
    // Auto-sync to Google Sheet if configured
    const spreadsheetId = localStorage.getItem('pemkot_sheets_id');
    const autoSync = localStorage.getItem('pemkot_sheets_autosync') === 'true';
    if (spreadsheetId && autoSync) {
      try {
        const token = await getAccessToken();
        if (token) {
          await appendLogisticsToSheet(token, spreadsheetId, newReq);
          triggerToast('Data permohonan logistik sukses disinkronkan ke Google Sheet!', 'success');
        }
      } catch (err) {
        console.error('Failed to auto-sync logistics to sheet:', err);
      }
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const elem = document.getElementById(sectionId);
    if (elem) {
      const offset = 110;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = elem.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col antialiased">
      
      {/* 1. ADMIN PANEL TOP BANNER INDICATOR */}
      <AdminBar 
        isActive={isAdminActive} 
        onLogout={() => {
          setIsAdminActive(false);
          triggerToast('Sesi Administrator dinonaktifkan.', 'info');
        }} 
      />

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <Navbar 
        isAdminActive={isAdminActive}
        onAdminClick={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={() => {
          setIsAdminActive(false);
          triggerToast('Sesi Administrator dinonaktifkan.', 'info');
        }}
      />

      {/* 3. CORE LANDING PAGE SECTIONS */}
      <main className="flex-grow">
        
        {/* Hero Banner Section */}
        <Hero 
          onAksesClick={() => handleScrollToSection('aplikasi')}
          onVisiClick={() => handleScrollToSection('visi-misi')}
          isAdminActive={isAdminActive}
          content={landingContent}
          onEditTrigger={() => {
            setLandingEditTab('hero');
            setIsLandingEditOpen(true);
          }}
        />

        {/* Region Policy Visi & Misi Section */}
        <VisiMisi 
          isAdminActive={isAdminActive}
          content={landingContent}
          onEditTrigger={() => {
            setLandingEditTab('visimisi');
            setIsLandingEditOpen(true);
          }}
        />

        {/* Google Sheets Live Syncer Panel (visible only when logged in as admin) */}
        {isAdminActive && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 animate-in fade-in duration-300">
            <GoogleSheetsPanel 
              bookings={bookings}
              vehicles={vehicles}
              logistics={logistics}
              onShowToast={triggerToast}
            />
          </div>
        )}

        {/* Digital Interactive Application Grid & Micro-Apps Forms */}
        <AppGrid 
          isAdminActive={isAdminActive}
          applications={applications}
          onAddApplication={handleAddApplication}
          onEditApplication={handleEditApplication}
          onDeleteApplication={handleDeleteApplication}
          
          bookings={bookings}
          onAddBooking={handleAddBooking}
          
          vehicles={vehicles}
          onAddVehicle={handleAddVehicle}
          
          logistics={logistics}
          onAddLogistics={handleAddLogistics}
          
          showToast={triggerToast}
        />

        {/* Jadwal Penggunaan Gedung Serba Guna Kantor Walikota Section */}
        <GedungSchedule 
          isAdminActive={isAdminActive}
          schedules={schedules}
          onAddSchedule={handleAddSchedule}
          onUpdateSchedule={handleUpdateSchedule}
          onDeleteSchedule={handleDeleteSchedule}
          showToast={triggerToast}
        />

        {/* Documented Activity Snapshots Section */}
        <GallerySection 
          isAdminActive={isAdminActive}
          galleryItems={galleryItems}
          onAddGalleryItem={handleAddGalleryItem}
          onDeleteGalleryItem={handleDeleteGalleryItem}
          showToast={triggerToast}
        />

        {/* Direct In-App Government Feedback Forms Section */}
        <ContactForm showToast={triggerToast} />

      </main>

      {/* 4. MAIN FOOTER AREA */}
      <footer className="bg-slate-950 text-slate-550 text-slate-400 py-12 border-t border-slate-900 text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-7 space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="p-1.5 bg-white rounded-xl flex items-center justify-center">
                  <img 
                    src="https://i.ibb.co.com/dJLVwj0K/logo-pemkot.png" 
                    alt="Logo Pemkot Tarakan" 
                    className="w-10 h-10 object-contain" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div>
                  <span className="block text-white font-extrabold text-xs uppercase tracking-wider leading-none">
                    Subbag Rumah Tangga &amp; Perlengkapan
                  </span>
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">
                    Sekretariat Daerah Kota Tarakan
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Mewujudkan sistem administrasi perkantoran serta tata kelola pemeliharaan sarana prasarana daerah yang akuntabel, efisien, bermartabat, dan modern di Kota Tarakan.
              </p>
            </div>

            <div className="md:col-span-5 flex flex-col md:flex-row items-center justify-center md:justify-end gap-6 text-center md:text-right">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Situs Terkait
                </span>
                <a 
                  href="https://tarakankota.go.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-amber-500 hover:text-amber-400 underline transition"
                >
                  Website Resmi Pemkot Tarakan
                </a>
              </div>
              <div className="h-8 w-[1px] bg-slate-800 hidden md:block"></div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">
                  &copy; {new Date().getFullYear()} Pemerintah Kota Tarakan. All Rights Reserved.
                </p>
                <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider">
                  Dikembangkan oleh Subbag RT &amp; Perlengkapan
                </p>
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* 4.5. LANDING PAGE CONTENT CUSTOMIZER MODAL */}
      <LandingEditModal
        isOpen={isLandingEditOpen}
        onClose={() => setIsLandingEditOpen(false)}
        content={landingContent}
        defaultTab={landingEditTab}
        onSave={(newContent) => {
          setLandingContent(newContent);
          localStorage.setItem('pemkot_landing_content', JSON.stringify(newContent));
          triggerToast('Susunan konten halaman utama berhasil diperbarui!', 'success');
        }}
      />

      {/* 5. PORTAL AUTH MODAL */}
      <AdminLoginModal 
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => setIsAdminActive(true)}
        showToast={triggerToast}
      />

      {/* 6. TOAST NOTIFIER FLOATER */}
      <Toast 
        toast={toast} 
        onClose={() => setToast(null)} 
      />

    </div>
  );
}
