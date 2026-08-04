'use client';

import React from 'react';
import ProgressTimeline, { TimelineStep } from '@/components/shared/ProgressTimeline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle2 } from 'lucide-react';

const steps: TimelineStep[] = [
  { id: '1', title: 'Student Registration & Profile Setup', description: 'Account created and profile details verified', date: '2026-07-01', status: 'completed' },
  { id: '2', title: 'AI Resume Analysis & Skill Extraction', description: 'Resume uploaded and processed by AI engine', date: '2026-07-02', status: 'completed' },
  { id: '3', title: 'Internship Application & Candidate Matching', description: 'Applied for Frontend Development Intern position', date: '2026-07-05', status: 'completed' },
  { id: '4', title: 'HR Shortlisting & Selection', description: 'Shortlisted by TechCorp India HR team', date: '2026-07-10', status: 'completed' },
  { id: '5', title: 'Industrial Mentor Assignment', description: 'Assigned to Dr. Rajesh Kumar (Principal Architect)', date: '2026-07-15', status: 'completed' },
  { id: '6', title: 'Weekly Internship Tasks Execution', description: 'Completed 12 out of 15 assigned deliverables', date: 'In Progress', status: 'current' },
  { id: '7', title: 'Final Evaluation & HR Confirmation', description: 'Final mentor review and performance grading', status: 'upcoming' },
  { id: '8', title: 'Certificate Generation & Issuance', description: 'Verified certificate generation and download', status: 'upcoming' },
];

export default function StudentProgressPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Internship Progress</h1>
        <p className="text-xs text-slate-500">Track your overall internship lifecycle progress from application to completion</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Overall Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="text-4xl font-bold text-blue-600">75%</div>
            <Progress value={75} color="blue" className="h-2.5" />
            <p className="text-xs text-slate-500">6 out of 8 milestone stages completed successfully</p>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-left">
              <div className="flex justify-between text-slate-600">
                <span>Start Date:</span>
                <span className="font-semibold text-slate-900">Jul 15, 2026</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Est. End Date:</span>
                <span className="font-semibold text-slate-900">Oct 15, 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline View */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Lifecycle Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressTimeline steps={steps} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
