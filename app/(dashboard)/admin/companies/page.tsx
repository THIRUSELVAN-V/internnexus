'use client';

import React from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CompanyRow {
  id: string;
  name: string;
  industry: string;
  internshipsCount: number;
  activeInternsCount: number;
  status: 'approved' | 'suspended';
}

const mockCompanies: CompanyRow[] = [
  { id: '1', name: 'TechCorp India', industry: 'Software & IT Services', internshipsCount: 6, activeInternsCount: 20, status: 'approved' },
  { id: '2', name: 'InnovateTech Solutions', industry: 'AI & SaaS Solutions', internshipsCount: 4, activeInternsCount: 12, status: 'approved' },
  { id: '3', name: 'CreativeStudio', industry: 'Design & Media Services', internshipsCount: 2, activeInternsCount: 5, status: 'approved' },
];

export default function AdminCompaniesPage() {
  const columns: Column<CompanyRow>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.industry}</p>
        </div>
      ),
    },
    {
      key: 'internshipsCount',
      header: 'Active Postings',
      render: (item) => <span className="text-xs font-mono">{item.internshipsCount} postings</span>,
    },
    {
      key: 'activeInternsCount',
      header: 'Active Interns',
      render: (item) => <Badge variant="purple" className="text-xs font-bold">{item.activeInternsCount} Interns</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'approved' ? 'success' : 'destructive'} className="capitalize text-xs">
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Companies Management</h1>
        <p className="text-xs text-slate-500">Directory of all approved enterprise companies on InternNexus</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockCompanies} columns={columns} searchKey="name" searchPlaceholder="Search companies..." />
        </CardContent>
      </Card>
    </div>
  );
}
