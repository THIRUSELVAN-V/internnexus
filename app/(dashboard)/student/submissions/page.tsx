'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/shared/FileUpload';
import SubmissionAnalysisCard from '@/components/ai/SubmissionAnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeSubmission } from '@/lib/ai/submissionAnalysis';
import type { SubmissionAnalysis } from '@/lib/types';
import { Upload, Sparkles, CheckCircle2 } from 'lucide-react';

export default function StudentSubmissionsPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SubmissionAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setAnalyzing(true);
    try {
      const res = await analyzeSubmission([file.name]);
      setAnalysis(res);
    } catch {
      // fallback
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Task Submission & AI Review</h1>
        <p className="text-xs text-slate-500">Upload your PDF, ZIP or code deliverables for automated AI checks and mentor review</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Submit Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Upload Code / Report"
              description="PDF, ZIP or JS/TS files"
              onFileSelect={handleFileSelect}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Submission Notes</label>
              <Textarea placeholder="Add brief notes for your mentor regarding this submission..." className="min-h-[80px]" />
            </div>

            {analyzing && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-center space-y-2">
                <div className="animate-spin h-5 w-5 border-2 border-rose-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs font-semibold text-rose-900">AI Analyzing Submission...</p>
                <p className="text-[11px] text-rose-600">Evaluating completion status & quality metrics</p>
              </div>
            )}

            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={!uploadedFile}>
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
                <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No Submission Uploaded Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Upload your task ZIP or PDF file to run instant AI checks and view completion feedback.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
