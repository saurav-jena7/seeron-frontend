'use client';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import Link from 'next/link';

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Topbar({ onMenuClick, title }: TopbarProps) {
  const router = useRouter();
  const user = getUser();
  const [dropOpen, setDropOpen] = useState(false);

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    clearAuth();
    router.push('/login');
    toast.success('Logged out');
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
          <Menu className="w-5 h-5" />
        </button>
        {title && <h1 className="text-base font-semibold text-gray-800 hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/notices" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="w-5 h-5" />
        </Link>
        <div className="relative">
          <button
            onClick={() => setDropOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
          </button>
          {dropOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1">
                <Link href="/profile" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
