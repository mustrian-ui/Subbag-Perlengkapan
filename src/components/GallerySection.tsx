import { useState, FormEvent, MouseEvent } from 'react';
import { Image, Calendar, Trash2, X, Plus, Clock } from 'lucide-react';
import { GalleryItem } from '../types';

interface GallerySectionProps {
  isAdminActive: boolean;
  galleryItems: GalleryItem[];
  onAddGalleryItem: (item: GalleryItem) => void;
  onDeleteGalleryItem: (id: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function GallerySection({
  isAdminActive,
  galleryItems,
  onAddGalleryItem,
  onDeleteGalleryItem,
  showToast
}: GallerySectionProps) {
  
  // Selection states for lightbox viewer
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Admin form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Pemeliharaan');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formUrl, setFormUrl] = useState('');

  const handleCreateGallery = (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim() || !formDate) {
      showToast('Harap isi semua kolom formulir galeri!', 'error');
      return;
    }

    const newItem: GalleryItem = {
      id: `gal_${Date.now()}`,
      title: formTitle,
      category: formCategory,
      date: formDate,
      url: formUrl
    };

    onAddGalleryItem(newItem);
    showToast('Dokumentasi kegiatan baru berhasil ditambahkan ke galeri!', 'success');
    
    // reset
    setFormTitle('');
    setFormUrl('');
    setIsFormOpen(false);
  };

  const handleRemoveItem = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus dokumentasi kegiatan ini?');
    if (confirmDelete) {
      onDeleteGalleryItem(id);
      showToast('Item galeri berhasil dihapus.', 'info');
    }
  };

  const formatIndonesiaDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch (err) {
      return dateStr;
    }
  };

  return (
    <section id="galeri" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-xs font-black tracking-widest text-teal-600 uppercase block">
              Dokumentasi Kerja Nyata
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Galeri Kegiatan Terbaru
            </h2>
            <div className="w-16 h-1 bg-teal-600 rounded-full"></div>
            <p className="text-slate-500 max-w-xl text-xs sm:text-sm md:text-base leading-relaxed">
              Melihat kilas balik aktivitas harian Subbagian Rumah Tangga & Perlengkapan dalam memelihara kenyamanan serta melayani tamu kehormatan daerah.
            </p>
          </div>

          {/* Admin Create Gallery Item Action button */}
          {isAdminActive && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/10 cursor-pointer self-start md:self-end hover:translate-y-[-1px] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Foto Galeri</span>
            </button>
          )}
        </div>

        {/* Gallery grid of cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxItem(item)}
              role="button"
              className="group relative rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 bg-slate-900 h-80 cursor-pointer"
            >
              
              {/* Admin removal Overlay controls */}
              {isAdminActive && (
                <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition cursor-pointer"
                    title="Hapus Item Galeri"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Dynamic Image with Fallback landscape source */}
              <img
                src={item.url}
                alt={item.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';
                }}
              />

              {/* Layer Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent z-10" />

              {/* Content Box Overlay (Pin to bottom) */}
              <div className="absolute bottom-0 inset-x-0 p-6 space-y-2 z-20">
                <span className="inline-block py-0.5 px-2 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                  {item.category}
                </span>
                
                <h4 className="text-white font-extrabold text-sm leading-snug line-clamp-2 shadow-sm font-sans">
                  {item.title}
                </h4>
                
                <p className="text-[10px] text-slate-350 font-semibold flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3 h-3 text-teal-400" />
                  <span>{formatIndonesiaDate(item.date)}</span>
                </p>
              </div>

            </div>
          ))}
          
          {galleryItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 border border-slate-150 rounded-3xl">
              <Image className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium">Bilik galeri belum diisi dokumentasi kerja.</p>
            </div>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* 1. LIGHTBOX MEDIA VIEWER POPUP */}
      {/* ======================================================== */}
      {lightboxItem && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxItem(null)}
        >
          <button
            onClick={() => setLightboxItem(null)}
            className="absolute right-6 top-6 text-slate-400 hover:text-white transition duration-200 text-3xl cursor-pointer p-1.5 rounded-full bg-white/5 hover:bg-white/10"
            aria-label="Tutup penampil"
          >
            <X className="w-6 h-6" />
          </button>

          <div 
            className="max-w-4xl w-full flex flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxItem.url}
              alt={lightboxItem.title}
              referrerPolicy="no-referrer"
              className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain mx-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800';
              }}
            />
            
            <div className="text-center max-w-2xl px-4">
              <span className="text-[9px] uppercase font-black text-amber-500 tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {lightboxItem.category}
              </span>
              <h4 className="text-white text-base sm:text-lg font-bold mt-2 leading-snug">
                {lightboxItem.title}
              </h4>
              <p className="text-slate-400 text-xs mt-1.5 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Tanggal pelaksanaan: {formatIndonesiaDate(lightboxItem.date)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ADMIN FORM MODAL: ADD GALLERY ITEM */}
      {/* ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300">
            <div className="bg-emerald-600 text-white p-6 relative">
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute right-4 top-4 text-white hover:opacity-100 transition duration-200"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-200">
                  Panel Dokumentasi Galeri
                </span>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Image className="w-5 h-5" /> Tambah Kegiatan Terbaru
                </h3>
              </div>
            </div>

            <form onSubmit={handleCreateGallery} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nama / Judul Kegiatan Kerja
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder="Contoh: Pemeliharaan Sistem Listrik AC Ruang Rapat"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Kategori Bidang
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none text-sm transition bg-white"
                  >
                    <option value="Pemeliharaan">Pemeliharaan Aset</option>
                    <option value="Keprotokolan">Keprotokolan & Acara</option>
                    <option value="Logistik">Distribusi Logistik</option>
                    <option value="Koordinasi">Rapat Koordinasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Tanggal Kegiatan
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  URL Gambar Kegiatan (Stable Link h-80 Unsplash)
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  required
                  placeholder="e.g. https://images.unsplash.com/photo-1517245386807-bb43f82c33c4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-sm transition"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">Contoh Unsplash Cepat:</span>
                  <button 
                    type="button" 
                    onClick={() => setFormUrl('https://images.unsplash.com/photo-1541829011-5586454ee1f7?auto=format&fit=crop&w=800')} 
                    className="text-[10px] text-emerald-600 underline font-bold cursor-pointer"
                  >
                    Sarana Kantor
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormUrl('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800')} 
                    className="text-[10px] text-emerald-600 underline font-bold cursor-pointer"
                  >
                    Rapat Pegawai
                  </button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition"
                >
                  Simpan ke Galeri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}
