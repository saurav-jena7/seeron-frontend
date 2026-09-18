'use client';
import { useEffect, useState } from 'react';
import PortalShell from '@/components/layout/PortalShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { User, ClipboardList, CreditCard, Bell, TrendingUp } from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface NamedRef { id: string; name: string; }
interface Profile {
  name: string; admission_no: string;
  class: NamedRef | null; section: NamedRef | null;
  academic_year: NamedRef | null; status: string;
}
interface FeeSummary { totalAssigned: number; totalPaid: number; balance: number; }
interface AttSummary { attendancePercentage: string; total: number; presentDays: number; summary: Record<string, number>; }
interface Notice { id: string; title: string; audience: string; created_at: string; }

const ATT_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#3b82f6'];

export default function PortalDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [att, setAtt] = useState<AttSummary | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/portal/profile'),
      api.get('/portal/fees'),
      api.get('/portal/attendance'),
      api.get('/portal/notices'),
    ]).then(([pr, fr, ar, nr]) => {
      setProfile(pr.data.data);
      setFees(fr.data.data);
      setAtt(ar.data.data);
      setNotices(nr.data.data.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell><Spinner /></PortalShell>
    </AuthGuard>
  );

  const attPct = parseFloat(att?.attendancePercentage ?? '0');
  const attData = [
    { name: 'Present', value: att?.summary?.present || 0 },
    { name: 'Absent',  value: att?.summary?.absent  || 0 },
    { name: 'Late',    value: att?.summary?.late    || 0 },
    { name: 'Excused', value: att?.summary?.excused || 0 },
  ].filter(d => d.value > 0);

  const feeProgress = fees ? Math.min(100, Math.round((fees.totalPaid / (fees.totalAssigned || 1)) * 100)) : 0;
  const radialData = [{ name: 'Attendance', value: attPct, fill: attPct >= 75 ? '#6366f1' : '#ef4444' }];

  return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title={`Welcome, ${profile?.name?.split(' ')[0] ?? ''} 👋`}>
        <div className="space-y-5">
          {/* Profile card */}
          {profile && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {profile.name?.[0]}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{profile.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-indigo-200 text-sm">#{profile.admission_no}</span>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {profile.class?.name}{profile.section?.name ? ` – ${profile.section.name}` : ''}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{profile.academic_year?.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Attendance radial */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-500" /> Attendance</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center pb-2">
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={radialData}>
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f3f4f6' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="-mt-8 text-center">
                  <p className="text-3xl font-bold text-gray-900">{attPct}%</p>
                  <p className="text-xs text-gray-500">{att?.presentDays} / {att?.total} days present</p>
                </div>
                <div className="flex gap-3 mt-3 text-xs">
                  {[
                    { label: 'Present', val: att?.summary?.present || 0, color: 'bg-indigo-500' },
                    { label: 'Absent',  val: att?.summary?.absent  || 0, color: 'bg-red-400' },
                    { label: 'Late',    val: att?.summary?.late    || 0, color: 'bg-amber-400' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-gray-600">{s.label}: <strong>{s.val}</strong></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Fee status */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-500" /> Fee Status</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Assigned</p>
                      <p className="font-bold text-gray-900">{formatCurrency(fees?.totalAssigned ?? 0)}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-green-600">Paid</p>
                      <p className="font-bold text-green-700">{formatCurrency(fees?.totalPaid ?? 0)}</p>
                    </div>
                    <div className={`${(fees?.balance ?? 0) > 0 ? 'bg-red-50' : 'bg-green-50'} rounded-xl p-3`}>
                      <p className={`text-xs ${(fees?.balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>Balance</p>
                      <p className={`font-bold ${(fees?.balance ?? 0) > 0 ? 'text-red-700' : 'text-green-700'}`}>{formatCurrency(fees?.balance ?? 0)}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Payment Progress</span>
                      <span>{feeProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-400 to-emerald-600"
                        style={{ width: `${feeProgress}%` }}
                      />
                    </div>
                  </div>
                  {/* Pie chart */}
                  <ResponsiveContainer width="100%" height={80}>
                    <PieChart>
                      <Pie data={[{ value: fees?.totalPaid ?? 0 }, { value: fees?.balance ?? 0 }]}
                        cx="50%" cy="50%" innerRadius={25} outerRadius={38} dataKey="value">
                        <Cell fill="#10b981" />
                        <Cell fill="#fca5a5" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Recent Notices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-0">
              {notices.length === 0 ? (
                <p className="text-sm text-gray-400">No notices</p>
              ) : notices.map(n => (
                <div key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors">
                  <Bell className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PortalShell>
    </AuthGuard>
  );
}
