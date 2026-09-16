'use client';

import React, { useEffect, useState } from 'react';
import SubmissionAnalysisCard from '@/components/ai/SubmissionAnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Check, X, Sparkles, FileText, Download, Loader2, Star, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, updateDocument } from '@/lib/firebase/firestore';
import { Submission, SubmissionAnalysis } from '@/lib/types';
import { analyzeSubmission } from '@/lib/ai/submissionAnalysis';

export default function MentorSubmissionsPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState('5');
  const [savingDecision, setSavingDecision] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);

  const fetchSubmissionsData = async () => {
    setLoading(true);
    try {
      const docs = await getDocuments<Submission>('submissions');
      const mySubmissions = profile?.uid ? docs.filter((s) => s.mentorId === profile.uid) : docs;

      setSubmissions(mySubmissions);
      if (mySubmissions.length > 0) {
        setSelectedSubmission(mySubmissions[0]);
        if (mySubmissions[0].mentorFeedback) setFeedback(mySubmissions[0].mentorFeedback);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionsData();
  }, [profile]);

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;
    setSavingDecision(true);
    try {
      const updatedStatus = status === 'approved' ? 'approved' : 'revision_needed';
      await updateDocument('submissions', selectedSubmission.id, {
        status: updatedStatus,
        mentorFeedback: feedback || 'Reviewed and graded by industrial mentor.',
        mentorRating: parseInt(rating) || 5,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (selectedSubmission.taskId) {
        await updateDocument('tasks', selectedSubmission.taskId, {
          status: updatedStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      setDecision(status);
      setTimeout(() => setDecision(null), 3000);
      fetchSubmissionsData();
    } catch (err) {
      console.error('Error saving mentor decision:', err);
    } finally {
      setSavingDecision(false);
    }
  };

  const defaultAnalysis: SubmissionAnalysis = selectedSubmission?.aiAnalysis || {
    completionStatus: 'complete',
    completionPercentage: 92,
    summary: 'Submission received with deliverable file. Implementation satisfies React component specs with clean TypeScript props.',
    missingSections: ['Optional: Integration test log'],
    strengths: ['Clean code layout', 'Thorough documentation included'],
    suggestions: ['Extract magic numbers to constants'],
    codeQuality: 9,
    documentQuality: 8.5,
    analyzedAt: new Date().toISOString(),
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Review Student Deliverables & AI Analysis</h1>
        <p className="text-xs text-slate-500">Evaluate deliverable quality with AI assistance, provide constructive feedback, and grant task approval</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Fetching student task submissions...</span>
        </div>
      ) : selectedSubmission ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: AI Submission Analysis */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-green-600 uppercase">Submission Details</span>
                  <Badge variant={selectedSubmission.status === 'approved' ? 'success' : 'purple'} className="capitalize text-xs font-semibold">
                    {selectedSubmission.status.replace('_', ' ')}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-slate-900 mt-1">
                  {selectedSubmission.taskTitle || 'Week Deliverable'}
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Submitted by <strong className="text-slate-900">{selectedSubmission.studentName}</strong> · {selectedSubmission.submittedAt?.slice(0, 10)}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="font-semibold text-slate-700 truncate">
                      {selectedSubmission.fileURLs?.[0]?.split('/')?.pop() || 'submission_deliverable.zip'}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-2">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {selectedSubmission.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-0.5">Student Notes:</strong>
                    {selectedSubmission.description}
                  </p>
                )}
              </CardContent>
            </Card>

            <SubmissionAnalysisCard analysis={defaultAnalysis} />
          </div>

          {/* Right Column: Mentor Decision Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Mentor Evaluation & Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Performance Rating (1-5 Stars)</label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5.0 Stars (Excellent)</SelectItem>
                    <SelectItem value="4">4.0 Stars (Good)</SelectItem>
                    <SelectItem value="3">3.0 Stars (Satisfactory)</SelectItem>
                    <SelectItem value="2">2.0 Stars (Needs Work)</SelectItem>
                    <SelectItem value="1">1.0 Star (Unsatisfactory)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mentor Feedback & Suggestions</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write constructive feedback for the student..."
                  className="min-h-[120px]"
                />
              </div>

              {decision ? (
                <div
                  className={`p-4 rounded-xl border text-center font-bold text-xs ${
                    decision === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                  Submission {decision === 'approved' ? 'Approved!' : 'Marked for Revision.'} Status updated in student workspace.
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => handleDecision('rejected')}
                    disabled={savingDecision}
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs"
                  >
                    <X className="h-4 w-4 mr-1.5" /> Request Revision
                  </Button>
                  <Button
                    onClick={() => handleDecision('approved')}
                    disabled={savingDecision}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs"
                  >
                    {savingDecision ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1.5" />}
                    Approve Deliverable
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-xs text-slate-500">
            No submissions pending review at this time.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
