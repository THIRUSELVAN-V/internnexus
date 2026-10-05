"use client";

import React, { useEffect, useState } from "react";

import {
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

import FileUpload from "@/components/shared/FileUpload";
import ResumeAnalysisCard from "@/components/ai/ResumeAnalysisCard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import {
  ResumeUploadError,
  uploadAndAnalyzeResume,
} from "@/lib/ai/resumeAnalysis";

import type {
  ResumeAnalysis,
  ResumeMetadata,
  StudentProfile,
} from "@/lib/types";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/config";

import { doc, getDoc } from "firebase/firestore";

type AnalysisState = "idle" | "uploading" | "analyzing" | "success" | "error";

export default function StudentResumePage() {
  // --------------------------------------------------
  // Firebase
  // --------------------------------------------------

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  // --------------------------------------------------
  // Student profile
  // --------------------------------------------------

  const [student, setStudent] = useState<StudentProfile | null>(null);

  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // Resume / analysis state
  // --------------------------------------------------

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const [resume, setResume] = useState<ResumeMetadata | null>(null);

  const [state, setState] = useState<AnalysisState>("idle");

  const [progress, setProgress] = useState(0);

  const [message, setMessage] = useState(
    "Upload your resume to analyze your profile.",
  );

  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  // --------------------------------------------------
  // Load current student
  // --------------------------------------------------

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      setAuthReady(true);

      if (!user) {
        setStudent(null);
        setLoading(false);
        return;
      }

      try {
        const studentRef = doc(db, "users", user.uid);

        const snapshot = await getDoc(studentRef);

        if (!snapshot.exists()) {
          setStudent(null);
          setLoading(false);
          return;
        }

        const data = snapshot.data() as StudentProfile;

        if (data.role !== "student") {
          setStudent(null);
          setLoading(false);
          return;
        }

        setStudent({
          ...data,
          uid: user.uid,
        });

        // ------------------------------------------------
        // Restore previously saved analysis
        // ------------------------------------------------

        if (data.resumeAnalysis && data.resumeAnalysis.status === "completed") {
          setAnalysis(data.resumeAnalysis);
        }
      } catch (error) {
        console.error("Failed to load student profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  // --------------------------------------------------
  // Existing profile data
  // --------------------------------------------------

  const storedProfile = student;

  const activeResume = resume ?? storedProfile?.resume ?? null;

  const storedAnalysis = storedProfile?.resumeAnalysis;

  const activeAnalysis =
    analysis ??
    (storedAnalysis?.status === "completed" ? storedAnalysis : null);

  // --------------------------------------------------
  // Display state
  // --------------------------------------------------

  const displayedState = state === "idle" && activeAnalysis ? "success" : state;

  const displayedMessage =
    state === "idle" && activeAnalysis ? "Resume analysis completed." : message;

  // --------------------------------------------------
  // Handle resume upload
  // --------------------------------------------------

  const handleFileSelect = async (file: File) => {
    const user = currentUser;

    if (!user || state === "uploading" || state === "analyzing") {
      return;
    }

    setState("uploading");
    setProgress(10);
    setMessage("Sending resume securely to the AI analysis service...");

    try {
      const result = await uploadAndAnalyzeResume(file, user, (value) => {
        setProgress(value);

        if (value >= 70 && value < 100) {
          setState("analyzing");

          setMessage("AI is analyzing your resume...");
        }
      });

      // ------------------------------------------------
      // Store returned resume metadata
      // ------------------------------------------------

      setResume(result.resume);

      // ------------------------------------------------
      // Store structured AI analysis
      // ------------------------------------------------

      setAnalysis(result.analysis);

      setProgress(100);

      setState("success");

      setMessage("Resume analysis completed successfully.");

      // ------------------------------------------------
      // Update local student profile state
      // ------------------------------------------------

      setStudent((current) =>
        current
          ? {
              ...current,
              resume: result.resume,
              resumeAnalysis: result.analysis,
              skills: result.analysis.skills,
            }
          : current,
      );
    } catch (caught) {
      console.error("Resume upload/analysis error:", caught);

      setState("error");
      setProgress(0);

      setMessage(
        caught instanceof ResumeUploadError
          ? caught.message
          : "Unable to analyze the resume. Please try again.",
      );
    }
  };

  // --------------------------------------------------
  // Busy state
  // --------------------------------------------------

  const busy = state === "uploading" || state === "analyzing";

  // --------------------------------------------------
  // Reset local analysis
  // --------------------------------------------------

  const handleAnalyzeAnother = () => {
    setAnalysis(null);
    setResume(null);

    setState("idle");
    setProgress(0);

    setMessage("Upload your resume to analyze your profile.");
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="max-w-5xl space-y-6">
      {/* ------------------------------------------ */}
      {/* Page Header */}
      {/* ------------------------------------------ */}

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Resume & AI Summary
        </h1>

        <p className="text-xs text-slate-500">
          Upload a PDF resume for secure AI-powered information extraction.
        </p>
      </div>

      {/* ------------------------------------------ */}
      {/* Main Content */}
      {/* ------------------------------------------ */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* ---------------------------------------- */}
        {/* Upload Section */}
        {/* ---------------------------------------- */}

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900">
              Upload Resume
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* File Upload */}

            <FileUpload
              accept=".pdf,application/pdf"
              maxSizeMB={10}
              label="Upload PDF Resume"
              description="PDF only (maximum 10MB)"
              onFileSelect={handleFileSelect}
              disabled={busy || loading || !authReady || !currentUser}
            />

            {/* -------------------------------------- */}
            {/* Upload Progress */}
            {/* -------------------------------------- */}

            {state === "uploading" && (
              <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex justify-between text-xs font-medium text-blue-800">
                  <span>Uploading resume...</span>

                  <span>{progress}%</span>
                </div>

                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* -------------------------------------- */}
            {/* AI Analysis */}
            {/* -------------------------------------- */}

            {state === "analyzing" && (
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-center">
                <div className="mx-auto flex h-5 w-5 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>

                <p className="text-xs font-semibold text-indigo-900">
                  AI is analyzing your resume...
                </p>

                <p className="text-[11px] text-indigo-600">
                  Extracting skills, projects, education, and experience
                </p>
              </div>
            )}

            {/* -------------------------------------- */}
            {/* Error */}
            {/* -------------------------------------- */}

            {state === "error" && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{displayedMessage}</span>
              </div>
            )}

            {/* -------------------------------------- */}
            {/* Success */}
            {/* -------------------------------------- */}

            {state === "success" && (
              <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-xs text-green-700">
                ✓ {displayedMessage}
              </div>
            )}

            {/* -------------------------------------- */}
            {/* Current Resume */}
            {/* -------------------------------------- */}

            {activeResume && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div>
                  <p className="text-xs text-slate-500">Current Resume</p>

                  <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                    <span className="block truncate font-semibold text-slate-700">
                      {activeResume.fileName}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-500">
                  The original PDF is processed temporarily and is not stored in
                  Firebase Storage. Upload the PDF again whenever you want a
                  fresh analysis.
                </p>

                {/* Analyze another resume */}

                {activeAnalysis && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={handleAnalyzeAnother}
                    disabled={busy}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Analyze Another Resume
                  </Button>
                )}
              </div>
            )}

            {/* -------------------------------------- */}
            {/* Security Notice */}
            {/* -------------------------------------- */}

            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />

                <span>Zero File Storage Policy Active</span>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-400">
                Files are processed temporarily by the server-side AI analysis
                service. Binary resume files are not stored in Firebase Storage.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* Analysis Result */}
        {/* ------------------------------------------ */}

        <div className="space-y-4 md:col-span-2">
          {activeAnalysis ? (
            <ResumeAnalysisCard analysis={activeAnalysis} />
          ) : (
            <Card className="border-dashed border-slate-200">
              <CardContent className="space-y-3 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-6 w-6" />
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  AI Resume Analysis
                </h3>

                <p className="mx-auto max-w-xs text-xs text-slate-500">
                  {displayedState === "error"
                    ? displayedMessage
                    : "Upload your PDF resume to extract structured skills, projects, education, experience, and other profile information."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
