'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getAuthContext, hasPermission } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart2, BookOpen, DollarSign, Users, ClipboardList, AlertTriangle } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

export default function ReportsPage() {
  const ctx     = getAuthContext();
  const canAcad = hasPermission('report.academic.view', ctx);
  const canAtt  = hasPermission('report.attendance.view', ctx);
  const canFin  = hasPermission('report.finance.view', ctx);
  const canHr   = hasPermission('report.hr.view', ctx);

  // Academic data
  const [studentsByClass,  setStudentsByClass]  = useState<{ class: string; count: number }[]>([]);
  const [teacherLoad,      setTeacherLoad]      = useState<{ teacher: string; subjects: number }[]>([]);

  // Attendance data
  const [attMonth,         setAttMonth]         = useState(String(new Date().getMonth() + 1));
  const [attSummary,       setAttSummary]        = useState<{ status: string; count: number }[]>([]);
  const [attClassWise,     setAttClassWise]      = useState<{ class: string; percentage: number }[]>([]);
  const [lowAtt,           setLowAtt]           = useState<{ name: string; admissionNo: string; percentage: number }[]>([]);

  // Finance data
  const [finYear,          setFinYear]          = useState(String(new Date().getFullYear()));
  const [monthlyRevenue,   setMonthlyRevenue]   = useState<{ month: string; revenue: number }[]>([]);
  const [byCategory,       setByCategory]       = useState<{ category: string; total: number }[]>([]);
  const [byMethod,         setByMethod]         = useState<{ method: string; total: number }[]>([]);

  // HR data
  const [hrSummary,        setHrSummary]        = useState<{ total: number; teachers: number; active: number; inactive: number } | null>(null);
  const [byDept,           setByDept]           = useState<{ department: string; count: number }[]>([]);

  const [loading,          setLoading]          = useState(true);

  async function loadAll(month = attMonth, year = finYear) {
    setLoading(true);
    const promises: Promise<void>[] = [];

    if (canAcad) {
      promises.push(
        api.get('/reports/academic/students-by-class').then(r => setStudentsByClass(r.data.data || [])).catch(() => {}),
        api.get('/reports/academic/teacher-load').then(r => setTeacherLoad(r.data.data || [])).catch(() => {}),
      );
    }
    if (canAtt) {
      promises.push(
        api.get('/reports/attendance/summary', { params: { month, year } }).then(r => setAttSummary(r.data.data || [])).catch(() => {}),
        api.get('/reports/attendance/class-wise', { params: { month, year } }).then(r => setAttClassWise(r.data.data || [])).catch(() => {}),
        api.get('/reports/attendance/low-attendance', { params: { month, year } }).then(r => setLowAtt(r.data.data || [])).catch(() => {}),
      );
    }
    if (canFin) {
      promises.push(
        api.get('/reports/finance/monthly-revenue', { params: { year } }).then(r => setMonthlyRevenue(r.data.data || [])).catch(() => {}),
        api.get('/reports/finance/collection-by-category').then(r => setByCategory(r.data.data || [])).catch(() => {}),
        api.get('/reports/finance/payment-methods').then(r => setByMethod(r.data.data || [])).catch(() => {}),
      );
    }
    if (canHr) {
      promises.push(
        api.get('/reports/hr/summary').then(r => setHrSummary(r.data.data)).catch(() => {}),
        api.get('/reports/hr/employees-by-department').then(r => setByDept(r.data.data || [])).catch(() => {}),
      );
    }

    await Promise.all(promises);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <AuthGuard anyPermission={['report.academic.view','report.finance.view','report.hr.view','report.attendance.view']}>
      <AppShell title="Reports">
        <div className="space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" /> Reports & Analytics
              </h2>
              <p className="text-sm text-gray-500">Live data from your institute</p>
            </div>
          </div>

          {loading ? <Spinner /> : (
            <>
              {/* ── ACADEMIC ───────────────────────────────────────────────── */}
              {canAcad && (
                <section>
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-indigo-500" /> Academic Reports
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Students by class */}
                    <Card>
                      <CardHeader><CardTitle>Students by Class</CardTitle></CardHeader>
                      <CardContent>
                        {studentsByClass.length === 0 ? (
                          <p className="text-sm text-gray-400 py-6 text-center">No student data</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={studentsByClass} layout="vertical" margin={{ left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                              <YAxis type="category" dataKey="class" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                              <Tooltip formatter={(v: number) => [v, 'Students']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} name="Students" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Teacher load */}
                    <Card>
                      <CardHeader><CardTitle>Teacher Load (Subjects Assigned)</CardTitle></CardHeader>
                      <CardContent>
                        {teacherLoad.length === 0 ? (
                          <p className="text-sm text-gray-400 py-6 text-center">No teacher assignments yet</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={teacherLoad.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <YAxis type="category" dataKey="teacher" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={100} />
                              <Tooltip formatter={(v: number) => [v, 'Subjects']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="subjects" fill="#8b5cf6" radius={[0,4,4,0]} name="Subjects" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                  </div>
                </section>
              )}

              {/* ── ATTENDANCE ─────────────────────────────────────────────── */}
              {canAtt && (
                <section>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-green-500" /> Attendance Reports
                    </h3>
                    <div className="flex gap-2">
                      <select value={attMonth}
                        onChange={e => { setAttMonth(e.target.value); loadAll(e.target.value, finYear); }}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
                      </select>
                      <select value={finYear}
                        onChange={e => { setFinYear(e.target.value); loadAll(attMonth, e.target.value); }}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Status pie */}
                    <Card>
                      <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
                      <CardContent>
                        {attSummary.length === 0 ? (
                          <p className="text-sm text-gray-400 py-6 text-center">No data for this period</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={attSummary} dataKey="count" nameKey="status" cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                                {attSummary.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Class-wise % */}
                    <Card className="lg:col-span-2">
                      <CardHeader><CardTitle>Class-wise Attendance %</CardTitle></CardHeader>
                      <CardContent>
                        {attClassWise.length === 0 ? (
                          <p className="text-sm text-gray-400 py-6 text-center">No data for this period</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={attClassWise}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="class" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
                              <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="percentage" fill="#10b981" radius={[4,4,0,0]} name="Attendance %" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                  </div>

                  {/* Low attendance students */}
                  {lowAtt.length > 0 && (
                    <Card className="mt-5 border-amber-200">
                      <CardHeader className="bg-amber-50 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-amber-700">
                          <AlertTriangle className="w-4 h-4" /> Low Attendance Students (below 75%)
                          <Badge variant="warning">{lowAtt.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                          {lowAtt.map((s, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50">
                              <div>
                                <span className="text-sm font-medium text-gray-900">{s.name}</span>
                                {s.admissionNo && <span className="text-xs text-gray-400 ml-2">#{s.admissionNo}</span>}
                              </div>
                              <Badge variant={s.percentage < 50 ? 'danger' : 'warning'}>{s.percentage}%</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </section>
              )}

              {/* ── FINANCE ────────────────────────────────────────────────── */}
              {canFin && (
                <section>
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" /> Finance Reports
                    </h3>
                    <select value={finYear}
                      onChange={e => { setFinYear(e.target.value); loadAll(attMonth, e.target.value); }}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Monthly revenue bar */}
                    <Card className="lg:col-span-2">
                      <CardHeader><CardTitle>Monthly Revenue ({finYear})</CardTitle></CardHeader>
                      <CardContent>
                        {monthlyRevenue.length === 0 ? (
                          <p className="text-sm text-gray-400 py-6 text-center">No fee payments recorded for {finYear}</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyRevenue}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                                tickFormatter={(v: number) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`} />
                              <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} name="Revenue" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment methods pie */}
                    <Card>
                      <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
                      <CardContent>
                        {byMethod.length === 0 ? (
                          <p className="text-sm text-gray-400 py-6 text-center">No data</p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie data={byMethod} dataKey="total" nameKey="method" cx="50%" cy="45%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                                {byMethod.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip formatter={(v: number) => [formatCurrency(v), '']} contentStyle={{ borderRadius: '10px', border: 'none' }} />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </CardContent>
                    </Card>

                  </div>

                  {/* By category */}
                  {byCategory.length > 0 && (
                    <Card className="mt-5">
                      <CardHeader><CardTitle>Collection by Fee Category</CardTitle></CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                          {byCategory.map((c, i) => (
                            <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                              <span className="text-sm font-medium text-gray-700">{c.category}</span>
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(c.total)}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </section>
              )}

              {/* ── HR ─────────────────────────────────────────────────────── */}
              {canHr && (
                <section>
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-pink-500" /> HR Reports
                  </h3>

                  {hrSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                      {[
                        { label: 'Total Staff',     value: hrSummary.total,    color: 'bg-pink-50 border-pink-200 text-pink-700' },
                        { label: 'Teachers',        value: hrSummary.teachers, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                        { label: 'Active',          value: hrSummary.active,   color: 'bg-green-50 border-green-200 text-green-700' },
                        { label: 'Inactive',        value: hrSummary.inactive, color: 'bg-gray-50 border-gray-200 text-gray-600' },
                      ].map(s => (
                        <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
                          <p className="text-2xl font-bold">{s.value}</p>
                          <p className="text-xs mt-1 opacity-70">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {byDept.length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>Staff by Department</CardTitle></CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={byDept} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={100} />
                            <Tooltip formatter={(v: number) => [v, 'Staff']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" fill="#ec4899" radius={[0,4,4,0]} name="Staff" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </section>
              )}

            </>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
