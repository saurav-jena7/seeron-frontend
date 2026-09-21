'use client';
import { useEffect, useState, FormEvent, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, UserCog, Pencil, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff, Copy, Check } from 'lucide-react';

// Safe label: works regardless of whether toJSON plugin ran or not
function roleLabel(r: { name: string; display_name?: string; displayName?: string }) {
  return r.display_name || r.displayName || r.name || '—';
}

interface RoleRef    { id: string; name: string; display_name?: string; displayName?: string; }
interface MemberUser { id: string; name: string; email: string; phone: string; plain_password?: string; }
interface Membership { id: string; user: MemberUser; roles: RoleRef[]; is_active: boolean; created_at: string; }
interface RoleOption { id: string; name: string; display_name?: string; displayName?: string; }

export default function MembershipsPage() {
  const [members,  setMembers]  = useState<Membership[]>([]);
  const [total,    setTotal]    = useState(0);
  const [roles,    setRoles]    = useState<RoleOption[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page,     setPage]     = useState(1);

  // ── Add modal state ──────────────────────────────────────────────────────
  const [open,    setOpen]    = useState(false);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', phone: '', roleIds: [] as string[] });

  // ── Edit modal state ─────────────────────────────────────────────────────
  const [editOpen,     setEditOpen]     = useState(false);
  const [editing,      setEditing]      = useState<Membership | null>(null);
  const [editRoleIds,  setEditRoleIds]  = useState<string[]>([]);
  const [editName,     setEditName]     = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPass,     setShowPass]     = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  function togglePassVisible(memberId: string) {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      next.has(memberId) ? next.delete(memberId) : next.add(memberId);
      return next;
    });
  }

  function copyPassword(pass: string) {
    navigator.clipboard.writeText(pass);
    toast.success('Password copied!');
  }

  const [saving, setSaving] = useState(false);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (debouncedSearch) params.search = debouncedSearch;
      const r = await api.get('/memberships', { params });
      setMembers(r.data.data);
      setTotal(r.data.meta?.total ?? r.data.data.length);
    } catch {}
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
    api.get('/roles').then(r => setRoles(r.data.data)).catch(() => {});
  }, [load]);

  function toggleRole(id: string, arr: string[], setArr: (v: string[]) => void) {
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  }

  function openEditModal(m: Membership) {
    setEditing(m);
    setEditRoleIds(m.roles.map(r => r.id));
    setEditName(m.user?.name || '');
    setEditPassword('');
    setShowPass(false);
    setEditOpen(true);
  }

  // ── Add member ────────────────────────────────────────────────────────────
  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (form.roleIds.length === 0) { toast.error('Select at least one role'); return; }
    if (form.password.length < 8)  { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await api.post('/memberships', { ...form, roleIds: form.roleIds });
      toast.success('Member added');
      setOpen(false);
      setForm({ name: '', email: '', password: '', phone: '', roleIds: [] });
      load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  // ── Edit member (roles + optionally name/password) ────────────────────────
  async function handleEditSave() {
    if (!editing) return;
    if (editRoleIds.length === 0) { toast.error('Assign at least one role'); return; }
    if (editPassword && editPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      // Single call with all changes
      await api.put(`/memberships/${editing.id}`, {
        roleIds:     editRoleIds,
        userName:    editName.trim() !== editing.user?.name ? editName.trim() : undefined,
        newPassword: editPassword || undefined,
      });
      toast.success('Member updated');
      setEditOpen(false);
      load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  // ── Toggle active status — only send isActive, no roleIds ────────────────
  async function toggleStatus(m: Membership) {
    const newStatus = !m.is_active;
    try {
      // Only pass isActive — no roleIds to avoid validation error
      await api.put(`/memberships/${m.id}`, { isActive: newStatus });
      toast.success(`Member ${newStatus ? 'activated' : 'deactivated'}`);
      load();
    } catch (err) { toast.error(getApiError(err)); }
  }

  async function removeMember(m: Membership) {
    if (!confirm(`Remove ${m.user?.name} from this institute?`)) return;
    try {
      await api.delete(`/memberships/${m.id}`);
      toast.success('Member removed');
      load();
    } catch (err) { toast.error(getApiError(err)); }
  }

  const roleVariant = (name: string): 'danger' | 'warning' | 'purple' | 'success' | 'info' | 'default' => {
    const map: Record<string, 'danger' | 'warning' | 'purple' | 'success' | 'info' | 'default'> = {
      INSTITUTE_ADMIN: 'danger', PRINCIPAL: 'warning', TEACHER: 'purple',
      ACCOUNTANT: 'success', CFO: 'success', HR_MANAGER: 'info', STUDENT: 'info',
    };
    return map[name] || 'default';
  };

  const totalPages = Math.ceil(total / limit);

  // ── Role checkbox list (shared between Add + Edit modals) ─────────────────
  function RoleCheckboxList({
    selected,
    onChange,
  }: {
    selected: string[];
    onChange: (ids: string[]) => void;
  }) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
        {roles.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading roles…</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {roles.map(r => {
              const label = roleLabel(r);
              const checked = selected.includes(r.id);
              return (
                <label
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-pointer bg-white hover:bg-indigo-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleRole(r.id, selected, onChange)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-800 font-medium">{label}</span>
                  {checked && (
                    <span className="ml-auto text-xs text-indigo-600 font-medium">✓ Selected</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <AuthGuard anyPermission={['membership.view']}>
      <AppShell title="Users & Members">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-600" /> Institute Members
              </h2>
              <p className="text-sm text-gray-500">{total} members</p>
            </div>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Add Member</Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Name</Th><Th>Email</Th><Th>Password</Th><Th>Roles</Th>
                      <Th>Status</Th><Th>Joined</Th><Th>Actions</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {members.length === 0 ? (
                      <Tr><Td className="text-center text-gray-400 py-8" colSpan={7 as never}>
                        {debouncedSearch ? `No members matching "${debouncedSearch}"` : 'No members found'}
                      </Td></Tr>
                    ) : members.map(m => (
                      <Tr key={m.id}>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {m.user?.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span className="font-medium text-gray-900">{m.user?.name ?? '—'}</span>
                          </div>
                        </Td>
                        <Td className="text-gray-500 text-sm">{m.user?.email ?? '—'}</Td>
                        {/* ── Password column ─────────────────────────────── */}
                        <Td>
                          {m.user?.plain_password ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">
                                {visiblePasswords.has(m.id)
                                  ? m.user.plain_password
                                  : '•'.repeat(Math.min(m.user.plain_password.length, 10))}
                              </span>
                              <button
                                title={visiblePasswords.has(m.id) ? 'Hide' : 'Show'}
                                onClick={() => togglePassVisible(m.id)}
                                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                              >
                                {visiblePasswords.has(m.id)
                                  ? <EyeOff className="w-3.5 h-3.5" />
                                  : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                title="Copy password"
                                onClick={() => copyPassword(m.user.plain_password!)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 italic">—</span>
                          )}
                        </Td>
                        {/* ── Roles ───────────────────────────────────────── */}
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {(m.roles || []).map(r => (
                              <Badge key={r.id} variant={roleVariant(r.name)}>{roleLabel(r)}</Badge>
                            ))}
                          </div>
                        </Td>
                        <Td>
                          {m.is_active
                            ? <Badge variant="success">Active</Badge>
                            : <Badge variant="danger">Inactive</Badge>}
                        </Td>
                        <Td className="text-gray-500 text-sm">{formatDate(m.created_at)}</Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            <button title="Edit member" onClick={() => openEditModal(m)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button title={m.is_active ? 'Deactivate' : 'Activate'} onClick={() => toggleStatus(m)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                              {m.is_active
                                ? <ToggleRight className="w-4 h-4 text-green-500" />
                                : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button title="Remove from institute" onClick={() => removeMember(m)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Add Member Modal ──────────────────────────────────────────────── */}
        <Modal open={open} onClose={() => setOpen(false)} title="Add Member" size="md">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name *" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <Input label="Email *" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              <Input label="Password *" type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required hint="Minimum 8 characters" />
              <Input label="Phone" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+91-XXXXXXXXXX" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Assign Roles *</p>
                {form.roleIds.length > 0 && (
                  <span className="text-xs text-indigo-600 font-medium">
                    {form.roleIds.length} role{form.roleIds.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <RoleCheckboxList
                selected={form.roleIds}
                onChange={ids => setForm(p => ({ ...p, roleIds: ids }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add Member</Button>
            </div>
          </form>
        </Modal>

        {/* ── Edit Member Modal ─────────────────────────────────────────────── */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)}
          title={`Edit Member — ${editing?.user?.name}`} size="md">
          <div className="space-y-5">

            {/* ── Account Details ────────────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Details</p>

              {/* Email — read only */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400 w-14 flex-shrink-0">Email</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{editing?.user?.email}</span>
              </div>

              {/* Current Password — visible to admin */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Current Password</p>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-mono text-amber-900 flex-1 tracking-wider">
                    {editing?.user?.plain_password
                      ? (showPass ? editing.user.plain_password : '•'.repeat(Math.min(editing.user.plain_password.length, 12)))
                      : <span className="text-gray-400 italic text-xs">Not available (set via seed)</span>}
                  </span>
                  {editing?.user?.plain_password && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="p-1 text-amber-600 hover:text-amber-800 transition-colors"
                        title={showPass ? 'Hide password' : 'Show password'}
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editing.user.plain_password!);
                          setCopied(true);
                          toast.success('Password copied to clipboard');
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1 text-amber-600 hover:text-amber-800 transition-colors"
                        title="Copy password"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-amber-600 mt-1">⚠ Only visible to admins. Share securely.</p>
              </div>

              {/* Name + New Password fields */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Update Name"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder={editing?.user?.name || 'Name'}
                />
                <div className="relative">
                  <Input
                    label="Set New Password"
                    type={showPass ? 'text' : 'password'}
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep"
                    hint={editPassword
                      ? (editPassword.length < 8 ? 'Min 8 characters' : '✓ Strong enough')
                      : 'Optional — leave blank to keep current'}
                  />
                </div>
              </div>
            </div>

            {/* ── Roles ──────────────────────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned Roles</p>
                {editRoleIds.length > 0 && (
                  <span className="text-xs text-indigo-600 font-medium">
                    {editRoleIds.length} role{editRoleIds.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              <RoleCheckboxList selected={editRoleIds} onChange={setEditRoleIds} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} loading={saving}>Save Changes</Button>
            </div>
          </div>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}
