'use client';
import { useEffect, useState } from 'react';
import PortalShell from '@/components/layout/PortalShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { DAYS } from '@/lib/utils';
import { Clock, BookOpen, User } from 'lucide-react';

interface NamedRef { id: string; name: string; }
interface TTEntry {
  id: string;
  subject: NamedRef | null;
  teacher: NamedRef | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
}

const PERIOD_COLORS = [
  'bg-indigo-50 border-indigo-200 text-indigo-700',
  'bg-blue-50 border-blue-200 text-blue-700',
  'bg-purple-50 border-purple-200 text-purple-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-amber-50 border-amber-200 text-amber-700',
  'bg-pink-50 border-pink-200 text-pink-700',
  'bg-cyan-50 border-cyan-200 text-cyan-700',
  'bg-rose-50 border-rose-200 text-rose-700',
];

export default function PortalTimetablePage() {
  const [entries, setEntries] = useState<TTEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(() => {
    const d = new Date().getDay(); // 0=Sun, 1=Mon...
    return d === 0 ? 1 : d; // default to today (Mon=1 ... Fri=5), fallback Mon
  });

  useEffect(() => {
    api.get('/portal/timetable')
      .then(r => setEntries(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = DAYS.reduce((acc, day, i) => {
    acc[i + 1] = entries.filter(e => e.day_of_week === i + 1);
    return acc;
  }, {} as Record<number, TTEntry[]>);

  const totalPeriods = entries.length;
  const todayPeriods = grouped[activeDay]?.length ?? 0;

  return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="My Timetable">
        {loading ? <Spinner /> : (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-indigo-700">{totalPeriods}</p>
                <p className="text-xs text-indigo-500 mt-1">Total Weekly Periods</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{todayPeriods}</p>
                <p className="text-xs text-purple-500 mt-1">Periods Today ({DAYS[activeDay - 1]})</p>
              </div>
            </div>

            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DAYS.map((day, i) => {
                const dayIdx = i + 1;
                const count = grouped[dayIdx]?.length ?? 0;
                const isToday = dayIdx === new Date().getDay();
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(dayIdx)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                      activeDay === dayIdx
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {day.slice(0, 3)}
                    {count > 0 && (
                      <span className={`ml-1.5 text-xs font-bold ${activeDay === dayIdx ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {count}
                      </span>
                    )}
                    {isToday && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Periods for selected day */}
            {entries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No timetable available yet</p>
                </CardContent>
              </Card>
            ) : (grouped[activeDay] || []).length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-gray-400">
                  <p className="text-sm">No periods on {DAYS[activeDay - 1]}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(grouped[activeDay] || []).map((p, idx) => (
                  <div
                    key={p.id}
                    className={`border rounded-2xl p-4 ${PERIOD_COLORS[idx % PERIOD_COLORS.length]} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold opacity-60">Period {idx + 1}</span>
                        </div>
                        <h3 className="font-bold text-base truncate">
                          {p.subject?.name ?? '—'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs opacity-75">
                            <User className="w-3 h-3" />
                            {p.teacher?.name ?? 'No teacher'}
                          </span>
                          {p.room && (
                            <span className="text-xs opacity-75">Room {p.room}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs font-mono font-bold opacity-80">
                          <Clock className="w-3.5 h-3.5" />
                          {p.start_time}
                        </div>
                        <div className="text-xs opacity-60 mt-0.5">{p.end_time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full week compact view */}
            <Card>
              <CardHeader><CardTitle>Full Week Overview</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {DAYS.map((day, i) => {
                    const dayIdx = i + 1;
                    const periods = grouped[dayIdx] || [];
                    if (periods.length === 0) return null;
                    return (
                      <div key={day} className="px-4 py-3">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-semibold text-gray-500 w-16">{day}</span>
                          <span className="text-xs text-gray-400">{periods.length} period{periods.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {periods.map((p, pi) => (
                            <div key={p.id}
                              className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg">
                              <span className="font-medium">{p.subject?.name ?? '—'}</span>
                              <span className="text-gray-400 font-mono">{p.start_time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </PortalShell>
    </AuthGuard>
  );
}
