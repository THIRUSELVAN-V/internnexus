'use client';

import React, { useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Download, CheckCircle2 } from 'lucide-react';

interface CertRow {
  id: string;
  studentName: string;
  role: string;
  mentorName: string;
  issueDate: string;
  status: 'ready' | 'issued';
}

const mockCerts: CertRow[] = [
  { id: '1', studentName: 'Thiru', role: 'Frontend Web Development Intern', mentorName: 'Mr. Vijay', issueDate: '2026-08-04', status: 'ready' },
  { id: '2', studentName: 'Priya Sharma', role: 'Full Stack Engineering Intern', mentorName: 'Ananya Deshmukh', issueDate: '2026-07-30', status: 'issued' },
];

export default function HRCertificatesPage() {
  const [issuedIds, setIssuedIds] = useState<string[]>([]);

  const handleIssue = (id: string) => {
    setIssuedIds((prev) => [...prev, id]);
  };

  const columns: Column<CertRow>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.studentName}</p>
          <p className="text-xs text-slate-500">{item.role}</p>
        </div>
      ),
    },
    {
      key: 'mentorName',
      header: 'Mentor',
      render: (item) => <span className="text-xs text-slate-700">{item.mentorName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const isGenerated = item.status === 'issued' || issuedIds.includes(item.id);
        return (
          <Badge variant={isGenerated ? 'success' : 'warning'} className="capitalize text-xs">
            {isGenerated ? 'Issued' : 'Ready to Issue'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => {
        const isGenerated = item.status === 'issued' || issuedIds.includes(item.id);
        return (
          <Button
            size="sm"
            onClick={() => handleIssue(item.id)}
            disabled={isGenerated}
            className={isGenerated ? 'bg-green-600 hover:bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}
          >
            {isGenerated ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Certificate Issued</> : <><Award className="h-3.5 w-3.5 mr-1" /> Generate Certificate</>}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Certificate Generation</h1>
        <p className="text-xs text-slate-500">Generate and issue verified completion certificates for evaluated interns</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockCerts} columns={columns} searchKey="studentName" searchPlaceholder="Search student..." />
        </CardContent>
      </Card>
    </div>
  );
}
