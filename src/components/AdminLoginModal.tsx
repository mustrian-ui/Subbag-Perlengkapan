import { useState, FormEvent } from 'react';
import { Lock, X, ShieldAlert, AlertTriangle, ExternalLink } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

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
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (password === 'adminsetda') {
      try {
        await signInAnonymously(auth);
        onLoginSuccess();
        showToast('Otentikasi Administrator Berhasil! Mode Editor Aktif.', 'success');
        setPassword('');
        onClose();
      } catch (err: any) {
        console.error('Firebase Auth sign in failed:', err);
        if (err && (err.code === 'auth/admin-restricted-operation' || String(err).includes('admin-restricted-operation'))) {
          setAuthError('restricted');
          showToast('Otentikasi dibatasi! Silakan aktifkan Anonymous Sign-in di Firebase Console.', 'error');
        } else {
          setAuthError(err?.message || String(err));
          showToast('Gagal memulai sesi aman Firebase!', 'error');
        }
      }
    } else {
      showToast('Sandi Administrator Salah!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition-all duration-300">
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

          {authError === 'restricted' && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-3 animate-fade-in">
              <div className="flex items-start gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Otentikasi Anonim Dibatasi (Admin Restricted)</span>
              </div>
              <p className="leading-relaxed">
                GCP / Firebase memblokir login anonim secara default dengan pesan error <code>auth/admin-restricted-operation</code>. Ikuti langkah mudah berikut untuk mengaktifkannya:
              </p>
              
              <div className="space-y-2">
                <p className="font-bold text-slate-800 border-b pb-1 text-[11px]">Langkah 1: Aktifkan Provider Anonim</p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700 font-medium">
                  <li className="pl-1">
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer hover:bg-teal-50 px-1 py-0.5 rounded"
                    >
                      Buka Firebase Console <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                  <li className="pl-1">Klik tombol <strong>Add new provider</strong></li>
                  <li className="pl-1">Pilih <strong>Anonymous</strong>, lalu klik <strong>Enable</strong> dan <strong>Save</strong></li>
                </ol>
              </div>

              <div className="space-y-2 pt-1 border-t border-amber-200">
                <p className="font-bold text-slate-800 border-b pb-1 text-[11px]">Langkah 2: Nonaktifkan Proteksi Block di GCP</p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700 font-medium animate-pulse">
                  <li className="pl-1">
                    <a
                      href={`https://console.cloud.google.com/customer-identity/settings?project=${firebaseConfig.projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer hover:bg-amber-100 px-1 py-0.5 rounded"
                    >
                      Buka Google Cloud Console Settings <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                  <li className="pl-1">Buka tab <strong>Security</strong> di bagian atas</li>
                  <li className="pl-1">Cari opsi <strong>Prevent anonymous sign-in</strong> (Cegah masuk anonim)</li>
                  <li className="pl-1">Ubah statusnya menjadi <strong>Disabled (Nonaktif)</strong> / matikan centangnya, lalu klik <strong>Save</strong></li>
                </ol>
              </div>

              <p className="text-[10px] text-amber-600 font-semibold italic">
                Setelah kedua langkah di atas selesai, silakan masukkan password kembali lalu klik tombol <strong>Verifikasi & Aktifkan Sesi</strong>.
              </p>
            </div>
          )}

          {authError && authError !== 'restricted' && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error Otentikasi:</span>
                <p className="mt-0.5 font-mono text-[10px] opacity-90">{authError}</p>
              </div>
            </div>
          )}

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
                placeholder="Masukkan kata sandi..."
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
