'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { getAuthContext, hasPermission } from '@/lib/auth';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Building2, Save, Eye, Phone, Mail, Globe,
  Calendar, MapPin, Image, CheckCircle,
} from 'lucide-react';

interface Institute {
  id: string; name: string; address: string; phone: string;
  email: string; website: string; established_year: number;
  type: string; logo_url: string; created_at: string;
}

export default function InstitutePage() {
  const ctx     = getAuthContext();
  const canEdit = hasPermission('institute.update', ctx);

  const [inst,    setInst]    = useState<Partial<Institute>>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    api.get('/institute')
      .then(r => setInst(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/institute', inst);
      setInst(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Institute details updated');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function set(k: keyof Institute, v: string | number) {
    setInst(prev => ({ ...prev, [k]: v }));
  }

  const typeLabel = inst.type ? inst.type.charAt(0).toUpperCase() + inst.type.slice(1) : '';

  return (
    <AuthGuard anyPermission={['institute.view', 'institute.update']}>
      <AppShell title="Institute">
        <div className="max-w-4xl space-y-6">

          {/* ── Hero header ────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-lg shadow-indigo-100">
            <div className="flex items-center gap-5">
              {/* Institute avatar */}
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold shadow-inner flex-shrink-0">
                {inst.name?.[0]?.toUpperCase() || 'I'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white truncate">
                  {loading ? 'Loading…' : inst.name || 'Institute Setup'}
                </h2>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {typeLabel && (
                    <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full capitalize">
                      {typeLabel}
                    </span>
                  )}
                  {inst.email && (
                    <span className="text-indigo-200 text-sm">{inst.email}</span>
                  )}
                  {!canEdit && (
                    <span className="flex items-center gap-1 text-xs bg-white/10 text-indigo-200 px-2.5 py-0.5 rounded-full">
                      <Eye className="w-3 h-3" /> View only
                    </span>
                  )}
                </div>
              </div>
              {inst.created_at && (
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-xs text-indigo-300">Since</p>
                  <p className="text-sm font-medium text-white">{formatDate(inst.created_at)}</p>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : canEdit ? (
            /* ── Edit form ─────────────────────────────────────────────────── */
            <form onSubmit={handleSave} className="space-y-5">
              {/* Basic info */}
              <Card>
                <CardContent className="pt-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Basic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Institute Name *" value={inst.name || ''} onChange={e => set('name', e.target.value)} required placeholder="e.g. Seeron Academy" />
                    <Select label="Type *" value={inst.type || 'school'} onChange={e => set('type', e.target.value)}
                      options={[
                        { value: 'school',     label: 'School' },
                        { value: 'college',    label: 'College' },
                        { value: 'institute',  label: 'Institute' },
                        { value: 'university', label: 'University' },
                      ]} />
                  </div>
                </CardContent>
              </Card>

              {/* Contact info */}
              <Card>
                <CardContent className="pt-5 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Details</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Phone" value={inst.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+91-XXXXXXXXXX" />
                    <Input label="Email" type="email" value={inst.email || ''} onChange={e => set('email', e.target.value)} placeholder="info@institute.edu" />
                    <Input label="Website" value={inst.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://..." />
                    <Input label="Established Year" type="number" value={inst.established_year || ''} onChange={e => set('established_year', parseInt(e.target.value))} min={1800} max={2100} placeholder="e.g. 2005" />
                  </div>
                </CardContent>
              </Card>

              {/* Address & branding */}
              <Card>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Address & Branding</h3>
                  </div>
                  <Input label="Address" value={inst.address || ''} onChange={e => set('address', e.target.value)} placeholder="Street, City, State" />
                  <Input label="Logo URL" value={inst.logo_url || ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://cdn.example.com/logo.png" />
                  {inst.logo_url && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <img src={inst.logo_url} alt="Logo preview" className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-200" onError={e => (e.currentTarget.style.display = 'none')} />
                      <div>
                        <p className="text-xs font-medium text-gray-700">Logo Preview</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{inst.logo_url}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save bar */}
              <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-5 py-3 shadow-sm">
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Last updated: {formatDate(inst.created_at)}
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow transition-all duration-200
                    ${saved
                      ? 'bg-green-500 text-white shadow-green-200'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200 hover:shadow-indigo-300'}
                    disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {saving ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : saved ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* ── Read-only view ────────────────────────────────────────────── */
            <Card>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: Building2, label: 'Name',             value: inst.name },
                    { icon: Building2, label: 'Type',             value: typeLabel },
                    { icon: Phone,     label: 'Phone',            value: inst.phone },
                    { icon: Mail,      label: 'Email',            value: inst.email },
                    { icon: Globe,     label: 'Website',          value: inst.website },
                    { icon: Calendar,  label: 'Established Year', value: inst.established_year?.toString() },
                    { icon: MapPin,    label: 'Address',          value: inst.address },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                        <row.icon className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">{row.label}</p>
                        <p className="text-sm font-medium text-gray-800 truncate">{row.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Last updated: {formatDate(inst.created_at)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
