"use client";

import React, { Suspense, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { CheckCircle2, UserCheck, Loader2, AlertCircle, RefreshCw } from "lucide-react";

import MentorRecommendationCard from "@/components/ai/MentorRecommendationCard";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { recommendMentors } from "@/lib/ai/mentorRecommend";
import { createNotification } from "@/lib/firebase/notifications";

import type { Application, MentorRecommendation } from "@/lib/types";

interface UserData {
  displayName?: string;
  name?: string;
  email?: string;
}

interface InternshipData {
  title?: string;
  domain?: string;
}

function HRMentorRecommendationContent() {
  const searchParams = useSearchParams();

  const applicationId = searchParams.get("applicationId");

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------

  const [studentName, setStudentName] = useState("");

  const [internshipTitle, setInternshipTitle] = useState("");

  const [companyName, setCompanyName] = useState("");

  const [candidateMatchScore, setCandidateMatchScore] = useState<number | null>(
    null,
  );

  const [application, setApplication] = useState<Application | null>(null);

  const [recommendations, setRecommendations] = useState<
    MentorRecommendation[]
  >([]);

  const [selectedMentor, setSelectedMentor] = useState("");

  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);

  const [confirming, setConfirming] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  const [confirmedMentorName, setConfirmedMentorName] = useState("");

  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Load application + student + internship
  // ---------------------------------------------------------

  useEffect(() => {
    async function loadApplication() {
      if (!applicationId) {
        setError(
          "No application was selected. Open this page from an applicant record.",
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const db = getFirebaseDb();

        // ---------------------------------------------------
        // Application
        // ---------------------------------------------------

        const applicationRef = doc(db, "applications", applicationId);

        const applicationSnapshot = await getDoc(applicationRef);

        if (!applicationSnapshot.exists()) {
          throw new Error("Application was not found.");
        }

        const applicationData = applicationSnapshot.data() as Application;

        setApplication({
          ...applicationData,
          id: applicationSnapshot.id,
        });

        // ---------------------------------------------------
        // Existing candidate match
        // ---------------------------------------------------

        const existingMatchScore =
          typeof applicationData.matchScore === "number"
            ? applicationData.matchScore
            : typeof applicationData.candidateMatch?.matchScore === "number"
              ? applicationData.candidateMatch.matchScore
              : null;

        setCandidateMatchScore(existingMatchScore);

        // ---------------------------------------------------
        // Existing mentor assignment
        // ---------------------------------------------------

        if (applicationData.mentorId) {
          setSelectedMentor(applicationData.mentorId);

          if (applicationData.mentorName) {
            setConfirmedMentorName(applicationData.mentorName);
          }
        } else if (
          Array.isArray(applicationData.mentorRecommendations) &&
          applicationData.mentorRecommendations.length > 0
        ) {
          setRecommendations(applicationData.mentorRecommendations);
        }

        // ---------------------------------------------------
        // Student
        // ---------------------------------------------------

        if (applicationData.studentId) {
          const studentSnapshot = await getDoc(
            doc(db, "users", applicationData.studentId),
          );

          if (studentSnapshot.exists()) {
            const student = studentSnapshot.data() as UserData;

            setStudentName(
              student.displayName ??
                student.name ??
                applicationData.studentName ??
                "Student",
            );
          } else {
            setStudentName(applicationData.studentName ?? "Student");
          }
        } else {
          setStudentName(applicationData.studentName ?? "Student");
        }

        // ---------------------------------------------------
        // Internship
        // ---------------------------------------------------

        if (applicationData.internshipId) {
          const internshipSnapshot = await getDoc(
            doc(db, "internships", applicationData.internshipId),
          );

          if (internshipSnapshot.exists()) {
            const internship = internshipSnapshot.data() as InternshipData;

            setInternshipTitle(
              internship.title ??
                applicationData.internshipTitle ??
                "Internship",
            );
          } else {
            setInternshipTitle(applicationData.internshipTitle ?? "Internship");
          }
        } else {
          setInternshipTitle(applicationData.internshipTitle ?? "Internship");
        }

        setCompanyName(applicationData.companyName ?? "");

        // ---------------------------------------------------
        // Existing assignment means the workflow is already
        // completed.
        // ---------------------------------------------------

        if (applicationData.mentorId) {
          setConfirmed(true);
        }
      } catch (caught) {
        console.error(
          "Failed to load mentor recommendation application:",
          caught,
        );

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load application.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadApplication();
  }, [applicationId]);

  // ---------------------------------------------------------
  // Generate AI recommendations
  // ---------------------------------------------------------

  const handleGenerateRecommendations = async () => {
    if (!applicationId) {
      setError("Application ID is missing.");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      /*
       * The client intentionally does not calculate mentor
       * matching itself.
       *
       * The server-side mentor recommendation API:
       * - verifies the HR
       * - loads the application
       * - verifies company ownership
       * - loads mentors belonging to the company
       * - considers mentor workload
       * - sends trusted data to Gemini
       * - returns structured recommendations
       */
      const results = await recommendMentors("", [], applicationId);

      setRecommendations(results);

      if (results.length === 0) {
        setError("No suitable industrial mentors were found for this student.");
      }
    } catch (caught) {
      console.error("Mentor recommendation failed:", caught);

      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to generate mentor recommendations.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // ---------------------------------------------------------
  // Confirm mentor assignment
  // ---------------------------------------------------------

  const handleConfirmAssignment = async () => {
    if (!applicationId) {
      setError("Application ID is missing.");
      return;
    }

    if (!selectedMentor) {
      setError("Please select a mentor before confirming.");
      return;
    }

    const selectedRecommendation = recommendations.find(
      (mentor) => mentor.mentorId === selectedMentor,
    );

    if (!selectedRecommendation) {
      setError("The selected mentor recommendation could not be found.");
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error(
          "You must be logged in to confirm a mentor assignment.",
        );
      }

      const db = getFirebaseDb();

      // ---------------------------------------------------
      // Verify application still exists
      // ---------------------------------------------------

      const applicationRef = doc(db, "applications", applicationId);

      const applicationSnapshot = await getDoc(applicationRef);

      if (!applicationSnapshot.exists()) {
        throw new Error("Application was not found.");
      }

      const applicationData = applicationSnapshot.data() as Application;

      // ---------------------------------------------------
      // Verify current HR owns this company
      // ---------------------------------------------------

      const userSnapshot = await getDoc(doc(db, "users", user.uid));

      if (!userSnapshot.exists()) {
        throw new Error("HR profile was not found.");
      }

      const userData = userSnapshot.data();

      if (userData.role !== "hr" && userData.role !== "admin") {
        throw new Error(
          "You are not authorized to assign an industrial mentor.",
        );
      }

      if (
        userData.role === "hr" &&
        applicationData.companyId !== userData.companyId
      ) {
        throw new Error(
          "You are not authorized to assign a mentor for this company.",
        );
      }

      // ---------------------------------------------------
      // Verify selected mentor still exists
      // ---------------------------------------------------

      const mentorSnapshot = await getDoc(
        doc(db, "users", selectedRecommendation.mentorId),
      );

      if (!mentorSnapshot.exists()) {
        throw new Error("The selected mentor no longer exists.");
      }

      const mentorData = mentorSnapshot.data();

      if (mentorData.role !== "mentor") {
        throw new Error("The selected user is not an industrial mentor.");
      }

      // ---------------------------------------------------
      // Verify mentor belongs to same company
      // ---------------------------------------------------

      if (
        applicationData.companyId &&
        mentorData.companyId !== applicationData.companyId
      ) {
        throw new Error(
          "The selected mentor does not belong to the student's company.",
        );
      }

      // ---------------------------------------------------
      // Prevent duplicate assignment
      // ---------------------------------------------------

      if (applicationData.mentorId) {
        throw new Error(
          "A mentor has already been assigned to this application.",
        );
      }

      // ---------------------------------------------------
      // Create mentor assignment record
      // ---------------------------------------------------

      const now = new Date().toISOString();

      await addDoc(collection(db, "mentorAssignments"), {
        internshipId: applicationData.internshipId,

        companyId: applicationData.companyId,

        studentId: applicationData.studentId,

        studentName: applicationData.studentName || studentName,

        mentorId: selectedRecommendation.mentorId,

        mentorName: selectedRecommendation.mentorName,

        status: "accepted",

        aiRecommended: true,

        recommendationScore: selectedRecommendation.matchScore,

        startDate: now.slice(0, 10),

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),
      });

      // ---------------------------------------------------
      // Update application
      // ---------------------------------------------------

      await updateDoc(applicationRef, {
        status: "mentor_assigned",

        mentorId: selectedRecommendation.mentorId,

        mentorName: selectedRecommendation.mentorName,

        mentorAssignedAt: serverTimestamp(),

        mentorAssignedBy: user.uid,

        updatedAt: serverTimestamp(),
      });

      // Notify the assigned mentor
      createNotification({
        recipientUserId: selectedRecommendation.mentorId,
        recipientRole: "mentor",
        title: "New Mentee Assigned",
        message: `You have been assigned to mentor ${applicationData.studentName || studentName} for ${applicationData.internshipTitle || "Internship"}.`,
        type: "info",
        category: "assignment",
        link: "/mentor/interns",
        relatedId: applicationId,
        relatedType: "application",
      }).catch((notifyErr) => console.error("Failed to notify mentor:", notifyErr));

      // Notify the student
      if (applicationData.studentId) {
        createNotification({
          recipientUserId: applicationData.studentId,
          recipientRole: "student",
          title: "Mentor Assigned",
          message: `${selectedRecommendation.mentorName} has been assigned as your industrial mentor.`,
          type: "success",
          category: "assignment",
          link: "/student/mentor",
          relatedId: applicationId,
          relatedType: "application",
        }).catch((notifyErr) => console.error("Failed to notify student of mentor assignment:", notifyErr));
      }

      // ---------------------------------------------------
      // Update local state
      // ---------------------------------------------------

      setConfirmedMentorName(selectedRecommendation.mentorName);

      setConfirmed(true);
    } catch (caught) {
      console.error("Mentor assignment failed:", caught);

      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to confirm mentor assignment.",
      );
    } finally {
      setConfirming(false);
    }
  };

  // ---------------------------------------------------------
  // Missing application ID
  // ---------------------------------------------------------

  if (!applicationId) {
    return (
      <div className="max-w-4xl space-y-6">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />

            <div>
              <h2 className="text-sm font-bold text-amber-900">
                No application selected
              </h2>

              <p className="mt-1 text-xs text-amber-700">
                Open mentor recommendation from a specific applicant so the
                application ID can be loaded.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading application...
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Confirmed state
  // ---------------------------------------------------------

  if (confirmed) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            AI Mentor Recommendation
          </h1>

          <p className="text-xs text-slate-500">
            AI-assisted industrial mentor assignment
          </p>
        </div>

        <Card className="border-green-200 bg-green-50/40 py-8 text-center">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Mentor Assignment Confirmed!
            </h2>

            <p className="mx-auto max-w-sm text-xs text-slate-600">
              {confirmedMentorName ||
                application?.mentorName ||
                "The selected mentor"}{" "}
              has been assigned as the industrial mentor for{" "}
              {studentName || "the student"}.
            </p>

            <Badge variant="success" className="mt-2">
              Mentor Assigned
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          AI Mentor Recommendation
        </h1>

        <p className="text-xs text-slate-500">
          AI proposes suitable mentors based on student skills, internship
          requirements, mentor expertise, and mentor workload.
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <p className="text-xs text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Intern */}
      <Card className="border-slate-200">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-purple-600">
              Selected Intern
            </span>

            <h3 className="text-base font-bold text-slate-900">
              {studentName || "Student"}
            </h3>

            <p className="text-xs text-slate-500">
              Applied for {internshipTitle || "selected internship"}
              {companyName ? ` at ${companyName}` : ""}
            </p>
          </div>

          {candidateMatchScore !== null && (
            <Badge variant="purple" className="w-fit text-xs">
              {candidateMatchScore}% AI Match Score
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Generate AI */}
      {recommendations.length === 0 && (
        <Card className="border-purple-100 bg-purple-50/40">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <UserCheck className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Generate AI Mentor Recommendations
              </h2>

              <p className="mt-1 max-w-md text-xs text-slate-500">
                Gemini will analyze the student's resume, internship
                requirements, mentor expertise, and current mentor capacity.
              </p>
            </div>

            <Button
              onClick={handleGenerateRecommendations}
              disabled={analyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  AI is analyzing...
                </>
              ) : (
                <>
                  <UserCheck className="mr-1.5 h-4 w-4" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <>
          <MentorRecommendationCard
            recommendations={recommendations}
            selectedMentorId={selectedMentor}
            onSelectMentor={(id) => setSelectedMentor(id)}
          />

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleGenerateRecommendations}
              disabled={analyzing || confirming}
              className="text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Regenerate Recommendations
                </>
              )}
            </Button>

            <Button
              onClick={handleConfirmAssignment}
              disabled={!selectedMentor || confirming || analyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <UserCheck className="mr-1.5 h-4 w-4" />
                  Confirm Mentor Assignment
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// -----------------------------------------------------------
// Suspense wrapper required because useSearchParams()
// is used by the page.
// -----------------------------------------------------------

export default function HRMentorRecommendationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        </div>
      }
    >
      <HRMentorRecommendationContent />
    </Suspense>
  );
}
