'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/shared/FileUpload';
import ResumeAnalysisCard from '@/components/ai/ResumeAnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyzeResume } from '@/lib/ai/resumeAnalysis';
import type { ResumeAnalysis } from '@/lib/types';
import { Sparkles, FileText, Download } from 'lucide-react';

export default function StudentResumePage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleFileSelect = async (file: File) => {
    setAnalyzing(true);
    try {
      const res = await analyzeResume(file);
      setAnalysis(res);
    } catch {
      // fallback mock
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Resume & AI Summary</h1>
        <p className="text-xs text-slate-500">Upload your resume to generate an instant AI analysis and skill extraction card</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Upload Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Upload PDF Resume"
              description="PDF format recommended (Max 10MB)"
              onFileSelect={handleFileSelect}
            />

            {analyzing && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center space-y-2">
                <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs font-semibold text-indigo-900">AI Processing Resume...</p>
                <p className="text-[11px] text-indigo-600">Extracting skills, projects & experience</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">Current Active Resume:</p>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 truncate">resume_john_doe.pdf</span>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Result Column */}
        <div className="md:col-span-2 space-y-4">
          {analysis ? (
            <ResumeAnalysisCard analysis={analysis} />
          ) : (
            <Card className="border-dashed border-slate-200">
              <CardContent className="py-16 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No AI Analysis Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Upload a new resume on the left to extract skills, education, projects, and an overall readiness score.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
