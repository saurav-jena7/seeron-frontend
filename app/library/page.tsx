'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { BookMarked, BookOpen, Users, RefreshCw, Plus, TrendingUp } from 'lucide-react';

export default function LibraryPage() {
  const [stats] = useState({ totalBooks: 0, issued: 0, returned: 0, members: 0 });

  return (
    <AuthGuard anyPermission={['library.book.view']}>
      <AppShell title="Library">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-cyan-600" /> Library Management
              </h2>
              <p className="text-sm text-gray-500">Manage books, members, issuances and returns</p>
            </div>
            <Button><Plus className="w-4 h-4" /> Add Book</Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Books', value: stats.totalBooks, icon: BookOpen, color: 'bg-cyan-50 text-cyan-600' },
              { label: 'Issued', value: stats.issued, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
              { label: 'Returned Today', value: stats.returned, icon: RefreshCw, color: 'bg-green-50 text-green-600' },
              { label: 'Members', value: stats.members, icon: Users, color: 'bg-purple-50 text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Books Catalogue', desc: 'View and manage all books', icon: BookOpen, color: 'border-cyan-200 bg-cyan-50', href: '#' },
              { title: 'Issue Book', desc: 'Issue a book to a member', icon: TrendingUp, color: 'border-orange-200 bg-orange-50', href: '#' },
              { title: 'Return Book', desc: 'Process a book return', icon: RefreshCw, color: 'border-green-200 bg-green-50', href: '#' },
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

          {/* Coming soon notice */}
          <Card>
            <CardContent className="py-12 text-center">
              <BookMarked className="w-12 h-12 text-cyan-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">Library Module</h3>
              <p className="text-gray-400 mt-1">Full catalogue, issue/return tracking, fines and reports coming soon.</p>
              <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {['Books Catalogue', 'Issue Management', 'Return Tracking', 'Fine Management', 'Reports'].map(f => (
                  <Badge key={f} variant="info">{f}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
