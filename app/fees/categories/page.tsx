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
import { getApiError, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

interface FeeCategory { id: string; name: string; description: string; amount: number; frequency: string; }

export default function FeeCategoriesPage() {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', amount: '', frequency: 'monthly' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/fees/categories'); setCategories(r.data.data); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ name: '', description: '', amount: '', frequency: 'monthly' }); setOpen(true); }
  function openEdit(c: FeeCategory) { setEditing(c); setForm({ name: c.name, description: c.description || '', amount: String(c.amount), frequency: c.frequency }); setOpen(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editing) await api.put(`/fees/categories/${editing.id}`, payload);
      else await api.post('/fees/categories', payload);
      toast.success(editing ? 'Category updated' : 'Category added');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(c: FeeCategory) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try { await api.delete(`/fees/categories/${c.id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const freqVariant = (f: string) => f === 'monthly' ? 'info' : f === 'annually' ? 'success' : f === 'one_time' ? 'purple' : 'warning';

  return (
    <AuthGuard anyPermission={['fee.view']}>
      <AppShell title="Fee Categories">
        <div className="space-y-5 max-w-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Tag className="w-5 h-5 text-indigo-600" /> Fee Categories</h2>
            <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Category</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead><tr><Th>Name</Th><Th>Description</Th><Th>Amount</Th><Th>Frequency</Th><Th>Actions</Th></tr></Thead>
                  <Tbody>
                    {categories.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={5}>No categories</Td></Tr>
                      : categories.map((c) => (
                        <Tr key={c.id}>
                          <Td className="font-medium text-gray-900">{c.name}</Td>
                          <Td className="text-gray-500">{c.description || '—'}</Td>
                          <Td className="font-semibold text-gray-900">{formatCurrency(c.amount)}</Td>
                          <Td><Badge variant={freqVariant(c.frequency)}>{c.frequency.replace('_', ' ')}</Badge></Td>
                          <Td>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => del(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Category' : 'Add Fee Category'} size="sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Category Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
            <Input label="Description" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            <Input label="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} required min="0" step="0.01" />
            <Select label="Frequency" value={form.frequency} onChange={(e) => setForm(p => ({ ...p, frequency: e.target.value }))}
              options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' }, { value: 'one_time', label: 'One Time' }]} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Save' : 'Add'}</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}
