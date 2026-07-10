import { useState, useEffect, FormEvent } from 'react';
import { X, Save, Plus, Trash2, Sparkles, Compass, CheckCircle, Image, PhoneCall } from 'lucide-react';
import { LandingPageContent, MisiItem } from '../types';
// @ts-ignore
import pnsHeroBackground from '../assets/images/pns_hero_background_1783294463163.jpg';

interface LandingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: LandingPageContent;
  onSave: (newContent: LandingPageContent) => void;
  defaultTab?: 'hero' | 'visimisi';
}

export default function LandingEditModal({
  isOpen,
  onClose,
  content,
  onSave,
  defaultTab = 'hero'
}: LandingEditModalProps) {
  const [activeTab, setActiveTab] = useState<'hero' | 'visimisi'>(defaultTab);

  // Hero Fields state
  const [heroTagline, setHeroTagline] = useState('');
  const [heroTitlePrefix, setHeroTitlePrefix] = useState('');
  const [heroTitleAccent, setHeroTitleAccent] = useState('');
  const [heroDesc, setHeroDesc] = useState('');
  const [heroBgUrl, setHeroBgUrl] = useState('');
  const [heroPhone, setHeroPhone] = useState('');

  // Visi Misi Fields state
  const [visiMisiSubtitle, setVisiMisiSubtitle] = useState('');
  const [visiTitle, setVisiTitle] = useState('');
  const [visiText, setVisiText] = useState('');
  const [misiSubtitle, setMisiSubtitle] = useState('');
  const [misiTitle, setMisiTitle] = useState('');
  const [misiItems, setMisiItems] = useState<MisiItem[]>([]);

  // Update form inputs whenever initial content changes or modal is loaded
  useEffect(() => {
    if (isOpen) {
      setHeroTagline(content.heroTagline || '');
      setHeroTitlePrefix(content.heroTitlePrefix || '');
      setHeroTitleAccent(content.heroTitleAccent || '');
      setHeroDesc(content.heroDesc || '');
      setHeroBgUrl(content.heroBgUrl || '');
      setHeroPhone(content.heroPhone || '');

      setVisiMisiSubtitle(content.visiMisiSubtitle || '');
      setVisiTitle(content.visiTitle || '');
      setVisiText(content.visiText || '');
      setMisiSubtitle(content.misiSubtitle || '');
      setMisiTitle(content.misiTitle || '');
      setMisiItems(content.misiItems ? [...content.misiItems] : []);
    }
  }, [isOpen, content]);

  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  // Manage Mission Statement updates
  const handleMisiChange = (index: number, key: 'title' | 'desc', value: string) => {
    const updated = [...misiItems];
    updated[index] = { ...updated[index], [key]: value };
    setMisiItems(updated);
  };

  const handleAddMisi = () => {
    const newMisi: MisiItem = {
      id: `misi_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: 'Judul Misi Baru',
      desc: 'Rincian aksi operasional untuk merealisasikan pembangunan daerah.'
    };
    setMisiItems([...misiItems, newMisi]);
  };

  const handleRemoveMisi = (index: number) => {
    const updated = misiItems.filter((_, idx) => idx !== index);
    setMisiItems(updated);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!heroTitlePrefix.trim() || !heroDesc.trim() || !visiText.trim() || !misiTitle.trim()) {
      alert('Harap lengkapi semua kolom teks utama agar tata letak tetap proporsional!');
      return;
    }

    onSave({
      heroTagline,
      heroTitlePrefix,
      heroTitleAccent,
      heroDesc,
      heroBgUrl,
      heroPhone,
      visiMisiSubtitle,
      visiTitle,
      visiText,
      misiSubtitle,
      misiTitle,
      misiItems
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="landing-edit-modal"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Mode Kustomisasi Landing Page</h3>
              <p className="text-xs text-slate-400 font-medium">Ubah isi konten text, sub-heading, dan layout visual web portal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'hero' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Bagian Atas (Hero Banner)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visimisi')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'visimisi' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Bagian Tengah (Visi & Misi)</span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          {activeTab === 'hero' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-3">
                <span className="text-xs text-blue-800 leading-relaxed font-semibold">
                  💡 Tips Layout: Gunakan tag HTML <code>&lt;br /&gt;</code> untuk mengatur pemotongan baris judul utama, agar tampil seimbang pada perangkat seluler dan desktop.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hero Tagline */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Tagline Atas</label>
                  <input
                    type="text"
                    value={heroTagline}
                    onChange={(e) => setHeroTagline(e.target.value)}
                    placeholder="Contoh: Sekretariat Daerah Kota Tarakan"
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition"
                  />
                </div>

                {/* Hero Title Prefix */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Judul Baris Atas</label>
                  <input
                    type="text"
                    value={heroTitlePrefix}
                    onChange={(e) => setHeroTitlePrefix(e.target.value)}
                    placeholder="Contoh: Subbagian Rumah Tangga"
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition font-semibold text-slate-800"
                  />
                </div>

                {/* Hero Title Accent */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Judul Baris Bawah (Accent Warna Kuning)</label>
                  <input
                    type="text"
                    value={heroTitleAccent}
                    onChange={(e) => setHeroTitleAccent(e.target.value)}
                    placeholder="Contoh: &amp; Perlengkapan"
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition font-semibold text-amber-600"
                  />
                </div>

                {/* Hero Backgroud Image URL */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-slate-400" />
                    <span>Gambar Latar Belakang (URL)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={heroBgUrl}
                      onChange={(e) => setHeroBgUrl(e.target.value)}
                      placeholder="Masukkan URL Gambar valid (Unsplash, Ibb, dsb)"
                      className="flex-grow text-xs font-mono px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setHeroBgUrl(pnsHeroBackground)}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-amber-900 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 cursor-pointer"
                    >
                      Set Gambar Sepasang PNS
                    </button>
                  </div>
                </div>

                {/* Hero Phone Support */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-slate-400" />
                    <span>Nomor Telepon Call Center</span>
                  </label>
                  <input
                    type="text"
                    value={heroPhone}
                    onChange={(e) => setHeroPhone(e.target.value)}
                    placeholder="Contoh: (0551) 21122"
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Paragraf Deskripsi Layanan Utama</label>
                  <textarea
                    rows={4}
                    value={heroDesc}
                    onChange={(e) => setHeroDesc(e.target.value)}
                    placeholder="Jelaskan peran mendalam dari subbagian logistik/rumah tangga..."
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition leading-relaxed text-slate-600"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visimisi' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-6">
                {/* Visi Misi Subtitle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Subtitle Atas Visi &amp; Misi</label>
                  <input
                    type="text"
                    value={visiMisiSubtitle}
                    onChange={(e) => setVisiMisiSubtitle(e.target.value)}
                    placeholder="Contoh: Arah Pembangunan Daerah"
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition"
                  />
                </div>

                {/* Visi Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Judul Utama Visi &amp; Misi</label>
                  <input
                    type="text"
                    value={visiTitle}
                    onChange={(e) => setVisiTitle(e.target.value)}
                    placeholder="Contoh: Visi &amp; Misi Kota Tarakan"
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition font-semibold text-slate-800"
                  />
                </div>

                {/* Visi Text */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Teks Visi Utama Daerah</label>
                  <textarea
                    rows={3}
                    value={visiText}
                    onChange={(e) => setVisiText(e.target.value)}
                    placeholder="Tuliskan pernyataan visi kota..."
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-250 focus:border-blue-500 focus:ring focus:ring-blue-200 outline-none transition font-medium italic text-slate-700 leading-relaxed"
                  />
                </div>
              </div>

              {/* Misi Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">Daftar Poin Misi Pemerintah</h4>
                    <p className="text-xs text-slate-500">Sesuaikan butir-butir aksi strategis pembangun daerah</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMisi}
                    className="px-3.5 py-1.5 text-xs text-teal-700 font-extrabold bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Poin Misi</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                  {misiItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-medium">
                      Belum ada poin misi yang dikonfigurasi. Klik 'Tambah Poin Misi'.
                    </div>
                  ) : (
                    misiItems.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                            Poin Misi {String(index + 1).padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMisi(index)}
                            className="p-1 px-2 text-rose-600 hover:text-white hover:bg-rose-600 border border-transparent hover:border-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="Hapus Misi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleMisiChange(index, 'title', e.target.value)}
                            placeholder="Tulis judul misi..."
                            className="w-full text-xs font-bold px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 outline-none transition"
                          />
                          <textarea
                            rows={2}
                            value={item.desc}
                            onChange={(e) => handleMisiChange(index, 'desc', e.target.value)}
                            placeholder="Rincian deskripsi misi..."
                            className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 outline-none transition leading-relaxed text-slate-550"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-5 px-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Perubahan disimpan langsung ke Cloud Database (Firestore) agar terlihat oleh semua pengunjung</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-250 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[1] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
