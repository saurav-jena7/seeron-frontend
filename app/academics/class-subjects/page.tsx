'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Trash2, BookOpen, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ClassItem    { id: string; name: string; level: number; }
interface SubjectItem  { id: string; name: string; code: string; type: string; }
interface TeacherItem  { id: string; name: string; employeeCode?: string; designation?: string; }
interface ClassSubject {
  id: string;
  subject: { id: string; name: string; code: string; type: string } | null;
  teacher: { id: string; name: string; employeeCode?: string } | null;
}

export default function ClassSubjectsPage() {
  const ctx     = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);

  const [classes,       setClasses]       = useState<ClassItem[]>([]);
  const [subjects,      setSubjects]      = useState<SubjectItem[]>([]);
  const [teachers,      setTeachers]      = useState<TeacherItem[]>([]);
  const [selClass,      setSelClass]      = useState('');
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [initLoad,      setInitLoad]      = useState(true);

  // Assign modal
  const [open,       setOpen]       = useState(false);
  const [form,       setForm]       = useState({ subject_id: '', teacher_id: '' });
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/academics/classes'),
      api.get('/academics/subjects'),
      api.get('/employees/teachers/list').catch(() => ({ data: { data: [] } })),
    ]).then(([cr, sr, tr]) => {
      setClasses(cr.data.data || []);
      setSubjects(sr.data.data || []);
      setTeachers(tr.data.data || []);
    }).finally(() => setInitLoad(false));
  }, []);

  useEffect(() => {
    if (!selClass) { setClassSubjects([]); return; }
    setLoading(true);
    api.get('/class-subjects', { params: { class_id: selClass } })
      .then(r => setClassSubjects(r.data.data || []))
      .catch(() => setClassSubjects([]))
      .finally(() => setLoading(false));
  }, [selClass]);

  const assignedSubjectIds = new Set(classSubjects.map(cs => cs.subject?.id));
  const availableSubjects  = subjects.filter(s => !assignedSubjectIds.has(s.id));
  const selectedClass      = classes.find(c => c.id === selClass);

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    if (!selClass)        { toast.error('Select a class first'); return; }
    if (!form.subject_id) { toast.error('Select a subject'); return; }
    setSaving(true);
    try {
      await api.post('/class-subjects', {
        class_id:   selClass,
        subject_id: form.subject_id,
        teacher_id: form.teacher_id || undefined,
      });
      toast.success('Subject assigned to class');
      setOpen(false);
      setForm({ subject_id: '', teacher_id: '' });
      // Refresh
      const r = await api.get('/class-subjects', { params: { class_id: selClass } });
      setClassSubjects(r.data.data || []);
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function handleUpdateTeacher(csId: string, teacherId: string) {
    try {
      await api.put(`/class-subjects/${csId}`, { teacher_id: teacherId || null });
      toast.success('Teacher updated');
      const r = await api.get('/class-subjects', { params: { class_id: selClass } });
      setClassSubjects(r.data.data || []);
    } catch (err) { toast.error(getApiError(err)); }
  }

  async function handleRemove(csId: string, subjectName: string) {
    if (!confirm(`Remove "${subjectName}" from this class?`)) return;
    try {
      await api.delete(`/class-subjects/${csId}`);
      toast.success('Removed');
      setClassSubjects(prev => prev.filter(cs => cs.id !== csId));
    } catch (err) { toast.error(getApiError(err)); }
  }

  const typeVariant = (t: string) =>
    t === 'practical' ? 'success' : t === 'elective' ? 'purple' : 'info';

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Class Subjects">
        <div className="space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link href="/academics/subjects"
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> Assign Subjects to Classes
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Step 1 of Academic Setup — assign subjects and their teachers per class</p>
              </div>
            </div>
          </div>

          {/* Spec guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">📋 Rules (per spec)</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
              <li>Subject must be created before assigning to a class</li>
              <li>Assign an active Teacher to each Class Subject</li>
              <li>Teacher must belong to this institute</li>
              <li>A Teacher may teach multiple Subjects</li>
              <li>No duplicate subject–class assignments</li>
            </ul>
          </div>

          {/* Class selector */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                  <select value={selClass} onChange={e => setSelClass(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">— Select a class —</option>
                    {initLoad ? <option disabled>Loading…</option> : classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {selClass && isAdmin && (
                  <button onClick={() => { setForm({ subject_id: '', teacher_id: '' }); setOpen(true); }}
                    disabled={availableSubjects.length === 0}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" />
                    {availableSubjects.length === 0 ? 'All subjects assigned' : 'Assign Subject'}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Class subjects table */}
          {selClass && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  {selectedClass?.name} — Assigned Subjects
                  <Badge variant="info">{classSubjects.length}</Badge>
                </CardTitle>
                <p className="text-xs text-gray-400">
                  {availableSubjects.length} subject{availableSubjects.length !== 1 ? 's' : ''} still unassigned
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : classSubjects.length === 0 ? (
                  <div className="py-10 text-center">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-gray-500 text-sm">No subjects assigned to this class yet</p>
                    {isAdmin && availableSubjects.length > 0 && (
                      <button onClick={() => setOpen(true)} className="mt-2 text-sm text-indigo-600 hover:underline font-medium">
                        + Assign the first subject
                      </button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Subject</Th>
                        <Th>Code</Th>
                        <Th>Type</Th>
                        <Th>Assigned Teacher</Th>
                        {isAdmin && <Th>Actions</Th>}
                      </tr>
                    </Thead>
                    <Tbody>
                      {classSubjects.map(cs => (
                        <Tr key={cs.id}>
                          <Td>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                                {cs.subject?.name?.[0] ?? '?'}
                              </div>
                              <span className="font-medium text-gray-900">{cs.subject?.name ?? '—'}</span>
                            </div>
                          </Td>
                          <Td className="text-gray-500 font-mono text-xs">{cs.subject?.code || '—'}</Td>
                          <Td>
                            {cs.subject?.type && (
                              <Badge variant={typeVariant(cs.subject.type)}>{cs.subject.type}</Badge>
                            )}
                          </Td>
                          <Td>
                            {isAdmin ? (
                              /* Inline teacher selector */
                              <select
                                value={cs.teacher?.id || ''}
                                onChange={e => handleUpdateTeacher(cs.id, e.target.value)}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 max-w-[180px]"
                              >
                                <option value="">— No teacher —</option>
                                {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            ) : (
                              cs.teacher ? (
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-sm text-gray-700">{cs.teacher.name}</span>
                                </div>
                              ) : <span className="text-xs text-gray-400 italic">Not assigned</span>
                            )}
                          </Td>
                          {isAdmin && (
                            <Td>
                              <button
                                onClick={() => handleRemove(cs.id, cs.subject?.name || '')}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove from class"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assign Subject Modal */}
        {isAdmin && (
          <Modal open={open} onClose={() => setOpen(false)} title={`Assign Subject to ${selectedClass?.name || 'Class'}`} size="sm">
            <form onSubmit={handleAssign} className="space-y-4">
              <Select
                label="Subject *"
                value={form.subject_id}
                onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}
                options={availableSubjects.map(s => ({ value: s.id, label: `${s.name}${s.code ? ' (' + s.code + ')' : ''}` }))}
                placeholder="Select subject"
                required
              />
              <div>
                <Select
                  label="Assign Teacher (optional)"
                  value={form.teacher_id}
                  onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
                  options={teachers.map(t => ({ value: t.id, label: `${t.name}${t.designation ? ' — ' + t.designation : ''}` }))}
                  placeholder="No teacher (assign later)"
                />
                <p className="text-xs text-gray-400 mt-1">Teacher must belong to this institute and be marked as a teacher</p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>Assign Subject</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
