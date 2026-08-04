'use client';

import React from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ActiveInternRow {
  id: string;
  name: string;
  role: string;
  mentorName: string;
  startDate: string;
  progress: number;
  tasksCompleted: string;
}

const mockInterns: ActiveInternRow[] = [
  { id: '1', name: 'John Doe', role: 'Frontend Web Development Intern', mentorName: 'Dr. Rajesh Kumar', startDate: '2026-07-15', progress: 75, tasksCompleted: '12 / 15' },
  { id: '2', name: 'Priya Sharma', role: 'Full Stack Engineering Intern', mentorName: 'Ananya Deshmukh', startDate: '2026-07-01', progress: 85, tasksCompleted: '14 / 16' },
  { id: '3', name: 'Rahul Verma', role: 'UI/UX Design & Frontend Intern', mentorName: 'Vikram Mehta', startDate: '2026-07-10', progress: 60, tasksCompleted: '9 / 15' },
];

export default function HRInternsPage() {
  const columns: Column<ActiveInternRow>[] = [
    {
      key: 'name',
      header: 'Intern Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.role}</p>
        </div>
      ),
    },
    {
      key: 'mentorName',
      header: 'Assigned Mentor',
      render: (item) => <span className="text-xs font-semibold text-slate-800">{item.mentorName}</span>,
    },
    {
      key: 'tasksCompleted',
      header: 'Tasks Progress',
      render: (item) => (
        <div className="w-36 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span>{item.tasksCompleted}</span>
            <span>{item.progress}%</span>
          </div>
          <Progress value={item.progress} color="purple" className="h-1.5" />
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (item) => <span className="text-xs text-slate-600 font-mono">{item.startDate}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Active Interns Monitoring</h1>
        <p className="text-xs text-slate-500">Track task completion velocity and progress across active intern cohorts</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockInterns} columns={columns} searchKey="name" searchPlaceholder="Search active interns..." />
        </CardContent>
      </Card>
    </div>
  );
}
