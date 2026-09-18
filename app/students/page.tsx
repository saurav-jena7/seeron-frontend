'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, GraduationCap, Eye } from 'lucide-react';
import Link from 'next/link';
import { getUser } from '@/lib/auth';

interface Student {
  id: string; name: string; admission_no: string; roll_no: string;
  gender: string; phone: string; email: string;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  status: string; admission_date: string;
}
interface Class { id: string; name: string; }
interface Section { id: string; name: string; class_id: string; }
interface AcademicYear { id: string; name: string; is_current: number; }

const emptyForm = {
  name: '', admission_no: '', roll_no: '', gender: '', dob: '', blood_group: '',
  phone: '', email: '', address: '', parent_name: '', parent_phone: '', parent_email: '',
  class_id: '', section_id: '', academic_year_id: '', admission_date: '', status: 'active',
};

export default function StudentsPage() {
  const user = getUser();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const limit = 15;

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/students', { params: { page, limit, search: search || undefined, class_id: filterClass || undefined } });
      setStudents(r.data.data); setTotal(r.data.meta.total);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    Promise.all([api.get('/academics/classes'), api.get('/academics/sections'), api.get('/academics/years')])
      .then(([cr, sr, yr]) => { setClasses(cr.data.data); setSections(sr.data.data); setYears(yr.data.data); });
  }, []);

  useEffect(() => { load(); }, [page, search, filterClass]);

  const filteredSections = sections.filter((s) => s.class_id === form.class_id);

  function openAdd() { setEditing(null); setForm({ ...emptyForm, academic_year_id: years.find((y) => y.is_current)?.id || '' }); setOpen(true); }
  function openEdit(s: Student) {
    setEditing(s);
    setForm({ ...emptyForm, name: s.name, admission_no: s.admission_no || '', roll_no: s.roll_no || '', gender: s.gender || '', phone: s.phone || '', email: s.email || '', class_id: s.class?.id || '', status: s.status || 'active' });
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/students/${editing.id}`, form);
      else await api.post('/students', form);
      toast.success(editing ? 'Student updated' : 'Student admitted');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(s: Student) {
    if (!confirm(`Delete student ${s.name}?`)) return;
    try { await api.delete(`/students/${s.id}`); toast.success('Student deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const totalPages = Math.ceil(total / limit);
  const statusVariant = (s: string) => s === 'active' ? 'success' : s === 'graduated' ? 'info' : s === 'transferred' ? 'warning' : 'danger';

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Students">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-indigo-600" /> Students</h2>
              <p className="text-sm text-gray-500">{total} total students</p>
            </div>
            {isAdmin && (
              <Button onClick={openAdd}><Plus className="w-4 h-4" /> Admit Student</Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 flex-wrap w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input type="text" placeholder="Search by name, admission no…" className="flex-1 text-sm outline-none bg-transparent text-gray-700"
                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <Select value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
                  options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="All classes" className="w-36" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead><tr>
                    <Th>Name</Th><Th>Admission No</Th><Th>Roll No</Th><Th>Class</Th>
                    <Th>Gender</Th><Th>Phone</Th><Th>Admitted</Th><Th>Status</Th><Th>Actions</Th>
                  </tr></Thead>
                  <Tbody>
                    {students.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={9 as never}>No students found</Td></Tr>
                      : students.map((s) => (
                        <Tr key={s.id}>
                          <Td><div className="font-medium text-gray-900">{s.name}</div><div className="text-xs text-gray-400">{s.email}</div></Td>
                          <Td className="text-gray-600 font-mono text-xs">{s.admission_no || '—'}</Td>
                          <Td className="text-gray-600">{s.roll_no || '—'}</Td>
                          <Td className="text-gray-600">{s.class?.name ? `${s.class.name}${s.section?.name ? ' – ' + s.section.name : ''}` : '—'}</Td>
                          <Td className="capitalize text-gray-600">{s.gender || '—'}</Td>
                          <Td className="text-gray-600">{s.phone || '—'}</Td>
                          <Td className="text-gray-600">{formatDate(s.admission_date)}</Td>
                          <Td><Badge variant={statusVariant(s.status)}>{s.status}</Badge></Td>
                          <Td>
                            <div className="flex gap-1">
                              <Link href={`/students/${s.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-3.5 h-3.5" /></Link>
                              {isAdmin && (
                                <>
                                  <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => del(s)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                </>
                              )}
                            </div>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
        <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Student' : 'Admit Student'} size="xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" value={form.name} onChange={(e) => f('name', e.target.value)} required />
              <Input label="Admission No" value={form.admission_no} onChange={(e) => f('admission_no', e.target.value)} />
              <Input label="Roll No" value={form.roll_no} onChange={(e) => f('roll_no', e.target.value)} />
              <Select label="Gender" value={form.gender} onChange={(e) => f('gender', e.target.value)}
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} placeholder="Select gender" />
              <Input label="Date of Birth" type="date" value={form.dob} onChange={(e) => f('dob', e.target.value)} />
              <Select label="Blood Group" value={form.blood_group} onChange={(e) => f('blood_group', e.target.value)}
                options={['A+','A-','B+','B-','O+','O-','AB+','AB-'].map((b) => ({ value: b, label: b }))} placeholder="Select" />
              <Input label="Phone" value={form.phone} onChange={(e) => f('phone', e.target.value)} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} />
            </div>
            <Input label="Address" value={form.address} onChange={(e) => f('address', e.target.value)} />

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">Academic Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Class" value={form.class_id} onChange={(e) => f('class_id', e.target.value)}
                options={classes.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select class" />
              <Select label="Section" value={form.section_id} onChange={(e) => f('section_id', e.target.value)}
                options={filteredSections.map((s) => ({ value: s.id, label: s.name }))} placeholder="Select section" />
              <Select label="Academic Year" value={form.academic_year_id} onChange={(e) => f('academic_year_id', e.target.value)}
                options={years.map((y) => ({ value: y.id, label: y.name }))} placeholder="Select year" />
              <Input label="Admission Date" type="date" value={form.admission_date} onChange={(e) => f('admission_date', e.target.value)} />
              <Select label="Status" value={form.status} onChange={(e) => f('status', e.target.value)}
                options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'graduated', label: 'Graduated' }, { value: 'transferred', label: 'Transferred' }]} />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">Parent / Guardian</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Parent Name" value={form.parent_name} onChange={(e) => f('parent_name', e.target.value)} />
              <Input label="Parent Phone" value={form.parent_phone} onChange={(e) => f('parent_phone', e.target.value)} />
              <Input label="Parent Email" type="email" value={form.parent_email} onChange={(e) => f('parent_email', e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Admit Student'}</Button>
            </div>
          </form>
        </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
