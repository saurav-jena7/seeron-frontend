'use client';
import { useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getUser } from '@/lib/auth';
import api from '@/lib/api';
import { getApiError, getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';
import { User, Lock } from 'lucide-react';

export default function ProfilePage() {
  const user = getUser();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPass !== confirmPass) { toast.error('Passwords do not match'); return; }
    if (newPass.length < 6) { toast.error('Password must be at least 6 characters'); return; }
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
          <Card>
            <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(user?.name || 'U')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <Badge variant="info" className="mt-1 capitalize">{user?.role?.replace('_', ' ')}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">User ID:</span><p className="font-mono text-xs text-gray-700 mt-0.5">{user?.id}</p></div>
                <div><span className="text-gray-500">Institute ID:</span><p className="font-mono text-xs text-gray-700 mt-0.5">{user?.instituteId}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input label="Current Password" type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required />
                <Input label="New Password" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required hint="Minimum 6 characters" />
                <Input label="Confirm New Password" type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
                <Button type="submit" loading={saving}>Update Password</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
