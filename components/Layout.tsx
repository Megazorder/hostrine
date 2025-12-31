import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserCircle, LogOut, Menu, X, PlusCircle, Moon, Sun, BarChart3, Users } from 'lucide-react';
import { storageService } from '../services/storage';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const profile = storageService.getProfile();

  useEffect(() => {
    if (!storageService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = () => {
    storageService.logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label, end = false }: { to: string, icon: any, label: string, end?: boolean }) => (
    <NavLink
      to={to}
      end={end}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
          isActive
            ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row font-sans transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={toggleMenu} className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 dark:text-white text-sm">Painel</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400 p-1">
             {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           <div onClick={() => navigate('/profile')} className="flex items-center gap-2 cursor-pointer ml-1">
             <span className="text-sm font-semibold text-gray-900 dark:text-white max-w-[100px] truncate">{profile.name}</span>
             <img src={profile.photoUrl} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600" alt="Perfil" />
           </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky md:top-0 h-full md:h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transform transition-transform duration-200 ease-in-out flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl text-gray-800 dark:text-white tracking-tight truncate max-w-[150px]">Menu</span>
          </div>
          <button 
            onClick={toggleTheme} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* User Profile in Sidebar (Mobile Only / Duplicate) - Keeping for consistency with original design, but desktop header now has profile */}
        <div className="p-4 md:hidden flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer" onClick={() => navigate('/profile')}>
          <img 
            src={profile.photoUrl} 
            alt={profile.name} 
            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.creci}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Imóveis" end />
          <NavItem to="/analytics" icon={BarChart3} label="Análise" />
          <NavItem to="/leads" icon={Users} label="Leads" />
          <NavItem to="/properties/new" icon={PlusCircle} label="Novo Imóvel" />
          <NavItem to="/profile" icon={UserCircle} label="Meu Perfil" />
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden bg-gray-50 dark:bg-gray-900">
         {/* Desktop Header with User Info on Right */}
         <div className="hidden md:flex justify-end items-center px-8 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              onClick={() => navigate('/profile')}
            >
               <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{profile.creci}</p>
               </div>
               <img src={profile.photoUrl} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600" alt="Perfil" />
            </div>
         </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
           <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};