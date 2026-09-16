'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/shared/FileUpload';
import SubmissionAnalysisCard from '@/components/ai/SubmissionAnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { analyzeSubmission } from '@/lib/ai/submissionAnalysis';
import type { Submission, SubmissionAnalysis } from '@/lib/types';
import { Upload, Sparkles, CheckCircle2, Star, Loader2, FileText } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument } from '@/lib/firebase/firestore';

export default function StudentSubmissionsPage() {
  const { profile } = useAuthContext();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SubmissionAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const docs = await getDocuments<Submission>('submissions');
      const mySubmissions = profile?.uid
        ? docs.filter((s) => s.studentId === profile.uid)
        : docs;
      setSubmissions(mySubmissions);

      if (mySubmissions.length > 0 && mySubmissions[0].aiAnalysis) {
        setAnalysis(mySubmissions[0].aiAnalysis);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [profile]);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setAnalyzing(true);
    try {
      const res = await analyzeSubmission([file.name], notes);
      setAnalysis(res);
    } catch (err) {
      console.error('Error analyzing submission:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNewSubmission = async () => {
    if (!uploadedFile || !profile?.uid) return;
    try {
      const newSub: Omit<Submission, 'id'> = {
        taskId: 'tsk-3',
        taskTitle: 'API Integration & State Management',
        internshipId: 'int-1',
        studentId: profile.uid,
        studentName: profile.displayName || 'Student',
        mentorId: 'men-1',
        fileURLs: [`https://storage.googleapis.com/demo/${uploadedFile.name}`],
        fileTypes: [uploadedFile.name.endsWith('.pdf') ? 'pdf' : 'zip'],
        description: notes || 'Task deliverable submission with AI analysis.',
        status: 'submitted',
        aiAnalysis: analysis || undefined,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createDocument('submissions', newSub);
      setUploadedFile(null);
      setNotes('');
      fetchSubmissions();
    } catch (err) {
      console.error('Error creating submission:', err);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Task Submission & AI Quality Check</h1>
        <p className="text-xs text-slate-500">Upload task deliverables for automated AI checks, code quality analysis, and mentor ratings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Submit New Deliverable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Upload Code / Report"
              description="PDF, ZIP or TS files (Max 25MB)"
              onFileSelect={handleFileSelect}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Submission Notes</label>
              <Textarea
                placeholder="Add brief notes for your mentor regarding this submission..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {analyzing && (
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 text-center space-y-2">
                <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs font-semibold text-purple-900">AI Analyzing Deliverable...</p>
                <p className="text-[11px] text-purple-600">Evaluating completion status & code quality</p>
              </div>
            )}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!uploadedFile || analyzing}
              onClick={handleNewSubmission}
            >
              <Upload className="h-4 w-4 mr-1.5" /> Submit to Mentor
            </Button>
          </CardContent>
        </Card>

        {/* AI Analysis View */}
        <div className="md:col-span-2 space-y-4">
          {analysis ? (
            <SubmissionAnalysisCard analysis={analysis} />
          ) : (
            <Card className="border-dashed border-slate-200">
              <CardContent className="py-16 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Submission Uploaded Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Upload your task ZIP or PDF file to run instant AI checks and view completion feedback.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Past Submissions List */}
          {submissions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-900">Submission History</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-bold text-slate-900">{sub.taskTitle || 'Week Deliverable'}</span>
                        <Badge variant={sub.status === 'approved' ? 'success' : 'purple'} className="text-[10px] capitalize">
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{sub.description}</p>
                    </div>

                    {sub.mentorRating && (
                      <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {sub.mentorRating}.0
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
