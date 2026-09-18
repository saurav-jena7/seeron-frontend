'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function NewInstitutePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', website: '', established_year: '', type: 'school' });
  const [saving, setSaving] = useState(false);
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/institute/create', form);
      toast.success('Institute created');
      router.push('/super-admin');
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  return (
    <AuthGuard superAdminOnly>
      <AppShell title="New Institute">
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
            <h2 className="text-xl font-bold text-gray-900">Create Institute</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader><CardTitle>Institute Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Name *" value={form.name} onChange={e => f('name', e.target.value)} required />
                  <Select label="Type" value={form.type} onChange={e => f('type', e.target.value)}
                    options={[{ value: 'school', label: 'School' }, { value: 'college', label: 'College' }, { value: 'institute', label: 'Institute' }, { value: 'university', label: 'University' }]} />
                  <Input label="Phone" value={form.phone} onChange={e => f('phone', e.target.value)} />
                  <Input label="Email" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
                  <Input label="Website" value={form.website} onChange={e => f('website', e.target.value)} />
                  <Input label="Established Year" type="number" value={form.established_year} onChange={e => f('established_year', e.target.value)} />
                </div>
                <Input label="Address" value={form.address} onChange={e => f('address', e.target.value)} />
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" loading={saving}>Create Institute</Button>
            </div>
          </form>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
