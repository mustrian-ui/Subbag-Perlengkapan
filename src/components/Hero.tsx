import { Compass, Sparkles, PhoneCall, Briefcase, Car, Box, HeartHandshake, Edit3 } from 'lucide-react';

interface HeroProps {
  onAksesClick: () => void;
  onVisiClick: () => void;
  isAdminActive?: boolean;
  content: {
    heroTagline: string;
    heroTitlePrefix: string;
    heroTitleAccent: string;
    heroDesc: string;
    heroBgUrl: string;
    heroPhone: string;
  };
  onEditTrigger: () => void;
}

export default function Hero({ onAksesClick, onVisiClick, isAdminActive, content, onEditTrigger }: HeroProps) {
  // Helper to safely render line breaks in customized texts
  const renderRichText = (text: string) => {
    return text.split(/(<br\s*\/?>|\n)/gi).map((part, index) => {
      if (part.toLowerCase().match(/<br\s*\/?>/) || part === '\n') {
        return <br key={index} />;
      }
      return part;
    });
  };

  return (
    <section id="beranda" className="relative min-h-[85vh] flex items-center justify-center py-20 overflow-hidden bg-slate-950">
      
      {/* Background Image with optimized fit, safety opacity and elegant fade-in */}
      <div 
        className="absolute inset-0 bg-cover opacity-40 transform scale-100 transition-all duration-1000"
        style={{ 
          backgroundImage: `url('${content.heroBgUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600'}')`,
          backgroundPosition: '0% 50%'
        }}
        role="presentation"
      />
      
      {/* Rich gradient overlay with the custom theme colors */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Floating admin controller when admin session is active */}
      {isAdminActive && (
        <div className="absolute top-24 right-4 sm:right-10 z-30 bg-slate-900 border border-blue-500/40 p-4 rounded-2xl shadow-2xl flex flex-col gap-2 max-w-xs animate-pulse hover:animate-none">
          <span className="text-[10px] font-black text-amber-400 block uppercase tracking-wider">⚙️ Pengaturan Hero Banner</span>
          <button
            type="button"
            onClick={onEditTrigger}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Konten Hero</span>
          </button>
        </div>
      )}

      {/* Futuristic technical layout indicator */}
      <div className="absolute top-10 left-10 pointer-events-none hidden lg:block opacity-25">
        <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
          Coordinate Lat: 3.3150° N, Long: 117.5921° E
        </div>
        <div className="text-[9px] font-mono text-teal-400">
          Setda Tarakan Portal // V4.1
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Info Block */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> {content.heroTagline || "Sekretariat Daerah Kota Tarakan"}
            </span>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight font-display">
              {renderRichText(content.heroTitlePrefix || "Subbagian Rumah Tangga")} <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-250 block sm:inline">
                {content.heroTitleAccent || "& Perlengkapan"}
              </span>
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              {content.heroDesc}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <button
                onClick={onAksesClick}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm shadow-xl shadow-teal-900/40 hover:translate-y-[-2px] active:translate-y-0 transition duration-200 cursor-pointer"
              >
                Akses Aplikasi Layanan
              </button>
              <button
                onClick={onVisiClick}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-sm border border-white/25 backdrop-blur-sm hover:translate-y-[-2px] active:translate-y-0 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Pelajari Visi Misi</span>
              </button>
            </div>
          </div>

          {/* Right Side Cards representing core services summary */}
          <div className="lg:col-span-12 xl:col-span-5 flex justify-center">
            <div className="glass-card w-full max-w-sm p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
              {/* Highlight effects */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-teal-500/15 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 text-center space-y-6">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-slate-950 font-black text-lg sm:text-xl">
                    Layanan Umum Utama
                  </h3>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    Mendukung jalannya pelayanan publik dengan fasilitas prima dan terkelola secara cermat
                  </p>
                </div>
                
                <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
                  <div className="flex items-center justify-between py-3 text-xs sm:text-sm">
                    <span className="text-slate-900 flex items-center gap-2 font-bold">
                      <Briefcase className="w-4 h-4 text-teal-700" /> Manajemen Rumah Tangga
                    </span>
                    <span className="font-bold text-xs bg-teal-100 text-teal-950 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Aktif Melayani
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-xs sm:text-sm">
                    <span className="text-slate-900 flex items-center gap-2 font-bold">
                      <Box className="w-4 h-4 text-teal-700" /> Logistik Perlengkapan
                    </span>
                    <span className="font-bold text-xs bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Sistem Terintegrasi
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 text-xs sm:text-sm">
                    <span className="text-slate-900 flex items-center gap-2 font-bold">
                      <Car className="w-4 h-4 text-teal-700" /> Armada Kendaraan Setda
                    </span>
                    <span className="font-bold text-xs bg-blue-100 text-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Terkontrol Baik
                    </span>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-100/95 rounded-xl text-center border border-amber-300">
                  <p className="text-xs font-extrabold text-amber-950 flex items-center justify-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-amber-700 animate-bounce" /> Call Center Setda: {content.heroPhone}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
