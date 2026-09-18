'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getAuthContext, clearAuth } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, ClipboardList, CreditCard, Clock,
  Bell, User, LogOut, Menu, X, GraduationCap, ChevronRight,
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard',  href: '/portal/dashboard',  icon: LayoutDashboard },
  { label: 'My Profile', href: '/portal/profile',    icon: User },
  { label: 'Attendance', href: '/portal/attendance', icon: ClipboardList },
  { label: 'Fee Status', href: '/portal/fees',       icon: CreditCard },
  { label: 'Timetable',  href: '/portal/timetable',  icon: Clock },
  { label: 'Notices',    href: '/portal/notices',    icon: Bell },
];

export default function PortalShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname  = usePathname();
  const router    = useRouter();
  const ctx       = getAuthContext();
  const user      = ctx?.user;
  const [menuOpen, setMenuOpen] = useState(false);

  // Build initials safely from the stored name
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  async function handleLogout() {
    try {
      await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') });
    } catch {}
    clearAuth();
    router.push('/login');
    toast.success('Logged out');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">Seeron</span>
              <span className="text-gray-400 text-xs ml-1.5">Student Portal</span>
            </div>
          </div>

          {/* Right — user info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-none truncate max-w-[120px]">{user?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">Student</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            <button
              onClick={() => setMenuOpen(v => !v)}
              className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 sm:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={cn(
          'w-56 flex-shrink-0 transition-all duration-200',
          'sm:block',
          menuOpen
            ? 'fixed top-14 left-0 bottom-0 w-64 bg-white z-20 overflow-y-auto shadow-xl p-4'
            : 'hidden sm:block',
        )}>
          {/* Student identity card in sidebar */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-indigo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-indigo-200 text-xs mt-0.5">Student</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-700',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </span>
                  {active && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {title && (
            <div className="mb-5">
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                <span>Portal</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-indigo-600 font-medium">{title}</span>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
