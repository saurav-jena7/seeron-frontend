'use client';
import { useEffect, useState } from 'react';
import PortalShell from '@/components/layout/PortalShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, Megaphone, Clock, Users, GraduationCap, BookOpen } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  audience: string;
  created_by: { id: string; name: string } | null;
  created_at: string;
  expires_at?: string;
}

const AUDIENCE_CONFIG: Record<string, { icon: React.ElementType; color: string; badge: 'info' | 'success' | 'purple' | 'warning' }> = {
  all:      { icon: Megaphone,      color: 'bg-indigo-50 border-indigo-200', badge: 'info' },
  students: { icon: GraduationCap,  color: 'bg-green-50 border-green-200',   badge: 'success' },
  teachers: { icon: BookOpen,       color: 'bg-purple-50 border-purple-200', badge: 'purple' },
  parents:  { icon: Users,          color: 'bg-amber-50 border-amber-200',   badge: 'warning' },
};

export default function PortalNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    api.get('/portal/notices')
      .then(r => setNotices(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'all' ? notices : notices.filter(n => n.audience === filter || n.audience === 'all');

  return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="Notices">
        <div className="space-y-5">
          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['all', 'students', 'teachers', 'parents'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                }`}
              >
                {f === 'all' ? 'All Notices' : f}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : displayed.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">
                <Megaphone className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="font-medium">No notices</p>
                <p className="text-sm mt-1">Check back later for announcements</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayed.map(n => {
                const cfg = AUDIENCE_CONFIG[n.audience] || AUDIENCE_CONFIG.all;
                const AudienceIcon = cfg.icon;
                const isExpiring = n.expires_at && new Date(n.expires_at) > new Date() &&
                  (new Date(n.expires_at).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;
                return (
                  <div key={n.id}
                    className={`border rounded-2xl p-4 hover:shadow-md transition-all ${cfg.color}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AudienceIcon className="w-4.5 h-4.5 text-gray-700" style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{n.title}</h3>
                          <Badge variant={cfg.badge} className="capitalize flex-shrink-0">{n.audience}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                        <div className="flex items-center gap-3 mt-2.5 flex-wrap text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(n.created_at)}
                          </span>
                          {n.created_by && (
                            <span>By {n.created_by.name}</span>
                          )}
                          {isExpiring && (
                            <span className="text-orange-500 font-medium">
                              Expires {formatDate(n.expires_at!)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PortalShell>
    </AuthGuard>
  );
}
