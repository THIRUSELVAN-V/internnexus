'use client';

import React, { useEffect, useState } from 'react';
import ProgressTimeline, { TimelineStep } from '@/components/shared/ProgressTimeline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { Task, Application, Certificate, MentorAssignment, StudentProfile } from '@/lib/types';
import { getStudentLifecycleState, calculateTaskProgress } from '@/lib/utils/constants';

export default function StudentProgressPage() {
  const { profile } = useAuthContext();
  const student = profile as StudentProfile;
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [mentorAssignment, setMentorAssignment] = useState<MentorAssignment | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    async function fetchProgress() {
      setLoading(true);
      try {
        const [taskDocs, certDocs, appDocs, mentorDocs] = await Promise.all([
          getDocuments<Task>('tasks'),
          getDocuments<Certificate>('certificates'),
          getDocuments<Application>('applications'),
          getDocuments<MentorAssignment>('mentorAssignments'),
        ]);

        const myTasks = profile?.uid ? taskDocs.filter((t) => t.studentId === profile.uid) : [];
        const myCerts = profile?.uid ? certDocs.filter((c) => c.studentId === profile.uid) : [];
        const myApps = profile?.uid ? appDocs.filter((a) => a.studentId === profile.uid) : [];
        const myMentor = profile?.uid ? mentorDocs.find((m) => m.studentId === profile.uid) || null : null;

        setTasks(myTasks);
        setCertificates(myCerts);
        setApplications(myApps);
        setMentorAssignment(myMentor);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [profile]);

  const taskStats = calculateTaskProgress(tasks);
  const lifecycleState = getStudentLifecycleState({
    applications,
    mentorAssignment,
    certificates,
  });

  const hasCert = certificates.length > 0;

  // Real overall progress calculation based on actual lifecycle milestones and tasks
  let overallProgressPct = 0;
  if (lifecycleState === 'completed' || hasCert) {
    overallProgressPct = 100;
  } else if (lifecycleState === 'mentor_assigned') {
    // 60% base for mentor assignment + task completion ratio * 35%
    overallProgressPct = 60 + Math.round((taskStats.percentage * 0.35));
  } else if (lifecycleState === 'selected') {
    overallProgressPct = 50;
  } else if (lifecycleState === 'shortlisted') {
    overallProgressPct = 35;
  } else if (lifecycleState === 'applied') {
    overallProgressPct = 20;
  } else if (student?.resumeAnalyzed) {
    overallProgressPct = 10;
  } else {
    overallProgressPct = 5;
  }

  const steps: TimelineStep[] = [
    {
      id: '1',
      title: 'Student Registration & Profile Setup',
      description: profile?.displayName ? `Account created for ${profile.displayName}` : 'Profile registered',
      status: 'completed',
    },
    {
      id: '2',
      title: 'AI Resume Analysis & Skill Extraction',
      description: student?.resumeAnalyzed
        ? 'Resume processed and technical skills extracted'
        : 'Upload resume to extract structured technical skills',
      status: student?.resumeAnalyzed ? 'completed' : 'upcoming',
    },
    {
      id: '3',
      title: 'Internship Application Submission',
      description: applications.length > 0
        ? `${applications.length} internship application(s) submitted`
        : 'Browse open roles and submit an application',
      status: applications.length > 0 ? 'completed' : 'upcoming',
    },
    {
      id: '4',
      title: 'HR Shortlisting & Candidate Selection',
      description: ['shortlisted', 'selected', 'mentor_assigned', 'completed'].includes(lifecycleState)
        ? 'Candidate application shortlisted by HR'
        : 'Pending review by company talent acquisition',
      status: ['shortlisted', 'selected', 'mentor_assigned', 'completed'].includes(lifecycleState)
        ? 'completed'
        : applications.length > 0 ? 'current' : 'upcoming',
    },
    {
      id: '5',
      title: 'Industrial Mentor Assignment',
      description: mentorAssignment
        ? `Mentored by ${mentorAssignment.mentorName}`
        : lifecycleState === 'selected'
        ? 'HR is matching an industrial mentor for your internship'
        : 'Industrial mentor assigned after HR selection',
      status: ['mentor_assigned', 'completed'].includes(lifecycleState)
        ? 'completed'
        : lifecycleState === 'selected' ? 'current' : 'upcoming',
    },
    {
      id: '6',
      title: 'Weekly Internship Tasks & Deliverables',
      description: tasks.length > 0
        ? `Completed ${taskStats.completed} of ${taskStats.total} assigned deliverables (${taskStats.percentage}%)`
        : 'Awaiting task publication from mentor',
      status: lifecycleState === 'completed' || (tasks.length > 0 && taskStats.percentage === 100)
        ? 'completed'
        : lifecycleState === 'mentor_assigned' ? 'current' : 'upcoming',
    },
    {
      id: '7',
      title: 'Digital Certificate Generation & Issuance',
      description: hasCert
        ? 'Official verified digital internship certificate issued'
        : 'Generated upon internship completion',
      status: hasCert ? 'completed' : 'upcoming',
    },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Internship Progress Matrix</h1>
        <p className="text-xs text-slate-500">Track your real internship lifecycle progress from initial application to final certificate issuance</p>
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
                {taskStats.total > 0
                  ? `${taskStats.completed} of ${taskStats.total} assigned tasks completed`
                  : 'No tasks assigned yet'}
              </p>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-left">
                <div className="flex justify-between text-slate-600">
                  <span>Task Velocity:</span>
                  <span className="font-semibold text-slate-900">{taskStats.percentage}% Completed</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current State:</span>
                  <span className="font-semibold text-slate-900 capitalize">{lifecycleState.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Certificate Status:</span>
                  <span className="font-semibold text-slate-900">{hasCert ? 'Issued' : 'Pending Completion'}</span>
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
