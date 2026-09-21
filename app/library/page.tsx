'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import api from '@/lib/api';
import { getAuthContext, hasPermission } from '@/lib/auth';
import { getApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BookMarked, BookOpen, Users, RefreshCw, Plus,
  TrendingUp, GraduationCap, Search, Trash2,
} from 'lucide-react';

interface LibraryStats { totalStudents: number; totalEmployees: number; totalTeachers: number; }
interface Book {
  id: string; title: string; author: string;
  isbn?: string; category?: string;
  total_copies: number; available_copies: number;
}

export default function LibraryPage() {
  const ctx       = getAuthContext();
  const canAdd    = hasPermission('library.book.create', ctx);
  const canDelete = hasPermission('library.book.delete', ctx);
  const canIssue  = hasPermission('library.issue.create', ctx);
  const canReturn = hasPermission('library.return.create', ctx);

  const [stats,   setStats]   = useState<LibraryStats | null>(null);
  const [books,   setBooks]   = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [form,    setForm]    = useState({ title: '', author: '', isbn: '', category: '', total_copies: '1' });
  const [saving,  setSaving]  = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        api.get('/institute/dashboard-stats'),
        api.get('/library/books').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(sRes.data.data);
      setBooks(bRes.data.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const totalMembers   = (stats?.totalStudents ?? 0) + (stats?.totalEmployees ?? 0);
  const studentMembers = stats?.totalStudents  ?? 0;
  const staffMembers   = stats?.totalEmployees ?? 0;

  const filteredBooks = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/library/books', {
        ...form,
        total_copies: parseInt(form.total_copies) || 1,
      });
      toast.success('Book added to catalogue');
      setAddOpen(false);
      setForm({ title: '', author: '', isbn: '', category: '', total_copies: '1' });
      const r = await api.get('/library/books');
      setBooks(r.data.data || []);
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function deleteBook(id: string) {
    if (!confirm('Delete this book?')) return;
    try {
      await api.delete(`/library/books/${id}`);
      toast.success('Book deleted');
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (err) { toast.error(getApiError(err)); }
  }

  return (
    <AuthGuard anyPermission={['library.book.view']}>
      <AppShell title="Library">
        <div className="space-y-6">

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-cyan-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5" /> Library Management
              </h2>
              <p className="text-cyan-100 text-sm mt-0.5">
                Manage books, members, issuances and returns
              </p>
            </div>
            {canAdd && (
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 bg-white text-cyan-700 hover:bg-cyan-50 font-semibold text-sm px-4 py-2 rounded-xl shadow transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Book
              </button>
            )}
          </div>

          {/* ── Stats ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Books',      value: loading ? '…' : books.length,                                         icon: BookOpen,      color: 'bg-cyan-50 text-cyan-600' },
              { label: 'Student Members',  value: loading ? '…' : studentMembers,                                       icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Staff Members',    value: loading ? '…' : staffMembers,                                          icon: Users,         color: 'bg-purple-50 text-purple-600' },
              { label: 'Books Available',  value: loading ? '…' : books.reduce((s, b) => s + (b.available_copies || 0), 0), icon: TrendingUp,   color: 'bg-green-50 text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-xl ${s.color.split(' ')[0]}`}>
                  <s.icon className={`w-5 h-5 ${s.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Access control info ──────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-cyan-500" /> Who can manage library?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { action: 'Add / Edit / Delete Books', roles: 'Librarian, Institute Admin, Super Admin', color: 'bg-cyan-50 border-cyan-200' },
                  { action: 'Issue Books to Members',    roles: 'Librarian',                              color: 'bg-orange-50 border-orange-200' },
                  { action: 'Process Book Returns',      roles: 'Librarian',                              color: 'bg-green-50 border-green-200' },
                ].map(row => (
                  <div key={row.action} className={`border rounded-xl p-3 ${row.color}`}>
                    <p className="font-semibold text-gray-800 text-xs mb-1">{row.action}</p>
                    <p className="text-gray-500 text-xs">{row.roles}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Books catalogue ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-500" /> Books Catalogue
                {books.length > 0 && <Badge variant="info">{books.length} books</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or author…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="text-sm outline-none bg-transparent text-gray-700 w-44"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : books.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-500 font-medium">No books in catalogue yet</p>
                  {canAdd
                    ? <button onClick={() => setAddOpen(true)} className="mt-3 text-sm text-cyan-600 hover:underline font-medium">+ Add the first book</button>
                    : <p className="text-xs text-gray-400 mt-1">Contact your Librarian or Admin to add books</p>}
                </div>
              ) : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Title</Th><Th>Author</Th><Th>ISBN</Th><Th>Category</Th>
                      <Th>Total</Th><Th>Available</Th>
                      {canDelete && <Th>Actions</Th>}
                    </tr>
                  </Thead>
                  <Tbody>
                    {filteredBooks.map(b => (
                      <Tr key={b.id}>
                        <Td className="font-medium text-gray-900">{b.title}</Td>
                        <Td className="text-gray-600">{b.author}</Td>
                        <Td className="text-gray-400 text-xs font-mono">{b.isbn || '—'}</Td>
                        <Td>{b.category ? <Badge variant="default">{b.category}</Badge> : '—'}</Td>
                        <Td className="text-gray-600">{b.total_copies}</Td>
                        <Td>
                          <Badge variant={b.available_copies > 0 ? 'success' : 'danger'}>
                            {b.available_copies}
                          </Badge>
                        </Td>
                        {canDelete && (
                          <Td>
                            <button
                              onClick={() => deleteBook(b.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* ── Quick action tiles ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Issue a Book',   desc: 'Issue a book to a registered member',    icon: TrendingUp, color: 'border-orange-200 bg-orange-50/60', show: canIssue },
              { title: 'Return a Book',  desc: 'Process book return and update records',  icon: RefreshCw,  color: 'border-green-200 bg-green-50/60',   show: canReturn },
              { title: 'All Members',    desc: `${totalMembers} potential library members`, icon: Users,    color: 'border-indigo-200 bg-indigo-50/60', show: true },
            ].filter(a => a.show).map(a => (
              <Card key={a.title} className={`border-2 ${a.color} cursor-pointer hover:shadow-md transition-all`}>
                <CardContent className="py-5">
                  <div className="flex items-center gap-3 mb-2">
                    <a.icon className="w-5 h-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Add Book Modal ────────────────────────────────────────────────── */}
        {canAdd && (
          <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Book to Catalogue" size="md">
            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Title *" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                <Input label="Author *" value={form.author}
                  onChange={e => setForm(p => ({ ...p, author: e.target.value }))} required />
                <Input label="ISBN" value={form.isbn}
                  onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))} placeholder="978-..." />
                <Input label="Category" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Science" />
                <Input label="Total Copies *" type="number" value={form.total_copies}
                  onChange={e => setForm(p => ({ ...p, total_copies: e.target.value }))} min="1" required />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" loading={saving}>Add Book</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
