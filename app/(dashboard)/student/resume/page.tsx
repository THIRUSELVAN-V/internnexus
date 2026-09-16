'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/shared/FileUpload';
import ResumeAnalysisCard from '@/components/ai/ResumeAnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyzeResume } from '@/lib/ai/resumeAnalysis';
import type { ResumeAnalysis, StudentProfile } from '@/lib/types';
import { Sparkles, FileText, Download, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firebase/auth';

export default function StudentResumePage() {
  const { profile, refreshProfile } = useAuthContext();
  const student = profile as StudentProfile;

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(student?.resumeAnalysis || null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (student?.resumeAnalysis) {
      setAnalysis(student.resumeAnalysis);
    }
  }, [student]);

  const handleFileSelect = async (file: File) => {
    setAnalyzing(true);
    setSaved(false);
    try {
      const res = await analyzeResume(file);
      setAnalysis(res);

      if (profile?.uid) {
        await updateUserProfile(profile.uid, {
          resumeAnalysis: res,
          skills: res.skills,
          resumeURL: `https://storage.googleapis.com/demo-resumes/${file.name}`,
        } as Partial<StudentProfile>);

        if (refreshProfile) {
          await refreshProfile();
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err) {
      console.error('Error analyzing resume:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Resume & AI Skill Parser</h1>
        <p className="text-xs text-slate-500">Upload your PDF resume to generate AI skill extractions, experience summaries, and match scores</p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Resume analysis & extracted skills saved to your student profile!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Upload PDF Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Upload PDF Resume"
              description="PDF format (Max 10MB)"
              onFileSelect={handleFileSelect}
            />

            {analyzing && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center space-y-2">
                <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs font-semibold text-indigo-900">AI Processing Resume...</p>
                <p className="text-[11px] text-indigo-600">Extracting technical skills, projects & experience</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-xs text-slate-500">Active Resume Record:</p>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">
                    {student?.resumeURL ? student.resumeURL.split('/').pop() : 'resume_student.pdf'}
                  </span>
                </div>
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
