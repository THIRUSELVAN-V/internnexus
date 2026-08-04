'use client';

import React from 'react';
import { UserCheck, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MentorRecommendation } from '@/lib/types';

export interface MentorRecommendationCardProps {
  recommendations: MentorRecommendation[];
  selectedMentorId?: string;
  onSelectMentor: (mentorId: string) => void;
}

export default function MentorRecommendationCard({
  recommendations,
  selectedMentorId,
  onSelectMentor,
}: MentorRecommendationCardProps) {
  return (
    <Card className="border-purple-100 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
            <UserCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">AI Mentor Recommendation</CardTitle>
            <p className="text-xs text-slate-500">Based on domain expertise, student skills & workload</p>
          </div>
        </div>
        <Badge variant="purple" className="text-xs font-semibold">
          <Sparkles className="h-3 w-3 mr-1" /> Smart Rank
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {recommendations.map((rec) => {
          const isSelected = selectedMentorId === rec.mentorId;
          return (
            <div
              key={rec.mentorId}
              className={`rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-purple-400 bg-purple-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-700 text-sm">
                    #{rec.rank}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{rec.mentorName}</h4>
                    <p className="text-xs text-slate-500">{rec.designation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs font-semibold">
                    {rec.matchScore}% Match
                  </Badge>
                  <Button
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => onSelectMentor(rec.mentorId)}
                    className={isSelected ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : 'Assign'}
                  </Button>
                </div>
              </div>

              {/* Workload & Expertise */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium">
                  Workload: {rec.currentWorkload}/{rec.maxMentees} mentees
                </span>
                {rec.expertise.map((exp) => (
                  <span key={exp} className="rounded-md bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5">
                    {exp}
                  </span>
                ))}
              </div>

              {/* Reasoning */}
              <p className="mt-2 text-xs text-slate-500 italic bg-white/80 rounded-lg p-2 border border-slate-100">
                &quot;{rec.reasoning}&quot;
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
