'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, AlertCircle, Award, Briefcase, GraduationCap, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ResumeAnalysis } from '@/lib/types';

export default function ResumeAnalysisCard({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <Card className="border-indigo-100 bg-gradient-to-b from-white to-slate-50/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Brain className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">AI Resume Analysis</CardTitle>
            <p className="text-xs text-slate-500">Automated extraction & evaluation summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Overall Score:</span>
          <Badge variant="ai" className="text-sm font-bold px-3 py-1">
            {analysis.overallScore} / 100
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-3">
        {/* Score Progress */}
        <div>
          <Progress value={analysis.overallScore} color={analysis.overallScore >= 80 ? 'green' : 'blue'} className="h-2" />
        </div>

        {/* AI Summary */}
        <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5 text-xs text-slate-700 leading-relaxed">
          <strong className="text-indigo-900 font-semibold block mb-1">AI Executive Summary:</strong>
          {analysis.summary}
        </div>

        {/* Skills grid */}
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-700">
            <Code className="h-3.5 w-3.5 text-blue-600" /> Extracted Skills ({analysis.skills.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="bg-white border-slate-200 text-slate-700 text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Education & Experience Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-1.5 mb-2 font-semibold text-slate-800">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-600" /> Education
            </div>
            {analysis.education.map((edu, idx) => (
              <div key={idx}>
                <p className="font-medium text-slate-900">{edu.degree}</p>
                <p className="text-slate-500">{edu.institution} {edu.gpa ? `· GPA ${edu.gpa}` : ''}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-white">
            <div className="flex items-center gap-1.5 mb-2 font-semibold text-slate-800">
              <Briefcase className="h-3.5 w-3.5 text-indigo-600" /> Experience
            </div>
            {analysis.experience.map((exp, idx) => (
              <div key={idx}>
                <p className="font-medium text-slate-900">{exp.title}</p>
                <p className="text-slate-500">{exp.company} ({exp.duration})</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Strengths
            </p>
            <ul className="space-y-1 text-slate-600">
              {analysis.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-green-500 font-bold">•</span> {str}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Areas for Growth
            </p>
            <ul className="space-y-1 text-slate-600">
              {analysis.improvements.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span> {imp}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
