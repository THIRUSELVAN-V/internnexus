'use client';

import React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils/formatters';

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  date?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export default function ProgressTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {steps.map((step) => {
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {/* Step Bullet */}
            <div
              className={cn(
                'absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white transition-colors',
                isCompleted && 'border-green-600 bg-green-600 text-white',
                isCurrent && 'border-blue-600 text-blue-600 ring-4 ring-blue-50',
                !isCompleted && !isCurrent && 'border-slate-300 text-slate-300'
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <div className="h-2 w-2 rounded-full bg-blue-600" />
              ) : (
                <Circle className="h-2 w-2 text-slate-300" />
              )}
            </div>

            {/* Step Details */}
            <div className="flex-1 rounded-xl border border-slate-100 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h4 className={cn('text-sm font-semibold', isCurrent ? 'text-blue-700' : 'text-slate-900')}>
                  {step.title}
                </h4>
                {step.date && <span className="text-xs text-slate-400 font-mono">{step.date}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
