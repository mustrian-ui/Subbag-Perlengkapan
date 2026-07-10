import { useState, useEffect } from 'react';
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
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
// @ts-ignore
import pnsHeroBackground from './assets/images/pns_hero_background_1783294463163.jpg';

const DEFAULT_LANDING_CONTENT: LandingPageContent = {
  heroTagline: "Sekretariat Daerah Kota Tarakan",
  heroTitlePrefix: "Subbagian Rumah Tangga",
  heroTitleAccent: "& Perlengkapan",
  heroDesc: "Berkomitmen tinggi menyelenggarakan pelayanan rumah tangga, akomodasi keprotokolan negara, pemeliharaan sarana prasarana vital, serta tata kelola logistik perlengkapan guna mendukung kelancaran administrasi pemerintahan Kota Tarakan yang mandiri dan dinamis.",
  heroBgUrl: pnsHeroBackground,
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

  // Landing Page customizable content state
  const [landingContent, setLandingContent] = useState<LandingPageContent>(DEFAULT_LANDING_CONTENT);

  const [isLandingEditOpen, setIsLandingEditOpen] = useState<boolean>(false);
  const [landingEditTab, setLandingEditTab] = useState<'hero' | 'visimisi'>('hero');

  // Application Dataset State
  const [applications, setApplications] = useState<Application[]>([]);

  // Gallery Dataset State
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Transaction bookings array
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Vehicular requests array
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Logistics requirements array
  const [logistics, setLogistics] = useState<LogisticsRequest[]>([]);

  // Hall schedules dataset
  const [schedules, setSchedules] = useState<HallSchedule[]>([]);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminActive(true);
      } else {
        setIsAdminActive(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore Sync & Seeding Effects
  useEffect(() => {
    // 1. Landing content sync
    const landingRef = doc(db, 'settings', 'landing');
    const unsubLanding = onSnapshot(landingRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as LandingPageContent;
        if (data.heroBgUrl === "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600" || !data.heroBgUrl) {
          const updatedContent = { ...data, heroBgUrl: pnsHeroBackground };
          setDoc(landingRef, updatedContent).catch(err => {
            console.error('Failed to update landing hero background to PNS default:', err);
          });
          setLandingContent(updatedContent);
        } else {
          setLandingContent(data);
        }
      } else {
        setDoc(landingRef, DEFAULT_LANDING_CONTENT).catch(err => {
          console.error('Failed to seed landing content:', err);
        });
      }
    }, (err) => {
      console.error('Firestore landing content listen error:', err);
    });

    // 2. Applications sync
    const appsRef = collection(db, 'applications');
    const unsubApps = onSnapshot(appsRef, (snap) => {
      if (!snap.empty) {
        const list: Application[] = [];
        snap.forEach(d => list.push(d.data() as Application));
        list.sort((a, b) => a.id.localeCompare(b.id));
        setApplications(list);
      } else {
        const DEFAULT_APPS: Application[] = [
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
        ];
        DEFAULT_APPS.forEach(app => {
          setDoc(doc(db, 'applications', app.id), app).catch(err => {
            console.error('Failed to seed application:', app.id, err);
          });
        });
      }
    }, (err) => {
      console.error('Firestore applications listen error:', err);
    });

    // 3. Gallery sync
    const galleryRef = collection(db, 'gallery');
    const unsubGallery = onSnapshot(galleryRef, (snap) => {
      if (!snap.empty) {
        const list: GalleryItem[] = [];
        snap.forEach(d => list.push(d.data() as GalleryItem));
        list.sort((a, b) => b.date.localeCompare(a.date));
        setGalleryItems(list);
      } else {
        const DEFAULT_GALLERY: GalleryItem[] = [
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
        ];
        DEFAULT_GALLERY.forEach(item => {
          setDoc(doc(db, 'gallery', item.id), item).catch(err => {
            console.error('Failed to seed gallery:', item.id, err);
          });
        });
      }
    }, (err) => {
      console.error('Firestore gallery listen error:', err);
    });

    // 4. Bookings sync
    const bookingsRef = collection(db, 'bookings');
    const unsubBookings = onSnapshot(bookingsRef, (snap) => {
      if (!snap.empty) {
        const list: Booking[] = [];
        snap.forEach(d => list.push(d.data() as Booking));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setBookings(list);
      } else {
        const DEFAULT_BOOKINGS: Booking[] = [
          { 
            id: 'book_1', 
            ruang: 'Gedung Lubung', 
            tanggal: '2026-05-25', 
            waktu: '09:00 - 12:00 WITA', 
            agenda: 'Bagian Tata Pemerintahan - Rapat RKPD Dinas Kaltara', 
            status: 'Disetujui',
            pemohon: 'Drs. Heri Supriyadi',
            instansi: 'Bagian Tata Pemerintahan'
          },
          { 
            id: 'book_2', 
            ruang: 'Gedung Serbaguna', 
            tanggal: '2026-05-26', 
            waktu: '13:00 - 16:00 WITA', 
            agenda: 'Subbag Protokol - Sosialisasi Digitalisasi Birokrasi', 
            status: 'Menunggu Konfirmasi',
            pemohon: 'Staff Protokol',
            instansi: 'Subbag Protokol Setda'
          }
        ];
        DEFAULT_BOOKINGS.forEach(b => {
          setDoc(doc(db, 'bookings', b.id), b).catch(err => {
            console.error('Failed to seed booking:', b.id, err);
          });
        });
      }
    }, (err) => {
      console.error('Firestore bookings listen error:', err);
    });

    // 5. Vehicles sync
    const vehiclesRef = collection(db, 'vehicles');
    const unsubVehicles = onSnapshot(vehiclesRef, (snap) => {
      if (!snap.empty) {
        const list: Vehicle[] = [];
        snap.forEach(d => list.push(d.data() as Vehicle));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setVehicles(list);
      } else {
        const DEFAULT_VEHICLES: Vehicle[] = [
          { 
            id: 'veh_1', 
            kendaraan: 'Toyota Innova (KU 1045 A)', 
            pemohon: 'Drs. Heri Supriyadi', 
            instansi: 'Bagian Organisasi Setda',
            tujuan: 'Bandara Juwata (Penjemputan DPR RI)', 
            status: 'Disetujui' 
          }
        ];
        DEFAULT_VEHICLES.forEach(v => {
          setDoc(doc(db, 'vehicles', v.id), v).catch(err => {
            console.error('Failed to seed vehicle:', v.id, err);
          });
        });
      }
    }, (err) => {
      console.error('Firestore vehicles listen error:', err);
    });

    // 6. Logistics sync
    const logisticsRef = collection(db, 'logistics');
    const unsubLogistics = onSnapshot(logisticsRef, (snap) => {
      if (!snap.empty) {
        const list: LogisticsRequest[] = [];
        snap.forEach(d => list.push(d.data() as LogisticsRequest));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setLogistics(list);
      } else {
        const DEFAULT_LOGISTICS: LogisticsRequest[] = [
          { 
            id: 'log_1', 
            barang: 'Kertas HVS A4 80g', 
            jumlah: '5 Rim', 
            status: 'Selesai',
            kegiatan: 'Administrasi Umum',
            pemohon: 'Staff Hukum',
            instansi: 'Bagian Hukum Setda'
          },
          { 
            id: 'log_2', 
            barang: 'Toner Ink HP Deskjet', 
            jumlah: '2 Box', 
            status: 'Diproses',
            kegiatan: 'Cetak Dokumen Laporan',
            pemohon: 'Staff Kesra',
            instansi: 'Bagian Kesejahteraan Rakyat Setda'
          }
        ];
        DEFAULT_LOGISTICS.forEach(l => {
          setDoc(doc(db, 'logistics', l.id), l).catch(err => {
            console.error('Failed to seed logistics:', l.id, err);
          });
        });
      }
    }, (err) => {
      console.error('Firestore logistics listen error:', err);
    });

    // 7. Schedules sync
    const schedulesRef = collection(db, 'schedules');
    const unsubSchedules = onSnapshot(schedulesRef, (snap) => {
      if (!snap.empty) {
        const list: HallSchedule[] = [];
        snap.forEach(d => list.push(d.data() as HallSchedule));
        list.sort((a, b) => a.hariTanggal.localeCompare(b.hariTanggal));
        setSchedules(list);
      } else {
        const DEFAULT_SCHEDULES: HallSchedule[] = [
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
        DEFAULT_SCHEDULES.forEach(s => {
          setDoc(doc(db, 'schedules', s.id), s).catch(err => {
            console.error('Failed to seed schedule:', s.id, err);
          });
        });
      }
    }, (err) => {
      console.error('Firestore schedules listen error:', err);
    });

    return () => {
      unsubLanding();
      unsubApps();
      unsubGallery();
      unsubBookings();
      unsubVehicles();
      unsubLogistics();
      unsubSchedules();
    };
  }, []);

  const handleAddSchedule = async (newSched: HallSchedule) => {
    try {
      await setDoc(doc(db, 'schedules', newSched.id), newSched);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schedules/${newSched.id}`);
    }
  };

  const handleUpdateSchedule = async (updatedSched: HallSchedule) => {
    try {
      await setDoc(doc(db, 'schedules', updatedSched.id), updatedSched);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schedules/${updatedSched.id}`);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schedules/${id}`);
    }
  };

  // Helper trigger callback for toaster messages
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // State adjustment callbacks
  const handleAddApplication = async (newApp: Application) => {
    try {
      await setDoc(doc(db, 'applications', newApp.id), newApp);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `applications/${newApp.id}`);
    }
  };

  const handleEditApplication = async (editedApp: Application) => {
    try {
      await setDoc(doc(db, 'applications', editedApp.id), editedApp);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `applications/${editedApp.id}`);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'applications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `applications/${id}`);
    }
  };

  const handleAddGalleryItem = async (newItem: GalleryItem) => {
    try {
      await setDoc(doc(db, 'gallery', newItem.id), newItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `gallery/${newItem.id}`);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `gallery/${id}`);
    }
  };

  const handleAddBooking = async (newBooking: Booking) => {
    try {
      await setDoc(doc(db, 'bookings', newBooking.id), newBooking);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bookings/${newBooking.id}`);
    }
    
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
    try {
      await setDoc(doc(db, 'vehicles', newVeh.id), newVeh);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${newVeh.id}`);
    }
    
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
    try {
      await setDoc(doc(db, 'logistics', newReq.id), newReq);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `logistics/${newReq.id}`);
    }
    
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
        onLogout={async () => {
          try {
            await signOut(auth);
            triggerToast('Sesi Administrator dinonaktifkan.', 'info');
          } catch (err) {
            console.error('Logout error:', err);
          }
        }} 
      />

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <Navbar 
        isAdminActive={isAdminActive}
        onAdminClick={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={async () => {
          try {
            await signOut(auth);
            triggerToast('Sesi Administrator dinonaktifkan.', 'info');
          } catch (err) {
            console.error('Logout error:', err);
          }
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
        onSave={async (newContent) => {
          try {
            await setDoc(doc(db, 'settings', 'landing'), newContent);
            triggerToast('Susunan konten halaman utama berhasil diperbarui!', 'success');
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, 'settings/landing');
          }
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
