'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Shield, Lock } from 'lucide-react';

interface PermRef { id: string; name: string; resource: string; action: string; module: string; }
interface Role { id: string; name: string; display_name: string; description: string; isSystem: boolean; institute: string | null; permissions: PermRef[]; }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<PermRef[]>([]);
  const [groupedPerms, setGroupedPerms] = useState<Record<string, PermRef[]>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', displayName: '', description: '', permissions: [] as string[] });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [rr, pr] = await Promise.all([api.get('/roles'), api.get('/permissions')]);
      setRoles(rr.data.data);
      setAllPerms(pr.data.data);
      setGroupedPerms(pr.data.grouped || {});
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name: '', displayName: '', description: '', permissions: [] }); setOpen(true); }
  function openEdit(r: Role) {
    setEditing(r);
    setForm({ name: r.name, displayName: r.display_name, description: r.description || '', permissions: r.permissions.map(p => p.id) });
    setOpen(true);
  }

  function togglePerm(id: string) {
    setForm(p => ({ ...p, permissions: p.permissions.includes(id) ? p.permissions.filter(x => x !== id) : [...p.permissions, id] }));
  }

  function toggleModule(module: string) {
    const ids = (groupedPerms[module] || []).map(p => p.id);
    const allSelected = ids.every(id => form.permissions.includes(id));
    setForm(p => ({
      ...p,
      permissions: allSelected
        ? p.permissions.filter(id => !ids.includes(id))
        : [...new Set([...p.permissions, ...ids])],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/roles/${editing.id}`, { displayName: form.displayName, description: form.description, permissions: form.permissions });
      else await api.post('/roles', { name: form.name, displayName: form.displayName, description: form.description, permissions: form.permissions });
      toast.success(editing ? 'Role updated' : 'Role created');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(r: Role) {
    if (r.is_system) { toast.error('Cannot delete system roles'); return; }
    if (!confirm(`Delete role "${r.display_name}"?`)) return;
    try { await api.delete(`/roles/${r.id}`); toast.success('Role deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const modules = Object.keys(groupedPerms).sort();

  return (
    <AuthGuard anyPermission={['role.view']}>
      <AppShell title="Roles">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-600" /> Roles</h2>
              <p className="text-sm text-gray-500">{roles.length} roles</p>
            </div>
            <Button onClick={openAdd}><Plus className="w-4 h-4" /> Create Role</Button>
          </div>

          {/* Role cards */}
          {loading ? <Spinner /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(r => (
                <Card key={r.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{r.display_name}</p>
                          {r.is_system && <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"><Lock className="w-3 h-3" /> System</span>}
                        </div>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{r.name}</p>
                        {r.description && <p className="text-xs text-gray-400 mt-1">{r.description}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                        {!r.is_system && <button onClick={() => del(r)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1.5">{r.permissions.length} permissions</p>
                      <div className="flex flex-wrap gap-1">
                        {r.permissions.slice(0, 6).map(p => (
                          <span key={p.id} className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{p.name}</span>
                        ))}
                        {r.permissions.length > 6 && <span className="text-xs text-gray-400">+{r.permissions.length - 6} more</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit Role Modal */}
        <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit: ${editing.display_name}` : 'Create Role'} size="xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {!editing && <Input label="Role ID (uppercase)" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value.toUpperCase().replace(/\s+/g, '_') }))} required placeholder="e.g. EXAM_COORDINATOR" />}
              <Input label="Display Name *" value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} required placeholder="e.g. Exam Coordinator" />
              <Input label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
            </div>

            {/* Permission selector grouped by module */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Permissions ({form.permissions.length} selected)</p>
                <button type="button" onClick={() => setForm(p => ({ ...p, permissions: p.permissions.length === allPerms.length ? [] : allPerms.map(x => x.id) }))}
                  className="text-xs text-indigo-600 hover:underline">
                  {form.permissions.length === allPerms.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                {modules.map(module => {
                  const perms = groupedPerms[module] || [];
                  const allSel = perms.every(p => form.permissions.includes(p.id));
                  const someSel = perms.some(p => form.permissions.includes(p.id));
                  return (
                    <div key={module} className="border-b border-gray-100 last:border-0">
                      <button type="button" onClick={() => toggleModule(module)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{module}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{perms.filter(p => form.permissions.includes(p.id)).length}/{perms.length}</span>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${allSel ? 'bg-indigo-600 border-indigo-600' : someSel ? 'bg-indigo-200 border-indigo-400' : 'border-gray-300'}`}>
                            {(allSel || someSel) && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                        </div>
                      </button>
                      <div className="grid grid-cols-2 gap-1 px-4 py-2">
                        {perms.map(p => (
                          <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                            <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={() => togglePerm(p.id)} className="w-3.5 h-3.5 rounded text-indigo-600" />
                            <span className="text-gray-700 font-mono">{p.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Create Role'}</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}

