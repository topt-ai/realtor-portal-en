import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, PlusSquare, Menu, X, LogOut, Globe, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navLinks = [
    { to: '/dashboard', icon: Home, label: 'Mis Propiedades' },
    { to: '/agregar', icon: PlusSquare, label: 'Agregar Propiedad' },
    { to: '/profile', icon: User, label: 'Mi Perfil' },
  ];

  const displayName = user?.user_metadata?.full_name || user?.email || 'Agente';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const websiteUrl =
    (user?.user_metadata?.website_url as string | undefined) ||
    'https://jarvisrealty.tuwebsv.com';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-bg">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-brand-primary text-brand-white">
        <div className="font-bold text-xl">TuWebSV</div>
        <div className="flex flex-row items-center gap-4">
          <button
            onClick={() => signOut()}
            className="p-1 text-gray-300 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-brand-primary text-brand-white transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 hidden md:block">
          <div className="font-bold text-2xl tracking-tight text-brand-accent">TuWebSV</div>
        </div>

        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center text-white font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-sm text-gray-400">Bienvenido,</p>
            <p className="font-medium truncate">{displayName}</p>
          </div>
        </div>

        <div className="px-4 pt-4">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Globe size={20} />
            Visitar mi sitio web
          </a>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-accent text-brand-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-brand-white'
                )
              }
            >
              <link.icon size={20} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
