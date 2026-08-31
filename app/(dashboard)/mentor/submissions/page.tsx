'use client';

import React, { useState } from 'react';
import SubmissionAnalysisCard from '@/components/ai/SubmissionAnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles, FileText, Download } from 'lucide-react';

const mockSubmissionData = {
  completionStatus: 'complete' as const,
  completionPercentage: 92,
  summary: 'Submission received with 2 files (UI_Components.zip, documentation.pdf). Implementation covers React components with TypeScript types.',
  missingSections: ['Optional: Integration test log'],
  strengths: ['Clean code layout', 'Thorough documentation included'],
  suggestions: ['Extract magic numbers to constants'],
  codeQuality: 9,
  documentQuality: 8.5,
  analyzedAt: new Date().toISOString(),
};

export default function MentorSubmissionsPage() {
  const [feedback, setFeedback] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Review Student Submissions</h1>
        <p className="text-xs text-slate-500">Evaluate deliverable quality with AI assistance and give manual approval or feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: AI Submission Analysis */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold text-green-600 uppercase">Submission Details</span>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">
                Week 2: Component Development & UI Integration
              </CardTitle>
              <p className="text-xs text-slate-500">Submitted by <strong className="text-slate-900">Thiru</strong> · 2 days ago</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">UI_Components_Submission.zip</span>
                <Button size="sm" variant="ghost" className="h-7"><Download className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>

          <SubmissionAnalysisCard analysis={mockSubmissionData} />
        </div>

        {/* Right Column: Mentor Decision Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Mentor Evaluation & Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mentor Feedback / Comments</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write constructive feedback for the student..."
                className="min-h-[120px]"
              />
            </div>

            {decision ? (
              <div className={`p-4 rounded-xl border text-center font-bold text-sm ${decision === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                Submission {decision === 'approved' ? 'Approved!' : 'Rejected for Revision.'}
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setDecision('rejected')} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                  <X className="h-4 w-4 mr-1.5" /> Request Revision
                </Button>
                <Button onClick={() => setDecision('approved')} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-1.5" /> Approve Submission
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
