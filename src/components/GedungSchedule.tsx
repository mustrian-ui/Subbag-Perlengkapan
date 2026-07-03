import { useState, FormEvent } from 'react';
import { Calendar, Plus, Trash2, Edit, Search, HelpCircle, X, Check, Save } from 'lucide-react';
import { HallSchedule } from '../types';

interface GedungScheduleProps {
  isAdminActive: boolean;
  schedules: HallSchedule[];
  onAddSchedule: (schedule: HallSchedule) => void;
  onUpdateSchedule: (schedule: HallSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

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

  // Form states
  const [hariTanggal, setHariTanggal] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [instansi, setInstansi] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setHariTanggal('');
    setKegiatan('');
    setInstansi('');
    setKeterangan('');
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
      // Editing
      onUpdateSchedule({
        id: editingSchedule.id,
        hariTanggal,
        kegiatan,
        instansi,
        keterangan: keterangan || 'Lengkap'
      });
      showToast('Jadwal penggunaan gedung berhasil diperbarui!', 'success');
    } else {
      // Adding new
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
    setHariTanggal('');
    setKegiatan('');
    setInstansi('');
    setKeterangan('');
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

  // Filtering based on search term
  const filteredSchedules = schedules.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.hariTanggal.toLowerCase().includes(term) ||
      item.kegiatan.toLowerCase().includes(term) ||
      item.instansi.toLowerCase().includes(term) ||
      item.keterangan.toLowerCase().includes(term)
    );
  });

  return (
    <section id="jadwal-gedung" className="py-24 bg-slate-50 relative border-b border-slate-100">
      {/* Background gradients for smooth styling */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-widest text-emerald-600 uppercase block">
              Schedules &amp; Reservasi Publik
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Jadwal Gedung Serba Guna Kantor Walikota
            </h2>
            <div className="w-20 h-1.5 bg-emerald-500 rounded-full"></div>
            <p className="text-slate-500 max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed">
              Daftar resmi agenda penggunaan Aula &amp; Gedung Serba Guna Kantor Walikota Tarakan. Membantu menghindari bentrokan jadwal kedepannya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input field */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kegiatan / instansi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-64 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-emerald-500 outline-none shadow-sm transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Admin Add Schedule Button */}
            {isAdminActive && (
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/10 cursor-pointer hover:translate-y-[-1px] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda</span>
              </button>
            )}
          </div>
        </div>

        {/* Schedules Table Panel */}
        <div className="bg-white border border-slate-150 rounded-3xl shadow-xl shadow-slate-900/5 overflow-hidden">
          {filteredSchedules.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-extrabold text-slate-700">Agenda Tidak Ditemukan</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tidak ada jadwal penggunaan gedung serba guna yang sesuai dengan filter pencarian Anda saat ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-4 px-6 text-center w-16">No.</th>
                    <th className="py-4 px-6 w-48">Hari / Tanggal</th>
                    <th className="py-4 px-6">Kegiatan</th>
                    <th className="py-4 px-6 w-56">Instansi / Unit</th>
                    <th className="py-4 px-6 w-44">Keterangan</th>
                    {isAdminActive && <th className="py-4 px-6 text-center w-28">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium font-sans">
                  {filteredSchedules.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{item.hariTanggal}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 leading-relaxed max-w-xs break-words font-semibold text-slate-800">
                        {item.kegiatan}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-extrabold border border-slate-200">
                          {item.instansi}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.keterangan && item.keterangan.toLowerCase().includes('batal') 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : item.keterangan && item.keterangan.toLowerCase().includes('tunda')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                             item.keterangan && item.keterangan.toLowerCase().includes('batal')
                               ? 'bg-rose-500' 
                               : item.keterangan && item.keterangan.toLowerCase().includes('tunda')
                               ? 'bg-amber-500'
                               : 'bg-teal-500'
                          }`}></span>
                          {item.keterangan}
                        </span>
                      </td>
                      {isAdminActive && (
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 border border-slate-100 bg-white rounded-lg transition"
                              title="Sunting Jadwal"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-rose-650 text-rose-600 hover:text-white hover:bg-rose-600 border border-slate-100 bg-white rounded-lg transition"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                    <Calendar className="w-5 h-5" />
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
                    placeholder="Contoh: Rapat Pleno Koordinasi Panitia HUT HUT Kota Tarakan"
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
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-750 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-slate-950/10 cursor-pointer flex items-center gap-1.5 transition active:scale-98"
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
