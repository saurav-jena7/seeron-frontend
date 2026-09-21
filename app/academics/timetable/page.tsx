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
import { Plus, Trash2, Clock } from 'lucide-react';

interface NamedRef { id: string; name: string; }

interface TTEntry {
  id: string;
  subject: NamedRef | null;
  teacher: NamedRef | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  section: NamedRef | null;
}
interface Class { id: string; name: string; }
interface Subject { id: string; name: string; }
interface Teacher { id: string; name: string; }
interface Section { id: string; name: string; class: NamedRef | null; }

export default function TimetablePage() {
  const ctx = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);
  const [entries, setEntries] = useState<TTEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selClass, setSelClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    class_id: '', section_id: '', subject_id: '', teacher_id: '',
    day_of_week: '1', start_time: '08:00', end_time: '09:00', room: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/academics/classes'),
      api.get('/academics/subjects'),
      api.get('/employees/teachers/list'),
      api.get('/academics/sections'),
    ]).then(([cr, sr, tr, secr]) => {
      setClasses(cr.data.data);
      setSubjects(sr.data.data);
      setTeachers(tr.data.data);
      setSections(secr.data.data);
    });
  }, []);

  useEffect(() => {
    if (!selClass) return;
    setLoading(true);
    api.get('/academics/timetable', { params: { class_id: selClass } })
      .then((r) => setEntries(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selClass]);

  const grouped = DAYS.reduce((acc, day, i) => {
    acc[i + 1] = entries.filter((e) => e.day_of_week === i + 1);
    return acc;
  }, {} as Record<number, TTEntry[]>);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/academics/timetable', {
        ...form,
        day_of_week: parseInt(form.day_of_week),
        section_id: form.section_id || undefined,
        teacher_id: form.teacher_id || undefined,
      });
      toast.success('Entry added');
      setOpen(false);
      if (selClass) {
        const r = await api.get('/academics/timetable', { params: { class_id: selClass } });
        setEntries(r.data.data);
      }
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm('Remove this entry?')) return;
    try {
      await api.delete(`/academics/timetable/${id}`);
      setEntries((p) => p.filter((e) => e.id !== id));
      toast.success('Removed');
    } catch (err) { toast.error(getApiError(err)); }
  }

  // sections for the selected class — match via populated class.id
  const filteredSections = sections.filter(
    (s) => s.class?.id === (form.class_id || selClass)
  );
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Timetable">
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" /> Timetable
            </h2>
            <div className="flex items-center gap-3">
              <Select value={selClass} onChange={(e) => setSelClass(e.target.value)}
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select class…" className="w-44" />
              {isAdmin && (
                <Button onClick={() => setOpen(true)} disabled={!selClass}>
                  <Plus className="w-4 h-4" /> Add Entry
                </Button>
              )}
            </div>
          </div>

          {!selClass ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                Select a class to view timetable
              </CardContent>
            </Card>
          ) : loading ? <Spinner /> : (
            <div className="space-y-4">
              {DAYS.map((day, i) => (
                <Card key={day}>
                  <CardHeader><CardTitle>{day}</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    {(grouped[i + 1] || []).length === 0 ? (
                      <p className="text-sm text-gray-400 px-6 py-3">No periods</p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {(grouped[i + 1] || []).map((e) => (
                          <div key={e.id} className="flex items-center justify-between px-6 py-3">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-mono text-indigo-600 w-24">
                                {e.start_time}–{e.end_time}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {e.subject?.name ?? '—'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {e.teacher?.name ?? 'No teacher'}
                                  {e.room ? ` · Room ${e.room}` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => del(e.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              style={{ visibility: isAdmin ? 'visible' : 'hidden' }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
        <Modal open={open} onClose={() => setOpen(false)} title="Add Timetable Entry" size="md">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Select label="Class" value={form.class_id || selClass} onChange={(e) => f('class_id', e.target.value)}
                options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" required />
              <Select label="Section (opt)" value={form.section_id} onChange={(e) => f('section_id', e.target.value)}
                options={filteredSections.map((s) => ({ value: s.id, label: s.name }))} placeholder="All sections" />
              <Select label="Subject" value={form.subject_id} onChange={(e) => f('subject_id', e.target.value)}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select subject" required />
              <Select label="Teacher (opt)" value={form.teacher_id} onChange={(e) => f('teacher_id', e.target.value)}
                options={teachers.map((t) => ({ value: t.id, label: t.name }))} placeholder="None" />
              <Select label="Day" value={form.day_of_week} onChange={(e) => f('day_of_week', e.target.value)}
                options={DAYS.map((d, i) => ({ value: String(i + 1), label: d }))} />
              <Input label="Room (opt)" value={form.room} onChange={(e) => f('room', e.target.value)} placeholder="e.g. 101" />
              <Input label="Start Time" type="time" value={form.start_time} onChange={(e) => f('start_time', e.target.value)} required />
              <Input label="End Time" type="time" value={form.end_time} onChange={(e) => f('end_time', e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add</Button>
            </div>
          </form>
        </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}

