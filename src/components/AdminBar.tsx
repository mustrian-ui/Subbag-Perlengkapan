import { Settings, LogOut, MessageSquareText, Layers, AlertCircle } from 'lucide-react';

interface AdminBarProps {
  isActive: boolean;
  onLogout: () => void;
  complaintsCount?: number;
  newComplaintsCount?: number;
  onOpenComplaints?: () => void;
  totalPendingReportsCount?: number;
  onOpenServiceReports?: () => void;
}

export default function AdminBar({ 
  isActive, 
  onLogout,
  complaintsCount = 0,
  newComplaintsCount = 0,
  onOpenComplaints,
  totalPendingReportsCount = 0,
  onOpenServiceReports
}: AdminBarProps) {
  if (!isActive) return null;

  return (
    <div className="bg-emerald-600 text-white py-2 px-4 text-center text-xs font-bold tracking-wider uppercase flex items-center justify-between flex-wrap gap-2 shadow-inner border-b border-emerald-500 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-100"></span>
        </span>
        <Settings className="w-3.5 h-3.5 inline animate-spin-slow" />
        <span className="normal-case font-semibold">Mode Admin Aktif — Kelola permohonan, jadwal, berkas, dan ambil tindakan langsung</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {onOpenServiceReports && (
          <button
            type="button"
            onClick={onOpenServiceReports}
            className="normal-case flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold transition cursor-pointer border border-emerald-400/40 shadow-sm"
            title="Buka Pusat Tindakan Semua Layanan (SIPERUM, SIPAKAR, SILOGIS, LAPOR-RT)"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-200" />
            <span>Pusat Tindakan Layanan</span>
            {totalPendingReportsCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full animate-pulse">
                {totalPendingReportsCount} Perlu Aksi
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-emerald-700 text-emerald-100 text-[10px] font-bold rounded-full">
                Siap
              </span>
            )}
          </button>
        )}

        {onOpenComplaints && (
          <button
            type="button"
            onClick={onOpenComplaints}
            className="normal-case flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition cursor-pointer border border-white/20"
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Kotak Aduan (LAPOR-RT)</span>
            {newComplaintsCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                {newComplaintsCount} Baru
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-emerald-800 text-emerald-100 text-[10px] font-bold rounded-full">
                {complaintsCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onLogout}
          className="underline hover:text-slate-100 font-black transition cursor-pointer flex items-center gap-1 bg-emerald-800 hover:bg-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-500/30"
        >
          <LogOut className="w-3 h-3" /> Keluar Sesi
        </button>
      </div>
    </div>
  );
}
