import { Eye, Award, Edit3 } from 'lucide-react';
import { MisiItem } from '../types';

interface VisiMisiProps {
  isAdminActive?: boolean;
  content: {
    visiMisiSubtitle: string;
    visiTitle: string;
    visiText: string;
    misiSubtitle: string;
    misiTitle: string;
    misiItems: MisiItem[];
  };
  onEditTrigger: () => void;
}

export default function VisiMisi({ isAdminActive, content, onEditTrigger }: VisiMisiProps) {
  return (
    <section id="visi-misi" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Floating admin section button for editing middle layout */}
        {isAdminActive && (
          <div className="mb-8 flex justify-center">
            <div className="bg-slate-550 bg-slate-100 border border-blue-500/35 px-5 py-3.5 rounded-2xl flex items-center gap-4 shadow-md">
              <div className="text-left">
                <span className="block text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Desain Visi Misi</span>
                <span className="text-[11px] text-slate-500 font-medium">Ubah deskripsi visi dan misi strategis daerah</span>
              </div>
              <button
                type="button"
                onClick={onEditTrigger}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Visi &amp; Misi</span>
              </button>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-black tracking-widest text-teal-600 uppercase">
            {content.visiMisiSubtitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
            {content.visiTitle}
          </h2>
          <div className="w-16 h-1 bg-teal-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Visi Card (Left) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden border border-slate-800">
            
            {/* Soft decorative light blur */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
            
            <div className="space-y-6 relative z-10">
              <div className="inline-flex p-4 rounded-2xl bg-white/10 text-amber-400 text-2xl border border-white/10 shadow-inner">
                <Eye className="w-6 h-6" />
              </div>
              <span className="block text-amber-400 font-black text-xs uppercase tracking-widest">
                Visi Kota Tarakan
              </span>
              <blockquote className="text-lg sm:text-xl font-extrabold leading-relaxed text-slate-100 italic">
                “{content.visiText}”
              </blockquote>
            </div>

            <div className="pt-10 border-t border-white/10 mt-10 relative z-10 flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium tracking-wide">Sinergitas Menuju Tarakan Smart City</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            
          </div>

          {/* Misi List (Right) */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-center">
            <span className="text-xs font-black text-teal-600 uppercase tracking-widest">
              {content.misiSubtitle}
            </span>
            <h3 className="text-2xl font-bold text-slate-950 mb-2 font-display">
              {content.misiTitle}
            </h3>
            
            <div className="space-y-4">
              {content.misiItems && content.misiItems.length > 0 ? (
                content.misiItems.map((item, index) => (
                  <div 
                    key={item.id || index}
                    className="flex gap-4 p-4.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition duration-200"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 flex items-center justify-center font-black text-sm">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm font-medium">
                  Belum ada misi terdaftar. Silakan login admin untuk menambahkan misi daerah.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
