'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { Bus, MapPin, User, Wrench, Plus, Navigation, GraduationCap } from 'lucide-react';

interface Stats { totalStudents: number; totalEmployees: number; totalTeachers: number; }

export default function TransportPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/institute/dashboard-stats')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Approximate: assume ~30% of students use transport
  const potentialRiders = Math.round((stats?.totalStudents ?? 0) * 0.3);

  const statCards = [
    { label: 'Total Students',      value: loading ? '…' : stats?.totalStudents ?? 0, icon: GraduationCap, color: 'bg-violet-50 text-violet-600' },
    { label: 'Potential Riders',    value: loading ? '…' : potentialRiders,             icon: Bus,           color: 'bg-blue-50 text-blue-600' },
    { label: 'Staff Commuters',     value: loading ? '…' : stats?.totalEmployees ?? 0,  icon: User,          color: 'bg-green-50 text-green-600' },
    { label: 'Maintenance Due',     value: '—',                                          icon: Wrench,        color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <AuthGuard anyPermission={['transport.vehicle.view']}>
      <AppShell title="Transport">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-violet-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bus className="w-5 h-5" /> Transport Management
              </h2>
              <p className="text-violet-100 text-sm mt-0.5">Manage vehicles, drivers, routes and student allocation</p>
            </div>
            <Button className="bg-white text-violet-700 hover:bg-violet-50 border-0 shadow">
              <Plus className="w-4 h-4" /> Add Vehicle
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
              { title: 'Vehicles',          desc: 'Manage the fleet of institute vehicles',  icon: Bus,        color: 'border-violet-200 bg-violet-50/60' },
              { title: 'Routes & Stops',    desc: 'Define bus routes and pickup stops',        icon: MapPin,     color: 'border-blue-200 bg-blue-50/60' },
              { title: 'Driver Management', desc: 'Manage drivers and vehicle assignments',    icon: User,       color: 'border-green-200 bg-green-50/60' },
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

          {/* Ridership estimate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-violet-500" /> Ridership Overview
              </CardTitle>
              <Badge variant="purple">Estimated from student data</Badge>
            </CardHeader>
            <CardContent>
              {loading ? <Spinner /> : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Total students enrolled</span>
                      <span className="font-bold text-gray-900">{stats?.totalStudents ?? 0}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Potential transport users (~30%)</span>
                      <span className="font-bold text-gray-900">{potentialRiders}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600">Staff commuters</span>
                      <span className="font-bold text-gray-900">{stats?.totalEmployees ?? 0}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="h-full rounded-full bg-green-400 transition-all duration-700"
                        style={{ width: stats?.totalStudents ? `${Math.min(100, Math.round(((stats?.totalEmployees ?? 0) / stats.totalStudents) * 100))}%` : '0%' }} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    🚌 Full fleet management, GPS tracking, route optimisation and student allocation coming in the next module update.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Vehicle Tracking', 'Route Management', 'Driver Profiles', 'Maintenance Logs', 'Student Allocation'].map(f => (
                      <Badge key={f} variant="purple">{f}</Badge>
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
