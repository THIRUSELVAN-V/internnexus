'use client';

import React from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';

interface StudentRow {
  id: string;
  name: string;
  role: string;
  college: string;
  tasksDone: string;
  progress: number;
  rating: number;
}

const mockMentees: StudentRow[] = [
  { id: '1', name: 'Thiru', role: 'Frontend Web Development Intern', college: 'IIT Madras', tasksDone: '12 / 15', progress: 80, rating: 4.8 },
  { id: '2', name: 'Priya Sharma', role: 'Full Stack Engineering Intern', college: 'BITS Pilani', tasksDone: '14 / 16', progress: 88, rating: 5.0 },
  { id: '3', name: 'Rahul Verma', role: 'UI/UX Design & Frontend Intern', college: 'NIT Trichy', tasksDone: '9 / 15', progress: 60, rating: 4.2 },
];

export default function MentorStudentsPage() {
  const columns: Column<StudentRow>[] = [
    {
      key: 'name',
      header: 'Student Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.college}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Internship Role',
      render: (item) => <span className="text-xs text-slate-700 font-medium">{item.role}</span>,
    },
    {
      key: 'tasksDone',
      header: 'Task Progress',
      render: (item) => (
        <div className="w-32 space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span>{item.tasksDone}</span>
            <span>{item.progress}%</span>
          </div>
          <Progress value={item.progress} color="green" className="h-1.5" />
        </div>
      ),
    },
    {
      key: 'rating',
      header: 'Current Performance',
      render: (item) => (
        <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {item.rating} / 5
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/mentor/feedback"><MessageSquare className="h-3.5 w-3.5 mr-1" /> Leave Feedback</Link>
          </Button>
          <Button style={{color:"white"}} size="sm" className="bg-green-600 hover:bg-green-700" asChild>
            <Link href="/mentor/evaluation">Final Evaluation</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Students</h1>
        <p className="text-xs text-slate-500">Overview of active mentees assigned under your mentorship</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockMentees} columns={columns} searchKey="name" searchPlaceholder="Search students..." />
        </CardContent>
      </Card>
    </div>
  );
}
