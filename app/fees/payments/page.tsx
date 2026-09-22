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
import { getApiError, formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, CreditCard } from 'lucide-react';

interface Payment {
  id: string;
  student: { id: string; name: string; admission_no: string } | null;
  fee_category: { id: string; name: string } | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  transaction_ref: string;
  collected_by: { id: string; name: string } | null;
}
interface FeeCategory { id: string; name: string; amount: number; }
interface Student { id: string; name: string; admission_no: string; }

export default function FeePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selStudent, setSelStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ student_id: '', fee_category_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash', transaction_ref: '', remarks: '' });
  const [saving, setSaving] = useState(false);
  const limit = 20;

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/fees/payments', { params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) } });
      setPayments(r.data.data); setTotal(r.data.meta.total);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    api.get('/fees/categories').then((r) => setCategories(r.data.data));
  }, [page, search]);

  async function searchStudents(q: string) {
    if (q.length < 2) { setStudentResults([]); return; }
    const r = await api.get('/students', { params: { search: q, limit: 5 } });
    setStudentResults(r.data.data);
  }

  function selectStudent(s: Student) {
    setSelStudent(s);
    setForm((p) => ({ ...p, student_id: s.id }));
    setStudentSearch(s.name);
    setStudentResults([]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.student_id) { toast.error('Select a student'); return; }
    setSaving(true);
    try {
      await api.post('/fees/payments', { ...form, amount: parseFloat(form.amount) });
      toast.success('Payment recorded');
      setOpen(false); load();
      setSelStudent(null); setStudentSearch('');
      setForm({ student_id: '', fee_category_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash', transaction_ref: '', remarks: '' });
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  const onCatChange = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    setForm((p) => ({ ...p, fee_category_id: id, amount: cat ? String(cat.amount) : p.amount }));
  };

  const totalPages = Math.ceil(total / limit);
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <AuthGuard anyPermission={['fee.view','fee.collect']}>
      <AppShell title="Fee Payments">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-600" /> Fee Payments</h2>
              <p className="text-sm text-gray-500">{total} total records</p>
            </div>
            <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" /> Record Payment</Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input type="text" placeholder="Search…" className="flex-1 text-sm outline-none bg-transparent text-gray-700"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead><tr>
                    <Th>Student</Th><Th>Category</Th><Th>Amount</Th>
                    <Th>Date</Th><Th>Method</Th><Th>Collected By</Th><Th>Status</Th>
                  </tr></Thead>
                  <Tbody>
                    {payments.length === 0
                      ? <Tr><Td className="text-center text-gray-400 py-8" colSpan={7}>No payments</Td></Tr>
                      : payments.map((p) => (
                        <Tr key={p.id}>
                          <Td>
                            <div className="font-medium text-gray-900">{p.student?.name ?? '—'}</div>
                            <div className="text-xs text-gray-400">#{p.student?.admission_no}</div>
                          </Td>
                          <Td>{p.fee_category?.name ?? '—'}</Td>
                          <Td className="font-semibold text-gray-900">{formatCurrency(p.amount)}</Td>
                          <Td className="text-gray-600">{formatDate(p.payment_date)}</Td>
                          <Td className="capitalize text-gray-600">{p.payment_method}</Td>
                          <Td className="text-gray-500">{p.collected_by?.name ?? '—'}</Td>
                          <Td><Badge variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge></Td>
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

        <Modal open={open} onClose={() => setOpen(false)} title="Record Fee Payment" size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <div className="relative">
                <input type="text" value={studentSearch} onChange={(e) => { setStudentSearch(e.target.value); searchStudents(e.target.value); }}
                  placeholder="Search by name or admission no…"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {studentResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                    {studentResults.map((s) => (
                      <button key={s.id} type="button" onClick={() => selectStudent(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex justify-between">
                        <span className="font-medium text-gray-800">{s.name}</span>
                        <span className="text-gray-400 text-xs">#{s.admission_no}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selStudent && <p className="text-xs text-green-600 mt-1">✓ {selStudent.name} selected</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select label="Fee Category" value={form.fee_category_id} onChange={(e) => onCatChange(e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder="Select category" />
              <Input label="Amount (₹) *" type="number" value={form.amount} onChange={(e) => f('amount', e.target.value)} required min="0" />
              <Input label="Payment Date *" type="date" value={form.payment_date} onChange={(e) => f('payment_date', e.target.value)} required />
              <Select label="Payment Method" value={form.payment_method} onChange={(e) => f('payment_method', e.target.value)}
                options={[{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'online', label: 'Online' }, { value: 'cheque', label: 'Cheque' }]} />
              <Input label="Transaction Ref" value={form.transaction_ref} onChange={(e) => f('transaction_ref', e.target.value)} placeholder="Optional" />
            </div>
            <Input label="Remarks" value={form.remarks} onChange={(e) => f('remarks', e.target.value)} />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Record Payment</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}
