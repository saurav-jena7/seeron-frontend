'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { Key } from 'lucide-react';

interface Perm { id: string; name: string; resource: string; action: string; module: string; description: string; }

const MODULE_COLORS: Record<string, string> = {
  institute: 'bg-blue-50 text-blue-700',
  users:     'bg-purple-50 text-purple-700',
  rbac:      'bg-amber-50 text-amber-700',
  students:  'bg-indigo-50 text-indigo-700',
  hr:        'bg-pink-50 text-pink-700',
  academics: 'bg-green-50 text-green-700',
  finance:   'bg-emerald-50 text-emerald-700',
  notices:   'bg-orange-50 text-orange-700',
  admin:     'bg-red-50 text-red-700',
  library:   'bg-cyan-50 text-cyan-700',
  hostel:    'bg-teal-50 text-teal-700',
  transport: 'bg-violet-50 text-violet-700',
  reports:   'bg-sky-50 text-sky-700',
};

export default function PermissionsPage() {
  const [grouped, setGrouped] = useState<Record<string, Perm[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/permissions').then(r => {
      setGrouped(r.data.grouped || {});
      setTotal(r.data.data?.length || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const modules = Object.keys(grouped).sort();
  const filterPerms = (perms: Perm[]) => search ? perms.filter(p => p.name.includes(search) || p.description?.toLowerCase().includes(search.toLowerCase())) : perms;

  return (
    <AuthGuard anyPermission={['permission.view']}>
      <AppShell title="Permissions">
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Key className="w-5 h-5 text-indigo-600" /> Permissions</h2>
              <p className="text-sm text-gray-500">{total} granular permissions across {modules.length} modules</p>
            </div>
            <input type="text" placeholder="Search permissions…" value={search} onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {loading ? <Spinner /> : (
            <div className="space-y-4">
              {modules.map(module => {
                const perms = filterPerms(grouped[module] || []);
                if (perms.length === 0) return null;
                const color = MODULE_COLORS[module] || 'bg-gray-50 text-gray-700';
                return (
                  <Card key={module}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${color}`}>{module}</span>
                        <span className="text-xs text-gray-400 font-normal">{perms.length} permissions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {perms.map(p => (
                          <div key={p.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                            <Key className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-mono font-semibold text-gray-800">{p.name}</p>
                              {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
