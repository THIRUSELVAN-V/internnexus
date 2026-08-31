'use client';

import React from 'react';
import ProgressTimeline, { TimelineStep } from '@/components/shared/ProgressTimeline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const mentorSteps: TimelineStep[] = [
  { id: '1', title: 'Mentor Assignment Accepted', description: 'Accepted mentee assignment for Thiru', date: '2026-07-15', status: 'completed' },
  { id: '2', title: 'Week 1 Task Published & Approved', description: 'Environment Setup submission approved', date: '2026-07-22', status: 'completed' },
  { id: '3', title: 'Week 2 Task Published & Approved', description: 'Component Development submission approved with 5/5 feedback', date: '2026-07-29', status: 'completed' },
  { id: '4', title: 'Week 3 Task (In Progress)', description: 'API Integration task currently being executed by student', status: 'current' },
  { id: '5', title: 'Final Evaluation & Certificate Approval', description: 'Pending final review upon week 12 completion', status: 'upcoming' },
];

export default function MentorProgressPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mentee Progress Tracking</h1>
          <p className="text-xs text-slate-500">Track task milestone progress for individual assigned students</p>
        </div>
        <div className="w-64">
          <Select defaultValue="john">
            <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="john">Thiru (Frontend Intern)</SelectItem>
              <SelectItem value="priya">Priya Sharma (Full Stack Intern)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Student Mentorship Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressTimeline steps={mentorSteps} />
        </CardContent>
      </Card>
    </div>
  );
}
