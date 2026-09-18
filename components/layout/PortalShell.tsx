'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getUser, clearAuth } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { LayoutDashboard, ClipboardList, CreditCard, Clock, Bell, User, LogOut, Menu, X, GraduationCap } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
  { label: 'My Profile', href: '/portal/profile', icon: User },
  { label: 'Attendance', href: '/portal/attendance', icon: ClipboardList },
  { label: 'Fee Status', href: '/portal/fees', icon: CreditCard },
  { label: 'Timetable', href: '/portal/timetable', icon: Clock },
  { label: 'Notices', href: '/portal/notices', icon: Bell },
];

export default function PortalShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }); } catch {}
    clearAuth(); router.push('/login'); toast.success('Logged out');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900">Student Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-gray-600">Hi, {user?.name?.split(' ')[0]}</span>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
          <button onClick={() => setMenuOpen(v => !v)} className="sm:hidden p-2 text-gray-500">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar nav */}
        <aside className={cn('w-52 flex-shrink-0', menuOpen ? 'block' : 'hidden sm:block')}>
          <nav className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 space-y-0.5 sticky top-20">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {title && <h1 className="text-xl font-bold text-gray-900 mb-5">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
