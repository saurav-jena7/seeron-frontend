'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { setActiveInstitute, getInstituteId } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield, Building2, Users, GraduationCap, Plus, ArrowRight, Search,
  BookOpen, CreditCard, ClipboardList, Bell, Activity, BarChart2,
  BookMarked, Home, Bus, UserCog, Key, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Institute {
  id: string; name: string; type: string; email: string; phone: string;
  created_at: string; memberCount: number; studentCount: number; employeeCount?: number;
}

const MODULES = [
  { label: 'Institute',    href: '/institute',        icon: Building2,    perm: 'institute.view',     color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { label: 'Members',     href: '/memberships',       icon: UserCog,      perm: 'membership.view',    color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'Roles',       href: '/roles',             icon: Key,          perm: 'role.view',          color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Employees',   href: '/employees',         icon: Users,        perm: 'employee.view',      color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { label: 'Academics',   href: '/academics/classes', icon: BookOpen,     perm: 'academic.view',      color: 'bg-green-50 text-green-600 border-green-200' },
  { label: 'Students',    href: '/students',          icon: GraduationCap,perm: 'student.view',       color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { label: 'Attendance',  href: '/attendance',        icon: ClipboardList,perm: 'attendance.view',    color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { label: 'Fees',        href: '/fees/payments',     icon: CreditCard,   perm: 'fee.view',           color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { label: 'Notices',     href: '/notices',           icon: Bell,         perm: 'notice.view',        color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { label: 'Reports',     href: '/reports',           icon: BarChart2,    perm: 'report.academic.view', color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { label: 'Audit Log',   href: '/audit',             icon: Activity,     perm: 'audit.view',         color: 'bg-red-50 text-red-600 border-red-200' },
  { label: 'Library',     href: '/library',           icon: BookMarked,   perm: 'library.book.view',  color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { label: 'Hostel',      href: '/hostel',            icon: Home,         perm: 'hostel.view',        color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { label: 'Transport',   href: '/transport',         icon: Bus,          perm: 'transport.vehicle.view', color: 'bg-violet-50 text-violet-600 border-violet-200' },
];

export default function SuperAdminPage() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [filtered,   setFiltered]   = useState<Institute[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [activeId,   setActiveId]   = useState<string | null>(null);
  const [switching,  setSwitching]  = useState(false);

  useEffect(() => {
    api.get('/institute/all')
      .then(r => { setInstitutes(r.data.data); setFiltered(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
    setActiveId(getInstituteId());
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(institutes.filter(i =>
      i.name.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q)
    ));
  }, [search, institutes]);

  async function switchToInstitute(inst: Institute) {
    setSwitching(true);
    setActiveInstitute(inst.id);
    setActiveId(inst.id);
    toast.success(`Switched to ${inst.name}`);
    setSwitching(false);
  }

  const activeInst = institutes.find(i => i.id === activeId);
  const totalMembers  = institutes.reduce((s, i) => s + (i.memberCount  || 0), 0);
  const totalStudents = institutes.reduce((s, i) => s + (i.studentCount || 0), 0);

  return (
    <AuthGuard superAdminOnly>
      <AppShell title="Super Admin">
        <div className="space-y-6">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-amber-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5" /> Platform Administration
              </h2>
              <p className="text-amber-100 text-sm mt-0.5">
                Full access to all institutes — select an institute to manage it
              </p>
            </div>
            <Link href="/super-admin/institutes/new">
              <Button className="bg-white text-amber-700 hover:bg-amber-50 border-0 shadow font-semibold">
                <Plus className="w-4 h-4" /> New Institute
              </Button>
            </Link>
          </div>

          {/* ── Platform stats ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Institutes', value: institutes.length,  icon: Building2,     bg: 'bg-indigo-50',  color: 'text-indigo-600' },
              { label: 'Total Members',    value: totalMembers,        icon: Users,         bg: 'bg-blue-50',    color: 'text-blue-600' },
              { label: 'Total Students',   value: totalStudents,       icon: GraduationCap, bg: 'bg-green-50',   color: 'text-green-600' },
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

          {/* ── Active institute + module access ────────────────────────────── */}
          {activeInst && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {activeInst.name[0]}
                  </div>
                  Managing: {activeInst.name}
                  <Badge variant="success" className="ml-1">Active</Badge>
                </CardTitle>
                <p className="text-xs text-gray-400">
                  All modules below operate within this institute context
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MODULES.map(m => (
                    <Link key={m.href} href={m.href}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border ${m.color} hover:shadow-md transition-all hover:-translate-y-0.5 group`}>
                      <m.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold">{m.label}</span>
                      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Institute list ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> All Institutes ({filtered.length})
              </CardTitle>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search institutes…"
                  className="text-sm outline-none bg-transparent text-gray-700 w-44"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No institutes found</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filtered.map(inst => {
                    const isActive = inst.id === activeId;
                    return (
                      <div key={inst.id}
                        className={`flex items-center justify-between px-6 py-4 transition-colors ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0 ${isActive ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                            {inst.name[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">{inst.name}</p>
                              {isActive && <Badge variant="success" className="text-xs">Active</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <Badge variant="info" className="capitalize text-xs">{inst.type}</Badge>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Users className="w-3 h-3" />{inst.memberCount ?? 0}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />{inst.studentCount ?? 0}
                              </span>
                              <span className="text-xs text-gray-300">{formatDate(inst.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {!isActive && (
                            <button
                              onClick={() => switchToInstitute(inst)}
                              disabled={switching}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Switch
                            </button>
                          )}
                          <Link
                            href={`/super-admin/institutes/${inst.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Manage <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
