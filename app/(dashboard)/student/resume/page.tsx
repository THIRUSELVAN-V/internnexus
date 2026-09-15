"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

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

import { useAuthContext } from "@/contexts/AuthContext";

type AnalysisState = "idle" | "uploading" | "analyzing" | "success" | "error";

export default function StudentResumePage() {
  const { user, profile, loading } = useAuthContext();

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

  const [resume, setResume] = useState<ResumeMetadata | null>(null);

  const [state, setState] = useState<AnalysisState>("idle");

  const [progress, setProgress] = useState(0);

  const [message, setMessage] = useState(
    "Upload your resume to analyze your profile.",
  );

  // --------------------------------------------------
  // Existing student profile
  // --------------------------------------------------

  const storedProfile = profile as StudentProfile | null;

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

      // ----------------------------------------------
      // Save result in local state
      // ----------------------------------------------

      setResume(result.resume);

      setAnalysis(result.analysis);

      setProgress(100);

      setState("success");

      setMessage("Resume analysis completed successfully.");
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
  // UI
  // --------------------------------------------------

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Resume & AI Summary
        </h1>

        <p className="text-xs text-slate-500">
          Upload a PDF resume for secure AI-powered information extraction.
        </p>
      </div>

      {/* Main Content */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* ------------------------------------------ */}
        {/* Upload Section */}
        {/* ------------------------------------------ */}

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
              disabled={busy || loading || !user}
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
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />

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
              <p
                role="alert"
                className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700"
              >
                {displayedMessage}
              </p>
            )}

            {/* -------------------------------------- */}
            {/* Success */}
            {/* -------------------------------------- */}

            {state === "success" && (
              <p className="rounded-lg border border-green-100 bg-green-50 p-3 text-xs text-green-700">
                ✓ {displayedMessage}
              </p>
            )}

            {/* -------------------------------------- */}
            {/* Current Resume */}
            {/* -------------------------------------- */}

            {activeResume && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">Current Resume:</p>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <span className="block truncate font-semibold text-slate-700">
                    {activeResume.fileName}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
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
                    onClick={() => {
                      setAnalysis(null);
                      setResume(null);
                      setState("idle");
                      setProgress(0);
                      setMessage("Upload your resume to analyze your profile.");
                    }}
                    disabled={busy}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Analyze Another Resume
                  </Button>
                )}
              </div>
            )}
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
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-6 w-6" />
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  AI Resume Analysis
                </h3>

                <p className="mx-auto mt-2 max-w-xs text-xs text-slate-500">
                  {displayedMessage}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
