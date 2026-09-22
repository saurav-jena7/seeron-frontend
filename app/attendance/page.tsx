'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ClipboardList, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Class { id: string; name: string; }
interface Section { id: string; name: string; class: { id: string; name: string } | null; }
interface Student { id: string; name: string; admission_no: string; roll_no: string; }

type AttStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttRecord { student_id: string; status: AttStatus; remarks: string; }

const STATUS_CONFIG: { value: AttStatus; label: string; color: string; activeColor: string }[] = [
  { value: 'present', label: 'P', color: 'border-gray-200 text-gray-600 hover:border-green-400', activeColor: 'bg-green-500 border-green-500 text-white' },
  { value: 'absent', label: 'A', color: 'border-gray-200 text-gray-600 hover:border-red-400', activeColor: 'bg-red-500 border-red-500 text-white' },
  { value: 'late', label: 'L', color: 'border-gray-200 text-gray-600 hover:border-yellow-400', activeColor: 'bg-yellow-500 border-yellow-500 text-white' },
  { value: 'excused', label: 'E', color: 'border-gray-200 text-gray-600 hover:border-blue-400', activeColor: 'bg-blue-500 border-blue-500 text-white' },
];

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selClass, setSelClass] = useState('');
  const [selSection, setSelSection] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, AttRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/academics/classes'), api.get('/academics/sections')])
      .then(([cr, sr]) => { setClasses(cr.data.data); setSections(sr.data.data); });
  }, []);

  const filteredSections = sections.filter((s) => s.class?.id === selClass);

  useEffect(() => {
    if (!selClass) return;
    setLoading(true);
    api.get('/students', { params: { class_id: selClass, section_id: selSection || undefined, limit: 100 } })
      .then((r) => {
        setStudents(r.data.data);
        const init: Record<string, AttRecord> = {};
        r.data.data.forEach((s: Student) => { init[s.id] = { student_id: s.id, status: 'present', remarks: '' }; });
        setRecords(init);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selClass, selSection]);

  // Load existing attendance for the selected date — re-runs when date, class, section, or student list changes
  useEffect(() => {
    if (!selClass || !date || students.length === 0) return;
    api.get('/attendance', { params: { class_id: selClass, section_id: selSection || undefined, date } })
      .then((r) => {
        if (r.data.data.length > 0) {
          setRecords((prev) => {
            const updated = { ...prev };
            r.data.data.forEach((a: { student: { id: string }; status: AttStatus }) => {
              const sid = a.student?.id;
              if (sid && updated[sid]) updated[sid].status = a.status;
            });
            return updated;
          });
        }
      });
  }, [date, selClass, selSection, students]);

  function setStatus(studentId: string, status: AttStatus) {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  }

  function markAll(status: AttStatus) {
    setRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => { updated[id].status = status; });
      return updated;
    });
  }

  async function handleSave() {
    if (!selClass || students.length === 0) { toast.error('Select class and load students first'); return; }
    setSaving(true);
    try {
      await api.post('/attendance/bulk', {
        date,
        class_id: selClass,
        section_id: selSection || undefined,
        records: Object.values(records),
      });
      toast.success(`Attendance saved for ${students.length} students`);
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  const counts = Object.values(records).reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <AuthGuard anyPermission={['attendance.view', 'attendance.create']}>
      <AppShell title="Attendance">
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-600" /> Mark Attendance</h2>
            <Button onClick={handleSave} loading={saving} disabled={students.length === 0}>
              <Save className="w-4 h-4" /> Save Attendance
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <Select value={selClass} onChange={(e) => { setSelClass(e.target.value); setSelSection(''); }}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" className="w-40" />
                {filteredSections.length > 0 && (
                  <Select value={selSection} onChange={(e) => setSelSection(e.target.value)}
                    options={filteredSections.map((s) => ({ value: s.id, label: s.name }))} placeholder="All sections" className="w-36" />
                )}
                {students.length > 0 && (
                  <div className="flex gap-1 ml-auto">
                    <Button variant="secondary" size="sm" onClick={() => markAll('present')}><Check className="w-3.5 h-3.5 text-green-600" /> All Present</Button>
                    <Button variant="secondary" size="sm" onClick={() => markAll('absent')}>All Absent</Button>
                  </div>
                )}
              </div>

              {students.length > 0 && (
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                  {STATUS_CONFIG.map((s) => (
                    <div key={s.value} className="flex items-center gap-1.5 text-sm">
                      <span className={cn('w-6 h-6 rounded text-xs font-bold flex items-center justify-center border', s.activeColor)}>{s.label}</span>
                      <span className="text-gray-600 capitalize">{s.value}: <strong>{counts[s.value] || 0}</strong></span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student list */}
          {loading ? <Spinner /> : !selClass ? (
            <Card><CardContent className="py-12 text-center text-gray-400">Select a class to mark attendance</CardContent></Card>
          ) : students.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-gray-400">No students in this class</CardContent></Card>
          ) : (
            <Card>
              <CardHeader><CardTitle>{students.length} Students</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {students.map((s, i) => {
                    const rec = records[s.id];
                    return (
                      <div key={s.id} className="flex items-center px-4 py-3 gap-4">
                        <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">#{s.admission_no} · Roll {s.roll_no || '—'}</p>
                        </div>
                        <div className="flex gap-1">
                          {STATUS_CONFIG.map((cfg) => (
                            <button key={cfg.value} onClick={() => setStatus(s.id, cfg.value)}
                              className={cn('w-8 h-8 rounded-lg border text-xs font-bold transition-all', rec?.status === cfg.value ? cfg.activeColor : cfg.color)}>
                              {cfg.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
