'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getAuthContext, hasPermission } from '@/lib/auth';
import {
  GraduationCap, Users, BookOpen, CreditCard,
  ClipboardList, TrendingUp, Bell, Shield, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Stats {
  totalStudents: number; totalEmployees: number; totalTeachers: number;
  totalClasses: number; presentToday: number; pendingFees: number;
}
interface Notice { id: string; title: string; audience: string; created_at: string; }

// Mock chart data — will be replaced with real API data when analytics endpoint is added
const attendanceWeek = [
  { day: 'Mon', present: 142, absent: 12 },
  { day: 'Tue', present: 138, absent: 16 },
  { day: 'Wed', present: 145, absent: 9 },
  { day: 'Thu', present: 140, absent: 14 },
  { day: 'Fri', present: 135, absent: 19 },
];

const feeMonths = [
  { month: 'Apr', collected: 42000, pending: 8000 },
  { month: 'May', collected: 51000, pending: 6000 },
  { month: 'Jun', collected: 47000, pending: 9000 },
  { month: 'Jul', collected: 55000, pending: 5000 },
  { month: 'Aug', collected: 49000, pending: 7000 },
  { month: 'Sep', collected: 60000, pending: 4000 },
];

const studentStatus = [
  { name: 'Active', value: 85, color: '#6366f1' },
  { name: 'Graduated', value: 10, color: '#10b981' },
  { name: 'Transferred', value: 3, color: '#f59e0b' },
  { name: 'Inactive', value: 2, color: '#ef4444' },
];

const RCOLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const ctx = getAuthContext();
  const [stats, setStats] = useState<Stats | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const canViewStudents   = hasPermission('student.view', ctx);
  const canViewFees       = hasPermission('fee.view', ctx);
  const canViewEmployees  = hasPermission('employee.view', ctx);
  const canMarkAttendance = hasPermission('attendance.create', ctx);
  const canViewAudit      = hasPermission('audit.view', ctx);
  const canCreateNotice   = hasPermission('notice.create', ctx);
  const canViewAttendance = hasPermission('attendance.view', ctx);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, nRes] = await Promise.all([
          api.get('/institute/dashboard-stats'),
          api.get('/notices'),
        ]);
        setStats(sRes.data.data);
        setNotices(nRes.data.data.slice(0, 4));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const attendancePct = stats && stats.totalStudents > 0
    ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0;

  const quickActions = [
    canViewStudents    && { label: 'Admit Student',  href: '/students',      icon: GraduationCap, color: 'from-indigo-500 to-indigo-600' },
    canMarkAttendance  && { label: 'Attendance',     href: '/attendance',    icon: ClipboardList, color: 'from-green-500 to-green-600' },
    canViewFees        && { label: 'Fee Payments',   href: '/fees/payments', icon: CreditCard,    color: 'from-amber-500 to-amber-600' },
    canViewEmployees   && { label: 'Employees',      href: '/employees',     icon: Users,         color: 'from-purple-500 to-purple-600' },
    canCreateNotice    && { label: 'Post Notice',    href: '/notices',       icon: Bell,          color: 'from-pink-500 to-pink-600' },
    canViewAudit       && { label: 'Activity Log',  href: '/audit',         icon: TrendingUp,    color: 'from-blue-500 to-blue-600' },
  ].filter(Boolean) as { label: string; href: string; icon: React.ElementType; color: string }[];

  return (
    <AuthGuard>
      <AppShell title="Dashboard">
        <div className="space-y-6">
          {/* Welcome bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-indigo-100">
            <div>
              <h2 className="text-xl font-bold text-white">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {ctx?.user?.name?.split(' ')[0]} 👋
              </h2>
              <p className="text-indigo-200 text-sm mt-0.5">
                {ctx?.currentRoles.map(r => r.displayName).join(' · ') || 'Dashboard'} &nbsp;|&nbsp; {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {ctx?.currentInstitute && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                <Shield className="w-4 h-4 text-white" />
                <span className="text-white font-medium text-sm">{ctx.currentInstitute.name}</span>
              </div>
            )}
          </div>

          {/* Stat cards */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                canViewStudents  && { title: 'Students',     value: stats.totalStudents,  icon: GraduationCap, bg: 'bg-indigo-600', change: '+12 this month' },
                canViewEmployees && { title: 'Employees',    value: stats.totalEmployees, icon: Users,         bg: 'bg-blue-600',   change: '' },
                canViewEmployees && { title: 'Teachers',     value: stats.totalTeachers,  icon: Users,         bg: 'bg-purple-600', change: '' },
                hasPermission('academic.view', ctx) && { title: 'Classes', value: stats.totalClasses, icon: BookOpen, bg: 'bg-green-600', change: '' },
                canViewAttendance && { title: 'Present Today', value: `${stats.presentToday} (${attendancePct}%)`, icon: ClipboardList, bg: 'bg-amber-600', change: attendancePct >= 75 ? '✓ Good' : '⚠ Low' },
                canViewFees && { title: 'Pending Fees', value: formatCurrency(stats.pendingFees), icon: CreditCard, bg: 'bg-red-600', change: '' },
              ].filter(Boolean).map((s: any) => (
                <div key={s.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`${s.bg} p-3`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500">{s.title}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{s.value}</p>
                    {s.change && <p className="text-xs text-green-600 mt-0.5">{s.change}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance bar chart */}
            {canViewAttendance && (
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-green-500" /> Weekly Attendance
                    </CardTitle>
                    <Badge variant="success">This Week</Badge>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={attendanceWeek} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="present" fill="#6366f1" radius={[6, 6, 0, 0]} name="Present" />
                        <Bar dataKey="absent" fill="#fca5a5" radius={[6, 6, 0, 0]} name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Student status pie */}
            {canViewStudents && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500" /> Student Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={studentStatus} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {studentStatus.map((_, index) => (
                          <Cell key={index} fill={RCOLORS[index % RCOLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Fee collection area chart */}
          {canViewFees && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Fee Collection — Last 6 Months
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Collected</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-300 inline-block" /> Pending</span>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={feeMonths}>
                    <defs>
                      <linearGradient id="colCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colPending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                    <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} fill="url(#colCollected)" name="Collected" />
                    <Area type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} fill="url(#colPending)" name="Pending" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Quick actions + notices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {quickActions.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 pt-0">
                  {quickActions.map(a => (
                    <Link key={a.href} href={a.href}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-all group hover:-translate-y-0.5">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${a.color} shadow-sm`}>
                        <a.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">{a.label}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Recent Notices</CardTitle>
                <Link href="/notices" className="text-sm text-indigo-600 hover:underline">View all</Link>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-0">
                {notices.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No notices yet</p>
                ) : notices.map(n => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                    <div className="p-1.5 bg-indigo-100 rounded-lg mt-0.5"><Bell className="w-3.5 h-3.5 text-indigo-600" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="info">{n.audience}</Badge>
                        <span className="text-xs text-gray-400">{formatDate(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
