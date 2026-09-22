'use client';
import { useEffect, useState, FormEvent } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { getApiError, formatDate } from '@/lib/utils';
import { getAuthContext, hasPermission, isSuperAdmin } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Bell, Megaphone } from 'lucide-react';

interface Notice { id: string; title: string; content: string; audience: string; created_by: { id: string; name: string } | null; created_at: string; expires_at: string; }

export default function NoticesPage() {
  const ctx = getAuthContext();
  const isAdmin = isSuperAdmin(ctx) || hasPermission('academic.create', ctx);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: '', content: '', audience: 'all', expires_at: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/notices'); setNotices(r.data.data); } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm({ title: '', content: '', audience: 'all', expires_at: '' }); setOpen(true); }
  function openEdit(n: Notice) { setEditing(n); setForm({ title: n.title, content: n.content, audience: n.audience, expires_at: n.expires_at || '' }); setOpen(true); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/notices/${editing.id}`, form);
      else await api.post('/notices', form);
      toast.success(editing ? 'Notice updated' : 'Notice published');
      setOpen(false); load();
    } catch (err) { toast.error(getApiError(err)); }
    setSaving(false);
  }

  async function del(n: Notice) {
    if (!confirm('Delete this notice?')) return;
    try { await api.delete(`/notices/${n.id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(getApiError(err)); }
  }

  const audienceVariant = (a: string) => a === 'all' ? 'info' : a === 'students' ? 'success' : a === 'teachers' ? 'purple' : 'warning';

  return (
    <AuthGuard anyPermission={['notice.view']}>
      <AppShell title="Notices">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-600" /> Notices & Announcements</h2>
            {isAdmin && <Button onClick={openAdd}><Plus className="w-4 h-4" /> New Notice</Button>}
          </div>

          {loading ? <Spinner /> : notices.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-gray-400"><Megaphone className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>No notices yet</p></CardContent></Card>
          ) : (
            <div className="space-y-4">
              {notices.map((n) => (
                <Card key={n.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-indigo-50 rounded-lg mt-0.5 flex-shrink-0"><Bell className="w-4 h-4 text-indigo-600" /></div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900">{n.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.content}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <Badge variant={audienceVariant(n.audience)}>For: {n.audience}</Badge>
                            <span className="text-xs text-gray-400">By {n.created_by?.name ?? '—'} · {formatDate(n.created_at)}</span>
                            {n.expires_at && <span className="text-xs text-orange-500">Expires {formatDate(n.expires_at)}</span>}
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEdit(n)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => del(n)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Notice' : 'New Notice'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
              <textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} required rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Audience" value={form.audience} onChange={(e) => setForm(p => ({ ...p, audience: e.target.value }))}
                options={[{ value: 'all', label: 'Everyone' }, { value: 'students', label: 'Students' }, { value: 'teachers', label: 'Teachers' }, { value: 'parents', label: 'Parents' }]} />
              <Input label="Expiry Date (opt)" type="date" value={form.expires_at} onChange={(e) => setForm(p => ({ ...p, expires_at: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Update' : 'Publish'}</Button>
            </div>
          </form>
        </Modal>
      </AppShell>
    </AuthGuard>
  );
}

