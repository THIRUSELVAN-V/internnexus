'use client';

import React from 'react';
import { Target, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export interface CandidateMatchProps {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  recommendation: 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';
}

export default function CandidateMatchCard({
  matchScore,
  matchedSkills,
  missingSkills,
  reasoning,
  recommendation,
}: CandidateMatchProps) {
  const recLabels = {
    strong_match: { label: 'Strong Match', variant: 'success' as const },
    good_match: { label: 'Good Match', variant: 'default' as const },
    partial_match: { label: 'Partial Match', variant: 'warning' as const },
    weak_match: { label: 'Weak Match', variant: 'destructive' as const },
  };

  return (
    <Card className="border-sky-100 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
            <Target className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">AI Candidate Match</CardTitle>
            <p className="text-xs text-slate-500">Requirements vs Candidate Resume</p>
          </div>
        </div>
        <Badge variant={recLabels[recommendation].variant} className="font-semibold px-3 py-1 text-xs">
          {recLabels[recommendation].label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {/* Match Percentage */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Overall Match Percentage</span>
          <span className="text-xl font-bold text-blue-600">{matchScore}%</span>
        </div>
        <Progress value={matchScore} color={matchScore >= 80 ? 'green' : matchScore >= 60 ? 'blue' : 'amber'} className="h-2.5" />

        {/* Reasoning */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-900 font-semibold block mb-0.5">AI Reasoning:</strong>
          {reasoning}
        </div>

        {/* Matched vs Missing Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-green-200 bg-green-50/40 p-3">
            <div className="flex items-center gap-1.5 mb-2 font-semibold text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Matched Skills ({matchedSkills.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {matchedSkills.map((sk) => (
                <span key={sk} className="rounded-md bg-white border border-green-200 px-2 py-0.5 text-xs text-green-800 font-medium">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
            <div className="flex items-center gap-1.5 mb-2 font-semibold text-amber-800">
              <XCircle className="h-4 w-4 text-amber-600" /> Missing / Gap Skills ({missingSkills.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {missingSkills.length > 0 ? (
                missingSkills.map((sk) => (
                  <span key={sk} className="rounded-md bg-white border border-amber-200 px-2 py-0.5 text-xs text-amber-800 font-medium">
                    {sk}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">None. All requirements met!</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
