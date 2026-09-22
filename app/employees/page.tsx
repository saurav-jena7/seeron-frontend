'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';

interface Employee {
  id: string; name: string; employee_code: string; designation: string;
  department: string; gender: string; dob: string; joining_date: string;
  phone: string; email: string; address: string;
  salary: number; employment_type: string; is_teacher: number;
}

const emptyForm = {
  name: '', employee_code: '', designation: '', department: '',
  gender: '', dob: '', joining_date: '', phone: '', email: '',
  address: '', salary: '', employment_type: 'full_time', is_teacher: false,
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<Employee | null>(null);
  const [form,      setForm]      = useState({ ...emptyForm });
  const [saving,    setSaving]    = useState(false);
  const limit = 15;

  async function fetchEmployees() {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', { params: { page, limit, search: search || undefined } });
      setEmployees(data.data || []);
      setTotal(data.meta.total);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchEmployees(); }, [page, search]);

  function openAdd() { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); }
  function openEdit(emp: Employee) {
    setEditing(emp);
    setForm({
      name:            emp.name,
      employee_code:   emp.employee_code   || '',
      designation:     emp.designation     || '',
      department:      emp.department      || '',
      gender:          emp.gender          || '',
      dob:             emp.dob             || '',
      joining_date:    emp.joining_date    || '',
      phone:           emp.phone           || '',
      email:           emp.email           || '',
      address:         emp.address         || '',
      salary:          emp.salary?.toString() || '',
      employment_type: emp.employment_type || 'full_time',
      is_teacher:      !!emp.is_teacher,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, salary: form.salary ? parseFloat(form.salary) : undefined };
      if (editing) {
        await api.put(`/employees/${editing.id}`, payload);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', payload);
        toast.success('Employee added');
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(`Delete ${emp.name}?`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (err) { toast.error(getApiError(err)); }
  }

  const f = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));
  const totalPages = Math.ceil(total / limit);

  return (
    <AuthGuard anyPermission={['employee.view']}>
      <AppShell title="Employees">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" /> Employees
              </h2>
              <p className="text-sm text-gray-500">{total} total employees</p>
            </div>
            <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Employee</Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input type="text" placeholder="Search employees..."
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Name</Th><Th>Code</Th><Th>Designation</Th><Th>Department</Th>
                      <Th>Phone</Th><Th>Type</Th><Th>Salary</Th><Th>Role</Th><Th>Actions</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {employees.length === 0 ? (
                      <Tr><Td className="text-center text-gray-400 py-8" colSpan={9}>No employees found</Td></Tr>
                    ) : employees.map(emp => (
                      <Tr key={emp.id}>
                        <Td>
                          <div className="font-medium text-gray-900">{emp.name}</div>
                          <div className="text-xs text-gray-400">{emp.email}</div>
                        </Td>
                        <Td className="text-gray-600">{emp.employee_code || '--'}</Td>
                        <Td>{emp.designation || '--'}</Td>
                        <Td>{emp.department  || '--'}</Td>
                        <Td>{emp.phone       || '--'}</Td>
                        <Td><Badge variant="info">{emp.employment_type?.replace('_', ' ')}</Badge></Td>
                        <Td>{emp.salary ? formatCurrency(emp.salary) : '--'}</Td>
                        <Td>{emp.is_teacher ? <Badge variant="purple">Teacher</Badge> : <Badge variant="default">Staff</Badge>}</Td>
                        <Td>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(emp)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(emp)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}
          title={editing ? 'Edit Employee' : 'Add Employee'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name *" value={form.name} onChange={e => f('name', e.target.value)} required />
              <Input label="Employee Code" value={form.employee_code} onChange={e => f('employee_code', e.target.value)} />
              <Input label="Designation" value={form.designation} onChange={e => f('designation', e.target.value)} />
              <Input label="Department" value={form.department} onChange={e => f('department', e.target.value)} />
              <Select label="Gender" value={form.gender} onChange={e => f('gender', e.target.value)}
                options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
                placeholder="Select gender" />
              <Input label="Date of Birth" type="date" value={form.dob} onChange={e => f('dob', e.target.value)} />
              <Input label="Joining Date" type="date" value={form.joining_date} onChange={e => f('joining_date', e.target.value)} />
              <Input label="Phone" value={form.phone} onChange={e => f('phone', e.target.value)} />
              <Input label="Email" type="email" value={form.email} onChange={e => f('email', e.target.value)} />
              <Input label="Salary" type="number" value={form.salary} onChange={e => f('salary', e.target.value)} />
              <Select label="Employment Type" value={form.employment_type} onChange={e => f('employment_type', e.target.value)}
                options={[
                  { value: 'full_time', label: 'Full Time' },
                  { value: 'part_time', label: 'Part Time' },
                  { value: 'contract',  label: 'Contract'  },
                ]} />
            </div>
            <Input label="Address" value={form.address} onChange={e => f('address', e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.is_teacher as boolean}
                onChange={e => f('is_teacher', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600" />
              Mark as Teacher
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Add Employee'}</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}
