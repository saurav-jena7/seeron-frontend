'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, DAYS } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Trash2, Clock, Pencil } from 'lucide-react';

interface NamedRef { id: string; name: string; }

interface TTEntry {
  id: string;
  class: NamedRef | null;
  subject: NamedRef | null;
  teacher: NamedRef | null;
  section: NamedRef | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
}
interface ClassItem   { id: string; name: string; }
interface SubjectItem { id: string; name: string; }
interface TeacherItem { id: string; name: string; }
interface SectionItem { id: string; name: string; class: NamedRef | null; }

const EMPTY_FORM = {
  class_id: '', section_id: '', subject_id: '', teacher_id: '',
  day_of_week: '1', start_time: '08:00', end_time: '09:00', room: '',
};

export default function TimetablePage() {
  const ctx     = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);

  const [entries,  setEntries]  = useState<TTEntry[]>([]);
  const [classes,  setClasses]  = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selClass, setSelClass] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Modal state — shared for add & edit
  const [open,       setOpen]       = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null); // null = adding
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [saving,     setSaving]     = useState(false);

  // ── load reference data + initial entries ────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get('/academics/classes'),
      api.get('/academics/subjects'),
      api.get('/employees/teachers/list').catch(() => ({ data: { data: [] } })),
      api.get('/academics/sections'),
    ]).then(([cr, sr, tr, secr]) => {
      setClasses(cr.data.data  || []);
      setSubjects(sr.data.data || []);
      setTeachers(tr.data.data || []);
      setSections(secr.data.data || []);
    });
  }, []);

  // ── reload entries when class filter changes ──────────────────────────────
  useEffect(() => {
    setLoading(true);
    const params = selClass ? { class_id: selClass } : {};
    api.get('/academics/timetable', { params })
      .then(r => setEntries(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selClass]);

  async function reloadEntries() {
    const params = selClass ? { class_id: selClass } : {};
    const r = await api.get('/academics/timetable', { params });
    setEntries(r.data.data || []);
  }

  // ── group entries by day ──────────────────────────────────────────────────
  const grouped = DAYS.reduce((acc, _, i) => {
    acc[i + 1] = entries.filter(e => e.day_of_week === i + 1);
    return acc;
  }, {} as Record<number, TTEntry[]>);

  // sections that match the class currently selected inside the form
  const filteredSections = sections.filter(s => s.class?.id === form.class_id);

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  // ── open modal for Add ────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, class_id: selClass });
    setOpen(true);
  }

  // ── open modal for Edit ───────────────────────────────────────────────────
  function openEdit(entry: TTEntry) {
    setEditingId(entry.id);
    setForm({
      class_id:    entry.class?.id    || selClass,
      section_id:  entry.section?.id  || '',
      subject_id:  entry.subject?.id  || '',
      teacher_id:  entry.teacher?.id  || '',
      day_of_week: String(entry.day_of_week),
      start_time:  entry.start_time   || '08:00',
      end_time:    entry.end_time     || '09:00',
      room:        entry.room         || '',
    });
    setOpen(true);
  }

  // ── submit (create or update) ─────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.class_id)   { toast.error('Please select a class');   return; }
    if (!form.subject_id) { toast.error('Please select a subject'); return; }
    setSaving(true);
    try {
      const payload = {
        class_id:    form.class_id,
        subject_id:  form.subject_id,
        section_id:  form.section_id  || undefined,
        teacher_id:  form.teacher_id  || undefined,
        day_of_week: parseInt(form.day_of_week),
        start_time:  form.start_time,
        end_time:    form.end_time,
        room:        form.room        || undefined,
      };

      if (editingId) {
        await api.put(`/academics/timetable/${editingId}`, payload);
        toast.success('Entry updated');
      } else {
        await api.post('/academics/timetable', payload);
        toast.success('Entry added');
      }

      setOpen(false);
      await reloadEntries();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async function del(id: string) {
    if (!confirm('Remove this timetable entry?')) return;
    try {
      await api.delete(`/academics/timetable/${id}`);
      setEntries(p => p.filter(e => e.id !== id));
      toast.success('Removed');
    } catch (err) { toast.error(getApiError(err)); }
  }

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Timetable">
        <div className="space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Timetable
            </h2>
            <div className="flex items-center gap-3">
              <Select
                value={selClass}
                onChange={e => setSelClass(e.target.value)}
                options={classes.map(c => ({ value: c.id, label: c.name }))}
                placeholder="All classes"
                className="w-44"
              />
              {isAdmin && (
                <Button onClick={openAdd}>
                  <Plus className="w-4 h-4" /> Add Entry
                </Button>
              )}
            </div>
          </div>

          {/* Timetable grid */}
          {loading ? <Spinner /> : (
            <div className="space-y-4">
              {entries.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-400">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p>No timetable entries yet.</p>
                    {isAdmin && (
                      <button onClick={openAdd} className="mt-2 text-sm text-indigo-600 hover:underline font-medium">
                        + Add the first entry
                      </button>
                    )}
                  </CardContent>
                </Card>
              )}

              {DAYS.map((day, i) => {
                const dayEntries = grouped[i + 1] || [];
                if (dayEntries.length === 0 && !selClass) return null;
                return (
                  <Card key={day}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{day}</span>
                        <span className="text-xs font-normal text-gray-400">
                          {dayEntries.length} period{dayEntries.length !== 1 ? 's' : ''}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {dayEntries.length === 0 ? (
                        <p className="text-sm text-gray-400 px-6 py-3">No periods scheduled</p>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {dayEntries.map(e => (
                            <div key={e.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                {/* Time badge */}
                                <span className="text-xs font-mono bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg whitespace-nowrap">
                                  {e.start_time} – {e.end_time}
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {e.subject?.name ?? '—'}
                                    {/* Show class name when no class filter */}
                                    {!selClass && e.class?.name && (
                                      <span className="ml-2 text-xs font-normal text-gray-400">({e.class.name})</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {e.teacher?.name ?? 'No teacher'}
                                    {e.section?.name ? ` · Section ${e.section.name}` : ''}
                                    {e.room ? ` · Room ${e.room}` : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Actions — visible on hover for admins */}
                              {isAdmin && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEdit(e)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => del(e.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / Edit Modal */}
        {isAdmin && (
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title={editingId ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select label="Class *" value={form.class_id}
                  onChange={e => setForm(p => ({ ...p, class_id: e.target.value, section_id: '' }))}
                  options={classes.map(c => ({ value: c.id, label: c.name }))}
                  placeholder="Select class" required />

                <Select label="Section (opt)" value={form.section_id}
                  onChange={e => f('section_id', e.target.value)}
                  options={filteredSections.map(s => ({ value: s.id, label: s.name }))}
                  placeholder="All sections" />

                <Select label="Subject *" value={form.subject_id}
                  onChange={e => f('subject_id', e.target.value)}
                  options={subjects.map(s => ({ value: s.id, label: s.name }))}
                  placeholder="Select subject" required />

                <Select label="Teacher (opt)" value={form.teacher_id}
                  onChange={e => f('teacher_id', e.target.value)}
                  options={teachers.map(t => ({ value: t.id, label: t.name }))}
                  placeholder="None" />

                <Select label="Day *" value={form.day_of_week}
                  onChange={e => f('day_of_week', e.target.value)}
                  options={DAYS.map((d, i) => ({ value: String(i + 1), label: d }))} />

                <Input label="Room (opt)" value={form.room}
                  onChange={e => f('room', e.target.value)} placeholder="e.g. 101" />

                <Input label="Start Time *" type="time" value={form.start_time}
                  onChange={e => f('start_time', e.target.value)} required />

                <Input label="End Time *" type="time" value={form.end_time}
                  onChange={e => f('end_time', e.target.value)} required />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>
                  {editingId ? 'Save Changes' : 'Add Entry'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
