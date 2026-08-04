'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResumeAnalysisCard from '@/components/ai/ResumeAnalysisCard';
import CandidateMatchCard from '@/components/ai/CandidateMatchCard';
import { UserCheck, CheckCircle2, ArrowLeft, Download } from 'lucide-react';

const mockAnalysisData = {
  skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Python', 'Git', 'REST APIs', 'SQL'],
  technicalSkills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'Git'],
  softSkills: ['Problem Solving', 'Team Collaboration', 'Communication', 'Time Management'],
  education: [
    { degree: 'B.Tech in Computer Science & Engineering', institution: 'Indian Institute of Technology, Madras', year: 2026, gpa: 8.9 }
  ],
  experience: [
    { title: 'Frontend Developer Intern', company: 'InnovateTech Solutions', duration: '3 months', description: 'Built React UI components and optimized frontend bundle size.' }
  ],
  projects: [
    { name: 'AI Task Planner', description: 'Smart auto-scheduling web app using OpenAI API.', technologies: ['React', 'Node.js'] }
  ],
  certifications: ['AWS Cloud Practitioner', 'Meta Front-End Developer'],
  overallScore: 94,
  summary: 'Outstanding Computer Science candidate with high technical proficiency in TypeScript, React, and REST APIs.',
  strengths: ['Top 5% match score for Frontend Development Role', 'Proven project portfolio in React ecosystem'],
  improvements: ['Could gain additional experience with Kubernetes container orchestration'],
  analyzedAt: new Date().toISOString(),
};

export default function HRApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/applicants"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Applicants</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" /> Download Resume PDF</Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
            <Link href="/hr/mentor-recommendation"><UserCheck className="h-3.5 w-3.5 mr-1" /> Assign Mentor</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResumeAnalysisCard analysis={mockAnalysisData} />
        <CandidateMatchCard
          matchScore={94}
          matchedSkills={['React', 'TypeScript', 'Tailwind CSS', 'Git']}
          missingSkills={['GraphQL']}
          reasoning="The candidate satisfies 4 out of 5 core technical requirements for the Frontend Developer Intern role."
          recommendation="strong_match"
        />
      </div>
    </div>
  );
}
