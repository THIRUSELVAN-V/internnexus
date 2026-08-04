'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckSquare, Upload, ArrowRight, BookOpen } from 'lucide-react';

const mockTasks = [
  {
    id: 'tsk-1',
    week: 1,
    title: 'Environment Setup & Codebase Onboarding',
    dueDate: '2026-08-05',
    status: 'approved',
    description: 'Clone repo, configure local environment variables, and submit starter ticket PR.',
  },
  {
    id: 'tsk-2',
    week: 2,
    title: 'Component Development & UI Integration',
    dueDate: '2026-08-12',
    status: 'approved',
    description: 'Implement reusable dashboard UI components matching Figma design specs.',
  },
  {
    id: 'tsk-3',
    week: 3,
    title: 'API Integration & State Management',
    dueDate: '2026-08-19',
    status: 'in_progress',
    description: 'Connect UI components to REST/GraphQL APIs and manage global async state.',
  },
  {
    id: 'tsk-4',
    week: 4,
    title: 'Performance Optimization & Final Deliverable',
    dueDate: '2026-08-26',
    status: 'pending',
    description: 'Lighthouse audit target 90+, bundle optimization, and demo presentation.',
  },
];

export default function StudentTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Tasks</h1>
        <p className="text-xs text-slate-500">Weekly internship tasks published by your mentor</p>
      </div>

      <div className="space-y-4">
        {mockTasks.map((task) => {
          const isApproved = task.status === 'approved';
          const isInProgress = task.status === 'in_progress';

          return (
            <Card key={task.id} className={isInProgress ? 'border-blue-300 shadow-sm' : ''}>
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold">Week {task.week}</Badge>
                    <Badge
                      variant={isApproved ? 'success' : isInProgress ? 'default' : 'secondary'}
                      className="text-xs capitalize"
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Due {task.dueDate}
                  </span>
                  <Button asChild size="sm" variant={isInProgress ? 'default' : 'outline'}>
                    <Link href="/student/submissions">
                      {isApproved ? 'View Submission' : 'Upload Submission'} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
