'use client';

import React from 'react';
import Link from 'next/link';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Eye, UserCheck } from 'lucide-react';

interface ApplicantRow {
  id: string;
  name: string;
  role: string;
  college: string;
  score: number;
  status: 'pending' | 'ai_reviewed' | 'hr_shortlisted' | 'mentor_assigned';
  appliedAt: string;
}

const mockApplicants: ApplicantRow[] = [
  { id: '1', name: 'Thiru', role: 'Frontend Web Development Intern', college: 'IIT Madras', score: 94, status: 'ai_reviewed', appliedAt: '2026-08-01' },
  { id: '2', name: 'Priya Sharma', role: 'Full Stack Engineering Intern', college: 'BITS Pilani', score: 88, status: 'hr_shortlisted', appliedAt: '2026-07-28' },
  { id: '3', name: 'Rahul Verma', role: 'UI/UX Design & Frontend Intern', college: 'NIT Trichy', score: 84, status: 'ai_reviewed', appliedAt: '2026-07-27' },
  { id: '4', name: 'Ananya Deshmukh', role: 'Frontend Web Development Intern', college: 'IIT Bombay', score: 91, status: 'mentor_assigned', appliedAt: '2026-07-25' },
];

export default function HRApplicantsPage() {
  const columns: Column<ApplicantRow>[] = [
    {
      key: 'name',
      header: 'Applicant Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.college}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Applied Role',
      render: (item) => <span className="text-xs text-slate-700 font-medium">{item.role}</span>,
    },
    {
      key: 'score',
      header: 'AI Match Score',
      render: (item) => (
        <Badge variant="purple" className="font-bold text-xs">
          <Sparkles className="h-3 w-3 mr-1" /> {item.score}% Match
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'mentor_assigned' ? 'success' : 'default'} className="capitalize text-xs">
          {item.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/hr/applicants/${item.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Review AI
            </Link>
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
            <Link href={`/hr/mentor-recommendation?applicantId=${item.id}`}>
              <p style={{ color: 'white' }}>Assign Mentor</p>
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Applicants Management</h1>
        <p className="text-xs text-slate-500">Review AI resume summaries, match scores, and shortlist candidates</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockApplicants} columns={columns} searchKey="name" searchPlaceholder="Search applicants..." />
        </CardContent>
      </Card>
    </div>
  );
}
