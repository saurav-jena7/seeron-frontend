'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Building2, Save } from 'lucide-react';

interface Institute {
  id: string; name: string; address: string; phone: string;
  email: string; website: string; established_year: number;
  type: string; logo_url: string; created_at: string;
}

export default function InstitutePage() {
  const [inst, setInst] = useState<Partial<Institute>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/institute').then((r) => { setInst(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/institute', inst);
      setInst(data.data);
      toast.success('Institute details updated');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function set(k: keyof Institute, v: string | number) {
    setInst((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <AuthGuard anyPermission={['institute.view']}>
      <AppShell title="Institute Setup">
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Institute Setup</h2>
              <p className="text-sm text-gray-500">Manage your institute&apos;s profile and details</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : (
            <form onSubmit={handleSave}>
              <Card>
                <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Institute Name" value={inst.name || ''} onChange={(e) => set('name', e.target.value)} required />
                    <Select
                      label="Type"
                      value={inst.type || 'school'}
                      onChange={(e) => set('type', e.target.value)}
                      options={[
                        { value: 'school', label: 'School' },
                        { value: 'college', label: 'College' },
                        { value: 'institute', label: 'Institute' },
                        { value: 'university', label: 'University' },
                      ]}
                    />
                    <Input label="Phone" value={inst.phone || ''} onChange={(e) => set('phone', e.target.value)} />
                    <Input label="Email" type="email" value={inst.email || ''} onChange={(e) => set('email', e.target.value)} />
                    <Input label="Website" value={inst.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
                    <Input label="Established Year" type="number" value={inst.established_year || ''} onChange={(e) => set('established_year', parseInt(e.target.value))} min={1800} max={2100} />
                  </div>
                  <Input label="Address" value={inst.address || ''} onChange={(e) => set('address', e.target.value)} />
                  <Input label="Logo URL" value={inst.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://..." />
                </CardContent>
              </Card>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400">Last updated: {formatDate(inst.created_at)}</p>
                <Button type="submit" loading={saving} className="gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              </div>
            </form>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
