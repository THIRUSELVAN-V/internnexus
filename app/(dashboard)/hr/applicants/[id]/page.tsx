"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import ResumeAnalysisCard from "@/components/ai/ResumeAnalysisCard";
import CandidateMatchCard from "@/components/ai/CandidateMatchCard";

import {
  UserCheck,
  ArrowLeft,
  Download,
  Loader2,
  Sparkles,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { createNotification } from "@/lib/firebase/notifications";
import { matchCandidateWithInternship } from "@/lib/ai/candidateMatch";
import type {
  Application,
  CandidateMatch,
  ResumeAnalysis,
  HRProfile,
  Internship,
} from "@/lib/types";
import { formatTimestamp } from "@/lib/utils/formatters";

interface ApplicantData {
  application: Application;
  resumeAnalysis: ResumeAnalysis | null;
  candidateMatch: CandidateMatch | null;
  student: Record<string, unknown> | null;
}

export default function HRApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = getFirebaseDb();
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [data, setData] = useState<ApplicantData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [unauthorized, setUnauthorized] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
        setUnauthorized(false);

        const auth = getFirebaseAuth();
        const db = getFirebaseDb();

        const user = auth.currentUser;

        if (!user) {
          setError("Please log in to view applicant details.");
          return;
        }

        // ---------------------------------------------------
        // Get current HR/admin profile
        // ---------------------------------------------------

        const userSnapshot = await getDoc(doc(db, "users", user.uid));

        if (!userSnapshot.exists()) {
          setError("User profile not found.");
          return;
        }

        const userData = userSnapshot.data();

        const isAdmin = userData.role === "admin";

        const isHR = userData.role === "hr";

        if (!isHR && !isAdmin) {
          setUnauthorized(true);
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
          appliedAt: formatTimestamp(applicationData?.appliedAt),
        } as Application;

        // ---------------------------------------------------
        // Verify HR ownership
        // ---------------------------------------------------

        if (isHR) {
          let isOwner = false;

          if (
            userData.companyId &&
            application.companyId === userData.companyId
          ) {
            isOwner = true;
          }

          // If application companyId is unavailable,
          // verify through the internship.
          if (!isOwner && application.internshipId) {
            try {
              const internshipSnapshot = await getDoc(
                doc(db, "internships", application.internshipId),
              );

              if (internshipSnapshot.exists()) {
                const internshipData = internshipSnapshot.data() as Internship;

                if (internshipData.companyId === userData.companyId) {
                  isOwner = true;
                }
              }
            } catch (internshipError) {
              console.error(
                "Failed to verify internship ownership:",
                internshipError,
              );
            }
          }

          if (!isOwner) {
            setUnauthorized(true);
            return;
          }
        }

        // ---------------------------------------------------
        // Get student profile
        // ---------------------------------------------------

        let resumeAnalysis: ResumeAnalysis | null = null;

        let student: Record<string, unknown> | null = null;

        if (application.studentId) {
          const studentRef = doc(db, "users", application.studentId);

          const studentSnapshot = await getDoc(studentRef);

          if (studentSnapshot.exists()) {
            const studentData = studentSnapshot.data();

            student = studentData;

            if (studentData.resumeAnalysis) {
              resumeAnalysis = studentData.resumeAnalysis as ResumeAnalysis;
            } else if (studentData.resume?.analysis) {
              resumeAnalysis = studentData.resume.analysis as ResumeAnalysis;
            } else if (studentData.storedAnalysis) {
              resumeAnalysis = studentData.storedAnalysis as ResumeAnalysis;
            }
          }
        }

        // ---------------------------------------------------
        // Get candidate match
        // ---------------------------------------------------

        let candidateMatch: CandidateMatch | null = null;

        if (applicationData.candidateMatch) {
          candidateMatch = applicationData.candidateMatch as CandidateMatch;
        } else if (
          applicationData.matchScore !== undefined &&
          applicationData.matchScore !== null
        ) {
          // Compatibility with older saved results.
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
          student,
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

  const handleShortlist = async () => {
    if (!data?.application) return;
    try {
      setIsUpdating(true);
      setError("");

      const appId = data.application.id;
      await updateDoc(doc(db, "applications", appId), {
        status: "hr_shortlisted",
        updatedAt: new Date().toISOString(),
      });

      if (data.application.studentId) {
        const companyName = data.application.companyName || "the company";
        const internshipTitle = data.application.internshipTitle || "Internship";
        createNotification({
          recipientUserId: data.application.studentId,
          recipientRole: "student",
          title: "Application Shortlisted",
          message: `Your application for ${internshipTitle} at ${companyName} has been shortlisted.`,
          type: "success",
          category: "application",
          link: "/student/applications",
          relatedId: appId,
          relatedType: "application",
        }).catch((notifyErr) => console.error("Failed to notify shortlisted student:", notifyErr));
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              application: {
                ...prev.application,
                status: "hr_shortlisted",
                updatedAt: new Date().toISOString(),
              },
            }
          : null
      );

      // Check internship openings
      if (data.application.internshipId) {
        const internshipId = data.application.internshipId;
        const internshipSnapshot = await getDoc(doc(db, "internships", internshipId));
        if (internshipSnapshot.exists()) {
          const internshipData = internshipSnapshot.data();
          const openings = Number(internshipData.openings) || 1;
          const applicationsRef = collection(db, "applications");
          const q = query(
            applicationsRef,
            where("internshipId", "==", internshipId),
            where("status", "in", ["hr_shortlisted", "mentor_assigned", "accepted"])
          );
          const shortlistedSnapshot = await getDocs(q);
          if (shortlistedSnapshot.size >= openings && internshipData.status !== "closed") {
            await updateDoc(doc(db, "internships", internshipId), {
              status: "closed",
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      setAnalyzeSuccess("Candidate shortlisted successfully.");
      setTimeout(() => setAnalyzeSuccess(null), 4000);
    } catch (err) {
      console.error("Error shortlisting applicant:", err);
      setError(
        err instanceof Error ? err.message : "Failed to shortlist applicant."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!data?.application) return;
    try {
      setIsUpdating(true);
      setError("");

      const appId = data.application.id;
      await updateDoc(doc(db, "applications", appId), {
        status: "rejected",
        updatedAt: new Date().toISOString(),
      });

      setData((prev) =>
        prev
          ? {
              ...prev,
              application: {
                ...prev.application,
                status: "rejected",
                updatedAt: new Date().toISOString(),
              },
            }
          : null
      );

      setAnalyzeSuccess("Candidate application rejected.");
      setTimeout(() => setAnalyzeSuccess(null), 4000);
    } catch (err) {
      console.error("Error rejecting applicant:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reject applicant."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRunMatch = async () => {
    if (!data?.application) return;
    try {
      setIsAnalyzing(true);
      setError("");
      setAnalyzeSuccess(null);

      const app = data.application;
      const result = await matchCandidateWithInternship(
        [],
        [],
        app.id,
        app.internshipId,
        app.studentId
      );

      setData((prev) =>
        prev
          ? {
              ...prev,
              candidateMatch: result,
              application: {
                ...prev.application,
                candidateMatch: result,
                matchScore: Number(result.matchScore),
                matchedSkills: result.matchedSkills,
                missingSkills: result.missingSkills,
                matchReasoning: result.reasoning,
              },
            }
          : null
      );
      setAnalyzeSuccess(`Candidate match calculated successfully: ${result.matchScore}%`);
      setTimeout(() => setAnalyzeSuccess(null), 5000);
    } catch (err) {
      console.error("AI candidate matching failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "AI candidate matching failed. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

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
  // Unauthorized
  // ---------------------------------------------------------

  if (unauthorized) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />

        <h2 className="text-lg font-bold text-slate-900">
          Unauthorized Access
        </h2>

        <p className="text-xs text-slate-500">
          You do not have permission to view applicants for this company.
        </p>

        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/hr/applicants">Back to Applicants</Link>
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error / not found
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

  const { application, resumeAnalysis, candidateMatch, student } = data;

  // ---------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/applicants">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Applicants
          </Link>
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Analyze / Re-analyze AI button */}
          <Button
            size="sm"
            onClick={handleRunMatch}
            disabled={isAnalyzing || isUpdating}
            className="!bg-purple-600 !hover:bg-purple-700 !text-white text-xs font-semibold gap-1.5"
          >
            {isAnalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {candidateMatch ? "Re-analyze Match" : "Analyze AI Match"}
          </Button>

          {/* Condition 1: If candidate is not shortlisted (pending or ai_reviewed) -> Show Shortlist or Reject */}
          {(application.status === "pending" || application.status === "ai_reviewed") && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={isUpdating || isAnalyzing}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5 mr-1" />
                )}
                Reject
              </Button>

              <Button
                size="sm"
                onClick={handleShortlist}
                disabled={isUpdating || isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Shortlist
              </Button>
            </>
          )}

          {/* Condition 2: If shortlisted AND mentor NOT yet assigned -> Show Assign Mentor option */}
          {application.status === "hr_shortlisted" && !application.mentorId && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReject}
                disabled={isUpdating || isAnalyzing}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5 mr-1" />
                )}
                Reject
              </Button>

              <Button
                size="sm"
                className="!bg-purple-600 !hover:bg-purple-700 !text-white text-xs font-semibold"
                asChild
              >
                <Link
                  href={`/hr/mentor-recommendation?applicationId=${application.id}`}
                >
                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                  Assign Mentor
                </Link>
              </Button>
            </>
          )}

          {/* Condition 3: Mentor already assigned (mentor_assigned / accepted) -> Show assigned mentor badge, leave action buttons empty */}
          {(application.status === "mentor_assigned" || application.status === "accepted" || !!application.mentorId) && (
            <Badge variant="success" className="text-xs font-semibold gap-1 py-1 px-2.5">
              <Check className="h-3.5 w-3.5" />
              Mentor Assigned {application.mentorName ? `(${application.mentorName})` : ""}
            </Badge>
          )}
        </div>
      </div>

      {analyzeSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{analyzeSuccess}</span>
        </div>
      )}

      {/* Candidate Overview */}

      <Card className="border-slate-200">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">
                  {application.studentName ||
                    (student?.name as string) ||
                    (student?.displayName as string) ||
                    "Unknown Student"}
                </h2>

                <Badge variant="purple" className="text-xs capitalize">
                  {(application.status || "pending").replace("_", " ")}
                </Badge>

                {resumeAnalysis?.overallScore !== undefined && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold">
                    Resume Score: {resumeAnalysis.overallScore}/100
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-0.5">
                Applied for{" "}
                <strong className="text-slate-700">
                  {application.internshipTitle || "Internship"}
                </strong>{" "}
                ·{" "}
                {application.studentEmail ||
                  (student?.email as string) ||
                  "Email unavailable"}
              </p>
            </div>

            {application.appliedAt && (
              <p className="text-[11px] text-slate-400">
                Applied: {new Date(application.appliedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applicant Information */}

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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-5">
            <div>
              <p className="text-xs text-slate-500">Student</p>

              <p className="text-sm font-semibold text-slate-900">
                {application.studentName ||
                  (student?.name as string) ||
                  (student?.displayName as string) ||
                  "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Email</p>

              <p className="text-sm font-semibold text-slate-900 break-all">
                {application.studentEmail ||
                  (student?.email as string) ||
                  "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">College / University</p>

              <p className="text-sm font-semibold text-slate-900">
                {(student?.university as string) ||
                  (student?.college as string) ||
                  (student?.collegeName as string) ||
                  "Not provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Resume Analysis */}

        {resumeAnalysis ? (
          <ResumeAnalysisCard analysis={resumeAnalysis} />
        ) : (
          <Card className="border-dashed border-slate-200 bg-slate-50/50">
            <CardContent className="py-16 text-center space-y-2">
              <Sparkles className="h-8 w-8 text-slate-300 mx-auto" />

              <h3 className="text-sm font-bold text-slate-800">
                No AI Resume Analysis
              </h3>

              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                The candidate has not completed an AI resume analysis or no
                structured resume analysis is attached.
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
          <Card className="border-dashed border-slate-200">
            <CardHeader>
              <CardTitle>AI Candidate Match</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">
                Candidate matching has not been performed yet.
              </p>

              <Button
                size="sm"
                onClick={handleRunMatch}
                disabled={isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold gap-1.5"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Run AI Matching Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
