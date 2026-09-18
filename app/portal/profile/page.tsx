'use client';
import { useEffect, useState } from 'react';
import PortalShell from '@/components/layout/PortalShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  User, Phone, Mail, MapPin, Calendar, Droplets,
  GraduationCap, Users, BookOpen, Award,
} from 'lucide-react';

interface NamedRef { id: string; name: string; }
interface Profile {
  id: string;
  name: string;
  admission_no: string;
  roll_no: string;
  gender: string;
  dob: string;
  blood_group: string;
  phone: string;
  email: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  class: NamedRef | null;
  section: NamedRef | null;
  academic_year: NamedRef | null;
  status: string;
  admission_date: string;
}

const STATUS_COLOR: Record<string, string> = {
  active:      'bg-green-100 text-green-700 border-green-200',
  inactive:    'bg-gray-100 text-gray-600 border-gray-200',
  graduated:   'bg-blue-100 text-blue-700 border-blue-200',
  transferred: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function PortalProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal/profile')
      .then(r => setProfile(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Profile"><Spinner /></PortalShell>
    </AuthGuard>
  );

  if (!profile) return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Profile">
        <p className="text-gray-500 text-center py-12">Profile not found.</p>
      </PortalShell>
    </AuthGuard>
  );

  const className   = profile.class?.name ?? '—';
  const sectionName = profile.section?.name ?? null;
  const ayName      = profile.academic_year?.name ?? '—';
  const initials    = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Profile">
        <div className="space-y-5">
          {/* Hero card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 border-2 border-white/30">
                {initials}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    #{profile.admission_no}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                    {className}{sectionName ? ` – ${sectionName}` : ''}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{ayName}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_COLOR[profile.status] || STATUS_COLOR.inactive}`}>
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Personal info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Award,     label: 'Roll No',       value: profile.roll_no || '—' },
                  { icon: User,      label: 'Gender',        value: profile.gender || '—', className: 'capitalize' },
                  { icon: Calendar,  label: 'Date of Birth', value: formatDate(profile.dob) },
                  { icon: Droplets,  label: 'Blood Group',   value: profile.blood_group || '—' },
                  { icon: Phone,     label: 'Phone',         value: profile.phone || '—' },
                  { icon: Mail,      label: 'Email',         value: profile.email || '—' },
                  { icon: Calendar,  label: 'Admission Date',value: formatDate(profile.admission_date) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className={`text-sm font-medium text-gray-800 truncate ${item.className || ''}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
                {profile.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-800">{profile.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-5">
              {/* Academic info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-500" /> Academic Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Class',         value: `${className}${sectionName ? ' – ' + sectionName : ''}` },
                    { label: 'Academic Year', value: ayName },
                    { label: 'Roll Number',   value: profile.roll_no || '—' },
                    { label: 'Admission No',  value: profile.admission_no || '—' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Parent info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" /> Parent / Guardian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: User,  label: 'Name',  value: profile.parent_name  || '—' },
                    { icon: Phone, label: 'Phone', value: profile.parent_phone || '—' },
                    { icon: Mail,  label: 'Email', value: profile.parent_email || '—' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-3 h-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="text-sm font-medium text-gray-800">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PortalShell>
    </AuthGuard>
  );
}
