'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Building2, Users, GraduationCap, Briefcase,
  Save, Pencil, Trash2, Globe, Phone, Mail,
} from 'lucide-react';

interface Institute {
  id: string; name: string; address: string; phone: string; email: string;
  website: string; logo_url: string; established_year: number; type: string;
  created_at: string; memberCount: number; studentCount: number; employeeCount: number;
}

export default function InstituteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [inst,    setInst]    = useState<Institute | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<Partial<Institute>>({});
  const [saving,  setSaving]  = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get(`/institute/detail/${id}`);
      setInst(r.data.data);
      setForm(r.data.data);
    } catch { toast.error('Failed to load institute'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put(`/institute/detail/${id}`, form);
      setInst(r.data.data);
      setForm(r.data.data);
      setEditing(false);
      toast.success('Institute updated');
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete institute "${inst?.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/institute/detail/${id}`);
      toast.success('Institute deleted');
      router.push('/super-admin');
    } catch (err) { toast.error(getApiError(err)); }
  }

  const f = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  return (
    <AuthGuard superAdminOnly>
      <AppShell title="Institute Detail">
        {loading ? <Spinner /> : !inst ? (
          <p className="text-gray-500">Institute not found.</p>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {inst.name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{inst.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="info" className="capitalize">{inst.type}</Badge>
                      <span className="text-xs text-gray-400">Created {formatDate(inst.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {!editing && (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                )}
                <Button variant="danger" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Members',   value: inst.memberCount,   icon: Users,         bg: 'bg-indigo-50', color: 'text-indigo-600' },
                { label: 'Students',  value: inst.studentCount,  icon: GraduationCap, bg: 'bg-green-50',  color: 'text-green-600' },
                { label: 'Employees', value: inst.employeeCount, icon: Briefcase,     bg: 'bg-purple-50', color: 'text-purple-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
                  <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Details / Edit form */}
            <form onSubmit={handleSave}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    {editing ? 'Edit Institute Details' : 'Institute Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Name *" value={form.name || ''} onChange={e => f('name', e.target.value)} required />
                        <Select label="Type" value={form.type || 'school'} onChange={e => f('type', e.target.value)}
                          options={[
                            { value: 'school',      label: 'School' },
                            { value: 'college',     label: 'College' },
                            { value: 'institute',   label: 'Institute' },
                            { value: 'university',  label: 'University' },
                          ]} />
                        <Input label="Phone" value={form.phone || ''} onChange={e => f('phone', e.target.value)} />
                        <Input label="Email" type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} />
                        <Input label="Website" value={form.website || ''} onChange={e => f('website', e.target.value)} placeholder="https://" />
                        <Input label="Established Year" type="number" value={String(form.established_year || '')} onChange={e => f('established_year', parseInt(e.target.value))} />
                      </div>
                      <Input label="Address" value={form.address || ''} onChange={e => f('address', e.target.value)} />
                      <Input label="Logo URL" value={form.logo_url || ''} onChange={e => f('logo_url', e.target.value)} placeholder="https://..." />
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button variant="outline" type="button" onClick={() => { setEditing(false); setForm(inst); }}>Cancel</Button>
                        <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Save Changes</Button>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {[
                        { icon: Building2, label: 'Type',             value: inst.type || '—' },
                        { icon: Phone,     label: 'Phone',            value: inst.phone || '—' },
                        { icon: Mail,      label: 'Email',            value: inst.email || '—' },
                        { icon: Globe,     label: 'Website',          value: inst.website || '—' },
                        { icon: Building2, label: 'Est. Year',        value: inst.established_year?.toString() || '—' },
                        { icon: Building2, label: 'Address',          value: inst.address || '—' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <row.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">{row.label}</p>
                            <p className="font-medium text-gray-800 truncate capitalize">{row.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
