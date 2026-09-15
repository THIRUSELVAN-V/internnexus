import type { User } from "firebase/auth";
import type { ResumeAnalysis } from "@/lib/types";

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
  // 3. Show upload progress
  // --------------------------------------------------

  onProgress?.(10);

  // --------------------------------------------------
  // 4. Get Firebase authentication token
  // --------------------------------------------------

  let token: string;

  try {
    // Force refresh so we don't accidentally send
    // an expired Firebase ID token.
    token = await user.getIdToken(true);
  } catch (caught) {
    console.error("Failed to get Firebase ID token:", caught);

    throw new ResumeUploadError(
      "Your session has expired. Please sign in again.",
    );
  }

  // --------------------------------------------------
  // 5. Create multipart form data
  // --------------------------------------------------

  const formData = new FormData();

  formData.append("resume", file, file.name);

  // --------------------------------------------------
  // 6. Send PDF to Next.js API
  // --------------------------------------------------

  let response: Response;

  try {
    response = await fetch("/api/resume/analyze", {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
      },

      body: formData,
    });
  } catch (caught) {
    console.error("Resume API request failed:", caught);

    throw new ResumeUploadError(
      "Network error while sending the resume. Please try again.",
    );
  }

  onProgress?.(70);

  // --------------------------------------------------
  // 7. Read API response
  // --------------------------------------------------

  const payload = (await response.json().catch(() => ({}))) as {
    analysis?: ResumeAnalysis & {
      fileName?: string;
    };

    error?: string;
  };

  // --------------------------------------------------
  // 8. Handle API errors
  // --------------------------------------------------

  if (!response.ok) {
    console.error("Resume API failed:", response.status, payload);

    if (response.status === 401) {
      throw new ResumeUploadError(
        "Your session has expired. Please sign in again.",
      );
    }

    throw new ResumeUploadError(
      payload.error ?? `Resume analysis failed (HTTP ${response.status}).`,
    );
  }
  if (!payload.analysis) {
    throw new ResumeUploadError("The AI did not return a resume analysis.");
  }

  // --------------------------------------------------
  // 9. Complete progress
  // --------------------------------------------------

  onProgress?.(100);

  // --------------------------------------------------
  // 10. Return analysis
  // --------------------------------------------------

  return {
    analysis: payload.analysis,

    resume: {
      fileName: payload.analysis.fileName ?? file.name,

      contentType: "application/pdf",

      size: file.size,
    },
  };
}
