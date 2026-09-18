'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Shield, Building2, Users, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Institute { id: string; name: string; type: string; email: string; phone: string; created_at: string; }

export default function SuperAdminPage() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/institute/all').then(r => setInstitutes(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard superAdminOnly>
      <AppShell title="Super Admin">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" /> Platform Administration
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage all institutes on the platform</p>
            </div>
            <Link href="/super-admin/institutes/new">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" /> New Institute
              </button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl"><Building2 className="w-6 h-6 text-indigo-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Total Institutes</p>
                <p className="text-2xl font-bold text-gray-900">{institutes.length}</p>
              </div>
            </div>
          </div>

          {/* Institutes list */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" /> All Institutes</CardTitle></CardHeader>
            <CardContent className="p-0">
              {loading ? <Spinner /> : institutes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No institutes yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {institutes.map(inst => (
                    <div key={inst.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {inst.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{inst.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="info" className="capitalize">{inst.type}</Badge>
                            <span className="text-xs text-gray-400">{inst.email || 'No email'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{formatDate(inst.created_at)}</span>
                        <Link href={`/super-admin/institutes/${inst.id}`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
