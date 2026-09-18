'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';

interface Subject { id: string; name: string; code: string; type: string; }

export default function SubjectsPage() {
  const user = getUser();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: '', code: '', type: 'theory' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/academics/subjects'); setSubjects(r.data.data); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name: '', code: '', type: 'theory' }); setOpen(true); }
  function openEdit(s: Subject) { setEditing(s); setForm({ name: s.name, code: s.code || '', type: s.type || 'theory' }); setOpen(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/academics/subjects/${editing.id}`, form);
      else await api.post('/academics/subjects', form);
      toast.success(editing ? 'Subject updated' : 'Subject added');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(s: Subject) {
    if (!confirm(`Delete ${s.name}?`)) return;
    try { await api.delete(`/academics/subjects/${s.id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const typeVariant = (t: string) =>
    t === 'practical' ? 'success' : t === 'elective' ? 'purple' : 'info';

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Subjects">
        <div className="space-y-5 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Subjects
            </h2>
            {isAdmin && (
              <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Subject</Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Code</Th>
                      <Th>Type</Th>
                      {isAdmin && <Th>Actions</Th>}
                    </tr>
                  </Thead>
                  <Tbody>
                    {subjects.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={isAdmin ? 4 as never : 3 as never}>No subjects found</Td></Tr>
                      : subjects.map((s) => (
                        <Tr key={s.id}>
                          <Td className="font-medium text-gray-900">{s.name}</Td>
                          <Td className="text-gray-500 font-mono text-xs">{s.code || '—'}</Td>
                          <Td><Badge variant={typeVariant(s.type)}>{s.type}</Badge></Td>
                          {isAdmin && (
                            <Td>
                              <div className="flex gap-1">
                                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => del(s)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
          <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Subject Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              <Input label="Subject Code" value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. MATH" />
              <Select label="Type" value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                options={[{ value: 'theory', label: 'Theory' }, { value: 'practical', label: 'Practical' }, { value: 'elective', label: 'Elective' }]} />
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
