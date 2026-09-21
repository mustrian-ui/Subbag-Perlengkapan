import { useState, useMemo, FormEvent } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  AlertTriangle, 
  Info, 
  X, 
  Check, 
  Save, 
  Clock, 
  Building2, 
  Sparkles,
  CalendarDays,
  ShieldAlert
} from 'lucide-react';
import { HallSchedule } from '../types';

interface GedungScheduleProps {
  isAdminActive: boolean;
  schedules: HallSchedule[];
  onAddSchedule: (schedule: HallSchedule) => void;
  onUpdateSchedule: (schedule: HallSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Fixed Annual State/City Events held in GSG Kantor Walikota Tarakan
export const ANNUAL_EVENTS = [
  { no: 1, tanggal: '3 Januari', kegiatan: 'Hari Amal Bhakti Kemenag', instansi: 'Kementerian Agama & Bagian Kesra', keterangan: 'Agenda Tetap Tahunan' },
  { no: 2, tanggal: '25 April', kegiatan: 'Hari Otonomi Daerah', instansi: 'Bagian Pemerintahan & Setda', keterangan: 'Agenda Tetap Tahunan' },
  { no: 3, tanggal: '20 Mei', kegiatan: 'Hari Kebangkitan Nasional', instansi: 'Diskominfo & Bagian Prokopim', keterangan: 'Agenda Tetap Tahunan' },
  { no: 4, tanggal: '1 Juni', kegiatan: 'Hari Lahir Pancasila', instansi: 'Bakesbangpol Tarakan', keterangan: 'Agenda Tetap Tahunan' },
  { no: 5, tanggal: '17 Agustus', kegiatan: 'Hari Kemerdekaan Republik Indonesia', instansi: 'Panitia HUT RI Pemkot Tarakan', keterangan: 'Agenda Tetap Nasional' },
  { no: 6, tanggal: '1 Oktober', kegiatan: 'Hari Kesaktian Pancasila', instansi: 'Bakesbangpol Tarakan', keterangan: 'Agenda Tetap Tahunan' },
  { no: 7, tanggal: '22 Oktober', kegiatan: 'Hari Santri', instansi: 'Bagian Kesra & Ormas Islam', keterangan: 'Agenda Tetap Tahunan' },
  { no: 8, tanggal: '28 Oktober', kegiatan: 'Hari Sumpah Pemuda', instansi: 'Disbudporapar Tarakan', keterangan: 'Agenda Tetap Tahunan' },
  { no: 9, tanggal: '10 November', kegiatan: 'Hari Pahlawan', instansi: 'Dinas Sosial & Kodim/Polres', keterangan: 'Agenda Tetap Tahunan' },
  { no: 10, tanggal: '15 Desember', kegiatan: 'HUT Kota Tarakan', instansi: 'Seluruh Jajaran Pemkot Tarakan', keterangan: 'Peringatan Akbar Tahunan' },
  { no: 11, tanggal: '19 Desember', kegiatan: 'Hari Bela Negara', instansi: 'Bakesbangpol & Kodim Tarakan', keterangan: 'Agenda Tetap Tahunan' },
];

export default function GedungSchedule({
  isAdminActive,
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  showToast
}: GedungScheduleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<HallSchedule | null>(null);

  // Calendar state: defaults to current date (e.g. 2026)
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 5, 1)); // Juni 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Form states
  const [hariTanggal, setHariTanggal] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [instansi, setInstansi] = useState('');
  const [keterangan, setKeterangan] = useState('Lengkap');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  // Days in month calculation
  const { calendarDays, daysInMonth } = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // In Indonesia Monday is often day 0 or 1, let's normalize Sunday=0 -> 6, Monday=1 -> 0
    const startOffset = (firstDay + 6) % 7;
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return { calendarDays: days, daysInMonth: totalDays };
  }, [currentYear, currentMonth]);

  // Map schedules to dates
  const scheduleDayMap = useMemo(() => {
    const map = new Map<number, HallSchedule[]>();
    schedules.forEach(item => {
      // Try to parse day from string like "19 Juni 2026" or "Senin, 15 Juni 2026"
      const match = item.hariTanggal.match(/\b(\d{1,2})\b/);
      if (match) {
        const day = parseInt(match[1], 10);
        if (day >= 1 && day <= 31) {
          const list = map.get(day) || [];
          list.push(item);
          map.set(day, list);
        }
      }
    });
    return map;
  }, [schedules]);

  // Annual events map for current month
  const annualDayMap = useMemo(() => {
    const map = new Map<number, typeof ANNUAL_EVENTS[0]>();
    const curMonthName = monthNames[currentMonth].toLowerCase();
    ANNUAL_EVENTS.forEach(ev => {
      if (ev.tanggal.toLowerCase().includes(curMonthName)) {
        const match = ev.tanggal.match(/\b(\d{1,2})\b/);
        if (match) {
          const day = parseInt(match[1], 10);
          map.set(day, ev);
        }
      }
    });
    return map;
  }, [currentMonth]);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setHariTanggal(selectedDay ? `${selectedDay} ${monthNames[currentMonth]} ${currentYear}` : '');
    setKegiatan('');
    setInstansi('');
    setKeterangan('Lengkap');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (schedule: HallSchedule) => {
    setEditingSchedule(schedule);
    setHariTanggal(schedule.hariTanggal);
    setKegiatan(schedule.kegiatan);
    setInstansi(schedule.instansi);
    setKeterangan(schedule.keterangan);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!hariTanggal.trim() || !kegiatan.trim() || !instansi.trim()) {
      showToast('Harap isi kolom Hari/Tanggal, Kegiatan, dan Instansi!', 'error');
      return;
    }

    if (editingSchedule) {
      onUpdateSchedule({
        id: editingSchedule.id,
        hariTanggal,
        kegiatan,
        instansi,
        keterangan: keterangan || 'Lengkap'
      });
      showToast('Jadwal penggunaan gedung berhasil diperbarui!', 'success');
    } else {
      onAddSchedule({
        id: `sched_${Date.now()}`,
        hariTanggal,
        kegiatan,
        instansi,
        keterangan: keterangan || 'Lengkap'
      });
      showToast('Jadwal penggunaan gedung baru berhasil ditambahkan!', 'success');
    }

    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingSchedule(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal kegiatan ini?')) {
      onDeleteSchedule(id);
      showToast('Jadwal kegiatan berhasil dihapus.', 'info');
    }
  };

  // Filtered schedules for side list
  const filteredSchedules = schedules.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      item.hariTanggal.toLowerCase().includes(term) ||
      item.kegiatan.toLowerCase().includes(term) ||
      item.instansi.toLowerCase().includes(term) ||
      item.keterangan.toLowerCase().includes(term);

    if (selectedDay !== null) {
      const match = item.hariTanggal.match(/\b(\d{1,2})\b/);
      if (match && parseInt(match[1], 10) === selectedDay) {
        return matchesSearch;
      }
      return false;
    }

    return matchesSearch;
  });

  return (
    <section id="jadwal-gedung" className="py-20 bg-slate-50 relative border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-black tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase inline-block">
              Sistem Kalender &amp; Agenda GSG
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 font-display">
              Jadwal Pemakaian Gedung Serba Guna Kantor Walikota
            </h2>
            <p className="text-slate-500 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Pantau ketersediaan gedung melalui kalender interaktif dan daftar pemakaian resmi untuk mencegah tumpang tindih peminjaman fasilitas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdminActive && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda Gedung</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. MAIN GRID: KALENDER + JADWAL PEMAKAIAN GEDUNG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8">
          
          {/* LEFT: TAMPILAN KALENDER INTERAKTIF (7 Columns) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Kalender {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Klik tanggal untuk memfilter agenda terdaftar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentDate(new Date(2026, 5, 1));
                    setSelectedDay(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 py-2 border-b border-slate-100">
              <span className="text-emerald-700 font-extrabold">Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span className="text-slate-400">Sab</span>
              <span className="text-rose-500">Min</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 mt-2">
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty_${idx}`} className="h-16 rounded-xl bg-slate-50/50" />;
                }

                const daySchedules = scheduleDayMap.get(day) || [];
                const annualEvent = annualDayMap.get(day);
                const hasSchedules = daySchedules.length > 0;
                const isSelected = selectedDay === day;
                const isFirstDayOfMonth = day === 1;

                return (
                  <button
                    key={`day_${day}`}
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-400'
                        : hasSchedules
                          ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                          : annualEvent
                            ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70'
                            : 'border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black ${
                        isSelected ? 'text-emerald-800 font-extrabold' : 'text-slate-700'
                      }`}>
                        {day}
                      </span>
                      {isFirstDayOfMonth && (
                        <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-indigo-100 text-indigo-800">
                          Jumpa Pagi
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                      {annualEvent && (
                        <div className="text-[9px] font-black truncate text-amber-800 bg-amber-100/90 px-1 py-0.5 rounded" title={annualEvent.kegiatan}>
                          ★ {annualEvent.kegiatan}
                        </div>
                      )}
                      {daySchedules.slice(0, 1).map((s) => (
                        <div 
                          key={s.id} 
                          className="text-[9px] font-bold truncate text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded"
                          title={s.kegiatan}
                        >
                          {s.kegiatan}
                        </div>
                      ))}
                      {daySchedules.length > 1 && (
                        <span className="text-[8px] font-black text-slate-400">
                          +{daySchedules.length - 1} agenda
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Calendar legend */}
            <div className="flex items-center gap-4 flex-wrap mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Agenda Pemakaian Terdaftar</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Peringatan Tahunan Pemkot</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>Awal Bulan (Jumpa Pagi)</span>
              </span>
              {selectedDay !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="ml-auto text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Tampilkan Semua Tanggal
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: JADWAL PEMAKAIAN GEDUNG (5 Columns) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Jadwal Pemakaian Gedung
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedDay !== null
                      ? `Filter: Tanggal ${selectedDay} ${monthNames[currentMonth]} ${currentYear}`
                      : 'Seluruh agenda penggunaan terkini'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kegiatan, instansi, tanggal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 text-xs absolute right-3 top-1/2 -translate-y-1/2"
                >
                  &times;
                </button>
              )}
            </div>

            {/* List of Schedules */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredSchedules.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Tidak ada jadwal pemakaian gedung</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedDay !== null 
                      ? 'Tidak ada agenda pemakaian di tanggal yang dipilih.' 
                      : 'Belum ada agenda pemakaian yang sesuai filter pencarian.'}
                  </p>
                </div>
              ) : (
                filteredSchedules.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/15 transition duration-150 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.hariTanggal}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.keterangan && item.keterangan.toLowerCase().includes('batal')
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.keterangan && item.keterangan.toLowerCase().includes('tunda')
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                      }`}>
                        {item.keterangan}
                      </span>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                      {item.kegiatan}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={item.instansi}>
                        {item.instansi}
                      </span>
                      {isAdminActive && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                            title="Sunting"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* 2. KOLOM KETERANGAN MANDATORI DIBAWAH KALENDER DAN JADWAL */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300/80 rounded-2xl p-5 mb-10 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <span>Ketentuan Penting Penggunaan Gedung Serba Guna:</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-200/70 text-amber-900 font-extrabold rounded-md">
                  Pemberitahuan Resmi
                </span>
              </h4>
              <p className="text-xs md:text-sm font-bold text-amber-950 leading-relaxed">
                &ldquo;Jika pemakaian gedung akan dipakai Kepala Daerah secara mendadak maka peminjaman gedung akan digeser atau di reschedule dan setiap awal bulan akan di pakai untuk kegiatan Jumpa Pagi&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* 3. TABEL JADWAL KEGIATAN TAHUNAN YANG SUDAH PASTI DILAKSANAKAN */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Agenda Tetap Tahunan
                </span>
                <span className="text-xs text-slate-300 font-medium">GSG Walikota Tarakan</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2 font-display">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Jadwal Kegiatan Tahunan
              </h3>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              Daftar peringatan hari besar kenegaraan dan kegiatan resmi tahunan daerah yang telah ditetapkan.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                  <th className="py-3.5 px-5 text-center w-16">No.</th>
                  <th className="py-3.5 px-5 w-44">Tanggal Peringatan</th>
                  <th className="py-3.5 px-5">Nama Kegiatan / Peringatan Resmi</th>
                  <th className="py-3.5 px-5 w-72">Instansi / Unit Penyelenggara</th>
                  <th className="py-3.5 px-5 w-44 text-center">Status Agenda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-800 font-medium">
                {ANNUAL_EVENTS.map((ev) => (
                  <tr key={ev.no} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-center font-bold text-slate-400">
                      {ev.no}
                    </td>
                    <td className="py-3.5 px-5 font-black text-emerald-800">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{ev.tanggal}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {ev.kegiatan}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold border border-slate-200">
                        {ev.instansi}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {ev.keterangan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FORM FOR ADDING / EDITING SCHEDULING ENTRY */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 transform transition-all overflow-hidden duration-300 animate-in zoom-in-95"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2.5 text-slate-800">
                  <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base text-slate-900">
                      {editingSchedule ? 'Perbarui Jadwal Penggunaan' : 'Tambah Agenda Penggunaan'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">GSG Walikota Tarakan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hari / Tanggal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={hariTanggal}
                    onChange={(e) => setHariTanggal(e.target.value)}
                    placeholder="Contoh: Senin, 25 Mei 2026 atau Kam, 28/05/2026"
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none shadow-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kegiatan Acara <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={kegiatan}
                    onChange={(e) => setKegiatan(e.target.value)}
                    placeholder="Contoh: Rapat Pleno Koordinasi Panitia HUT Kota Tarakan"
                    rows={2}
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none shadow-sm transition resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Instansi / Penyelenggara <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={instansi}
                    onChange={(e) => setInstansi(e.target.value)}
                    placeholder="Contoh: Bappeda Litbang / Bagian Organisasi"
                    className="w-full text-xs font-semibold px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none shadow-sm transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status / Keterangan
                  </label>
                  <select
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full text-xs font-extrabold px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none shadow-sm transition bg-white"
                  >
                    <option value="Lengkap">Lengkap (Terjadwal)</option>
                    <option value="Tunda / Reschedule">Tunda / Reschedule</option>
                    <option value="Batal">Batal / Cancelled</option>
                    <option value="Dalam Konfirmasi">Dalam Konfirmasi</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition active:scale-98"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-slate-950/10 cursor-pointer flex items-center gap-1.5 transition active:scale-98"
                  >
                    {editingSchedule ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{editingSchedule ? 'Simpan Perubahan' : 'Simpan Agenda'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
