'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ResumeAnalysisCard from '@/components/ai/ResumeAnalysisCard';
import CandidateMatchCard from '@/components/ai/CandidateMatchCard';
import { UserCheck, CheckCircle2, ArrowLeft, Download, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocument, getDocuments } from '@/lib/firebase/firestore';
import { Application, StudentProfile, Internship, HRProfile } from '@/lib/types';
import { isHROwnedInternship } from '@/lib/utils/hr';

export default function HRApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const applicantId = resolvedParams.id;

  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function loadApplicantData() {
      if (!applicantId) return;
      setLoading(true);
      try {
        const app = await getDocument<Application>('applications', applicantId);
        if (!app) {
          setApplication(null);
          setLoading(false);
          return;
        }

        // Validate HR ownership
        const hr = profile as HRProfile;
        let isOwner = false;
        if (hr?.companyId && app.companyId === hr.companyId) {
          isOwner = true;
        } else if (app.internshipId) {
          const internship = await getDocument<Internship>('internships', app.internshipId);
          if (internship && isHROwnedInternship(internship, profile)) {
            isOwner = true;
          }
        }

        if (!isOwner && profile?.role !== 'admin') {
          setUnauthorized(true);
          setLoading(false);
          return;
        }

        setApplication(app);

        if (app.studentId) {
          const std = await getDocument<StudentProfile>('users', app.studentId);
          setStudent(std);
        }
      } catch (err) {
        console.error('Error fetching applicant details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      loadApplicantData();
    }
  }, [applicantId, profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-sm text-slate-500 font-medium">Loading applicant dossier...</span>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Unauthorized Access</h2>
        <p className="text-xs text-slate-500">You do not have permission to view applicants for this company.</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/hr/applicants">Back to Applicants</Link>
        </Button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Applicant Not Found</h2>
        <p className="text-xs text-slate-500">The requested application record could not be found.</p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/hr/applicants">Back to Applicants</Link>
        </Button>
      </div>
    );
  }

  const analysis = application.aiAnalysis || student?.resumeAnalysis;
  const matchScore = application.matchScore ?? 80;
  const matchedSkills = application.matchedSkills ?? [];
  const missingSkills = application.missingSkills ?? [];

  const recommendation =
    matchScore >= 80 ? 'strong_match' : matchScore >= 65 ? 'good_match' : matchScore >= 50 ? 'partial_match' : 'weak_match';

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/applicants">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Applicants
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
            <Link href={`/hr/mentor-recommendation?applicantId=${application.id}`}>
              <UserCheck className="h-3.5 w-3.5 mr-1" /> Assign Mentor
            </Link>
          </Button>
        </div>
      </div>

      {/* Candidate Overview Banner */}
      <Card className="border-slate-200">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{application.studentName}</h2>
              <Badge variant="purple" className="text-xs capitalize">
                {application.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Applied for <strong className="text-slate-700">{application.internshipTitle}</strong> · {application.studentEmail}
            </p>
          </div>
          {application.appliedAt && (
            <p className="text-[11px] text-slate-400">Applied: {new Date(application.appliedAt).toLocaleDateString()}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analysis ? (
          <ResumeAnalysisCard analysis={analysis} />
        ) : (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="py-16 text-center space-y-2">
              <Sparkles className="h-8 w-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No AI Resume Analysis</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The candidate has not completed an AI resume analysis or no structured resume analysis is attached.
              </p>
            </CardContent>
          </Card>
        )}

        <CandidateMatchCard
          matchScore={matchScore}
          matchedSkills={matchedSkills}
          missingSkills={missingSkills}
          reasoning={
            application.matchReasoning ||
            `Candidate matched ${matchedSkills.length} required skill(s) for the ${application.internshipTitle} position.`
          }
          recommendation={recommendation}
        />
      </div>
    </div>
  );
}
