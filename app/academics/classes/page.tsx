'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';

interface Class { id: string; name: string; level: number; }

/** Auto-extract a numeric level from the class name, e.g. "Class 10" → 10 */
function extractLevel(name: string): number | undefined {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0]) : undefined;
}

export default function ClassesPage() {
  const ctx     = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/academics/classes'); setClasses(r.data.data); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd()       { setEditing(null); setName('');      setOpen(true); }
  function openEdit(c: Class) { setEditing(c);   setName(c.name); setOpen(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Class name is required'); return; }
    setSaving(true);
    try {
      // Level is auto-derived from the name — no manual input needed
      const level = extractLevel(name);
      if (editing) await api.put(`/academics/classes/${editing.id}`, { name: name.trim(), level });
      else         await api.post('/academics/classes', { name: name.trim(), level });
      toast.success(editing ? 'Class updated' : 'Class added');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(c: Class) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try { await api.delete(`/academics/classes/${c.id}`); toast.success('Class deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Classes">
        <div className="space-y-5 max-w-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Classes
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Class</Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Class Name</Th>
                      {isAdmin && <Th>Actions</Th>}
                    </tr>
                  </Thead>
                  <Tbody>
                    {classes.length === 0
                      ? <Tr>
                          <Td className="text-center text-gray-400 py-8" colSpan={isAdmin ? 2 as never : 1 as never}>
                            No classes found{isAdmin && <> — <button onClick={openAdd} className="text-indigo-600 hover:underline ml-1">add one</button></>}
                          </Td>
                        </Tr>
                      : classes.map(c => (
                        <Tr key={c.id}>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {c.level ?? c.name.match(/\d+/)?.[0] ?? c.name[0]}
                              </div>
                              <span className="font-medium text-gray-900">{c.name}</span>
                            </div>
                          </Td>
                          {isAdmin && (
                            <Td>
                              <div className="flex gap-1">
                                <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => del(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </Td>
                          )}
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Class' : 'Add Class'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Class Name *"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Class 10"
                hint="The sort order is automatically set from the number in the name"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>{editing ? 'Save' : 'Add'}</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
