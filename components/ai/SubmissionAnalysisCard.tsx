'use client';

import React from 'react';
import { FileSearch, CheckCircle2, AlertTriangle, Lightbulb, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SubmissionAnalysis } from '@/lib/types';

export default function SubmissionAnalysisCard({ analysis }: { analysis: SubmissionAnalysis }) {
  return (
    <Card className="border-rose-100 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
            <FileSearch className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">AI Submission Analysis</CardTitle>
            <p className="text-xs text-slate-500">Automated quality check & section summary</p>
          </div>
        </div>
        <Badge variant={analysis.completionStatus === 'complete' ? 'success' : 'warning'} className="text-xs font-semibold">
          {analysis.completionPercentage}% Complete
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {/* Progress Bar */}
        <div>
          <Progress value={analysis.completionPercentage} color={analysis.completionPercentage >= 80 ? 'green' : 'amber'} className="h-2" />
        </div>

        {/* AI Summary */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900 font-semibold block mb-0.5">Submission Summary:</strong>
          {analysis.summary}
        </div>

        {/* Ratings if available */}
        {(analysis.codeQuality || analysis.documentQuality) && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            {analysis.codeQuality && (
              <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-2.5 flex items-center justify-between">
                <span className="font-semibold text-blue-900 flex items-center gap-1">
                  <Code className="h-3.5 w-3.5 text-blue-600" /> Code Quality
                </span>
                <span className="font-bold text-blue-700">{analysis.codeQuality} / 10</span>
              </div>
            )}
            {analysis.documentQuality && (
              <div className="rounded-lg bg-purple-50/60 border border-purple-100 p-2.5 flex items-center justify-between">
                <span className="font-semibold text-purple-900">Document Quality</span>
                <span className="font-bold text-purple-700">{analysis.documentQuality} / 10</span>
              </div>
            )}
          </div>
        )}

        {/* Strengths & Missing Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Verified Requirements
            </p>
            <ul className="space-y-1 text-slate-600">
              {analysis.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-green-500 font-bold">•</span> {str}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Missing / Incomplete
            </p>
            <ul className="space-y-1 text-slate-600">
              {analysis.missingSections.map((sec, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-amber-500 font-bold">•</span> {sec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3 text-xs">
            <p className="font-semibold text-sky-900 mb-1 flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5 text-sky-600" /> AI Suggestions for Mentor Review
            </p>
            <ul className="space-y-1 text-sky-800">
              {analysis.suggestions.map((sug, idx) => (
                <li key={idx}>• {sug}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
