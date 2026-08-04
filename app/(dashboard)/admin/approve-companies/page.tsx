'use client';

import React, { useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldCheck } from 'lucide-react';

interface PendingCompanyRow {
  id: string;
  name: string;
  industry: string;
  location: string;
  hrName: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockPending: PendingCompanyRow[] = [
  { id: '1', name: 'InnovateTech Labs', industry: 'AI & Cloud Software', location: 'Hyderabad', hrName: 'Suresh Raina', submittedAt: '2026-08-02', status: 'pending' },
  { id: '2', name: 'NextGen CyberSec', industry: 'Cybersecurity', location: 'Pune', hrName: 'Deepika Padukone', submittedAt: '2026-08-01', status: 'pending' },
];

export default function AdminApproveCompaniesPage() {
  const [data, setData] = useState<PendingCompanyRow[]>(mockPending);

  const handleStatusChange = (id: string, newStatus: 'approved' | 'rejected') => {
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)));
  };

  const columns: Column<PendingCompanyRow>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.industry} · {item.location}</p>
        </div>
      ),
    },
    {
      key: 'hrName',
      header: 'HR Manager',
      render: (item) => <span className="text-xs text-slate-700 font-medium">{item.hrName}</span>,
    },
    {
      key: 'submittedAt',
      header: 'Submitted Date',
      render: (item) => <span className="text-xs font-mono text-slate-600">{item.submittedAt}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'destructive' : 'warning'}
          className="capitalize text-xs"
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Approval Actions',
      render: (item) =>
        item.status === 'pending' ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleStatusChange(item.id, 'rejected')} className="border-red-200 text-red-600 hover:bg-red-50">
              <X className="h-3.5 w-3.5 mr-1" /> Reject
            </Button>
            <Button size="sm" onClick={() => handleStatusChange(item.id, 'approved')} className="bg-green-600 hover:bg-green-700">
              <Check className="h-3.5 w-3.5 mr-1" /> Approve
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Action completed</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Approve Company Registrations</h1>
        <p className="text-xs text-slate-500">Verify company profiles and grant platform credentials to HR managers</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={data} columns={columns} searchKey="name" searchPlaceholder="Search pending companies..." />
        </CardContent>
      </Card>
    </div>
  );
}
