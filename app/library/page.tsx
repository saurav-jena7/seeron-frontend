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
import Select from '@/components/ui/Select';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import api from '@/lib/api';
import { getAuthContext, hasPermission } from '@/lib/auth';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BookMarked, BookOpen, Users, RefreshCw, Plus, Pencil,
  TrendingUp, GraduationCap, Search, Trash2, RotateCcw,
} from 'lucide-react';

interface LibraryStats { totalBooks: number; totalCopies: number; availableCopies: number; issuedCopies: number; }
interface Book {
  id: string; title: string; author: string;
  isbn?: string; category?: string;
  total_copies: number; available_copies: number;
}
interface Issue {
  id: string;
  book: { id: string; title: string; author: string; isbn?: string } | null;
  member_type: string; member_name: string;
  issue_date: string; due_date: string; return_date?: string; status: string;
}
interface Student { id: string; name: string; admission_no: string; }

type TabType = 'books' | 'issues';

export default function LibraryPage() {
  const ctx       = getAuthContext();
  const canAdd    = hasPermission('library.book.create', ctx);
  const canEdit   = hasPermission('library.book.update', ctx) || canAdd;
  const canDelete = hasPermission('library.book.delete', ctx);
  const canIssue  = hasPermission('library.book.view', ctx);  // issue uses view permission on backend

  const [tab,     setTab]     = useState<TabType>('books');
  const [stats,   setStats]   = useState<LibraryStats | null>(null);
  const [books,   setBooks]   = useState<Book[]>([]);
  const [issues,  setIssues]  = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  // ── Add/Edit Book modal ───────────────────────────────────────────────────
  const [bookOpen,    setBookOpen]    = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm,    setBookForm]    = useState({ title: '', author: '', isbn: '', category: '', total_copies: '1' });
  const [bookSaving,  setBookSaving]  = useState(false);

  // ── Issue Book modal ──────────────────────────────────────────────────────
  const [issueOpen,       setIssueOpen]       = useState(false);
  const [issueForm,       setIssueForm]       = useState({
    book_id: '', member_type: 'student', member_id: '', member_name: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; })(),
  });
  const [issueSaving,     setIssueSaving]     = useState(false);
  const [studentSearch,   setStudentSearch]   = useState('');
  const [studentResults,  setStudentResults]  = useState<Student[]>([]);
  const [selStudent,      setSelStudent]      = useState<Student | null>(null);

  // ── Return modal ──────────────────────────────────────────────────────────
  const [returnOpen,      setReturnOpen]      = useState(false);
  const [returningIssue,  setReturningIssue]  = useState<Issue | null>(null);
  const [returnDate,      setReturnDate]      = useState(new Date().toISOString().split('T')[0]);
  const [returnSaving,    setReturnSaving]    = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [sRes, bRes, iRes] = await Promise.all([
        api.get('/library/stats').catch(() => ({ data: { data: { totalBooks: 0, totalCopies: 0, availableCopies: 0, issuedCopies: 0 } } })),
        api.get('/library/books').catch(() => ({ data: { data: [] } })),
        api.get('/library/issues').catch(() => ({ data: { data: [] } })),
      ]);
      setStats(sRes.data.data);
      setBooks(bRes.data.data || []);
      setIssues(iRes.data.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // ── Book helpers ──────────────────────────────────────────────────────────
  function openAddBook() {
    setEditingBook(null);
    setBookForm({ title: '', author: '', isbn: '', category: '', total_copies: '1' });
    setBookOpen(true);
  }
  function openEditBook(b: Book) {
    setEditingBook(b);
    setBookForm({ title: b.title, author: b.author, isbn: b.isbn || '', category: b.category || '', total_copies: String(b.total_copies) });
    setBookOpen(true);
  }

  async function handleBookSave(e: React.FormEvent) {
    e.preventDefault(); setBookSaving(true);
    try {
      const payload = { ...bookForm, total_copies: parseInt(bookForm.total_copies) || 1 };
      if (editingBook) {
        await api.put(`/library/books/${editingBook.id}`, payload);
        toast.success('Book updated');
      } else {
        await api.post('/library/books', payload);
        toast.success('Book added to catalogue');
      }
      setBookOpen(false);
      await loadData();
    } catch (err) { toast.error(getApiError(err)); }
    setBookSaving(false);
  }

  async function deleteBook(id: string) {
    if (!confirm('Delete this book from catalogue?')) return;
    try { await api.delete(`/library/books/${id}`); toast.success('Book deleted'); setBooks(prev => prev.filter(b => b.id !== id)); }
    catch (err) { toast.error(getApiError(err)); }
  }

  // ── Issue helpers ─────────────────────────────────────────────────────────
  async function searchStudents(q: string) {
    if (q.length < 2) { setStudentResults([]); return; }
    try {
      const r = await api.get('/students', { params: { search: q, limit: 5 } });
      setStudentResults(r.data.data || []);
    } catch {}
  }

  function selectStudent(s: Student) {
    setSelStudent(s);
    setIssueForm(p => ({ ...p, member_id: s.id, member_name: s.name }));
    setStudentSearch(s.name);
    setStudentResults([]);
  }

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault(); setIssueSaving(true);
    try {
      await api.post('/library/issues', issueForm);
      toast.success('Book issued');
      setIssueOpen(false);
      resetIssueForm();
      await loadData();
    } catch (err) { toast.error(getApiError(err)); }
    setIssueSaving(false);
  }

  function resetIssueForm() {
    const today = new Date().toISOString().split('T')[0];
    const due   = new Date(); due.setDate(due.getDate() + 14);
    setIssueForm({ book_id: '', member_type: 'student', member_id: '', member_name: '', issue_date: today, due_date: due.toISOString().split('T')[0] });
    setStudentSearch(''); setStudentResults([]); setSelStudent(null);
  }

  // ── Return helpers ────────────────────────────────────────────────────────
  function openReturn(issue: Issue) {
    setReturningIssue(issue);
    setReturnDate(new Date().toISOString().split('T')[0]);
    setReturnOpen(true);
  }

  async function handleReturn(e: React.FormEvent) {
    e.preventDefault(); setReturnSaving(true);
    try {
      await api.put(`/library/issues/${returningIssue!.id}/return`, { return_date: returnDate });
      toast.success('Book returned');
      setReturnOpen(false); setReturningIssue(null);
      await loadData();
    } catch (err) { toast.error(getApiError(err)); }
    setReturnSaving(false);
  }

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredBooks  = books.filter(b =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.author?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredIssues = issues.filter(i =>
    i.book?.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.member_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusVariant = (s: string): 'success' | 'danger' | 'warning' =>
    s === 'returned' ? 'success' : s === 'overdue' ? 'danger' : 'warning';

  return (
    <AuthGuard anyPermission={['library.book.view']}>
      <AppShell title="Library">
        <div className="space-y-6">

          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-700 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4 shadow-lg shadow-cyan-100">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookMarked className="w-5 h-5" /> Library Management
              </h2>
              <p className="text-cyan-100 text-sm mt-0.5">Manage books, issue and track returns</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {canIssue && (
                <button onClick={() => setIssueOpen(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors border border-white/30">
                  <TrendingUp className="w-4 h-4" /> Issue Book
                </button>
              )}
              {canAdd && (
                <button onClick={openAddBook}
                  className="flex items-center gap-2 bg-white text-cyan-700 hover:bg-cyan-50 font-semibold text-sm px-4 py-2 rounded-xl shadow transition-colors">
                  <Plus className="w-4 h-4" /> Add Book
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Books',      value: loading ? '…' : (stats?.totalBooks      ?? 0), icon: BookOpen,      color: 'bg-cyan-50 text-cyan-600' },
              { label: 'Total Copies',     value: loading ? '…' : (stats?.totalCopies     ?? 0), icon: GraduationCap, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Available Copies', value: loading ? '…' : (stats?.availableCopies ?? 0), icon: TrendingUp,    color: 'bg-green-50 text-green-600' },
              { label: 'Issued Copies',    value: loading ? '…' : (stats?.issuedCopies    ?? 0), icon: Users,         color: 'bg-orange-50 text-orange-600' },
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

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(['books', 'issues'] as TabType[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {t === 'books' ? `Books (${books.length})` : `Issues (${issues.filter(i => i.status !== 'returned').length} active)`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-full max-w-xs">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder={tab === 'books' ? 'Search by title or author…' : 'Search by book or member…'}
              value={search} onChange={e => setSearch(e.target.value)}
              className="text-sm outline-none bg-transparent text-gray-700 flex-1" />
          </div>

          {/* Books tab */}
          {tab === 'books' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-500" /> Books Catalogue
                  {books.length > 0 && <Badge variant="info">{books.length} books</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : filteredBooks.length === 0 ? (
                  <div className="py-12 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-500 font-medium">No books in catalogue yet</p>
                    {canAdd && <button onClick={openAddBook} className="mt-3 text-sm text-cyan-600 hover:underline font-medium">+ Add the first book</button>}
                  </div>
                ) : (
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Title</Th><Th>Author</Th><Th>ISBN</Th><Th>Category</Th>
                        <Th>Total</Th><Th>Available</Th>
                        {(canEdit || canDelete) && <Th>Actions</Th>}
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
                          {(canEdit || canDelete) && (
                            <Td>
                              <div className="flex gap-1">
                                {canEdit && (
                                  <button onClick={() => openEditBook(b)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button onClick={() => deleteBook(b.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
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
          )}

          {/* Issues tab */}
          {tab === 'issues' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-cyan-500" /> Issue Records
                  {issues.length > 0 && <Badge variant="info">{issues.length} total</Badge>}
                </CardTitle>
                {canIssue && (
                  <button onClick={() => setIssueOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-cyan-600 hover:underline font-medium">
                    <Plus className="w-3.5 h-3.5" /> Issue a Book
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {loading ? <Spinner /> : filteredIssues.length === 0 ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-500 font-medium">No issue records yet</p>
                    {canIssue && <button onClick={() => setIssueOpen(true)} className="mt-3 text-sm text-cyan-600 hover:underline font-medium">+ Issue the first book</button>}
                  </div>
                ) : (
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Book</Th><Th>Issued To</Th><Th>Type</Th>
                        <Th>Issue Date</Th><Th>Due Date</Th><Th>Return Date</Th>
                        <Th>Status</Th>{canIssue && <Th>Actions</Th>}
                      </tr>
                    </Thead>
                    <Tbody>
                      {filteredIssues.map(i => (
                        <Tr key={i.id}>
                          <Td>
                            <div className="font-medium text-gray-900">{i.book?.title ?? '—'}</div>
                            <div className="text-xs text-gray-400">{i.book?.author}</div>
                          </Td>
                          <Td className="text-gray-700">{i.member_name || '—'}</Td>
                          <Td><Badge variant="default" className="capitalize">{i.member_type}</Badge></Td>
                          <Td className="text-gray-500 text-sm">{i.issue_date}</Td>
                          <Td className="text-gray-500 text-sm">{i.due_date}</Td>
                          <Td className="text-gray-500 text-sm">{i.return_date || '—'}</Td>
                          <Td>
                            <Badge variant={statusVariant(i.status)} className="capitalize">{i.status}</Badge>
                          </Td>
                          {canIssue && (
                            <Td>
                              {i.status !== 'returned' && (
                                <button onClick={() => openReturn(i)}
                                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium hover:underline">
                                  <RotateCcw className="w-3 h-3" /> Return
                                </button>
                              )}
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

        {/* Add / Edit Book Modal */}
        {canAdd && (
          <Modal open={bookOpen} onClose={() => setBookOpen(false)}
            title={editingBook ? 'Edit Book' : 'Add Book to Catalogue'} size="md">
            <form onSubmit={handleBookSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Title *" value={bookForm.title}
                  onChange={e => setBookForm(p => ({ ...p, title: e.target.value }))} required />
                <Input label="Author *" value={bookForm.author}
                  onChange={e => setBookForm(p => ({ ...p, author: e.target.value }))} required />
                <Input label="ISBN" value={bookForm.isbn}
                  onChange={e => setBookForm(p => ({ ...p, isbn: e.target.value }))} placeholder="978-..." />
                <Input label="Category" value={bookForm.category}
                  onChange={e => setBookForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Science" />
                <Input label="Total Copies *" type="number" value={bookForm.total_copies}
                  onChange={e => setBookForm(p => ({ ...p, total_copies: e.target.value }))} min="1" required />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setBookOpen(false)}>Cancel</Button>
                <Button type="submit" loading={bookSaving}>{editingBook ? 'Save Changes' : 'Add Book'}</Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Issue Book Modal */}
        {canIssue && (
          <Modal open={issueOpen} onClose={() => { setIssueOpen(false); resetIssueForm(); }} title="Issue a Book" size="md">
            <form onSubmit={handleIssue} className="space-y-4">
              <Select label="Book *" value={issueForm.book_id}
                onChange={e => setIssueForm(p => ({ ...p, book_id: e.target.value }))}
                options={books.filter(b => b.available_copies > 0).map(b => ({
                  value: b.id,
                  label: `${b.title} — ${b.author} (${b.available_copies} available)`,
                }))}
                placeholder="Select a book" required />

              <Select label="Member Type" value={issueForm.member_type}
                onChange={e => { setIssueForm(p => ({ ...p, member_type: e.target.value, member_id: '', member_name: '' })); setSelStudent(null); setStudentSearch(''); }}
                options={[{ value: 'student', label: 'Student' }, { value: 'employee', label: 'Employee' }]} />

              {issueForm.member_type === 'student' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <div className="relative">
                    <input type="text" value={studentSearch}
                      onChange={e => { setStudentSearch(e.target.value); searchStudents(e.target.value); }}
                      placeholder="Search by name or admission no…"
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    {studentResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1">
                        {studentResults.map(s => (
                          <button key={s.id} type="button" onClick={() => selectStudent(s)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-cyan-50 flex justify-between">
                            <span className="font-medium text-gray-800">{s.name}</span>
                            <span className="text-gray-400 text-xs">#{s.admission_no}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selStudent && <p className="text-xs text-green-600 mt-1">✓ {selStudent.name} selected</p>}
                </div>
              ) : (
                <Input label="Member Name *" value={issueForm.member_name}
                  onChange={e => setIssueForm(p => ({ ...p, member_name: e.target.value, member_id: 'manual' }))}
                  placeholder="Employee name" required />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="Issue Date *" type="date" value={issueForm.issue_date}
                  onChange={e => setIssueForm(p => ({ ...p, issue_date: e.target.value }))} required />
                <Input label="Due Date *" type="date" value={issueForm.due_date}
                  onChange={e => setIssueForm(p => ({ ...p, due_date: e.target.value }))} required />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => { setIssueOpen(false); resetIssueForm(); }}>Cancel</Button>
                <Button type="submit" loading={issueSaving}
                  disabled={!issueForm.book_id || !issueForm.member_id}>
                  Issue Book
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Return Book Modal */}
        {canIssue && (
          <Modal open={returnOpen} onClose={() => { setReturnOpen(false); setReturningIssue(null); }} title="Return Book" size="sm">
            <form onSubmit={handleReturn} className="space-y-4">
              {returningIssue && (
                <div className="bg-cyan-50 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-gray-900">{returningIssue.book?.title}</p>
                  <p className="text-gray-500 mt-0.5">Issued to: <strong>{returningIssue.member_name}</strong></p>
                  <p className="text-gray-500">Due date: <strong className={returningIssue.status === 'overdue' ? 'text-red-600' : ''}>{returningIssue.due_date}</strong></p>
                  {returningIssue.status === 'overdue' && (
                    <p className="text-red-600 text-xs mt-1 font-medium">⚠ This book is overdue</p>
                  )}
                </div>
              )}
              <Input label="Return Date *" type="date" value={returnDate}
                onChange={e => setReturnDate(e.target.value)} required />
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setReturnOpen(false)}>Cancel</Button>
                <Button type="submit" loading={returnSaving}>Confirm Return</Button>
              </div>
            </form>
          </Modal>
        )}
      </AppShell>
    </AuthGuard>
  );
}
