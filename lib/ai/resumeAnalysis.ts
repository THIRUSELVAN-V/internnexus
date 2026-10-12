import type { User } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import type { ResumeAnalysis } from "@/lib/types";
import { extractTextFromResumeFile } from "@/lib/utils/resumeExtractor";

const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB

export class ResumeUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResumeUploadError";
  }
}

export interface ResumeAnalyzeResult {
  analysis: ResumeAnalysis;

  resume: {
    fileName: string;
    contentType: "application/pdf";
    size: number;
  };
}

/**
 * Analyzes a resume file or raw text string in-memory without uploading to permanent storage.
 * Used during user registration or instant skill parsing.
 */
export async function analyzeResume(
  resumeTextOrFile: string | File
): Promise<ResumeAnalysis> {
  let resumeText: string;

  if (typeof resumeTextOrFile === "string") {
    resumeText = resumeTextOrFile;
  } else {
    resumeText = await extractTextFromResumeFile(resumeTextOrFile);
  }

  const response = await fetch("/api/ai/analyze-resume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resumeText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Resume analysis failed (HTTP ${response.status})`
    );
  }

  const result = (await response.json()) as ResumeAnalysis;
  return {
    ...result,
    status: result.status || "completed",
  };
}

export async function uploadAndAnalyzeResume(
  file: File,
  user: User,
  onProgress?: (value: number) => void,
): Promise<ResumeAnalyzeResult> {
  // --------------------------------------------------
  // 1. Validate file type
  // --------------------------------------------------

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new ResumeUploadError("Please select a PDF resume.");
  }

  // --------------------------------------------------
  // 2. Validate file size
  // --------------------------------------------------

  if (file.size === 0) {
    throw new ResumeUploadError("The selected resume is empty.");
  }

  if (file.size > MAX_RESUME_SIZE) {
    throw new ResumeUploadError("The resume must be 10MB or smaller.");
  }

  // --------------------------------------------------
  // 3. Run AI analysis
  //    First try the proper PDF route (Gemini). If Gemini
  //    is not configured (503) fall back to the text route.
  // --------------------------------------------------

  onProgress?.(20);

  let analysis: ResumeAnalysis;

  try {
    // --- attempt 1: send raw PDF to /api/resume/analyze ---
    const idToken = await user.getIdToken(true);
    const formData = new FormData();
    formData.append("resume", file);

    onProgress?.(35);

    const pdfResponse = await fetch("/api/resume/analyze", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
      body: formData,
    });

    if (pdfResponse.status === 503) {
      // Gemini not configured — fall through to text-based fallback
      throw new Error("GEMINI_NOT_CONFIGURED");
    }

    if (!pdfResponse.ok) {
      const errData = await pdfResponse.json().catch(() => ({}));
      throw new ResumeUploadError(
        errData.error || `Resume analysis failed (HTTP ${pdfResponse.status})`
      );
    }

    const pdfResult = await pdfResponse.json() as { analysis: ResumeAnalysis };
    analysis = { ...pdfResult.analysis, status: pdfResult.analysis.status || "completed" };

  } catch (primaryErr) {
    if (
      primaryErr instanceof ResumeUploadError ||
      !(primaryErr instanceof Error && primaryErr.message === "GEMINI_NOT_CONFIGURED")
    ) {
      // Hard failure — re-throw, don't fall back
      if (primaryErr instanceof ResumeUploadError) throw primaryErr;
      throw new ResumeUploadError(
        primaryErr instanceof Error
          ? primaryErr.message
          : "Resume analysis failed. Please try again."
      );
    }

    // --- attempt 2: text-extraction fallback (no Gemini key) ---
    console.warn("Gemini not configured, falling back to text-based resume analysis.");
    try {
      analysis = await analyzeResume(file);
    } catch (fallbackErr) {
      console.error("Fallback resume analysis failed:", fallbackErr);
      throw new ResumeUploadError(
        fallbackErr instanceof Error
          ? fallbackErr.message
          : "Resume analysis failed. Please try again."
      );
    }
  }

  onProgress?.(70);

  // --------------------------------------------------
  // 4. Save analysis & resume metadata to Firestore
  //    (only needed for fallback path; PDF route already
  //     saves via adminDb on the server)
  // --------------------------------------------------

  const resumeData = {
    fileName: file.name.slice(0, 200),
    contentType: "application/pdf" as const,
    size: file.size,
  };

  try {
    const db = getFirebaseDb();
    await setDoc(
      doc(db, "users", user.uid),
      {
        resume: {
          ...resumeData,
          analyzedAt: new Date().toISOString(),
        },
        resumeAnalysis: {
          ...analysis,
          status: "completed",
          fileName: resumeData.fileName,
          analyzedAt: new Date().toISOString(),
        },
        skills: analysis.skills || [],
        resumeAnalyzed: true,
        resumeAnalyzedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (firestoreErr) {
    console.warn("Failed to persist resume analysis to Firestore:", firestoreErr);
  }

  onProgress?.(100);

  // --------------------------------------------------
  // 5. Return structured analysis result
  // --------------------------------------------------

  return {
    analysis,
    resume: resumeData,
  };
}
