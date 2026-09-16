'use client';

import React, { useEffect, useState } from 'react';
import ProgressTimeline, { TimelineStep } from '@/components/shared/ProgressTimeline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { Task, Application, Certificate } from '@/lib/types';

export default function StudentProgressPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hasCert, setHasCert] = useState(false);

  useEffect(() => {
    async function fetchProgress() {
      setLoading(true);
      try {
        const [taskDocs, certDocs] = await Promise.all([
          getDocuments<Task>('tasks'),
          getDocuments<Certificate>('certificates'),
        ]);

        const myTasks = profile?.uid ? taskDocs.filter((t) => t.studentId === profile.uid) : taskDocs;
        setTasks(myTasks);

        const myCert = certDocs.some((c) => c.studentId === profile?.uid);
        setHasCert(myCert);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [profile]);

  const completedTasksCount = tasks.filter((t) => t.status === 'approved').length;
  const totalTasksCount = tasks.length || 4;
  const taskProgressPct = Math.round((completedTasksCount / totalTasksCount) * 100);

  const overallProgressPct = hasCert
    ? 100
    : Math.min(95, Math.round(50 + (taskProgressPct * 0.45)));

  const steps: TimelineStep[] = [
    { id: '1', title: 'Student Registration & Profile Setup', description: 'Account created and profile details verified', date: 'Jul 2026', status: 'completed' },
    { id: '2', title: 'AI Resume Analysis & Skill Extraction', description: 'Resume uploaded and processed by AI engine', date: 'Jul 2026', status: 'completed' },
    { id: '3', title: 'Internship Application & Candidate Matching', description: 'Applied for internship position with AI match score', date: 'Aug 2026', status: 'completed' },
    { id: '4', title: 'HR Shortlisting & Selection', description: 'Shortlisted by company HR team', date: 'Aug 2026', status: 'completed' },
    { id: '5', title: 'Industrial Mentor Assignment', description: 'Assigned to corporate industrial mentor', date: 'Aug 2026', status: 'completed' },
    {
      id: '6',
      title: 'Weekly Internship Tasks Execution',
      description: `Completed ${completedTasksCount} of ${totalTasksCount} assigned deliverables (${taskProgressPct}%)`,
      status: taskProgressPct >= 100 ? 'completed' : 'current',
    },
    {
      id: '7',
      title: 'Final Evaluation & Performance Review',
      description: 'Final mentor review and 5-star performance grading',
      status: taskProgressPct >= 100 ? 'current' : 'upcoming',
    },
    {
      id: '8',
      title: 'Digital Certificate Generation & Issuance',
      description: 'Verified completion certificate generation',
      status: hasCert ? 'completed' : 'upcoming',
    },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Internship Progress Matrix</h1>
        <p className="text-xs text-slate-500">Track your overall internship lifecycle progress from application to final certificate issuance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Calculating milestone progress...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-900">Overall Lifecycle Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-4xl font-bold text-blue-600">{overallProgressPct}%</div>
              <Progress value={overallProgressPct} color="blue" className="h-2.5" />
              <p className="text-xs text-slate-500">
                {completedTasksCount} of {totalTasksCount} weekly tasks completed
              </p>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-left">
                <div className="flex justify-between text-slate-600">
                  <span>Task Velocity:</span>
                  <span className="font-semibold text-slate-900">{taskProgressPct}% Completed</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Certificate Status:</span>
                  <span className="font-semibold text-slate-900">{hasCert ? 'Issued' : 'Pending Tasks'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline View */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Milestone Stage Tracker</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressTimeline steps={steps} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
