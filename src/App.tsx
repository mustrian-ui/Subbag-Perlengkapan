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
import { Application, GalleryItem, Booking, Vehicle, LogisticsRequest, SajiRapatRequest, CinderamataRequest, ToastMessage, LandingPageContent, HallSchedule, Complaint } from './types';
import LandingEditModal from './components/LandingEditModal';
import GoogleSheetsPanel from './components/GoogleSheetsPanel';
import GedungSchedule from './components/GedungSchedule';
import ComplaintsModal from './components/ComplaintsModal';
import ServiceReportsModal, { AppFilterType } from './components/ServiceReportsModal';
import ServicePortalModal, { getServiceType } from './components/ServicePortalModal';
import { getAccessToken, appendBookingToSheet, appendVehicleToSheet, appendLogisticsToSheet } from './lib/googleSheets';
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
const pnsHeroBackground = 'https://i.ibb.co.com/k2pcNHtX/back-Asn.png';

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

export const DEFAULT_APPS: Application[] = [
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
  },
  {
    id: 'app_5',
    title: 'SajiRapat (Konsumsi Rapat)',
    category: 'consumption',
    icon: 'utensils',
    desc: 'Fasilitasi penyediaan snack dan konsumsi makan rapat dinas, sosialisasi, dan agenda resmi Sekretariat Daerah.'
  },
  {
    id: 'app_6',
    title: 'PetaCendera (Cinderamata & Plakat)',
    category: 'souvenir',
    icon: 'gift',
    desc: 'Permohonan cinderamata resmi daerah, plakat khas Kota Tarakan, dan souvenir kehormatan tamu dinas.'
  }
];

// Standard building block layouts
export default function App() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isAdminActive, setIsAdminActive] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Dedicated Page-based Navigation State ('home' | 'portal' | 'reports')
  const [currentView, setCurrentView] = useState<'home' | 'portal' | 'reports'>('home');
  const [activePortalApp, setActivePortalApp] = useState<Application | null>(null);

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

  // SajiRapat requirements array (Konsumsi Rapat)
  const [sajiRapat, setSajiRapat] = useState<SajiRapatRequest[]>([]);

  // Cinderamata requirements array (PetaCendera)
  const [cinderamata, setCinderamata] = useState<CinderamataRequest[]>([]);

  // Hall schedules dataset
  const [schedules, setSchedules] = useState<HallSchedule[]>([]);

  // Complaints dataset state (LAPOR-RT)
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isComplaintsModalOpen, setIsComplaintsModalOpen] = useState<boolean>(false);

  // Unified Actionable Service Reports Dashboard State (SIPERUM, SIPAKAR, SILOGIS, LAPOR-RT)
  const [isServiceReportsModalOpen, setIsServiceReportsModalOpen] = useState<boolean>(false);
  const [serviceReportsInitialFilter, setServiceReportsInitialFilter] = useState<AppFilterType>('all');

  // Firebase Auth state listener
  useEffect(() => {
    const isBypassActive = localStorage.getItem('admin_bypass_active') === 'true';
    if (isBypassActive) {
      setIsAdminActive(true);
    }
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminActive(true);
      } else {
        if (localStorage.getItem('admin_bypass_active') !== 'true') {
          setIsAdminActive(false);
        }
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
        if (
          data.heroBgUrl === "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600" || 
          !data.heroBgUrl || 
          data.heroBgUrl.includes('pns_hero_background') || 
          data.heroBgUrl.includes('/assets/images/')
        ) {
          const updatedContent = { ...data, heroBgUrl: pnsHeroBackground };
          setDoc(landingRef, updatedContent).catch(err => {
            console.warn('Failed to update landing hero background to PNS default:', err);
          });
          setLandingContent(updatedContent);
        } else {
          setLandingContent(data);
        }
      } else {
        setDoc(landingRef, DEFAULT_LANDING_CONTENT).catch(err => {
          console.warn('Failed to seed landing content:', err);
        });
      }
    }, (err) => {
      console.warn('Firestore landing content listen error:', err);
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
        const isSeeded = localStorage.getItem('setda_apps_seeded');
        if (!isSeeded) {
          localStorage.setItem('setda_apps_seeded', 'true');
          setApplications(DEFAULT_APPS);
          if (auth.currentUser) {
            DEFAULT_APPS.forEach(app => {
              setDoc(doc(db, 'applications', app.id), app).catch(err => {
                console.warn('Failed to seed application:', app.id, err);
              });
            });
          }
        } else {
          setApplications([]);
        }
      }
    }, (err) => {
      console.warn('Firestore applications listen error:', err);
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
        const isSeeded = localStorage.getItem('setda_gallery_seeded');
        if (!isSeeded) {
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
          localStorage.setItem('setda_gallery_seeded', 'true');
          setGalleryItems(DEFAULT_GALLERY);
          if (auth.currentUser) {
            DEFAULT_GALLERY.forEach(item => {
              setDoc(doc(db, 'gallery', item.id), item).catch(err => {
                console.warn('Failed to seed gallery:', item.id, err);
              });
            });
          }
        } else {
          setGalleryItems([]);
        }
      }
    }, (err) => {
      console.warn('Firestore gallery listen error:', err);
    });

    // 4. Bookings sync (SIPERUM) - No auto-reseed on deletion
    const bookingsRef = collection(db, 'bookings');
    const unsubBookings = onSnapshot(bookingsRef, (snap) => {
      if (!snap.empty) {
        const list: Booking[] = [];
        snap.forEach(d => list.push(d.data() as Booking));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setBookings(list);
      } else {
        setBookings([]);
      }
    }, (err) => {
      console.warn('Firestore bookings listen error:', err);
    });

    // 5. Vehicles sync (SIPAKAR) - No auto-reseed on deletion
    const vehiclesRef = collection(db, 'vehicles');
    const unsubVehicles = onSnapshot(vehiclesRef, (snap) => {
      if (!snap.empty) {
        const list: Vehicle[] = [];
        snap.forEach(d => list.push(d.data() as Vehicle));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setVehicles(list);
      } else {
        setVehicles([]);
      }
    }, (err) => {
      console.warn('Firestore vehicles listen error:', err);
    });

    // 6. Logistics sync (SILOGIS) - No auto-reseed on deletion
    const logisticsRef = collection(db, 'logistics');
    const unsubLogistics = onSnapshot(logisticsRef, (snap) => {
      if (!snap.empty) {
        const list: LogisticsRequest[] = [];
        snap.forEach(d => list.push(d.data() as LogisticsRequest));
        list.sort((a, b) => b.id.localeCompare(a.id));
        setLogistics(list);
      } else {
        setLogistics([]);
      }
    }, (err) => {
      console.warn('Firestore logistics listen error:', err);
    });

    // 7. Schedules sync (GSG) - No auto-reseed on deletion
    const schedulesRef = collection(db, 'schedules');
    const unsubSchedules = onSnapshot(schedulesRef, (snap) => {
      if (!snap.empty) {
        const list: HallSchedule[] = [];
        snap.forEach(d => list.push(d.data() as HallSchedule));
        list.sort((a, b) => a.hariTanggal.localeCompare(b.hariTanggal));
        setSchedules(list);
      } else {
        setSchedules([]);
      }
    }, (err) => {
      console.warn('Firestore schedules listen error:', err);
    });

    // 8. Complaints (LAPOR-RT) sync - No auto-reseed on deletion
    const complaintsRef = collection(db, 'complaints');
    const unsubComplaints = onSnapshot(complaintsRef, (snap) => {
      if (!snap.empty) {
        const list: Complaint[] = [];
        snap.forEach(d => list.push(d.data() as Complaint));
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setComplaints(list);
      } else {
        setComplaints([]);
      }
    }, (err) => {
      console.warn('Firestore complaints listen error:', err);
    });

    // 9. SajiRapat (Konsumsi Rapat) sync - No auto-reseed on deletion
    const sajiRef = collection(db, 'sajirapat');
    const unsubSajiRapat = onSnapshot(sajiRef, (snap) => {
      if (!snap.empty) {
        const list: SajiRapatRequest[] = [];
        snap.forEach(d => list.push(d.data() as SajiRapatRequest));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setSajiRapat(list);
      } else {
        setSajiRapat([]);
      }
    }, (err) => {
      console.warn('Firestore sajiRapat listen error:', err);
    });

    // 10. Cinderamata (PetaCendera) sync - No auto-reseed on deletion
    const cenderaRef = collection(db, 'cinderamata');
    const unsubCinderamata = onSnapshot(cenderaRef, (snap) => {
      if (!snap.empty) {
        const list: CinderamataRequest[] = [];
        snap.forEach(d => list.push(d.data() as CinderamataRequest));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setCinderamata(list);
      } else {
        setCinderamata([]);
      }
    }, (err) => {
      console.warn('Firestore cinderamata listen error:', err);
    });

    return () => {
      unsubLanding();
      unsubApps();
      unsubGallery();
      unsubBookings();
      unsubVehicles();
      unsubLogistics();
      unsubSchedules();
      unsubComplaints();
      unsubSajiRapat();
      unsubCinderamata();
    };
  }, []);

  const handleUpdateComplaintStatus = async (id: string, status: 'Masuk' | 'Diproses' | 'Selesai') => {
    try {
      await updateDoc(doc(db, 'complaints', id), { status });
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `complaints/${id}`);
      throw err;
    }
  };

  const handleDeleteComplaint = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'complaints', id));
      setComplaints(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `complaints/${id}`);
      throw err;
    }
  };

  const handleAddComplaint = (newComp: Complaint) => {
    setComplaints(prev => [newComp, ...prev.filter(c => c.id !== newComp.id)]);
  };

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

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      triggerToast(`Status reservasi ruangan diperbarui menjadi "${status}"`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
      throw err;
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
      setBookings(prev => prev.filter(b => b.id !== id));
      triggerToast('Data permohonan ruangan berhasil dihapus', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
      throw err;
    }
  };

  const handleUpdateVehicleStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'vehicles', id), { status });
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, status } : v));
      triggerToast(`Status peminjaman kendaraan diperbarui menjadi "${status}"`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vehicles/${id}`);
      throw err;
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
      setVehicles(prev => prev.filter(v => v.id !== id));
      triggerToast('Data peminjaman kendaraan berhasil dihapus', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vehicles/${id}`);
      throw err;
    }
  };

  const handleUpdateLogisticsStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'logistics', id), { status });
      setLogistics(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      triggerToast(`Status permohonan logistik diperbarui menjadi "${status}"`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `logistics/${id}`);
      throw err;
    }
  };

  const handleDeleteLogistics = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'logistics', id));
      setLogistics(prev => prev.filter(l => l.id !== id));
      triggerToast('Data permohonan logistik berhasil dihapus', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `logistics/${id}`);
      throw err;
    }
  };

  const handleAddSajiRapat = async (newReq: SajiRapatRequest) => {
    try {
      await setDoc(doc(db, 'sajirapat', newReq.id), newReq);
      setSajiRapat(prev => [newReq, ...prev.filter(s => s.id !== newReq.id)]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sajirapat/${newReq.id}`);
    }
  };

  const handleUpdateSajiRapatStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'sajirapat', id), { status });
      setSajiRapat(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      triggerToast(`Status permohonan konsumsi diperbarui menjadi "${status}"`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `sajirapat/${id}`);
      throw err;
    }
  };

  const handleDeleteSajiRapat = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sajirapat', id));
      setSajiRapat(prev => prev.filter(s => s.id !== id));
      triggerToast('Data permohonan konsumsi berhasil dihapus', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `sajirapat/${id}`);
      throw err;
    }
  };

  const handleAddCinderamata = async (newReq: CinderamataRequest) => {
    try {
      await setDoc(doc(db, 'cinderamata', newReq.id), newReq);
      setCinderamata(prev => [newReq, ...prev.filter(c => c.id !== newReq.id)]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cinderamata/${newReq.id}`);
    }
  };

  const handleUpdateCinderamataStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'cinderamata', id), { status });
      setCinderamata(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      triggerToast(`Status permohonan cinderamata diperbarui menjadi "${status}"`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `cinderamata/${id}`);
      throw err;
    }
  };

  const handleDeleteCinderamata = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'cinderamata', id));
      setCinderamata(prev => prev.filter(c => c.id !== id));
      triggerToast('Data permohonan cinderamata berhasil dihapus', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cinderamata/${id}`);
      throw err;
    }
  };

  // Dedicated one-click cleanup for all built-in dummy/sample data
  const handleClearAllDummyData = async () => {
    const dummyDocs: { col: string; id: string }[] = [
      { col: 'bookings', id: 'book_1' },
      { col: 'bookings', id: 'book_2' },
      { col: 'vehicles', id: 'veh_1' },
      { col: 'logistics', id: 'log_1' },
      { col: 'logistics', id: 'log_2' },
      { col: 'sajirapat', id: 'saji_1' },
      { col: 'sajirapat', id: 'saji_2' },
      { col: 'cinderamata', id: 'cend_1' },
      { col: 'cinderamata', id: 'cend_2' },
      { col: 'complaints', id: 'comp_demo_1' },
      { col: 'complaints', id: 'comp_demo_2' },
      { col: 'schedules', id: 'sched_1' },
      { col: 'schedules', id: 'sched_2' },
      { col: 'schedules', id: 'sched_3' },
      { col: 'schedules', id: 'sched_4' }
    ];

    try {
      await Promise.all(
        dummyDocs.map(d => deleteDoc(doc(db, d.col, d.id)).catch(() => {}))
      );

      // Instantly clear from local state so UI updates immediately
      setBookings(prev => prev.filter(b => !['book_1', 'book_2'].includes(b.id)));
      setVehicles(prev => prev.filter(v => v.id !== 'veh_1'));
      setLogistics(prev => prev.filter(l => !['log_1', 'log_2'].includes(l.id)));
      setSajiRapat(prev => prev.filter(s => !['saji_1', 'saji_2'].includes(s.id)));
      setCinderamata(prev => prev.filter(c => !['cend_1', 'cend_2'].includes(c.id)));
      setComplaints(prev => prev.filter(c => !['comp_demo_1', 'comp_demo_2'].includes(c.id)));
      setSchedules(prev => prev.filter(s => !['sched_1', 'sched_2', 'sched_3', 'sched_4'].includes(s.id)));

      localStorage.setItem('setda_dummy_purged', 'true');
      triggerToast('Semua data contoh (dummy) berhasil dihapus permanen!', 'success');
    } catch (err) {
      console.error('Failed to clear dummy data:', err);
      triggerToast('Gagal menghapus beberapa data dummy.', 'error');
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

  // Dedicated Page Navigation Handlers
  const handleOpenPortal = (app: Application) => {
    setActivePortalApp(app);
    setCurrentView('portal');
    const serviceType = getServiceType(app);
    window.location.hash = `portal/${serviceType || app.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenReports = (filter?: AppFilterType) => {
    setServiceReportsInitialFilter(filter || 'all');
    setCurrentView('reports');
    window.location.hash = 'laporan';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = (targetSectionId?: string) => {
    setCurrentView('home');
    setActivePortalApp(null);
    setIsServiceReportsModalOpen(false);
    setIsComplaintsModalOpen(false);
    if (targetSectionId && typeof targetSectionId === 'string' && targetSectionId !== 'beranda') {
      window.location.hash = targetSectionId;
      setTimeout(() => {
        const element = document.getElementById(targetSectionId);
        if (element) {
          const headerOffset = 110;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.location.hash = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Synchronize Browser URL Hash to enable direct URLs, Back/Forward browser buttons
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '');
      if (!rawHash) {
        if (currentView !== 'home') {
          setCurrentView('home');
          setActivePortalApp(null);
        }
        return;
      }

      if (rawHash.startsWith('portal/')) {
        const target = rawHash.replace('portal/', '').toLowerCase();
        const found = applications.find(a => 
          a.id.toLowerCase() === target || 
          getServiceType(a) === target
        ) || DEFAULT_APPS.find(a => 
          a.id.toLowerCase() === target || 
          getServiceType(a) === target
        );
        if (found) {
          setActivePortalApp(found);
          setCurrentView('portal');
        }
      } else if (rawHash === 'laporan' || rawHash === 'reports' || rawHash === 'pusat-tindakan') {
        setCurrentView('reports');
      } else if (['beranda', 'visi-misi', 'aplikasi', 'jadwal-gedung', 'galeri', 'kontak'].includes(rawHash)) {
        if (currentView !== 'home') {
          setCurrentView('home');
          setActivePortalApp(null);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [applications]);

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col antialiased">
      
      {/* 1. ADMIN PANEL TOP BANNER INDICATOR */}
      <AdminBar 
        isActive={isAdminActive} 
        complaintsCount={complaints.length}
        newComplaintsCount={complaints.filter(c => c.status === 'Masuk').length}
        totalPendingReportsCount={
          bookings.filter(b => !b.status || b.status.toLowerCase().includes('menunggu') || b.status.toLowerCase().includes('pending')).length +
          vehicles.filter(v => !v.status || v.status.toLowerCase().includes('menunggu') || v.status.toLowerCase().includes('pending')).length +
          logistics.filter(l => !l.status || l.status.toLowerCase().includes('menunggu') || l.status.toLowerCase().includes('pending') || l.status.toLowerCase().includes('diproses')).length +
          complaints.filter(c => c.status === 'Masuk').length
        }
        onOpenComplaints={() => {
          const laporApp = applications.find(a => getServiceType(a) === 'lapor') || DEFAULT_APPS.find(a => getServiceType(a) === 'lapor');
          if (laporApp) {
            handleOpenPortal(laporApp);
          } else {
            handleOpenReports('lapor');
          }
        }}
        onOpenServiceReports={() => handleOpenReports('all')}
        onClearDummyData={handleClearAllDummyData}
        onLogout={async () => {
          try {
            localStorage.removeItem('admin_bypass_active');
            await signOut(auth);
            setIsAdminActive(false);
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
        currentView={currentView}
        onNavigateHome={handleBackToHome}
        onLogoutAdmin={async () => {
          try {
            localStorage.removeItem('admin_bypass_active');
            await signOut(auth);
            setIsAdminActive(false);
            triggerToast('Sesi Administrator dinonaktifkan.', 'info');
          } catch (err) {
            console.error('Logout error:', err);
          }
        }}
      />

      {/* 3. CORE APPLICATION & LANDING VIEWS */}
      <main className="flex-grow">
        {currentView === 'portal' && activePortalApp ? (
          <ServicePortalModal
            isFullPage={true}
            activeMicroApp={activePortalApp}
            onClose={() => handleBackToHome('aplikasi')}
            isAdminActive={isAdminActive}
            onOpenServiceReportsModal={(filter) => handleOpenReports(filter)}
            onOpenComplaintsModal={() => handleOpenReports('lapor')}
            bookings={bookings}
            onAddBooking={handleAddBooking}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onDeleteVehicle={handleDeleteVehicle}
            logistics={logistics}
            onAddLogistics={handleAddLogistics}
            onUpdateLogisticsStatus={handleUpdateLogisticsStatus}
            onDeleteLogistics={handleDeleteLogistics}
            sajiRapat={sajiRapat}
            onAddSajiRapat={handleAddSajiRapat}
            onUpdateSajiRapatStatus={handleUpdateSajiRapatStatus}
            onDeleteSajiRapat={handleDeleteSajiRapat}
            cinderamata={cinderamata}
            onAddCinderamata={handleAddCinderamata}
            onUpdateCinderamataStatus={handleUpdateCinderamataStatus}
            onDeleteCinderamata={handleDeleteCinderamata}
            complaints={complaints}
            onAddComplaint={handleAddComplaint}
            onUpdateComplaintStatus={handleUpdateComplaintStatus}
            onDeleteComplaint={handleDeleteComplaint}
            showToast={triggerToast}
          />
        ) : currentView === 'reports' ? (
          <ServiceReportsModal
            isOpen={true}
            isFullPage={true}
            onClose={() => handleBackToHome('aplikasi')}
            initialAppFilter={serviceReportsInitialFilter}
            isAdminActive={isAdminActive}
            bookings={bookings}
            vehicles={vehicles}
            logistics={logistics}
            sajiRapat={sajiRapat}
            cinderamata={cinderamata}
            complaints={complaints}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onDeleteBooking={handleDeleteBooking}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onDeleteVehicle={handleDeleteVehicle}
            onUpdateLogisticsStatus={handleUpdateLogisticsStatus}
            onDeleteLogistics={handleDeleteLogistics}
            onUpdateSajiRapatStatus={handleUpdateSajiRapatStatus}
            onDeleteSajiRapat={handleDeleteSajiRapat}
            onUpdateCinderamataStatus={handleUpdateCinderamataStatus}
            onDeleteCinderamata={handleDeleteCinderamata}
            onUpdateComplaintStatus={handleUpdateComplaintStatus}
            onDeleteComplaint={handleDeleteComplaint}
            onClearAllDummyData={handleClearAllDummyData}
            showToast={triggerToast}
          />
        ) : (
          <>
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
                  sajiRapat={sajiRapat}
                  cinderamata={cinderamata}
                  logistics={logistics}
                  complaints={complaints}
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
              onOpenPortal={handleOpenPortal}
              
              bookings={bookings}
              onAddBooking={handleAddBooking}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteBooking={handleDeleteBooking}
              
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicleStatus={handleUpdateVehicleStatus}
              onDeleteVehicle={handleDeleteVehicle}
              
              logistics={logistics}
              onAddLogistics={handleAddLogistics}
              onUpdateLogisticsStatus={handleUpdateLogisticsStatus}
              onDeleteLogistics={handleDeleteLogistics}

              sajiRapat={sajiRapat}
              onAddSajiRapat={handleAddSajiRapat}
              onUpdateSajiRapatStatus={handleUpdateSajiRapatStatus}
              onDeleteSajiRapat={handleDeleteSajiRapat}

              cinderamata={cinderamata}
              onAddCinderamata={handleAddCinderamata}
              onUpdateCinderamataStatus={handleUpdateCinderamataStatus}
              onDeleteCinderamata={handleDeleteCinderamata}

              complaints={complaints}
              onOpenComplaintsModal={() => handleOpenReports('lapor')}
              onAddComplaint={handleAddComplaint}
              onUpdateComplaintStatus={handleUpdateComplaintStatus}
              onDeleteComplaint={handleDeleteComplaint}

              onOpenServiceReportsModal={(filter) => handleOpenReports(filter)}
              
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
            <ContactForm 
              showToast={triggerToast} 
              onAddComplaint={handleAddComplaint}
            />
          </>
        )}
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
      {isLandingEditOpen && (
        <LandingEditModal
          isOpen={isLandingEditOpen}
          onClose={() => setIsLandingEditOpen(false)}
          content={landingContent}
          defaultTab={landingEditTab}
          onSave={async (newContent) => {
            try {
              await setDoc(doc(db, 'settings', 'landing'), newContent);
              setLandingContent(newContent);
              triggerToast('Susunan konten halaman utama berhasil diperbarui!', 'success');
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, 'settings/landing');
            }
          }}
        />
      )}

      {/* 4.6. COMPLAINTS & LAPOR-RT MANAGEMENT MODAL */}
      {isComplaintsModalOpen && (
        <ComplaintsModal
          isOpen={isComplaintsModalOpen}
          onClose={() => setIsComplaintsModalOpen(false)}
          complaints={complaints}
          onUpdateStatus={handleUpdateComplaintStatus}
          onDeleteComplaint={handleDeleteComplaint}
          showToast={triggerToast}
        />
      )}

      {/* 5. PORTAL AUTH MODAL */}
      {isAdminLoginOpen && (
        <AdminLoginModal 
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onLoginSuccess={() => setIsAdminActive(true)}
          showToast={triggerToast}
        />
      )}

      {/* 6. TOAST NOTIFIER FLOATER */}
      <Toast 
        toast={toast} 
        onClose={() => setToast(null)} 
      />

    </div>
  );
}
