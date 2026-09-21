'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Home, BedDouble, Users, AlertCircle, Plus, GraduationCap } from 'lucide-react';

interface Stats { totalStudents: number; totalEmployees: number; }

export default function HostelPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/institute/dashboard-stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Approximate: assume up to 40% of students may use hostel
  const potentialResidents = Math.round((stats?.totalStudents ?? 0) * 0.4);

  const statCards = [
    { label: 'Total Students',       value: loading ? '…' : stats?.totalStudents ?? 0,  icon: GraduationCap, color: 'bg-teal-50 text-teal-600' },
    { label: 'Potential Residents',  value: loading ? '…' : potentialResidents,           icon: BedDouble,     color: 'bg-blue-50 text-blue-600' },
    { label: 'Staff',                value: loading ? '…' : stats?.totalEmployees ?? 0,   icon: Users,         color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Active Complaints',    value: '—',                                            icon: AlertCircle,   color: 'bg-red-50 text-red-600' },
  ];

  return (
    <AuthGuard anyPermission={['hostel.view']}>
      <AppShell title="Hostel">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-teal-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Home className="w-5 h-5" /> Hostel Management
              </h2>
              <p className="text-teal-100 text-sm mt-0.5">Manage hostels, rooms, beds and student allocations</p>
            </div>
            <Button className="bg-white text-teal-700 hover:bg-teal-50 border-0 shadow">
              <Plus className="w-4 h-4" /> Add Hostel
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
              { title: 'Hostels & Rooms',     desc: 'Manage hostel blocks and individual rooms', icon: Home,      color: 'border-teal-200 bg-teal-50/60' },
              { title: 'Student Allocation',  desc: 'Assign students to rooms and beds',         icon: Users,     color: 'border-blue-200 bg-blue-50/60' },
              { title: 'Complaints',          desc: 'View and resolve resident complaints',       icon: AlertCircle, color: 'border-red-200 bg-red-50/60' },
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

          {/* Occupancy estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-teal-500" /> Occupancy Overview
              </CardTitle>
              <Badge variant="info">Estimated from student data</Badge>
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Students enrolled</span>
                      <span className="font-bold text-gray-900">{stats?.totalStudents ?? 0}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500 transition-all duration-700" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Potential hostel residents (~40%)</span>
                      <span className="font-bold text-gray-900">{potentialResidents}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    🏠 Full room/bed management, allocation tracking, visitor logs and complaint system coming in the next module update.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Room Management', 'Bed Allocation', 'Hostel Attendance', 'Complaints', 'Visitor Logs'].map(f => (
                      <Badge key={f} variant="success">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
