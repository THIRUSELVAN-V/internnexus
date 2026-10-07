"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, UserCheck, Check, X, Loader2 } from "lucide-react";

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

import { matchCandidateWithInternship } from "@/lib/ai/candidateMatch";
import type { Application, CandidateMatch } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils/formatters";
import { createNotification } from "@/lib/firebase/notifications";

interface ApplicantRow {
  id: string;
  name: string;
  role: string;
  college: string;
  score?: number;
  status: Application["status"];
  appliedAt: string;
  application: Application;
  candidateMatch?: CandidateMatch;
}

export default function HRApplicantsPage() {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Load applications
  // ---------------------------------------------------------

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const user = auth.currentUser;

      if (!user) {
        setError("Please log in to view applicants.");
        return;
      }

      // Get HR/admin profile
      const userSnapshot = await getDoc(doc(db, "users", user.uid));

      if (!userSnapshot.exists()) {
        setError("User profile not found.");
        return;
      }

      const userData = userSnapshot.data();

      if (userData.role !== "hr" && userData.role !== "admin") {
        setError("You are not authorized to view applicants.");
        return;
      }

      // -------------------------------------------------------
      // Get applications
      // -------------------------------------------------------

      let applicationSnapshot;

      if (userData.role === "admin") {
        applicationSnapshot = await getDocs(collection(db, "applications"));
      } else {
        if (!userData.companyId) {
          setError("Your HR account is not associated with a company.");
          return;
        }

        const applicationsQuery = query(
          collection(db, "applications"),
          where("companyId", "==", userData.companyId),
        );

        applicationSnapshot = await getDocs(applicationsQuery);
      }

      // -------------------------------------------------------
      // Build applicant rows
      // -------------------------------------------------------

      const rows = await Promise.all(
        applicationSnapshot.docs.map(async (applicationDoc) => {
          const data = applicationDoc.data() as Application;

          const studentId = data.studentId;
          const internshipId = data.internshipId;

          // ---------------------------------------------------
          // Get student profile
          // ---------------------------------------------------

          let studentName = data.studentName || "";

          let college =
            (
              data as Application & {
                college?: string;
              }
            ).college || "";

          if (studentId) {
            try {
              const studentSnapshot = await getDoc(doc(db, "users", studentId));

              if (studentSnapshot.exists()) {
                const studentData = studentSnapshot.data();

                studentName =
                  studentData.name ||
                  studentData.displayName ||
                  studentData.fullName ||
                  studentName;

                college =
                  studentData.college ||
                  studentData.collegeName ||
                  studentData.university ||
                  studentData.institution ||
                  college;
              }
            } catch (studentError) {
              console.error(
                "Failed to load student profile:",
                studentId,
                studentError,
              );
            }
          }

          // ---------------------------------------------------
          // Get internship information
          // ---------------------------------------------------

          let internshipTitle = data.internshipTitle || "";

          if (internshipId) {
            try {
              const internshipSnapshot = await getDoc(
                doc(db, "internships", internshipId),
              );

              if (internshipSnapshot.exists()) {
                const internshipData = internshipSnapshot.data();

                internshipTitle =
                  internshipData.title ||
                  internshipData.name ||
                  internshipTitle;
              }
            } catch (internshipError) {
              console.error(
                "Failed to load internship:",
                internshipId,
                internshipError,
              );
            }
          }

          // ---------------------------------------------------
          // Candidate match
          // ---------------------------------------------------

          const candidateMatch = data.candidateMatch;

          let score: number | undefined =
            candidateMatch?.matchScore ?? data.matchScore;

          if (score !== undefined && score !== null) {
            const numericScore = Number(score);

            score = Number.isFinite(numericScore) ? numericScore : undefined;
          }

          const appliedAtStr = formatTimestamp(data.appliedAt);

          return {
            id: applicationDoc.id,
            name: studentName || "Unknown Student",
            role: internshipTitle || "Internship",
            college: college || "College not available",
            score,
            status: data.status || "pending",
            appliedAt: appliedAtStr,
            application: {
              ...data,
              id: applicationDoc.id,
              appliedAt: appliedAtStr,
            },
            candidateMatch,
          } as ApplicantRow;
        }),
      );

      // Newest applications first
      rows.sort((a, b) => {
        const timeA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
        const timeB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
        return timeB - timeA;
      });

      setApplicants(rows);
    } catch (err) {
      console.error("Failed to load applications:", err);

      setError(
        err instanceof Error ? err.message : "Failed to load applicants.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Load page
  // ---------------------------------------------------------

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await loadApplications();
      } else {
        setLoading(false);
        setError("Please log in to view applicants.");
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------------------------------------------------------
  // Analyze candidate match
  // ---------------------------------------------------------

  const handleAnalyzeMatch = async (item: ApplicantRow) => {
    try {
      setAnalyzingId(item.id);
      setError("");

      const application = item.application;

      const result = await matchCandidateWithInternship(
        [],
        [],
        application.id,
        application.internshipId,
        application.studentId,
      );

      setApplicants((currentApplicants) =>
        currentApplicants.map((applicant) =>
          applicant.id === item.id
            ? {
                ...applicant,
                score: Number(result.matchScore),
                candidateMatch: result,
                application: {
                  ...applicant.application,
                  candidateMatch: result,
                  matchScore: Number(result.matchScore),
                  matchedSkills: result.matchedSkills,
                  missingSkills: result.missingSkills,
                  matchReasoning: result.reasoning,
                },
              }
            : applicant,
        ),
      );
    } catch (err) {
      console.error("AI candidate matching failed:", err);

      setError(
        err instanceof Error ? err.message : "AI candidate matching failed.",
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  // ---------------------------------------------------------
  // Shortlist applicant
  // ---------------------------------------------------------

  const handleShortlist = async (applicationId: string) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      await updateDoc(doc(db, "applications", applicationId), {
        status: "hr_shortlisted",
        updatedAt: new Date().toISOString(),
      });

      const target = applicants.find((applicant) => applicant.id === applicationId);
      if (target?.application?.studentId) {
        const companyName = target.application.companyName || "the company";
        const internshipTitle = target.role || target.application.internshipTitle || "Internship";
        createNotification({
          recipientUserId: target.application.studentId,
          recipientRole: "student",
          title: "Application Shortlisted",
          message: `Your application for ${internshipTitle} at ${companyName} has been shortlisted.`,
          type: "success",
          category: "application",
          link: "/student/applications",
          relatedId: applicationId,
          relatedType: "application",
        }).catch((notifyErr) => console.error("Failed to notify shortlisted student:", notifyErr));
      }

      setApplicants((currentApplicants) =>
        currentApplicants.map((applicant) =>
          applicant.id === applicationId
            ? {
                ...applicant,
                status: "hr_shortlisted",
                application: {
                  ...applicant.application,
                  status: "hr_shortlisted",
                  updatedAt: new Date().toISOString(),
                },
              }
            : applicant,
        ),
      );

      if (target?.application?.internshipId) {
        const internshipId = target.application.internshipId;
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
          const shortlistedCount = shortlistedSnapshot.size;
          
          if (shortlistedCount >= openings && internshipData.status !== "closed") {
            await updateDoc(doc(db, "internships", internshipId), {
              status: "closed",
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
    } catch (err) {
      console.error("Error shortlisting applicant:", err);

      setError(
        err instanceof Error ? err.message : "Failed to shortlist applicant.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ---------------------------------------------------------
  // Reject applicant
  // ---------------------------------------------------------

  const handleReject = async (applicationId: string) => {
    try {
      setUpdatingId(applicationId);
      setError("");

      await updateDoc(doc(db, "applications", applicationId), {
        status: "rejected",
        updatedAt: new Date().toISOString(),
      });

      setApplicants((currentApplicants) =>
        currentApplicants.map((applicant) =>
          applicant.id === applicationId
            ? {
                ...applicant,
                status: "rejected",
                application: {
                  ...applicant.application,
                  status: "rejected",
                  updatedAt: new Date().toISOString(),
                },
              }
            : applicant,
        ),
      );
    } catch (err) {
      console.error("Error rejecting applicant:", err);

      setError(
        err instanceof Error ? err.message : "Failed to reject applicant.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ---------------------------------------------------------
  // Table columns
  // ---------------------------------------------------------

  const columns: Column<ApplicantRow>[] = [
    {
      key: "name",
      header: "Applicant Name",
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>

          <p className="text-xs text-slate-500">{item.college}</p>
        </div>
      ),
    },

    {
      key: "role",
      header: "Applied Role",
      render: (item) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{item.role}</p>

          <p className="text-[11px] text-slate-500">
            {item.application.companyName}
          </p>
        </div>
      ),
    },

    {
      key: "score",
      header: "AI Match Score",
      render: (item) => {
        const score = item.score;

        if (
          score === undefined ||
          score === null ||
          !Number.isFinite(Number(score))
        ) {
          return <span className="text-xs text-slate-500">Not analyzed</span>;
        }

        return (
          <Badge variant="purple" className="text-xs font-bold">
            <Sparkles className="mr-1 h-3 w-3" />
            {Math.round(Number(score))}% Match
          </Badge>
        );
      },
    },

    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          variant={
            item.status === "mentor_assigned" || item.status === "accepted"
              ? "success"
              : item.status === "rejected"
                ? "destructive"
                : item.status === "hr_shortlisted"
                  ? "default"
                  : "warning"
          }
          className="text-xs font-semibold capitalize"
        >
          {item.status.replace("_", " ")}
        </Badge>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (item) => {
        const isAnalyzing = analyzingId === item.id;
        const isUpdating = updatingId === item.id;

        const canReview = item.status !== "rejected";

        const canShortlist =
          item.status === "pending" || item.status === "ai_reviewed";

        const canReject =
          item.status === "pending" ||
          item.status === "ai_reviewed" ||
          item.status === "hr_shortlisted";

        const canAssignMentor =
          item.status === "hr_shortlisted" ||
          item.status === "mentor_assigned" ||
          item.status === "accepted";

        return (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Analyze AI */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAnalyzeMatch(item)}
              disabled={isAnalyzing || isUpdating}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  {item.candidateMatch ? "Re-analyze" : "Analyze AI"}
                </>
              )}
            </Button>

            {/* Review AI */}
            {canReview && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/hr/applicants/${item.id}`}>
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  Review AI
                </Link>
              </Button>
            )}

            {/* Reject */}
            {canReject && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(item.id)}
                disabled={isUpdating || isAnalyzing}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
              >
                {isUpdating && item.status !== "hr_shortlisted" ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5 mr-1" />
                )}
                Reject
              </Button>
            )}

            {/* Shortlist */}
            {canShortlist && (
              <Button
                size="sm"
                onClick={() => handleShortlist(item.id)}
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
            )}

            {/* Assign Mentor */}
            {canAssignMentor && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
                asChild
              >
                <Link
                  href={`/hr/mentor-recommendation?applicationId=${item.id}`}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  Assign Mentor
                </Link>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Applicants Management
        </h1>

        <p className="text-xs text-slate-500">
          Review candidate applications, AI resume analysis, match scores,
          shortlist candidates, and assign industrial mentors
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />

              <span className="text-sm text-slate-600">
                Loading applicants...
              </span>
            </div>
          ) : applicants.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">
                No internship applications found.
              </p>
            </div>
          ) : (
            <DataTable
              data={applicants}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search applicants..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
