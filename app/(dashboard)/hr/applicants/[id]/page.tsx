"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import ResumeAnalysisCard from "@/components/ai/ResumeAnalysisCard";
import CandidateMatchCard from "@/components/ai/CandidateMatchCard";

import { UserCheck, ArrowLeft, Download, Loader2 } from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import { doc, getDoc } from "firebase/firestore";

import type { Application, CandidateMatch, ResumeAnalysis } from "@/lib/types";

interface ApplicantData {
  application: Application;
  resumeAnalysis: ResumeAnalysis | null;
  candidateMatch: CandidateMatch | null;
}

export default function HRApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [data, setData] = useState<ApplicantData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Get application ID from route
  // ---------------------------------------------------------

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;

      setApplicationId(resolvedParams.id);
    };

    loadParams();
  }, [params]);

  // ---------------------------------------------------------
  // Load applicant data
  // ---------------------------------------------------------

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    const loadApplicant = async () => {
      try {
        setLoading(true);
        setError("");

        const auth = getFirebaseAuth();
        const db = getFirebaseDb();

        const user = auth.currentUser;

        if (!user) {
          setError("Please log in to view applicant details.");
          return;
        }

        // ---------------------------------------------------
        // Get application
        // ---------------------------------------------------

        const applicationRef = doc(db, "applications", applicationId);

        const applicationSnapshot = await getDoc(applicationRef);

        if (!applicationSnapshot.exists()) {
          setError("Application not found.");
          return;
        }

        const applicationData = applicationSnapshot.data();

        const application = {
          ...applicationData,
          id: applicationId,
        } as Application;

        console.log("Loaded application:", application);

        // ---------------------------------------------------
        // Get student profile
        // ---------------------------------------------------

        let resumeAnalysis: ResumeAnalysis | null = null;

        if (application.studentId) {
          const studentRef = doc(db, "users", application.studentId);

          const studentSnapshot = await getDoc(studentRef);

          if (studentSnapshot.exists()) {
            const studentData = studentSnapshot.data();

            console.log("Loaded student profile:", studentData);

            if (studentData.resumeAnalysis) {
              resumeAnalysis = studentData.resumeAnalysis as ResumeAnalysis;
            }
          }
        }

        // ---------------------------------------------------
        // Get candidate match
        // ---------------------------------------------------

        let candidateMatch: CandidateMatch | null = null;

        if (applicationData.candidateMatch) {
          candidateMatch = applicationData.candidateMatch as CandidateMatch;
        } else if (applicationData.matchScore !== undefined) {
          // Compatibility with older saved results
          candidateMatch = {
            applicationId,
            internshipId: application.internshipId,
            studentId: application.studentId,

            matchScore: Number(applicationData.matchScore),

            matchedSkills: applicationData.matchedSkills ?? [],

            missingSkills: applicationData.missingSkills ?? [],

            reasoning: applicationData.matchReasoning ?? "",

            recommendation: applicationData.recommendation ?? "partial_match",

            analyzedAt: applicationData.updatedAt ?? new Date().toISOString(),
          };
        }

        setData({
          application,
          resumeAnalysis,
          candidateMatch,
        });
      } catch (err) {
        console.error("Failed to load applicant details:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load applicant details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadApplicant();
  }, [applicationId]);

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />

        <span className="text-sm text-slate-600">
          Loading applicant details...
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------

  if (error || !data) {
    return (
      <div className="max-w-5xl space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/applicants">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Applicants
          </Link>
        </Button>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">
              {error || "Applicant data could not be loaded."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { application, resumeAnalysis, candidateMatch } = data;

  // ---------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/applicants">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Applicants
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Resume download will be connected when resume file storage is available."
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Download Resume PDF
          </Button>

          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            asChild
          >
            <Link
              href={`/hr/mentor-recommendation?applicantId=${application.id}`}
            >
              <UserCheck className="mr-1 h-3.5 w-3.5" />
              Assign Mentor
            </Link>
          </Button>
        </div>
      </div>

      {/* Applicant information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Applicant Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Applicant ID</p>

              <p className="text-sm font-semibold text-slate-900">
                {application.id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Internship</p>

              <p className="text-sm font-semibold text-slate-900">
                {application.internshipTitle || "Internship"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Application Status</p>

              <Badge className="mt-1 capitalize">
                {(application.status || "pending").replace("_", " ")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Resume Analysis */}
        {resumeAnalysis ? (
          <ResumeAnalysisCard analysis={resumeAnalysis} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>AI Resume Analysis</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-slate-500">
                Resume analysis is not available for this student yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Candidate Match */}
        {candidateMatch ? (
          <CandidateMatchCard
            matchScore={Number(candidateMatch.matchScore)}
            matchedSkills={candidateMatch.matchedSkills ?? []}
            missingSkills={candidateMatch.missingSkills ?? []}
            reasoning={candidateMatch.reasoning ?? ""}
            recommendation={candidateMatch.recommendation}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>AI Candidate Match</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-slate-500">
                Candidate matching has not been performed yet.
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Return to Applicants Management and click "Analyze AI".
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
