'use client';
import { useEffect, useState } from 'react';
import PortalShell from '@/components/layout/PortalShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import api from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CreditCard, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface FeePayment {
  id: string;
  amount: number;
  payment_date: string;
  fee_category: { id: string; name: string } | null;
  payment_method: string;
  status: string;
}
interface FeeSummary {
  totalAssigned: number;
  totalPaid: number;
  balance: number;
  payments: FeePayment[];
}

const METHOD_COLORS: Record<string, string> = {
  cash: '#6366f1', bank: '#10b981', online: '#3b82f6', cheque: '#f59e0b',
};

export default function PortalFeesPage() {
  const [data, setData] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal/fees')
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="Fee Status"><Spinner /></PortalShell>
    </AuthGuard>
  );

  const feeProgress = data
    ? Math.min(100, Math.round((data.totalPaid / (data.totalAssigned || 1)) * 100))
    : 0;

  // Monthly bar chart data
  const monthlyData = (() => {
    if (!data?.payments) return [];
    const map: Record<string, number> = {};
    data.payments.forEach(p => {
      if (!p.payment_date) return;
      const month = p.payment_date.slice(0, 7); // YYYY-MM
      map[month] = (map[month] || 0) + p.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        amount,
      }));
  })();

  // Payment method pie data
  const methodData = (() => {
    if (!data?.payments) return [];
    const map: Record<string, number> = {};
    data.payments.forEach(p => {
      map[p.payment_method] = (map[p.payment_method] || 0) + p.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  return (
    <AuthGuard anyPermission={['student.view']}>
      <PortalShell title="Fee Status">
        {!data ? null : (
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalAssigned)}</p>
                <p className="text-sm text-gray-500 mt-1">Total Assigned</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700">{formatCurrency(data.totalPaid)}</p>
                <p className="text-sm text-green-600 mt-1">Total Paid</p>
              </div>
              <div className={`${data.balance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border rounded-2xl p-5 text-center`}>
                {data.balance > 0
                  ? <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  : <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />}
                <p className={`text-2xl font-bold ${data.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {formatCurrency(Math.abs(data.balance))}
                </p>
                <p className={`text-sm mt-1 ${data.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.balance > 0 ? 'Due' : 'All Cleared ✓'}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <Card>
              <CardContent className="py-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-medium">Payment Progress</span>
                  <span className="font-bold text-indigo-600">{feeProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${feeProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>₹0</span>
                  <span>{formatCurrency(data.totalAssigned)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            {(monthlyData.length > 0 || methodData.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Monthly payments bar chart */}
                {monthlyData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-indigo-500" /> Monthly Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            formatter={(v: number) => [formatCurrency(v), 'Paid']}
                          />
                          <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Amount Paid" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Payment method pie */}
                {methodData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={methodData} cx="50%" cy="45%" innerRadius={45} outerRadius={68}
                            paddingAngle={3} dataKey="value">
                            {methodData.map((entry, i) => (
                              <Cell
                                key={i}
                                fill={METHOD_COLORS[entry.name] || `hsl(${i * 60}, 60%, 55%)`}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '10px', border: 'none' }}
                            formatter={(v: number) => [formatCurrency(v), '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-3 mt-1">
                        {methodData.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600 capitalize">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: METHOD_COLORS[d.name] || `hsl(${i * 60}, 60%, 55%)` }}
                            />
                            {d.name}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Payment history table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {data.payments.length === 0 ? (
                  <p className="text-sm text-gray-400 px-6 py-6">No payments recorded yet</p>
                ) : (
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Category</Th>
                        <Th>Amount</Th>
                        <Th>Date</Th>
                        <Th>Method</Th>
                        <Th>Status</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {data.payments.map(p => (
                        <Tr key={p.id}>
                          <Td className="font-medium text-gray-900">{p.fee_category?.name ?? '—'}</Td>
                          <Td className="font-semibold">{formatCurrency(p.amount)}</Td>
                          <Td className="text-gray-600">{formatDate(p.payment_date)}</Td>
                          <Td className="capitalize text-gray-600">{p.payment_method}</Td>
                          <Td>
                            <Badge variant={p.status === 'paid' ? 'success' : 'warning'}>
                              {p.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PortalShell>
    </AuthGuard>
  );
}
