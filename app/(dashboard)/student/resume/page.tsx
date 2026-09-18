'use client';

import React, { useState, useEffect } from 'react';
import FileUpload from '@/components/shared/FileUpload';
import ResumeAnalysisCard from '@/components/ai/ResumeAnalysisCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { analyzeResume } from '@/lib/ai/resumeAnalysis';
import type { ResumeAnalysis, StudentProfile } from '@/lib/types';
import { Sparkles, FileText, Download, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firebase/auth';

export default function StudentResumePage() {
  const { profile, refreshProfile } = useAuthContext();
  const student = profile as StudentProfile;

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(student?.resumeAnalysis || null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student?.resumeAnalysis) {
      setAnalysis(student.resumeAnalysis);
    }
  }, [student]);

  const handleFileSelect = async (file: File) => {
    setAnalyzing(true);
    setSaved(false);
    setError(null);
    try {
      // Analyze file in memory via server-side AI route (no storage upload)
      const res = await analyzeResume(file);
      setAnalysis(res);

      if (profile?.uid) {
        // Save ONLY structured metadata to Firestore (no binary files or URLs)
        await updateUserProfile(profile.uid, {
          resumeAnalysis: res,
          skills: res.skills,
          resumeAnalyzed: true,
          resumeAnalyzedAt: new Date().toISOString(),
        } as Partial<StudentProfile>);

        if (refreshProfile) {
          await refreshProfile();
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      }
    } catch (err: unknown) {
      console.error('Error analyzing resume:', err);
      const msg = err instanceof Error ? err.message : 'Failed to analyze resume';
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Resume & AI Skill Parser</h1>
        <p className="text-xs text-slate-500">
          Upload a PDF or DOCX resume to extract structured skills, projects, and education. Resume text is analyzed in memory and never stored in Firebase Storage.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> Resume analysis & extracted skills updated in your student profile!
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">Select Resume File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              label="Select PDF or DOCX"
              description="PDF or DOCX format (Max 5MB)"
              accept=".pdf,.docx,.doc"
              onFileSelect={handleFileSelect}
            />

            {analyzing && (
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 text-center space-y-2">
                <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs font-semibold text-purple-900">AI Processing Resume...</p>
                <p className="text-[11px] text-purple-600">Extracting technical skills, languages, frameworks & projects</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero File Storage Policy Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Files are processed temporarily in server memory for skill extraction and discarded immediately. No binary files or Base64 blobs are stored in Firebase.
              </p>
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
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No AI Analysis Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Select a resume document on the left to extract skills, programming languages, frameworks, education, and project portfolio.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
