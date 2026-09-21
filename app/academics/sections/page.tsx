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
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  class: { id: string; name: string } | null;
  capacity: number;
  teacher: { id: string; name: string } | null;
}
interface Class { id: string; name: string; }
interface Teacher { id: string; name: string; }

export default function SectionsPage() {
  const ctx = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);

  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState({ name: '', class_id: '', capacity: '40', teacher_id: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [sr, cr, tr] = await Promise.all([
        api.get('/academics/sections'),
        api.get('/academics/classes'),
        api.get('/employees/teachers/list'),
      ]);
      setSections(sr.data.data); setClasses(cr.data.data); setTeachers(tr.data.data);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name: '', class_id: '', capacity: '40', teacher_id: '' }); setOpen(true); }
  function openEdit(s: Section) {
    setEditing(s);
    setForm({ name: s.name, class_id: s.class?.id || '', capacity: String(s.capacity), teacher_id: s.teacher?.id || '' });
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, capacity: parseInt(form.capacity), teacher_id: form.teacher_id || undefined };
      if (editing) await api.put(`/academics/sections/${editing.id}`, payload);
      else await api.post('/academics/sections', payload);
      toast.success(editing ? 'Section updated' : 'Section added');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(s: Section) {
    if (!confirm(`Delete section ${s.name}?`)) return;
    try { await api.delete(`/academics/sections/${s.id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Sections">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Sections
            </h2>
            {isAdmin && (
              <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Section</Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Section</Th>
                      <Th>Class</Th>
                      <Th>Capacity</Th>
                      <Th>Class Teacher</Th>
                      {isAdmin && <Th>Actions</Th>}
                    </tr>
                  </Thead>
                  <Tbody>
                    {sections.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={isAdmin ? 5 as never : 4 as never}>No sections found</Td></Tr>
                      : sections.map((s) => (
                        <Tr key={s.id}>
                          <Td className="font-medium text-gray-900">{s.class?.name ?? '—'} — {s.name}</Td>
                          <Td className="text-gray-600">{s.class?.name ?? '—'}</Td>
                          <Td className="text-gray-600">{s.capacity}</Td>
                          <Td className="text-gray-600">{s.teacher?.name || '—'}</Td>
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
          <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Section' : 'Add Section'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select label="Class" value={form.class_id} onChange={(e) => f('class_id', e.target.value)} required
                options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" />
              <Input label="Section Name" value={form.name} onChange={(e) => f('name', e.target.value)} required placeholder="e.g. A" />
              <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => f('capacity', e.target.value)} />
              <Select label="Class Teacher (optional)" value={form.teacher_id} onChange={(e) => f('teacher_id', e.target.value)}
                options={teachers.map((t) => ({ value: t.id, label: t.name }))} placeholder="None" />
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

