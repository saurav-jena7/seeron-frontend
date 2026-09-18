'use client';
import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/layout/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getAuthContext, hasPermission } from '@/lib/auth';
import { BarChart2, BookOpen, DollarSign, Users, ClipboardList, ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const ctx = getAuthContext();

  const reports = [
    {
      module: 'Academic',
      icon: BookOpen,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-600',
      perm: 'report.academic.view',
      items: ['Class-wise Student Report', 'Subject Performance', 'Teacher Assignment Report', 'Timetable Summary'],
    },
    {
      module: 'Attendance',
      icon: ClipboardList,
      color: 'bg-green-50 border-green-200 text-green-600',
      perm: 'report.attendance.view',
      items: ['Daily Attendance Summary', 'Monthly Attendance', 'Low Attendance Students', 'Class-wise Attendance'],
    },
    {
      module: 'Finance',
      icon: DollarSign,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      perm: 'report.finance.view',
      items: ['Fee Collection Report', 'Outstanding Fees', 'Payment Method Summary', 'Monthly Revenue'],
    },
    {
      module: 'HR',
      icon: Users,
      color: 'bg-pink-50 border-pink-200 text-pink-600',
      perm: 'report.hr.view',
      items: ['Employee Directory', 'Department Summary', 'Teacher Load Report', 'Leave Summary'],
    },
  ];

  const accessible = reports.filter(r => hasPermission(r.perm, ctx));

  return (
    <AuthGuard anyPermission={['report.academic.view', 'report.finance.view', 'report.hr.view', 'report.attendance.view']}>
      <AppShell title="Reports">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" /> Reports & Analytics
              </h2>
              <p className="text-sm text-gray-500">{accessible.length} report modules available</p>
            </div>
          </div>

          {accessible.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No report modules accessible with your current permissions.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {accessible.map(r => (
                <Card key={r.module} className={`border-2 ${r.color.split(' ')[1]}`}>
                  <CardHeader className={`rounded-t-xl ${r.color.split(' ')[0]}`}>
                    <CardTitle className="flex items-center gap-2">
                      <r.icon className={`w-5 h-5 ${r.color.split(' ')[2]}`} />
                      <span>{r.module} Reports</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {r.items.map(item => (
                        <div key={item} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                          <span className="text-sm text-gray-700">{item}</span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1 text-gray-400 hover:text-indigo-600"><Download className="w-3.5 h-3.5" /></button>
                            <button className="p-1 text-gray-400 hover:text-indigo-600"><ArrowRight className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
