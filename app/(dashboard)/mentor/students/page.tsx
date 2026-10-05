'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Star, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { MentorAssignment, Task, Application, StudentProfile } from '@/lib/types';
import { DUMMY_MENTEES } from '@/lib/utils/constants';

interface MenteeRow {
  id: string;
  studentId: string;
  name: string;
  role: string;
  university: string;
  tasksDone: string;
  progress: number;
  rating: number;
}

export default function MentorStudentsPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<MenteeRow[]>([]);

  useEffect(() => {
    async function fetchMenteesData() {
      setLoading(true);
      try {
        const [assignments, tasks, applications, users] = await Promise.all([
          getDocuments<MentorAssignment>('mentorAssignments'),
          getDocuments<Task>('tasks'),
          getDocuments<Application>('applications'),
          getDocuments<StudentProfile>('users'),
        ]);

        const myAssignments = profile?.uid
          ? assignments.filter((a) => a.mentorId === profile.uid)
          : assignments;

        const rows: MenteeRow[] = myAssignments.map((assign) => {
          const studentTasks = tasks.filter((t) => t.studentId === assign.studentId);
          const completedCount = studentTasks.filter((t) => t.status === 'approved').length;
          const totalCount = studentTasks.length;
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          const app = applications.find((a) => a.studentId === assign.studentId);
          const stdUser = users.find((u) => u.uid === assign.studentId);

          return {
            id: assign.id,
            studentId: assign.studentId,
            name: assign.studentName,
            role: app?.internshipTitle || 'Intern',
            university: stdUser?.university || '-',
            tasksDone: `${completedCount} / ${totalCount}`,
            progress: pct,
            rating: 5.0,
          };
        });

        setMentees(rows);
      } catch (err) {
        console.error('Error fetching mentees:', err);
        setMentees([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMenteesData();
  }, [profile]);

  const columns: Column<MenteeRow>[] = [
    {
      key: 'name',
      header: 'Student Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.university}</p>
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
      header: 'Task Velocity Progress',
      render: (item) => (
        <div className="w-36 space-y-1">
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
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/mentor/task-generator">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-purple-600" /> AI Task
            </Link>
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs" asChild>
            <Link href="/mentor/evaluation">Final Evaluation</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Student Mentees</h1>
        <p className="text-xs text-slate-500">Overview of active student mentees assigned under your corporate mentorship</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-green-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching assigned mentees...</span>
            </div>
          ) : (
            <DataTable data={mentees} columns={columns} searchKey="name" searchPlaceholder="Search student mentees..." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
