'use client';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Home, BedDouble, Users, AlertCircle, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function HostelPage() {
  const stats = [
    { label: 'Total Hostels', value: 0, icon: Home, color: 'bg-teal-50 text-teal-600' },
    { label: 'Total Rooms', value: 0, icon: BedDouble, color: 'bg-blue-50 text-blue-600' },
    { label: 'Occupied Beds', value: 0, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Complaints', value: 0, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <AuthGuard anyPermission={['hostel.view']}>
      <AppShell title="Hostel">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Home className="w-5 h-5 text-teal-600" /> Hostel Management
              </h2>
              <p className="text-sm text-gray-500">Manage hostels, rooms, beds and student allocations</p>
            </div>
            <Button><Plus className="w-4 h-4" /> Add Hostel</Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className={`p-3 rounded-xl ${s.color}`}><s.icon className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Hostels & Rooms', desc: 'Manage hostel blocks and rooms', icon: Home, color: 'border-teal-200 bg-teal-50' },
              { title: 'Student Allocation', desc: 'Allocate students to beds', icon: Users, color: 'border-blue-200 bg-blue-50' },
              { title: 'Complaints', desc: 'View and resolve complaints', icon: AlertCircle, color: 'border-red-200 bg-red-50' },
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

          <Card>
            <CardContent className="py-12 text-center">
              <BedDouble className="w-12 h-12 text-teal-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">Hostel Module</h3>
              <p className="text-gray-400 mt-1">Full hostel management with room allocation and tracking coming soon.</p>
              <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {['Room Management', 'Bed Allocation', 'Attendance', 'Complaints', 'Visitors'].map(f => (
                  <Badge key={f} variant="success">{f}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
