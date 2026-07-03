import { Settings, LogOut } from 'lucide-react';

interface AdminBarProps {
  isActive: boolean;
  onLogout: () => void;
}

export default function AdminBar({ isActive, onLogout }: AdminBarProps) {
  if (!isActive) return null;

  return (
    <div className="bg-emerald-600 text-white py-2.5 px-4 text-center text-xs font-bold tracking-wider uppercase flex items-center justify-center flex-wrap gap-2 shadow-inner border-b border-emerald-500 animate-in slide-in-from-top duration-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-100"></span>
      </span>
      <Settings className="w-3.5 h-3.5 inline animate-spin-slow" />
      <span>Mode Admin Aktif - Anda dapat menambah, mengedit, atau menghapus aplikasi dan galeri secara langsung</span>
      <button
        onClick={onLogout}
        className="underline ml-4 hover:text-slate-100 font-black transition cursor-pointer flex items-center gap-1 bg-emerald-750 px-2 py-0.5 rounded-md border border-emerald-500/30"
      >
        <LogOut className="w-3 h-3" /> Keluar Sesi
      </button>
    </div>
  );
}
