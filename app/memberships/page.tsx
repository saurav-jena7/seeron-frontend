'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, UserCog, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface RoleRef { id: string; name: string; displayName: string; }
interface MemberUser { id: string; name: string; email: string; phone: string; isActive: boolean; }
interface Membership { id: string; user: MemberUser; roles: RoleRef[]; isActive: boolean; created_at: string; }
interface RoleOption { id: string; name: string; displayName: string; }

export default function MembershipsPage() {
  const [members, setMembers] = useState<Membership[]>([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Membership | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', roleIds: [] as string[] });
  const [editRoleIds, setEditRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/memberships', { params: { page, limit } });
      setMembers(r.data.data); setTotal(r.data.meta?.total || r.data.data.length);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    api.get('/roles').then(r => setRoles(r.data.data)).catch(() => {});
  }, [page]);

  function toggleRole(id: string, arr: string[], setArr: (v: string[]) => void) {
    setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (form.roleIds.length === 0) { toast.error('Select at least one role'); return; }
    setSaving(true);
    try {
      await api.post('/memberships', { ...form, roleIds: form.roleIds });
      toast.success('Member added'); setOpen(false);
      setForm({ name: '', email: '', password: '', phone: '', roleIds: [] });
      load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function handleEditSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/memberships/${editing.id}`, { roleIds: editRoleIds });
      toast.success('Roles updated'); setEditOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function toggleStatus(m: Membership) {
    try {
      await api.put(`/roles/users/${m.user.id}/toggle-status`);
      toast.success(`Member ${m.isActive ? 'deactivated' : 'activated'}`); load();
    } catch (err) { toast.error(getApiError(err)); }
  }

  async function removeMember(m: Membership) {
    if (!confirm(`Remove ${m.user.name} from this institute?`)) return;
    try {
      await api.delete(`/memberships/${m.id}`);
      toast.success('Member removed'); load();
    } catch (err) { toast.error(getApiError(err)); }
  }

  const roleVariant = (name: string) => {
    const map: Record<string, 'danger' | 'warning' | 'purple' | 'success' | 'info' | 'default'> = {
      INSTITUTE_ADMIN: 'danger', PRINCIPAL: 'warning', TEACHER: 'purple',
      ACCOUNTANT: 'success', CFO: 'success', HR_MANAGER: 'info', STUDENT: 'info',
    };
    return map[name] || 'default';
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AuthGuard anyPermission={['membership.view']}>
      <AppShell title="Users & Members">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><UserCog className="w-5 h-5 text-indigo-600" /> Institute Members</h2>
              <p className="text-sm text-gray-500">{total} members</p>
            </div>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Add Member</Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input type="text" placeholder="Search…" className="flex-1 text-sm outline-none bg-transparent text-gray-700"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead><tr><Th>Name</Th><Th>Email</Th><Th>Roles</Th><Th>Status</Th><Th>Joined</Th><Th>Actions</Th></tr></Thead>
                  <Tbody>
                    {members.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={6 as never}>No members found</Td></Tr>
                      : members.map(m => (
                        <Tr key={m.id}>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{m.user?.name?.[0]}</div>
                              <span className="font-medium text-gray-900">{m.user?.name}</span>
                            </div>
                          </Td>
                          <Td className="text-gray-500 text-sm">{m.user?.email}</Td>
                          <Td>
                            <div className="flex flex-wrap gap-1">
                              {(m.roles || []).map(r => <Badge key={r.id} variant={roleVariant(r.name)}>{r.displayName}</Badge>)}
                            </div>
                          </Td>
                          <Td>{m.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Inactive</Badge>}</Td>
                          <Td className="text-gray-500">{formatDate(m.created_at)}</Td>
                          <Td>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditing(m); setEditRoleIds(m.roles.map(r => r.id)); setEditOpen(true); }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => toggleStatus(m)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                                {m.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button onClick={() => removeMember(m)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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

        {/* Add Member Modal */}
        <Modal open={open} onClose={() => setOpen(false)} title="Add Member" size="md">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <Input label="Email *" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              <Input label="Password *" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required hint="Min 8 chars" />
              <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Assign Roles *</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {roles.map(r => (
                  <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                    <input type="checkbox" checked={form.roleIds.includes(r.id)}
                      onChange={() => toggleRole(r.id, form.roleIds, ids => setForm(p => ({ ...p, roleIds: ids })))}
                      className="w-4 h-4 rounded text-indigo-600" />
                    <span className="text-gray-700">{r.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add Member</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Roles Modal */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit Roles — ${editing?.user?.name}`} size="sm">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {roles.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                  <input type="checkbox" checked={editRoleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id, editRoleIds, setEditRoleIds)}
                    className="w-4 h-4 rounded text-indigo-600" />
                  <span className="text-gray-700">{r.displayName}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleEditSave} loading={saving}>Save Roles</Button>
            </div>
          </div>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}
