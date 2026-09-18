'use client';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Bus, MapPin, User, Wrench, Plus, Navigation } from 'lucide-react';

export default function TransportPage() {
  return (
    <AuthGuard anyPermission={['transport.vehicle.view']}>
      <AppShell title="Transport">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bus className="w-5 h-5 text-violet-600" /> Transport Management
              </h2>
              <p className="text-sm text-gray-500">Manage vehicles, drivers, routes and student allocation</p>
            </div>
            <Button><Plus className="w-4 h-4" /> Add Vehicle</Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Vehicles', value: 0, icon: Bus, color: 'bg-violet-50 text-violet-600' },
              { label: 'Active Routes', value: 0, icon: Navigation, color: 'bg-blue-50 text-blue-600' },
              { label: 'Drivers', value: 0, icon: User, color: 'bg-green-50 text-green-600' },
              { label: 'Maintenance Due', value: 0, icon: Wrench, color: 'bg-orange-50 text-orange-600' },
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Vehicles', desc: 'Manage fleet of vehicles', icon: Bus, color: 'border-violet-200 bg-violet-50' },
              { title: 'Routes & Stops', desc: 'Define routes and bus stops', icon: MapPin, color: 'border-blue-200 bg-blue-50' },
              { title: 'Driver Management', desc: 'Manage drivers and assignments', icon: User, color: 'border-green-200 bg-green-50' },
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
              <Bus className="w-12 h-12 text-violet-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700">Transport Module</h3>
              <p className="text-gray-400 mt-1">Full fleet management, route tracking and student allocation coming soon.</p>
              <div className="flex justify-center gap-2 mt-4 flex-wrap">
                {['Vehicle Tracking', 'Route Management', 'Driver Profiles', 'Maintenance Logs', 'Student Allocation'].map(f => (
                  <Badge key={f} variant="purple">{f}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
