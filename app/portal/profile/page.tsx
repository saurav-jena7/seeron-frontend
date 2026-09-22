'use client';
import { useEffect, useState } from 'react';
import PortalShell from '@/components/layout/PortalShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  User, Phone, Mail, MapPin, Calendar, Droplets,
  GraduationCap, Users, BookOpen, Award, Hash,
  Shield, Eye, EyeOff, Lock, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';

interface NamedRef { id: string; name: string; }
interface Profile {
  id: string; name: string; admission_no: string; roll_no: string;
  gender: string; dob: string; blood_group: string;
  phone: string; email: string; address: string;
  parent_name: string; parent_phone: string; parent_email: string;
  class: NamedRef | null; section: NamedRef | null; academic_year: NamedRef | null;
  status: string; admission_date: string;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active:      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:    { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400'    },
  graduated:   { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  transferred: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
};

export default function PortalProfilePage() {
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [loading,  setLoading]  = useState(true);

  // Change password state
  const [pwOpen,       setPwOpen]       = useState(false);
  const [currentPw,    setCurrentPw]    = useState('');
  const [newPw,        setNewPw]        = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);

  useEffect(() => {
    api.get('/portal/profile')
      .then(r => setProfile(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw)    { toast.error('New passwords do not match'); return; }
    if (newPw.length < 8)       { toast.error('Password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      toast.success('Password changed successfully');
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwOpen(false);
    } catch (err) { toast.error(getApiError(err)); }
    setPwSaving(false);
  }

  if (loading) return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Profile">
        <div className="flex items-center justify-center h-64">
          <Spinner />
        </div>
      </PortalShell>
    </AuthGuard>
  );

  if (!profile) return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Profile">
        <div className="flex items-center justify-center h-64 text-gray-400">Profile not found.</div>
      </PortalShell>
    </AuthGuard>
  );

  const className   = profile.class?.name   ?? '--';
  const sectionName = profile.section?.name ?? null;
  const ayName      = profile.academic_year?.name ?? '--';
  const initials    = profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const statusStyle = STATUS_STYLES[profile.status] || STATUS_STYLES.inactive;

  const pwStrength = newPw.length === 0 ? 0 : newPw.length < 8 ? 1 : newPw.length < 12 ? 2 : 3;
  const pwStrengthLabel = ['', 'Weak', 'Good', 'Strong'][pwStrength];
  const pwStrengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'][pwStrength];

  return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Profile">
        <div className="space-y-6 max-w-2xl mx-auto">

          {/* ── Hero Banner ─────────────────────────────────────────────────── */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 overflow-hidden shadow-xl shadow-indigo-200">
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/10 rounded-full blur-xl" />
            <div className="absolute top-1/2 right-12 w-16 h-16 bg-white/5 rounded-full" />

            <div className="relative flex items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm text-white flex items-center justify-center text-3xl font-bold border-2 border-white/40 shadow-lg">
                  {initials}
                </div>
                {/* Status dot */}
                <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${statusStyle.dot}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white leading-tight">{profile.name}</h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="flex items-center gap-1 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                    <Hash className="w-3 h-3" /> {profile.admission_no || '--'}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                    {className}{sectionName ? ` - ${sectionName}` : ''}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{ayName}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${statusStyle.dot}`} />
                    {profile.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick stats strip */}
            <div className="relative mt-5 pt-4 border-t border-white/20 grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Roll No',       value: profile.roll_no      || '--' },
                { label: 'Academic Year', value: ayName                       },
                { label: 'Gender',        value: profile.gender       || '--', className: 'capitalize' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-white/60 text-xs">{s.label}</p>
                  <p className={`text-white font-semibold text-sm mt-0.5 ${s.className || ''}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Two-column grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Personal Info */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 divide-y divide-gray-50">
                {[
                  { icon: Calendar, label: 'Date of Birth',  value: formatDate(profile.dob)         },
                  { icon: Droplets, label: 'Blood Group',    value: profile.blood_group || '--'      },
                  { icon: Phone,    label: 'Phone',          value: profile.phone       || '--'      },
                  { icon: Mail,     label: 'Email',          value: profile.email       || '--'      },
                  { icon: Calendar, label: 'Admission Date', value: formatDate(profile.admission_date) },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 py-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center flex-shrink-0 transition-colors">
                      <item.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
                {profile.address && (
                  <div className="flex items-start gap-3 py-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-800">{profile.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-5">
              {/* Academic Details */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    Academic Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-gray-50">
                  {[
                    { label: 'Class',         value: `${className}${sectionName ? ' - ' + sectionName : ''}` },
                    { label: 'Academic Year', value: ayName },
                    { label: 'Roll Number',   value: profile.roll_no     || '--' },
                    { label: 'Admission No',  value: profile.admission_no || '--' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2.5">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-lg">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Parent Info */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    Parent / Guardian
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-gray-50">
                  {[
                    { icon: User,  label: 'Name',  value: profile.parent_name  || '--' },
                    { icon: Phone, label: 'Phone', value: profile.parent_phone || '--' },
                    { icon: Mail,  label: 'Email', value: profile.parent_email || '--' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 py-2.5 group">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-green-50 flex items-center justify-center flex-shrink-0 transition-colors">
                        <item.icon className="w-3 h-3 text-gray-400 group-hover:text-green-600 transition-colors" />
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

          {/* ── Change Password ──────────────────────────────────────────────── */}
          <Card className="shadow-sm border-gray-200 overflow-hidden">
            <button
              onClick={() => setPwOpen(v => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-400 mt-0.5">Update your login password securely</p>
                </div>
              </div>
              {pwOpen
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {pwOpen && (
              <div className="border-t border-gray-100 p-5">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {/* Current password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        required
                        placeholder="Enter your current password"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button type="button" onClick={() => setShowCurrent(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password *</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        required
                        placeholder="Minimum 8 characters"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button type="button" onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {newPw.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? pwStrengthColor : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${pwStrength === 1 ? 'text-red-500' : pwStrength === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {pwStrengthLabel}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm New Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Match indicator */}
                    {confirmPw.length > 0 && (
                      <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${newPw === confirmPw ? 'text-emerald-600' : 'text-red-500'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {newPw === confirmPw ? 'Passwords match' : 'Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button variant="outline" type="button" size="sm"
                      onClick={() => { setPwOpen(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" loading={pwSaving}
                      disabled={!currentPw || newPw.length < 8 || newPw !== confirmPw}>
                      <Lock className="w-3.5 h-3.5" /> Update Password
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </Card>

        </div>
      </PortalShell>
    </AuthGuard>
  );
}
