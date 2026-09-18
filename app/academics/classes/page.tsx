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
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';

interface Class { id: string; name: string; level: number; }

export default function ClassesPage() {
  const user = getUser();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/academics/classes'); setClasses(r.data.data); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setName(''); setLevel(''); setOpen(true); }
  function openEdit(c: Class) { setEditing(c); setName(c.name); setLevel(String(c.level || '')); setOpen(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/academics/classes/${editing.id}`, { name, level: level ? parseInt(level) : undefined });
      else await api.post('/academics/classes', { name, level: level ? parseInt(level) : undefined });
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
        <div className="space-y-5 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Classes
            </h2>
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
                      <Th>Name</Th>
                      <Th>Level</Th>
                      {isAdmin && <Th>Actions</Th>}
                    </tr>
                  </Thead>
                  <Tbody>
                    {classes.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={isAdmin ? 3 as never : 2 as never}>No classes found</Td></Tr>
                      : classes.map((c) => (
                        <Tr key={c.id}>
                          <Td className="font-medium text-gray-900">{c.name}</Td>
                          <Td className="text-gray-500">{c.level ?? '—'}</Td>
                          {isAdmin && (
                            <Td>
                              <div className="flex gap-1">
                                <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => del(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
              <Input label="Class Name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Class 10" />
              <Input label="Level / Order" type="number" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. 10" />
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
