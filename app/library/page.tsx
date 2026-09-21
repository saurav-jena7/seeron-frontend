'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { BookMarked, BookOpen, Users, RefreshCw, Plus, TrendingUp, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface LibraryStats {
  totalStudents: number;
  totalEmployees: number;
  totalTeachers: number;
}

export default function LibraryPage() {
  const [stats,   setStats]   = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/institute/dashboard-stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive meaningful library stats from available data
  // Total potential library members = students + staff
  const totalMembers   = (stats?.totalStudents  ?? 0) + (stats?.totalEmployees ?? 0);
  const studentMembers = stats?.totalStudents  ?? 0;
  const staffMembers   = stats?.totalEmployees ?? 0;

  const statCards = [
    { label: 'Total Members',   value: loading ? '…' : totalMembers,    icon: Users,        color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Student Members', value: loading ? '…' : studentMembers,  icon: GraduationCap,color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Staff Members',   value: loading ? '…' : staffMembers,    icon: BookOpen,     color: 'bg-purple-50 text-purple-600' },
    { label: 'Books Issued',    value: '—',                              icon: TrendingUp,   color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <AuthGuard anyPermission={['library.book.view']}>
      <AppShell title="Library">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-cyan-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5" /> Library Management
              </h2>
              <p className="text-cyan-100 text-sm mt-0.5">Manage books, members, issuances and returns</p>
            </div>
            <Button className="bg-white text-cyan-700 hover:bg-cyan-50 border-0 shadow">
              <Plus className="w-4 h-4" /> Add Book
            </Button>
          </div>

          {/* Stats from real API */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-xl ${s.color.split(' ')[0]}`}>
                  <s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick action tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Books Catalogue',  desc: 'View and manage all books in the library',    icon: BookOpen,   color: 'border-cyan-200 bg-cyan-50/60',    href: '#' },
              { title: 'Issue a Book',     desc: 'Issue a book to a registered member',          icon: TrendingUp, color: 'border-orange-200 bg-orange-50/60', href: '#' },
              { title: 'Return a Book',    desc: 'Process book return and update records',        icon: RefreshCw,  color: 'border-green-200 bg-green-50/60',   href: '#' },
            ].map(a => (
              <Card key={a.title} className={`border-2 ${a.color} cursor-pointer hover:shadow-md transition-all`}>
                <CardContent className="py-5">
                  <div className="flex items-center gap-3 mb-2">
                    <a.icon className="w-5 h-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Member breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-500" /> Potential Library Members
              </CardTitle>
              <Badge variant="info">From institute data</Badge>
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : (
                <div className="space-y-3">
                  {[
                    { label: 'Students',  value: studentMembers, pct: totalMembers ? Math.round((studentMembers / totalMembers) * 100) : 0, color: 'bg-indigo-500' },
                    { label: 'Teachers',  value: stats?.totalTeachers ?? 0, pct: totalMembers ? Math.round(((stats?.totalTeachers ?? 0) / totalMembers) * 100) : 0, color: 'bg-purple-500' },
                    { label: 'Other Staff', value: (stats?.totalEmployees ?? 0) - (stats?.totalTeachers ?? 0), pct: totalMembers ? Math.round((((stats?.totalEmployees ?? 0) - (stats?.totalTeachers ?? 0)) / totalMembers) * 100) : 0, color: 'bg-cyan-500' },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{row.label}</span>
                        <span className="font-semibold text-gray-800">{row.value} <span className="text-gray-400 font-normal">({row.pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full rounded-full ${row.color} transition-all duration-700`} style={{ width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">📚 Full catalogue, issue/return tracking, fines and overdue reports coming in the next module update.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['Books Catalogue', 'Issue Management', 'Return Tracking', 'Fine Management', 'Overdue Reports'].map(f => (
                    <Badge key={f} variant="info">{f}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
