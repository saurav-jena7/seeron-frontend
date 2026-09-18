'use client';
import { useEffect, useState } from 'react';
import PortalShell from '@/components/layout/PortalShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { formatDate, MONTHS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface AttRecord { id: string; date: string; status: string; remarks: string; }
interface AttSummary {
  records: AttRecord[];
  summary: Record<string, number>;
  total: number; presentDays: number; attendancePercentage: string;
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  excused: 'bg-blue-100 text-blue-700',
};
const PIE_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#3b82f6'];

export default function PortalAttendancePage() {
  const [data, setData] = useState<AttSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  useEffect(() => {
    setLoading(true);
    api.get('/portal/attendance', { params: { month, year } })
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  // Build weekly bar data from records
  const weeklyData = (() => {
    if (!data?.records) return [];
    const weeks: Record<number, { week: string; present: number; absent: number; late: number }> = {};
    data.records.forEach(r => {
      const d = new Date(r.date);
      const weekNum = Math.ceil(d.getDate() / 7);
      if (!weeks[weekNum]) weeks[weekNum] = { week: `Week ${weekNum}`, present: 0, absent: 0, late: 0 };
      if (r.status === 'present') weeks[weekNum].present++;
      else if (r.status === 'absent') weeks[weekNum].absent++;
      else if (r.status === 'late') weeks[weekNum].late++;
    });
    return Object.values(weeks);
  })();

  const pieData = data ? [
    { name: 'Present', value: data.summary.present || 0 },
    { name: 'Absent',  value: data.summary.absent  || 0 },
    { name: 'Late',    value: data.summary.late    || 0 },
    { name: 'Excused', value: data.summary.excused || 0 },
  ].filter(d => d.value > 0) : [];

  const pct = parseFloat(data?.attendancePercentage ?? '0');

  return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Attendance">
        <div className="space-y-5">
          {/* Filters */}
          <Card>
            <CardContent className="py-4 flex flex-wrap gap-3 items-center">
              <select value={month} onChange={e => setMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
              <select value={year} onChange={e => setYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </CardContent>
          </Card>

          {loading ? <Spinner /> : !data ? null : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Days',  value: data.total,            color: 'bg-gray-50 border-gray-200' },
                  { label: 'Present',     value: data.summary.present || 0, color: 'bg-indigo-50 border-indigo-200' },
                  { label: 'Absent',      value: data.summary.absent  || 0, color: 'bg-red-50 border-red-200' },
                  { label: 'Percentage',  value: `${data.attendancePercentage}%`, color: pct >= 75 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200' },
                ].map(s => (
                  <div key={s.label} className={cn('rounded-xl p-4 text-center border', s.color)}>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Weekly bar chart */}
                <Card>
                  <CardHeader><CardTitle>Weekly Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {weeklyData.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No data for this period</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={weeklyData} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="present" fill="#6366f1" radius={[4,4,0,0]} name="Present" />
                          <Bar dataKey="absent"  fill="#fca5a5" radius={[4,4,0,0]} name="Absent" />
                          <Bar dataKey="late"    fill="#fcd34d" radius={[4,4,0,0]} name="Late" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Pie chart */}
                <Card>
                  <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
                  <CardContent>
                    {pieData.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No records</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Daily records */}
              <Card>
                <CardHeader><CardTitle>Daily Records</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {data.records.length === 0 ? (
                    <p className="text-sm text-gray-400 px-6 py-6">No records for this period</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {data.records.map(r => (
                        <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                          <span className="text-sm text-gray-700">{formatDate(r.date)}</span>
                          <div className="flex items-center gap-2">
                            {r.remarks && <span className="text-xs text-gray-400">{r.remarks}</span>}
                            <Badge className={cn('capitalize', STATUS_COLORS[r.status] || '')}>{r.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </PortalShell>
    </AuthGuard>
  );
}
