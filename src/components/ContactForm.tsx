import React, { useState } from 'react';
import { Mail, PhoneCall, MapPin, Send, HelpCircle, Loader2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Complaint } from '../types';

interface ContactFormProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onAddComplaint?: (complaint: Complaint) => void;
}

export default function ContactForm({ showToast, onAddComplaint }: ContactFormProps) {
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [bagian, setBagian] = useState('');
  const [type, setType] = useState('Kerusakan Fasilitas');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nip.trim() || !bagian.trim() || !message.trim()) {
      showToast('Harap isi semua kolom pengaduan!', 'error');
      return;
    }

    setIsSubmitting(true);
    const complaintId = `comp_${Date.now()}`;
    const newComplaint: Complaint = {
      id: complaintId,
      name: name.trim(),
      nip: nip.trim(),
      bagian: bagian.trim(),
      type,
      message: message.trim(),
      status: 'Masuk',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'complaints', complaintId), newComplaint);
      if (onAddComplaint) {
        onAddComplaint(newComplaint);
      }
      showToast(
        `Laporan dari ${name} (${bagian}) terkait [${type}] berhasil masuk dan tersimpan ke pusat pengaduan Subbag!`, 
        'success'
      );
      // reset fields
      setName('');
      setNip('');
      setBagian('');
      setType('Kerusakan Fasilitas');
      setMessage('');
    } catch (err) {
      console.error('Failed to submit complaint to Firestore:', err);
      showToast('Gagal mengirim pengaduan ke server. Silakan coba kembali.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="kontak" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      
      {/* Visual background atmospheric highlights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-900/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-600/25 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Info Column Area */}
          <div className="lg:col-span-5 space-y-6">
            <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-teal-55 bg-teal-500/10 text-teal-300 border border-teal-500/25">
              Hubungi Kami
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
              Layanan Konsultasi &amp; Pengaduan Rumah Tangga
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
              Kami selalu siap melayani serta memelihara prasarana vital perkantoran di lingkungan Sekretariat Daerah Kota Tarakan. Hubungi kantor operasional kami di jam dinas, atau sampaikan pengaduan darurat Anda via form cepat.
            </p>

            <div className="space-y-4 pt-4">
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-200 text-sm">Alamat Kantor</h4>
                  <p className="text-xs text-slate-455 text-slate-400 mt-0.5 leading-relaxed">
                    Kantor Walikota Tarakan - Sekretariat Daerah Kota Tarakan, Lantai 2. Jl. P. Kalimantan No. 01, Kp. 1 Skip Tarakan, Kalimantan Utara.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-200 text-sm">E-mail Operasional</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    rumahtangga@tarakankota.go.id
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 shrink-0">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-200 text-sm">Kontak Telepon / WA</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    +62 812-5099-1474
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Direct Complaint Forms container */}
          <div className="lg:col-span-7">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-xl">
              
              <h3 className="text-xl font-extrabold text-white mb-6 flex items-center gap-2 font-display">
                <Send className="w-5 h-5 text-teal-400 animate-pulse" /> Kirim Pengaduan Cepat
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Nama Pengirim
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm transition font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      NIP / Kode Identitas Staf
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 19880402..."
                      value={nip}
                      onChange={(e) => setNip(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Bagian / Instansi Kerja
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bagian Organisasi"
                      value={bagian}
                      onChange={(e) => setBagian(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Sifat Laporan / Kendala
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-white/10 focus:border-teal-500 focus:outline-none text-sm transition cursor-pointer"
                    >
                      <option value="Kerusakan Fasilitas">Kerusakan Fasilitas Pokok</option>
                      <option value="Pelayanan Kebersihan">Pelayanan Kebersihan &amp; Kerja Bakti</option>
                      <option value="Kebutuhan ATK">Kebutuhan Logistik Bulanan / ATK</option>
                      <option value="Armada Kendaraan">Kendaraan Dinas Operasional</option>
                      <option value="Lainnya">Lain - Lain (Saran Masukan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Isi Pengaduan / Pesan Pelaporan
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tulis keluhan, perincian kerusakan prasarana, atau kebutuhan logistik penunjang secara lengkap di sini..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm transition leading-relaxed"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-teal-900/30 hover:translate-y-[-1px] active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Laporan...</span>
                      </>
                    ) : (
                      <span>Ajukan Laporan Pengaduan</span>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
