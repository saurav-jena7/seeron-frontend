'use client';
import { useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAuthContext, isSuperAdmin } from '@/lib/auth';
import api from '@/lib/api';
import { getApiError, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, Lock, Building2, Shield } from 'lucide-react';

export default function ProfilePage() {
  const ctx   = getAuthContext();
  const user  = ctx?.user;
  const roles = ctx?.currentRoles ?? [];
  const inst  = ctx?.currentInstitute;
  const isSuper = isSuperAdmin(ctx);

  const [currentPass,  setCurrentPass]  = useState('');
  const [newPass,      setNewPass]      = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [saving,       setSaving]       = useState(false);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPass !== confirmPass) { toast.error('Passwords do not match'); return; }
    if (newPass.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: currentPass, newPassword: newPass });
      toast.success('Password changed successfully');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell title="Profile">
        <div className="max-w-2xl space-y-6">

          {/* ── Profile card ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> My Profile</CardTitle></CardHeader>
            <CardContent>
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {getInitials(user?.name || 'U')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user?.name ?? '—'}</h3>
                  <p className="text-sm text-gray-500">{user?.email ?? '—'}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {isSuper && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        <Shield className="w-3 h-3" /> Super Admin
                      </span>
                    )}
                    {roles.map(r => (
                      <Badge key={r.id} variant="info" className="capitalize text-xs">
                        {r.displayName || r.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">User ID</p>
                  <p className="font-mono text-xs text-gray-700 truncate">{user?.id ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <p className="text-gray-700">{user?.phone ?? '—'}</p>
                </div>
                {inst && (
                  <div className="bg-indigo-50 rounded-xl p-3 sm:col-span-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-indigo-400 mb-0.5">Current Institute</p>
                      <p className="font-medium text-indigo-800 truncate">{inst.name}</p>
                    </div>
                    <Badge variant="info" className="ml-auto capitalize text-xs flex-shrink-0">{inst.type}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Change password ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  required
                  hint="Minimum 8 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  required
                />
                <Button type="submit" loading={saving}>Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
