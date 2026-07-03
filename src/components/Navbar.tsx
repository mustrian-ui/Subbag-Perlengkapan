import { useState } from 'react';
import { Menu, X, Shield, UserCheck } from 'lucide-react';

interface NavbarProps {
  isAdminActive: boolean;
  onAdminClick: () => void;
  onLogoutAdmin: () => void;
}

export default function Navbar({
  isAdminActive,
  onAdminClick,
  onLogoutAdmin
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 110; // offset for sticky header and admin bar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Title */}
          <div
            onClick={() => scrollToSection('beranda')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="p-1 bg-white rounded-xl flex items-center justify-center transition duration-300">
              <img 
                src="https://i.ibb.co.com/dJLVwj0K/logo-pemkot.png" 
                alt="Logo Pemkot Tarakan" 
                className="w-11 h-11 object-contain transition-transform duration-500 group-hover:scale-105" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <h1 className="text-xs sm:text-xs md:text-sm font-extrabold tracking-wider text-blue-900 uppercase leading-snug">
                Subbag RT & Perlengkapan
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold tracking-wide">
                Bagian Umum Setda Kota Tarakan
              </p>
            </div>
          </div>

          {/* Navigation Links for Desktop */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {[
              { id: 'beranda', label: 'Beranda' },
              { id: 'visi-misi', label: 'Visi & Misi' },
              { id: 'aplikasi', label: 'Layanan Aplikasi' },
              { id: 'jadwal-gedung', label: 'Jadwal Gedung GSG' },
              { id: 'galeri', label: 'Galeri Kegiatan' },
              { id: 'kontak', label: 'Hubungi Kami' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-teal-600 hover:bg-slate-50 transition duration-200 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Admin Action Button and Mobile Hamburger */}
          <div className="flex items-center space-x-2.5">
            {isAdminActive ? (
              <button
                onClick={onLogoutAdmin}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-200 cursor-pointer transition-all duration-200"
              >
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Aktif</span>
              </button>
            ) : (
              <button
                onClick={onAdminClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-teal-700 hover:translate-y-[-1px] text-white shadow-md shadow-slate-950/10 active:translate-y-0 cursor-pointer transition-all duration-200"
              >
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Login Admin</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-slate-700 active:scale-95 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-150 bg-white/98 backdrop-blur-md px-4 py-4 space-y-1.5 shadow-lg animate-in slide-in-from-top-4 duration-200">
          {[
            { id: 'beranda', label: 'Beranda' },
            { id: 'visi-misi', label: 'Visi & Misi' },
            { id: 'aplikasi', label: 'Layanan Aplikasi' },
            { id: 'jadwal-gedung', label: 'Jadwal Gedung GSG' },
            { id: 'galeri', label: 'Galeri Kegiatan' },
            { id: 'kontak', label: 'Hubungi Kami' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="w-full text-left px-5 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-teal-600 transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
