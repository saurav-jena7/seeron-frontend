'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react';

interface AcademicYear {
  id: string; name: string; start_date: string; end_date: string; is_current: boolean;
}

export default function AcademicYearsPage() {
  const ctx = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', is_current: false });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/academics/years'); setYears(r.data.data); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name: '', start_date: '', end_date: '', is_current: false }); setOpen(true); }
  function openEdit(y: AcademicYear) {
    setEditing(y);
    setForm({ name: y.name, start_date: y.start_date, end_date: y.end_date, is_current: !!y.is_current });
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/academics/years/${editing.id}`, form);
      else await api.post('/academics/years', form);
      toast.success(editing ? 'Year updated' : 'Year added');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(y: AcademicYear) {
    if (!confirm(`Delete ${y.name}?`)) return;
    try { await api.delete(`/academics/years/${y.id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  return (
    <AuthGuard anyPermission={['academic.view']}>
      <AppShell title="Academic Years">
        <div className="space-y-5 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Academic Years
            </h2>
            {isAdmin && (
              <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Year</Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Start</Th>
                      <Th>End</Th>
                      <Th>Status</Th>
                      {isAdmin && <Th>Actions</Th>}
                    </tr>
                  </Thead>
                  <Tbody>
                    {years.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={isAdmin ? 5 as never : 4 as never}>No academic years</Td></Tr>
                      : years.map((y) => (
                        <Tr key={y.id}>
                          <Td className="font-medium text-gray-900">{y.name}</Td>
                          <Td className="text-gray-600">{formatDate(y.start_date)}</Td>
                          <Td className="text-gray-600">{formatDate(y.end_date)}</Td>
                          <Td>
                            {y.is_current
                              ? <Badge variant="success">Current</Badge>
                              : <Badge variant="default">Inactive</Badge>}
                          </Td>
                          {isAdmin && (
                            <Td>
                              <div className="flex gap-1">
                                <button onClick={() => openEdit(y)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => del(y)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
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
          <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Academic Year' : 'Add Academic Year'} size="sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Year Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. 2025-2026" />
              <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))} required />
              <Input label="End Date" type="date" value={form.end_date} onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))} required />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.is_current} onChange={(e) => setForm(p => ({ ...p, is_current: e.target.checked }))} className="w-4 h-4 rounded text-indigo-600" />
                Set as current year
              </label>
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

