'use client';

import React from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ApplicationRow {
  id: string;
  title: string;
  company: string;
  appliedDate: string;
  status: 'pending' | 'ai_reviewed' | 'hr_shortlisted' | 'mentor_assigned' | 'accepted';
  matchScore: number;
  mentorName?: string;
}

const mockApplications: ApplicationRow[] = [
  {
    id: 'app-1',
    title: 'Frontend Web Development Intern',
    company: 'TechCorp India',
    appliedDate: '2026-08-01',
    status: 'mentor_assigned',
    matchScore: 94,
    mentorName: 'Mr. Vijay',
  },
  {
    id: 'app-2',
    title: 'Full Stack Engineering Intern',
    company: 'InnovateTech Solutions',
    appliedDate: '2026-07-28',
    status: 'hr_shortlisted',
    matchScore: 88,
  },
  {
    id: 'app-3',
    title: 'UI/UX Design & Frontend Intern',
    company: 'CreativeStudio',
    appliedDate: '2026-07-20',
    status: 'ai_reviewed',
    matchScore: 76,
  },
  {
    id: 'app-4',
    title: 'Data Science & ML Intern',
    company: 'AnalyticsPro',
    appliedDate: '2026-07-15',
    status: 'pending',
    matchScore: 65,
  },
];

export default function StudentApplicationsPage() {
  const columns: Column<ApplicationRow>[] = [
    {
      key: 'title',
      header: 'Internship Role',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{item.company}</p>
        </div>
      ),
    },
    {
      key: 'matchScore',
      header: 'AI Match Score',
      render: (item) => (
        <Badge variant="purple" className="font-semibold text-xs">
          <Sparkles className="h-3 w-3 mr-1" /> {item.matchScore}%
        </Badge>
      ),
    },
    {
      key: 'appliedDate',
      header: 'Applied Date',
      render: (item) => <span className="text-xs text-slate-600 font-mono">{item.appliedDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const variants: Record<string, 'default' | 'purple' | 'success' | 'warning'> = {
          pending: 'warning',
          ai_reviewed: 'purple',
          hr_shortlisted: 'default',
          mentor_assigned: 'success',
          accepted: 'success',
        };
        return (
          <Badge variant={variants[item.status] || 'default'} className="capitalize text-xs">
            {item.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'mentorName',
      header: 'Assigned Mentor',
      render: (item) =>
        item.mentorName ? (
          <span className="text-xs font-semibold text-slate-800">{item.mentorName}</span>
        ) : (
          <span className="text-xs text-slate-400 italic">Not assigned yet</span>
        ),
    },
    {
      key: 'action',
      header: 'Actions',
      render: (item) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={item.status === 'mentor_assigned' ? '/student/mentor' : '/student/tasks'}>
            View Details <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Applications</h1>
        <p className="text-xs text-slate-500">Track all your submitted internship applications and status updates</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={mockApplications}
            columns={columns}
            searchKey="title"
            searchPlaceholder="Search applications by title..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
