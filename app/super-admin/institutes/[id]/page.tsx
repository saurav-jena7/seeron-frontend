'use client';
import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { setActiveInstitute } from '@/lib/auth';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Building2, Users, GraduationCap, Briefcase,
  Save, Pencil, Trash2, Globe, Phone, Mail, Eye, EyeOff,
  Copy, Check, UserPlus, Settings, BookOpen, CreditCard,
  ClipboardList, Bell, Activity, ArrowRight, ChevronRight,
  BookMarked, Home, Bus, Key, UserCog, BarChart2,
} from 'lucide-react';
import Link from 'next/link';

interface Institute {
  id: string; name: string; address: string; phone: string; email: string;
  website: string; logo_url: string; established_year: number; type: string;
  created_at: string; memberCount: number; studentCount: number; employeeCount: number;
}

interface RoleRef { id: string; name: string; display_name?: string; displayName?: string; }
interface Member {
  id: string;
  user: { id: string; name: string; email: string; phone?: string; plain_password?: string; is_active: boolean; };
  roles: RoleRef[];
  is_active: boolean;
  created_at: string;
}

function roleLabel(r: RoleRef) { return r.display_name || r.displayName || r.name; }

const MODULES = [
  { label: 'Institute Settings', href: '/institute',        icon: Settings,     color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { label: 'Members',            href: '/memberships',      icon: UserCog,      color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'Roles',              href: '/roles',            icon: Key,          color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Employees',          href: '/employees',        icon: Users,        color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { label: 'Academics',          href: '/academics/classes',icon: BookOpen,     color: 'bg-green-50 text-green-600 border-green-200' },
  { label: 'Students',           href: '/students',         icon: GraduationCap,color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { label: 'Attendance',         href: '/attendance',       icon: ClipboardList,color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { label: 'Fees',               href: '/fees/payments',    icon: CreditCard,   color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { label: 'Notices',            href: '/notices',          icon: Bell,         color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { label: 'Reports',            href: '/reports',          icon: BarChart2,    color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { label: 'Audit Log',          href: '/audit',            icon: Activity,     color: 'bg-red-50 text-red-600 border-red-200' },
  { label: 'Library',            href: '/library',          icon: BookMarked,   color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  { label: 'Hostel',             href: '/hostel',           icon: Home,         color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { label: 'Transport',          href: '/transport',        icon: Bus,          color: 'bg-violet-50 text-violet-600 border-violet-200' },
];

export default function InstituteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [inst,         setInst]         = useState<Institute | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [editing,      setEditing]      = useState(false);
  const [form,         setForm]         = useState<Partial<Institute>>({});
  const [saving,       setSaving]       = useState(false);

  // Members state
  const [members,      setMembers]      = useState<Member[]>([]);
  const [membersLoad,  setMembersLoad]  = useState(false);
  const [visiblePass,  setVisiblePass]  = useState<Set<string>>(new Set());
  const [copied,       setCopied]       = useState<string | null>(null);
  const [tab,          setTab]          = useState<'overview' | 'members' | 'modules'>('overview');

  // Add member modal
  const [addOpen,      setAddOpen]      = useState(false);
  const [roles,        setRoles]        = useState<RoleRef[]>([]);
  const [newMember,    setNewMember]    = useState({ name: '', email: '', password: '', phone: '', roleIds: [] as string[] });
  const [addSaving,    setAddSaving]    = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get(`/institute/detail/${id}`);
      setInst(r.data.data); setForm(r.data.data);
    } catch { toast.error('Failed to load institute'); }
    setLoading(false);
  }

  async function loadMembers() {
    setMembersLoad(true);
    try {
      // Switch institute context to this one so /memberships returns the right data
      setActiveInstitute(id);
      const [mr, rr] = await Promise.all([
        api.get('/memberships?limit=100'),
        api.get('/roles'),
      ]);
      setMembers(mr.data.data || []);
      setRoles(rr.data.data || []);
    } catch {}
    setMembersLoad(false);
  }

  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (tab === 'members') loadMembers(); }, [tab]);

  function switchAndGo(href: string) {
    setActiveInstitute(id);
    router.push(href);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const r = await api.put(`/institute/detail/${id}`, form);
      setInst(r.data.data); setForm(r.data.data); setEditing(false);
      toast.success('Institute updated');
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${inst?.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/institute/detail/${id}`);
      toast.success('Institute deleted'); router.push('/super-admin');
    } catch (err) { toast.error(getApiError(err)); }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    if (newMember.roleIds.length === 0) { toast.error('Select at least one role'); return; }
    if (newMember.password.length < 8) { toast.error('Password min 8 chars'); return; }
    setAddSaving(true);
    try {
      setActiveInstitute(id);
      await api.post('/memberships', { ...newMember, roleIds: newMember.roleIds });
      toast.success('Member added');
      setAddOpen(false);
      setNewMember({ name: '', email: '', password: '', phone: '', roleIds: [] });
      loadMembers();
    } catch (err) { toast.error(getApiError(err)); }
    setAddSaving(false);
  }

  async function removeMember(m: Member) {
    if (!confirm(`Remove ${m.user?.name}?`)) return;
    try {
      setActiveInstitute(id);
      await api.delete(`/memberships/${m.id}`);
      toast.success('Member removed'); loadMembers();
    } catch (err) { toast.error(getApiError(err)); }
  }

  async function toggleMember(m: Member) {
    try {
      setActiveInstitute(id);
      await api.put(`/memberships/${m.id}`, { isActive: !m.is_active });
      toast.success(`Member ${m.is_active ? 'deactivated' : 'activated'}`); loadMembers();
    } catch (err) { toast.error(getApiError(err)); }
  }

  function togglePass(uid: string) {
    setVisiblePass(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  }

  function copyPass(pass: string, uid: string) {
    navigator.clipboard.writeText(pass);
    setCopied(uid); toast.success('Password copied!');
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleRoleInNew(rid: string) {
    setNewMember(p => ({ ...p, roleIds: p.roleIds.includes(rid) ? p.roleIds.filter(x => x !== rid) : [...p.roleIds, rid] }));
  }

  const f = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));
  const roleVariant = (n: string): 'danger'|'warning'|'purple'|'success'|'info'|'default' =>
    ({ INSTITUTE_ADMIN:'danger', PRINCIPAL:'warning', TEACHER:'purple', ACCOUNTANT:'success', STUDENT:'info' } as any)[n] || 'default';

  if (loading) return <AuthGuard superAdminOnly><AppShell title="Institute"><Spinner /></AppShell></AuthGuard>;
  if (!inst)   return <AuthGuard superAdminOnly><AppShell title="Institute"><p className="text-gray-500">Not found</p></AppShell></AuthGuard>;

  return (
    <AuthGuard superAdminOnly>
      <AppShell title={inst.name}>
        <div className="space-y-6 max-w-6xl">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xl font-bold shadow-lg">
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setActiveInstitute(id); toast.success(`Switched to ${inst.name}`); router.push('/dashboard'); }}>
                <ArrowRight className="w-4 h-4" /> Open Dashboard
              </Button>
              {!editing && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" /> Edit</Button>}
              <Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /> Delete</Button>
            </div>
          </div>

          {/* ── Stats ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Members',   value: inst.memberCount,   icon: Users,         bg: 'bg-indigo-50', color: 'text-indigo-600' },
              { label: 'Students',  value: inst.studentCount,  icon: GraduationCap, bg: 'bg-green-50',  color: 'text-green-600' },
              { label: 'Employees', value: inst.employeeCount, icon: Briefcase,     bg: 'bg-purple-50', color: 'text-purple-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
                <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                <div><p className="text-xs text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900">{s.value ?? 0}</p></div>
              </div>
            ))}
          </div>

          {/* ── Tabs ────────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(['overview', 'members', 'modules'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ───────────────────────────────────────────────── */}
          {tab === 'overview' && (
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
                          options={[{value:'school',label:'School'},{value:'college',label:'College'},{value:'institute',label:'Institute'},{value:'university',label:'University'}]} />
                        <Input label="Phone" value={form.phone || ''} onChange={e => f('phone', e.target.value)} />
                        <Input label="Email" type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} />
                        <Input label="Website" value={form.website || ''} onChange={e => f('website', e.target.value)} placeholder="https://" />
                        <Input label="Est. Year" type="number" value={String(form.established_year||'')} onChange={e => f('established_year', parseInt(e.target.value))} />
                      </div>
                      <Input label="Address" value={form.address || ''} onChange={e => f('address', e.target.value)} />
                      <Input label="Logo URL" value={form.logo_url || ''} onChange={e => f('logo_url', e.target.value)} placeholder="https://..." />
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <Button variant="outline" type="button" onClick={() => { setEditing(false); setForm(inst); }}>Cancel</Button>
                        <Button type="submit" loading={saving}><Save className="w-4 h-4" /> Save</Button>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: Building2, label: 'Type',     value: inst.type || '—' },
                        { icon: Phone,     label: 'Phone',    value: inst.phone || '—' },
                        { icon: Mail,      label: 'Email',    value: inst.email || '—' },
                        { icon: Globe,     label: 'Website',  value: inst.website || '—' },
                        { icon: Building2, label: 'Est Year', value: String(inst.established_year||'—') },
                        { icon: Building2, label: 'Address',  value: inst.address || '—' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <row.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">{row.label}</p>
                            <p className="font-medium text-gray-800 truncate">{row.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          )}

          {/* ── Tab: Members + Credentials ──────────────────────────────────── */}
          {tab === 'members' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Members & Credentials</CardTitle>
                <Button onClick={() => setAddOpen(true)} size="sm"><UserPlus className="w-4 h-4" /> Add Member</Button>
              </CardHeader>
              <CardContent className="p-0">
                {membersLoad ? <Spinner /> : (
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Name</Th><Th>Email</Th><Th>Password</Th><Th>Roles</Th><Th>Status</Th><Th>Actions</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {members.length === 0 ? (
                        <Tr><Td className="text-center text-gray-400 py-8" colSpan={6 as never}>No members yet</Td></Tr>
                      ) : members.map(m => (
                        <Tr key={m.id}>
                          <Td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {m.user?.name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{m.user?.name ?? '—'}</span>
                            </div>
                          </Td>
                          <Td className="text-gray-500 text-sm">{m.user?.email ?? '—'}</Td>
                          <Td>
                            {m.user?.plain_password ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2 py-1 rounded-lg">
                                  {visiblePass.has(m.user.id) ? m.user.plain_password : '•'.repeat(Math.min(m.user.plain_password.length, 10))}
                                </span>
                                <button onClick={() => togglePass(m.user.id)} className="p-1 text-gray-400 hover:text-indigo-600">
                                  {visiblePass.has(m.user.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button onClick={() => copyPass(m.user.plain_password!, m.user.id)} className="p-1 text-gray-400 hover:text-green-600">
                                  {copied === m.user.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : <span className="text-xs text-gray-300 italic">—</span>}
                          </Td>
                          <Td>
                            <div className="flex flex-wrap gap-1">
                              {(m.roles || []).map(r => (
                                <Badge key={r.id} variant={roleVariant(r.name)} className="text-xs">{roleLabel(r)}</Badge>
                              ))}
                            </div>
                          </Td>
                          <Td>
                            {m.is_active
                              ? <Badge variant="success">Active</Badge>
                              : <Badge variant="danger">Inactive</Badge>}
                          </Td>
                          <Td>
                            <div className="flex gap-1">
                              <button onClick={() => toggleMember(m)}
                                className="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
                                {m.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button onClick={() => removeMember(m)}
                                className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                                Remove
                              </button>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Tab: Modules ────────────────────────────────────────────────── */}
          {tab === 'modules' && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Institute Modules</CardTitle>
                <p className="text-xs text-gray-400">Click any module to manage it within this institute</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MODULES.map(m => (
                    <button key={m.href} onClick={() => switchAndGo(m.href)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border ${m.color} hover:shadow-md transition-all hover:-translate-y-0.5 group text-left w-full`}>
                      <m.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold">{m.label}</span>
                      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Add Member Modal ──────────────────────────────────────────────── */}
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Member to Institute" size="md">
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name *" value={newMember.name} onChange={e => setNewMember(p => ({...p, name: e.target.value}))} required />
              <Input label="Email *" type="email" value={newMember.email} onChange={e => setNewMember(p => ({...p, email: e.target.value}))} required />
              <Input label="Password *" type="password" value={newMember.password}
                onChange={e => setNewMember(p => ({...p, password: e.target.value}))} required hint="Min 8 characters" />
              <Input label="Phone" value={newMember.phone} onChange={e => setNewMember(p => ({...p, phone: e.target.value}))} placeholder="+91-XXXXXXXXXX" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Assign Roles *</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                {roles.map(r => (
                  <label key={r.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer bg-white hover:bg-indigo-50 border-b border-gray-100 last:border-0 transition-colors">
                    <input type="checkbox" checked={newMember.roleIds.includes(r.id)}
                      onChange={() => toggleRoleInNew(r.id)}
                      className="w-4 h-4 rounded accent-indigo-600" />
                    <span className="text-sm text-gray-800">{roleLabel(r)}</span>
                    {newMember.roleIds.includes(r.id) && <span className="ml-auto text-xs text-indigo-600">✓</span>}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" loading={addSaving}>Add Member</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}
