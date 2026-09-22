'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, GraduationCap, CreditCard, ClipboardList } from 'lucide-react';

interface Student {
  id: string; name: string; admission_no: string; roll_no: string;
  gender: string; dob: string; blood_group: string; phone: string; email: string;
  address: string; parent_name: string; parent_phone: string; parent_email: string;
  class: { id: string; name: string } | null;
  section: { id: string; name: string } | null;
  academic_year: { id: string; name: string } | null;
  status: string; admission_date: string;
}

interface FeeSummary {
  totalAssigned: number; totalPaid: number; balance: number;
  payments: { id: string; amount: number; payment_date: string; fee_category: { id: string; name: string } | null; payment_method: string; status: string }[];
}

interface AttendanceSummary {
  total: number; presentDays: number; attendancePercentage: string;
  summary: Record<string, number>;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeSummary | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sr, fr, ar] = await Promise.all([
          api.get(`/students/${id}`),
          api.get(`/fees/summary/${id}`),
          api.get(`/attendance/report/${id}`),
        ]);
        setStudent(sr.data.data);
        setFees(fr.data.data);
        setAttendance(ar.data.data);
      } catch {}
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <AuthGuard><AppShell title="Student"><Spinner /></AppShell></AuthGuard>;
  if (!student) return <AuthGuard><AppShell title="Student"><p className="text-gray-500">Student not found.</p></AppShell></AuthGuard>;

  const statusVariant = student.status === 'active' ? 'success' : student.status === 'graduated' ? 'info' : 'warning';

  return (
    <AuthGuard anyPermission={['student.view']}>
      <AppShell title="Student Detail">
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">{student.name[0]}</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-gray-500">#{student.admission_no}</span>
                  <Badge variant={statusVariant}>{student.status}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Personal Info</CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-2.5 text-sm">
                  {[
                    ['Class', `${student.class?.name || '—'}${student.section?.name ? ' – ' + student.section.name : ''}`],
                    ['Academic Year', student.academic_year?.name || '—'],
                    ['Roll No', student.roll_no || '—'],
                    ['Gender', student.gender || '—'],
                    ['Date of Birth', formatDate(student.dob)],
                    ['Blood Group', student.blood_group || '—'],
                    ['Phone', student.phone || '—'],
                    ['Email', student.email || '—'],
                    ['Admission Date', formatDate(student.admission_date)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="font-medium text-gray-800 text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Parent / Guardian</CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-2.5 text-sm">
                  {[
                    ['Name', student.parent_name || '—'],
                    ['Phone', student.parent_phone || '—'],
                    ['Email', student.parent_email || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="font-medium text-gray-800">{v}</dd>
                    </div>
                  ))}
                </dl>

                {attendance && (
                  <>
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3"><ClipboardList className="w-3.5 h-3.5" /> Attendance</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['Present', attendance.summary.present || 0],
                          ['Absent', attendance.summary.absent || 0],
                          ['Late', attendance.summary.late || 0],
                          ['Percentage', `${attendance.attendancePercentage}%`],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-gray-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-gray-900">{v}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{k}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {fees && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Fee Summary</CardTitle>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Assigned: <strong>{formatCurrency(fees.totalAssigned)}</strong></span>
                  <span className="text-green-600">Paid: <strong>{formatCurrency(fees.totalPaid)}</strong></span>
                  <Badge variant={fees.balance > 0 ? 'danger' : 'success'}>Balance: {formatCurrency(fees.balance)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {fees.payments.length === 0 ? (
                  <p className="text-sm text-gray-400 px-6 py-4">No payments recorded</p>
                ) : (
                  <Table>
                    <Thead><tr><Th>Category</Th><Th>Amount</Th><Th>Date</Th><Th>Method</Th><Th>Status</Th></tr></Thead>
                    <Tbody>
                      {fees.payments.map((p) => (
                        <Tr key={p.id}>
                          <Td>{p.fee_category?.name ?? '—'}</Td>
                          <Td className="font-medium">{formatCurrency(p.amount)}</Td>
                          <Td>{formatDate(p.payment_date)}</Td>
                          <Td className="capitalize">{p.payment_method}</Td>
                          <Td><Badge variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
