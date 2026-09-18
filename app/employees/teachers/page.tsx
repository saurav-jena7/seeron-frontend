'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface Teacher {
  id: string;
  name: string;
  employeeCode: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  joiningDate: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employees/teachers/list')
      .then((r) => setTeachers(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard anyPermission={['employee.view']}>
      <AppShell title="Teachers">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" /> Teachers
              </h2>
              <p className="text-sm text-gray-500">{teachers.length} teaching staff</p>
            </div>
            <Link href="/employees">
              <Button variant="outline">All Employees</Button>
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? <Spinner /> : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Code</Th>
                      <Th>Designation</Th>
                      <Th>Department</Th>
                      <Th>Phone</Th>
                      <Th>Email</Th>
                      <Th>Joined</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {teachers.length === 0 ? (
                      <Tr>
                        <Td className="text-center text-gray-400 py-8" colSpan={7 as never}>
                          No teachers found
                        </Td>
                      </Tr>
                    ) : (
                      teachers.map((t) => (
                        <Tr key={t.id}>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                {t.name[0]}
                              </div>
                              <div className="font-medium text-gray-900">{t.name}</div>
                            </div>
                          </Td>
                          <Td className="text-gray-600">{t.employeeCode || '—'}</Td>
                          <Td>{t.designation || '—'}</Td>
                          <Td>{t.department || '—'}</Td>
                          <Td>{t.phone || '—'}</Td>
                          <Td className="text-gray-500 text-xs">{t.email || '—'}</Td>
                          <Td className="text-gray-500">{formatDate(t.joiningDate)}</Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
