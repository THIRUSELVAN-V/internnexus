'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { MentorAssignment, Task, Application, Internship } from '@/lib/types';
import { filterHRInternships, filterHRAssignments } from '@/lib/utils/hr';

interface InternRow {
  id: string;
  studentId: string;
  name: string;
  role: string;
  mentorName: string;
  startDate: string;
  progress: number;
  tasksCompleted: string;
}

export default function HRInternsPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [internRows, setInternRows] = useState<InternRow[]>([]);

  useEffect(() => {
    async function fetchActiveInterns() {
      if (!profile?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [assignments, tasks, applications, internships] = await Promise.all([
          getDocuments<MentorAssignment>('mentorAssignments'),
          getDocuments<Task>('tasks'),
          getDocuments<Application>('applications'),
          getDocuments<Internship>('internships'),
        ]);

        const myInternships = filterHRInternships(internships, profile);
        const myAssignments = filterHRAssignments(assignments, myInternships, profile);

        const rows: InternRow[] = myAssignments.map((assign) => {
          const studentTasks = tasks.filter((t) => t.studentId === assign.studentId);
          const completedCount = studentTasks.filter((t) => t.status === 'approved').length;
          const totalCount = studentTasks.length;
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          const app = applications.find(
            (a) => a.studentId === assign.studentId && a.internshipId === assign.internshipId
          ) || applications.find((a) => a.studentId === assign.studentId);

          return {
            id: assign.id,
            studentId: assign.studentId,
            name: assign.studentName,
            role: app?.internshipTitle || 'Intern',
            mentorName: assign.mentorName,
            startDate: assign.startDate || '-',
            progress: pct,
            tasksCompleted: `${completedCount} / ${totalCount}`,
          };
        });

        setInternRows(rows);
      } catch (err) {
        console.error('Error fetching active interns:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveInterns();
  }, [profile]);

  const columns: Column<InternRow>[] = [
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
      header: 'Tasks Progress Velocity',
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
    {
      key: 'status',
      header: 'Cohort Status',
      render: (item) => (
        <Badge variant={item.progress >= 100 ? 'success' : 'purple'} className="capitalize text-xs font-semibold">
          {item.progress >= 100 ? 'Evaluation Complete' : 'Active Mentorship'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Active Interns Monitoring</h1>
        <p className="text-xs text-slate-500">Track task completion velocity, milestone progress, and mentor assignment across active intern cohorts</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching active intern cohorts...</span>
            </div>
          ) : (
            <DataTable
              data={internRows}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search active interns..."
              emptyMessage="No active interns found."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
