"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import DataTable, { Column } from "@/components/shared/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, UserCheck, Loader2 } from "lucide-react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { matchCandidateWithInternship } from "@/lib/ai/candidateMatch";
import type { Application, CandidateMatch } from "@/lib/types";

interface ApplicantRow {
  id: string;
  name: string;
  role: string;
  college: string;
  score?: number;
  status: "pending" | "ai_reviewed" | "hr_shortlisted" | "mentor_assigned";
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

      // Get HR profile
      const userSnapshot = await getDoc(doc(db, "users", user.uid));

      if (!userSnapshot.exists()) {
        setError("HR profile not found.");
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

                // Try common name fields
                studentName =
                  studentData.name ||
                  studentData.displayName ||
                  studentData.fullName ||
                  studentName;

                // Try common college fields
                college =
                  studentData.college ||
                  studentData.collegeName ||
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

          // Make sure score is actually a number
          if (score !== undefined && score !== null) {
            const numericScore = Number(score);

            score = Number.isFinite(numericScore) ? numericScore : undefined;
          }

          return {
            id: applicationDoc.id,

            name: studentName || "Unknown Student",

            role: internshipTitle || "Internship",

            college: college || "College not available",

            score,

            status: data.status || "pending",

            appliedAt: data.appliedAt || "",

            application: {
              ...data,
              id: applicationDoc.id,
            },

            candidateMatch,
          } as ApplicantRow;
        }),
      );

      // Newest applications first
      rows.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));

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

      // Update row immediately
      setApplicants((currentApplicants) =>
        currentApplicants.map((applicant) =>
          applicant.id === item.id
            ? {
                ...applicant,
                score: Number(result.matchScore),
                candidateMatch: result,
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
        <span className="text-xs font-medium text-slate-700">{item.role}</span>
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
          variant={item.status === "mentor_assigned" ? "success" : "default"}
          className="text-xs capitalize"
        >
          {item.status.replace("_", " ")}
        </Badge>
      ),
    },

    {
      key: "actions",
      header: "Actions",

      render: (item) => (
        <div className="flex items-center gap-2">
          {/* Analyze AI */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAnalyzeMatch(item)}
            disabled={analyzingId === item.id}
          >
            {analyzingId === item.id ? (
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
          <Button size="sm" variant="outline" asChild>
            <Link href={`/hr/applicants/${item.id}`}>
              <Eye className="mr-1 h-3.5 w-3.5" />
              Review AI
            </Link>
          </Button>

          {/* Assign Mentor */}
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            asChild
          >
            <Link href={`/hr/mentor-recommendation?applicantId=${item.id}`}>
              <UserCheck className="mr-1 h-3.5 w-3.5" />

              <span className="text-white">Assign Mentor</span>
            </Link>
          </Button>
        </div>
      ),
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
          Review AI resume summaries, candidate match scores, and shortlist
          candidates
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
