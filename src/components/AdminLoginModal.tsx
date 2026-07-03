import { useState, FormEvent } from 'react';
import { Lock, X, ShieldAlert } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  showToast
}: AdminLoginModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === 'adminsetda') {
      onLoginSuccess();
      showToast('Otentikasi Administrator Berhasil! Mode Editor Aktif.', 'success');
      setPassword('');
      onClose();
    } else {
      showToast('Sandi Administrator Salah!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300">
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white transition duration-200"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">
              Akses Terbatas
            </span>
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Login Admin Setda
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Masukkan sandi otentikasi administrator Anda untuk mengaktifkan panel tambah, edit, dan hapus layanan & galeri.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">
              Kata Sandi Admin
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 text-sm transition"
                placeholder="Sandi default: adminsetda"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-teal-700 text-white font-extrabold text-xs transition duration-200"
            >
              Verifikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
