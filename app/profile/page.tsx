'use client';
import { useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getAuthContext, isSuperAdmin } from '@/lib/auth';
import api from '@/lib/api';
import { getApiError, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  User, Lock, Building2, Shield, Phone, Mail, Hash,
  Eye, EyeOff, CheckCircle2, ChevronDown, ChevronUp,
  Key, Briefcase, Star,
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ProfilePage() {
  const ctx     = getAuthContext();
  const user    = ctx?.user;
  const roles   = ctx?.currentRoles ?? [];
  const inst    = ctx?.currentInstitute;
  const isSuper = isSuperAdmin(ctx);

  // Change password state
  const [pwOpen,       setPwOpen]       = useState(false);
  const [currentPass,  setCurrentPass]  = useState('');
  const [newPass,      setNewPass]      = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [saving,       setSaving]       = useState(false);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPass !== confirmPass) { toast.error('Passwords do not match'); return; }
    if (newPass.length < 8)     { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: currentPass, newPassword: newPass });
      toast.success('Password changed successfully');
      setCurrentPass(''); setNewPass(''); setConfirmPass(''); setPwOpen(false);
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  const initials = getInitials(user?.name || 'U');

  // Password strength
  const pwStrength = newPass.length === 0 ? 0 : newPass.length < 8 ? 1 : newPass.length < 12 ? 2 : 3;
  const pwStrengthLabel = ['', 'Weak', 'Good', 'Strong'][pwStrength];
  const pwStrengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'][pwStrength];

  // Role color gradient per role type
  const heroGradient = isSuper
    ? 'from-amber-500 via-orange-500 to-red-500'
    : roles.some(r => r.name === 'INSTITUTE_ADMIN')
    ? 'from-indigo-600 via-purple-600 to-pink-500'
    : roles.some(r => r.name === 'PRINCIPAL')
    ? 'from-blue-600 via-cyan-500 to-teal-500'
    : roles.some(r => r.name === 'TEACHER')
    ? 'from-green-500 via-emerald-500 to-teal-600'
    : 'from-indigo-600 via-purple-600 to-pink-500';

  return (
    <AuthGuard>
      <AppShell title="My Profile">
        <div className="max-w-2xl space-y-5">

          {/* ── Hero Banner ─────────────────────────────────────────────────── */}
          <div className={`relative bg-gradient-to-br ${heroGradient} rounded-3xl p-6 overflow-hidden shadow-xl`}>
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute top-1/2 right-16 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

            <div className="relative flex items-center gap-5">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm text-white flex items-center justify-center text-3xl font-bold border-2 border-white/40 shadow-lg select-none">
                  {initials}
                </div>
                {isSuper && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                    <Star className="w-3.5 h-3.5 text-white fill-white" />
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white leading-tight truncate">{user?.name ?? '--'}</h2>
                <p className="text-white/70 text-sm mt-0.5 truncate">{user?.email ?? '--'}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {isSuper && (
                    <span className="flex items-center gap-1 bg-amber-400/30 text-amber-100 border border-amber-300/40 text-xs px-2.5 py-1 rounded-full font-semibold">
                      <Shield className="w-3 h-3" /> Super Admin
                    </span>
                  )}
                  {roles.map(r => (
                    <span key={r.id} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium capitalize">
                      {r.displayName || r.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats strip */}
            {inst && (
              <div className="relative mt-5 pt-4 border-t border-white/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white/60 text-xs">Current Institute</p>
                  <p className="text-white font-semibold text-sm truncate">{inst.name}</p>
                </div>
                <span className="ml-auto bg-white/20 text-white text-xs px-2.5 py-1 rounded-full capitalize flex-shrink-0">
                  {inst.type}
                </span>
              </div>
            )}
          </div>

          {/* ── Account Details ──────────────────────────────────────────────── */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-5 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Account Details
              </p>
              <div className="space-y-0 divide-y divide-gray-50">
                {[
                  { icon: Hash,     label: 'User ID',    value: user?.id    ?? '--', mono: true },
                  { icon: Mail,     label: 'Email',      value: user?.email ?? '--' },
                  { icon: Phone,    label: 'Phone',      value: user?.phone ?? '--' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 py-3 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center flex-shrink-0 transition-colors">
                      <item.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className={`text-sm font-medium text-gray-800 truncate ${item.mono ? 'font-mono text-xs' : ''}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Roles & Permissions ──────────────────────────────────────────── */}
          {roles.length > 0 && (
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="pt-5 pb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5" /> Assigned Roles
                </p>
                <div className="flex flex-wrap gap-2">
                  {roles.map(r => (
                    <div key={r.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-indigo-800">{r.displayName || r.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Change Password ──────────────────────────────────────────────── */}
          <Card className="shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setPwOpen(v => !v)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-400 mt-0.5">Update your login password securely</p>
                </div>
              </div>
              {pwOpen
                ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
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
                        value={currentPass}
                        onChange={e => setCurrentPass(e.target.value)}
                        required
                        placeholder="Enter your current password"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
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
                        value={newPass}
                        onChange={e => setNewPass(e.target.value)}
                        required
                        placeholder="Minimum 8 characters"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {newPass.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3].map(i => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? pwStrengthColor : 'bg-gray-200'}`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${
                          pwStrength === 1 ? 'text-red-500' : pwStrength === 2 ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
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
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        required
                        placeholder="Re-enter new password"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Match indicator */}
                    {confirmPass.length > 0 && (
                      <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${newPass === confirmPass ? 'text-emerald-600' : 'text-red-500'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {newPass === confirmPass ? 'Passwords match' : 'Passwords do not match'}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      onClick={() => { setPwOpen(false); setCurrentPass(''); setNewPass(''); setConfirmPass(''); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      loading={saving}
                      disabled={!currentPass || newPass.length < 8 || newPass !== confirmPass}
                    >
                      <Lock className="w-3.5 h-3.5" /> Update Password
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </Card>

        </div>
      </AppShell>
    </AuthGuard>
  );
}
