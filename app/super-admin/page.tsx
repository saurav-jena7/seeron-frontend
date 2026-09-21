'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Shield, Building2, Users, GraduationCap, Plus, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

interface Institute {
  id: string; name: string; type: string; email: string; phone: string;
  created_at: string; memberCount: number; studentCount: number;
}

export default function SuperAdminPage() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filtered,   setFiltered]   = useState<Institute[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');

  useEffect(() => {
    api.get('/institute/all')
      .then(r => { setInstitutes(r.data.data); setFiltered(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(institutes.filter(i =>
      i.name.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q)
    ));
  }, [search, institutes]);

  const totalMembers  = institutes.reduce((s, i) => s + (i.memberCount  || 0), 0);
  const totalStudents = institutes.reduce((s, i) => s + (i.studentCount || 0), 0);

  return (
    <AuthGuard superAdminOnly>
      <AppShell title="Super Admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-amber-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" /> Platform Administration
              </h2>
              <p className="text-amber-100 text-sm mt-0.5">Full access to all institutes and platform settings</p>
            </div>
            <Link href="/super-admin/institutes/new">
              <Button className="bg-white text-amber-700 hover:bg-amber-50 border-0 shadow">
                <Plus className="w-4 h-4" /> New Institute
              </Button>
            </Link>
          </div>

          {/* Platform stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Institutes', value: institutes.length,  icon: Building2,    bg: 'bg-indigo-50',  color: 'text-indigo-600' },
              { label: 'Total Members',    value: totalMembers,        icon: Users,        bg: 'bg-blue-50',    color: 'text-blue-600' },
              { label: 'Total Students',   value: totalStudents,       icon: GraduationCap,bg: 'bg-green-50',   color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Institute list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> All Institutes ({filtered.length})
              </CardTitle>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text" placeholder="Search institutes…"
                  className="text-sm outline-none bg-transparent text-gray-700 w-48"
                  value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No institutes found</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map(inst => (
                    <div key={inst.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
                          {inst.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{inst.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge variant="info" className="capitalize">{inst.type}</Badge>
                            {inst.email && <span className="text-xs text-gray-400">{inst.email}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                        {/* Quick stats */}
                        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            {inst.memberCount ?? 0} members
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-green-400" />
                            {inst.studentCount ?? 0} students
                          </span>
                          <span className="text-gray-300">{formatDate(inst.created_at)}</span>
                        </div>
                        <Link
                          href={`/super-admin/institutes/${inst.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Manage <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
