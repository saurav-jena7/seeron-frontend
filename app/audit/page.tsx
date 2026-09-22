'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resource_id: string;
  user: { id: string; name: string; email: string } | null;
  ip_address: string;
  created_at: string;
}

const actionVariant = (a: string): 'success' | 'danger' | 'warning' | 'info' | 'default' | 'purple' =>
  a === 'CREATE' ? 'success' : a === 'DELETE' ? 'danger' : a === 'UPDATE' ? 'warning' :
  a === 'LOGIN'  ? 'info'    : a === 'LOGOUT' ? 'default' : 'purple';

export default function AuditPage() {
  const [logs,           setLogs]           = useState<AuditLog[]>([]);
  const [total,          setTotal]          = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);
  const [actions,        setActions]        = useState<string[]>([]);
  const [resources,      setResources]      = useState<string[]>([]);
  const [filterAction,   setFilterAction]   = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [fromDate,       setFromDate]       = useState('');
  const [toDate,         setToDate]         = useState('');
  const limit = 30;

  useEffect(() => {
    api.get('/audit/actions').then(r => {
      setActions(r.data.data.actions   || []);
      setResources(r.data.data.resources || []);
    }).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get('/audit', {
        params: {
          page, limit,
          action:    filterAction   || undefined,
          resource:  filterResource || undefined,
          from_date: fromDate       || undefined,
          to_date:   toDate         || undefined,
        },
      });
      setLogs(r.data.data || []);
      setTotal(r.data.meta.total);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, [page, filterAction, filterResource, fromDate, toDate]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AuthGuard anyPermission={['audit.view']}>
      <AppShell title="Activity Log">
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" /> Activity / Audit Log
          </h2>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-3 w-full items-end">
                <Select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
                  options={actions.map(a => ({ value: a, label: a }))} placeholder="All actions" className="w-36" />
                <Select value={filterResource} onChange={e => { setFilterResource(e.target.value); setPage(1); }}
                  options={resources.map(r => ({ value: r, label: r }))} placeholder="All resources" className="w-36" />
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setFilterAction(''); setFilterResource(''); setFromDate(''); setToDate(''); setPage(1); }}>
                    Clear
                  </Button>
                </div>
                <span className="ml-auto text-sm text-gray-500">{total} events</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Action</Th><Th>Resource</Th><Th>User</Th><Th>IP</Th><Th>Time</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {logs.length === 0 ? (
                      <Tr><Td className="text-center text-gray-400 py-8" colSpan={5}>No activity logs</Td></Tr>
                    ) : logs.map(log => (
                      <Tr key={log.id}>
                        <Td><Badge variant={actionVariant(log.action)}>{log.action}</Badge></Td>
                        <Td>
                          <span className="text-sm font-medium text-gray-700">{log.resource}</span>
                          {log.resource_id && (
                            <span className="text-xs text-gray-400 ml-1 font-mono">#{log.resource_id.slice(0, 8)}</span>
                          )}
                        </Td>
                        <Td>
                          <div className="text-sm text-gray-800">{log.user?.name ?? '--'}</div>
                          <div className="text-xs text-gray-400">{log.user?.email ?? ''}</div>
                        </Td>
                        <Td className="text-xs text-gray-500 font-mono">{log.ip_address || '--'}</Td>
                        <Td className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
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
      </AppShell>
    </AuthGuard>
  );
}
