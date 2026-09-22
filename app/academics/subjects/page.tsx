'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, FileText, User, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface Subject { id: string; name: string; code: string; type: string; }
interface Teacher { id: string; name: string; employeeCode?: string; designation?: string; }

export default function SubjectsPage() {
  const ctx     = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState<Subject | null>(null);
  const [form,     setForm]     = useState({ name: '', code: '', type: 'theory' });
  const [saving,   setSaving]   = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [sr, tr] = await Promise.all([
        api.get('/academics/subjects'),
        api.get('/employees/teachers/list').catch(() => ({ data: { data: [] } })),
      ]);
      setSubjects(sr.data.data || []);
      setTeachers(tr.data.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd()          { setEditing(null); setForm({ name: '', code: '', type: 'theory' }); setOpen(true); }
  function openEdit(s: Subject) {
    setEditing(s);
    setForm({ name: s.name, code: s.code || '', type: s.type || 'theory' });
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/academics/subjects/${editing.id}`, form);
      else         await api.post('/academics/subjects', form);
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
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Subjects
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {subjects.length} subjects &mdash; {teachers.length} eligible teachers
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/academics/class-subjects"
                className="flex items-center gap-1.5 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                <BookOpen className="w-4 h-4" /> Assign to Classes
              </Link>
              {isAdmin && (
                <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Subject</Button>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-2">Academic Setup</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
              {[
                { step: '1', label: 'Create subjects here', done: subjects.length > 0 },
                { step: '2', label: 'Assign subjects to classes with a default teacher', done: false },
                { step: '3', label: 'Assign section-level teachers per subject', done: false },
              ].map(s => (
                <div key={s.step} className={`flex items-center gap-2 p-2 rounded-xl ${s.done ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.done ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'}`}>{s.step}</span>
                  <span>{s.label}</span>
                  {s.done && <span className="ml-auto text-green-600">&#10003;</span>}
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Name</Th><Th>Code</Th><Th>Type</Th>
                      {isAdmin && <Th>Actions</Th>}
                    </tr>
                  </Thead>
                  <Tbody>
                    {subjects.length === 0 ? (
                      <Tr>
                        <Td className="text-center text-gray-400 py-8" colSpan={isAdmin ? 4 : 3}>
                          No subjects yet{isAdmin && (
                            <> &mdash; <button onClick={openAdd} className="text-indigo-600 hover:underline">add the first one</button></>
                          )}
                        </Td>
                      </Tr>
                    ) : subjects.map(s => (
                      <Tr key={s.id}>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {s.name[0]}
                            </div>
                            <span className="font-medium text-gray-900">{s.name}</span>
                          </div>
                        </Td>
                        <Td className="text-gray-500 font-mono text-xs">{s.code || '--'}</Td>
                        <Td><Badge variant={typeVariant(s.type)}>{s.type}</Badge></Td>
                        {isAdmin && (
                          <Td>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => del(s)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

          {teachers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-indigo-500" /> Eligible Teachers ({teachers.length})
                </CardTitle>
                <p className="text-xs text-gray-400">These teachers can be assigned to subjects in class setup</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {teachers.map(t => (
                    <div key={t.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{t.name}</p>
                        {t.designation && <p className="text-xs text-gray-400">{t.designation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {isAdmin && (
          <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Subject Name *" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Mathematics" />
              <Input label="Subject Code" value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. MATH"
                hint="Short identifier used in timetables" />
              <Select label="Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                options={[
                  { value: 'theory',    label: 'Theory' },
                  { value: 'practical', label: 'Practical' },
                  { value: 'elective',  label: 'Elective' },
                ]} />
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1">Teacher Assignment</p>
                <p>To assign a teacher to this subject for a specific class, go to <strong>Assign to Classes</strong> after creating the subject.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Add Subject'}</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
