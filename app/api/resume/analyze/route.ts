import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  analyzeResumePdf,
  ResumeAnalysisError,
} from "@/lib/ai/resumeAnalysisServer";

export const runtime = "nodejs";
export const maxDuration = 130;

const MAX_RESUME_SIZE = 10 * 1024 * 1024; // 10 MB

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  // --------------------------------------------------
  // 1. Check authentication token
  // --------------------------------------------------

  const authorization = request.headers.get("authorization");

  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token) {
    return errorResponse("You must be signed in to analyze a resume.", 401);
  }

  // --------------------------------------------------
  // 2. Verify Firebase user
  // --------------------------------------------------

  let uid: string;

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    uid = decodedToken.uid;
  } catch (caught) {
    console.error("Firebase token verification failed:", caught);

    return errorResponse(
      "Your session has expired. Please sign in again.",
      401,
    );
  }

  // --------------------------------------------------
  // 3. Read uploaded PDF
  // --------------------------------------------------

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (caught) {
    console.error("Failed to read form data:", caught);

    return errorResponse("Invalid resume upload.", 400);
  }

  const uploadedFile = formData.get("resume");

  if (!(uploadedFile instanceof File)) {
    return errorResponse("Please upload a PDF resume.", 400);
  }

  // --------------------------------------------------
  // 4. Validate file type
  // --------------------------------------------------

  const isPdf =
    uploadedFile.type === "application/pdf" ||
    uploadedFile.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return errorResponse("The uploaded file must be a PDF.", 422);
  }

  // --------------------------------------------------
  // 5. Validate file size
  // --------------------------------------------------

  if (uploadedFile.size === 0) {
    return errorResponse("The uploaded resume is empty.", 422);
  }

  if (uploadedFile.size > MAX_RESUME_SIZE) {
    return errorResponse("The resume must be 10MB or smaller.", 422);
  }

  // --------------------------------------------------
  // 6. Check student profile
  // --------------------------------------------------

  const userRef = adminDb.collection("users").doc(uid);

  try {
    const profileSnapshot = await userRef.get();

    if (!profileSnapshot.exists) {
      return errorResponse("Student profile not found.", 404);
    }

    const profileData = profileSnapshot.data();

    if (profileData?.role !== "student") {
      return errorResponse("Only student accounts can analyze resumes.", 403);
    }
  } catch (caught) {
    console.error("Firestore profile lookup failed:", caught);

    return errorResponse("Unable to verify your student profile.", 500);
  }

  // --------------------------------------------------
  // 7. Convert PDF to Buffer
  // --------------------------------------------------

  let pdfBuffer: Buffer;

  try {
    const arrayBuffer = await uploadedFile.arrayBuffer();

    pdfBuffer = Buffer.from(arrayBuffer);
  } catch (caught) {
    console.error("PDF conversion failed:", caught);

    return errorResponse("Unable to process the uploaded PDF.", 422);
  }

  // --------------------------------------------------
  // 8. Basic PDF validation
  // --------------------------------------------------

  const pdfHeader = pdfBuffer.subarray(0, 5);

  if (!pdfHeader.equals(Buffer.from("%PDF-"))) {
    return errorResponse("The uploaded file is not a valid PDF.", 422);
  }

  // --------------------------------------------------
  // 9. Send PDF to Gemini
  // --------------------------------------------------

  try {
    const analysis = await analyzeResumePdf(pdfBuffer);

    // ------------------------------------------------
    // 10. Save analysis in Firestore
    // ------------------------------------------------

    await userRef.set(
      {
        resume: {
          fileName: uploadedFile.name.slice(0, 200),
          contentType: "application/pdf",
          size: pdfBuffer.length,
          analyzedAt: FieldValue.serverTimestamp(),
        },

        resumeAnalysis: {
          ...analysis,
          status: "completed",
          fileName: uploadedFile.name.slice(0, 200),
          analyzedAt: FieldValue.serverTimestamp(),
        },

        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    // ------------------------------------------------
    // 11. Return result to frontend
    // ------------------------------------------------

    return NextResponse.json({
      analysis: {
        ...analysis,
        status: "completed",
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (caught) {
    console.error("Resume analysis failed:", caught);

    const resumeError =
      caught instanceof ResumeAnalysisError
        ? caught
        : new ResumeAnalysisError(
            "Unable to analyze the resume. Please try again.",
          );

    // ------------------------------------------------
    // Save failure status
    // ------------------------------------------------

    try {
      await userRef.set(
        {
          resumeAnalysis: {
            status: "failed",
            fileName: uploadedFile.name.slice(0, 200),
            error: resumeError.message,
            failedAt: FieldValue.serverTimestamp(),
          },

          updatedAt: FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );
    } catch (firestoreError) {
      console.error("Failed to save analysis failure:", firestoreError);
    }

    return NextResponse.json(
      {
        error: resumeError.message,
      },
      {
        status: resumeError.status,
      },
    );
  }
}
