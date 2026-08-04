'use client';

import React from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MentorTaskRow {
  id: string;
  week: number;
  title: string;
  assignedStudent: string;
  dueDate: string;
  status: 'published' | 'draft' | 'completed';
}

const mockTasks: MentorTaskRow[] = [
  { id: '1', week: 1, title: 'Environment Setup & Codebase Onboarding', assignedStudent: 'John Doe', dueDate: '2026-08-05', status: 'completed' },
  { id: '2', week: 2, title: 'Component Development & UI Integration', assignedStudent: 'John Doe', dueDate: '2026-08-12', status: 'completed' },
  { id: '3', week: 3, title: 'API Integration & State Management', assignedStudent: 'John Doe', dueDate: '2026-08-19', status: 'published' },
];

export default function MentorTasksPage() {
  const columns: Column<MentorTaskRow>[] = [
    {
      key: 'week',
      header: 'Week',
      render: (item) => <Badge variant="outline" className="font-semibold text-xs">Week {item.week}</Badge>,
    },
    {
      key: 'title',
      header: 'Task Title',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">Student: {item.assignedStudent}</p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (item) => <span className="text-xs font-mono text-slate-600">{item.dueDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'completed' ? 'success' : 'default'} className="capitalize text-xs">
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Task Management</h1>
        <p className="text-xs text-slate-500">Manage all published weekly tasks across your assigned mentees</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockTasks} columns={columns} searchKey="title" searchPlaceholder="Search tasks..." />
        </CardContent>
      </Card>
    </div>
  );
}
