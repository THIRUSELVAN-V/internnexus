import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { analyzeCandidateMatch } from "@/lib/ai/candidateMatchingServer";
import type { CandidateMatch } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 130;

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Firebase ID token
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const token = authorization.substring("Bearer ".length).trim();

    if (!token) {
      return NextResponse.json(
        { error: "Invalid authentication token." },
        { status: 401 },
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Get logged-in user's profile
    const userRef = adminDb.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 },
      );
    }

    const userData = userSnapshot.data();
    const role = userData?.role;

    // Only HR and Admin can perform candidate matching
    if (role !== "hr" && role !== "admin") {
      return NextResponse.json(
        {
          error: "You are not authorized to perform candidate matching.",
        },
        { status: 403 },
      );
    }

    // 3. Read request body
    const body = await request.json();
    const applicationId = body?.applicationId;

    if (typeof applicationId !== "string" || !applicationId.trim()) {
      return NextResponse.json(
        { error: "applicationId is required." },
        { status: 400 },
      );
    }

    // 4. Get application
    const applicationRef = adminDb
      .collection("applications")
      .doc(applicationId);

    const applicationSnapshot = await applicationRef.get();

    if (!applicationSnapshot.exists) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 },
      );
    }

    const applicationData = applicationSnapshot.data();

    const studentId = applicationData?.studentId;
    const internshipId = applicationData?.internshipId;
    const companyId = applicationData?.companyId;

    console.log("Candidate matching application data:", {
      applicationId,
      studentId,
      internshipId,
      companyId,
    });

    if (!studentId || !internshipId) {
      return NextResponse.json(
        {
          error:
            "Application does not contain student or internship information.",
        },
        { status: 400 },
      );
    }

    // 5. HR company authorization
    if (role === "hr" && companyId && userData?.companyId !== companyId) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to analyze applications from this company.",
        },
        { status: 403 },
      );
    }

    // 6. Get student's profile
    const studentRef = adminDb.collection("users").doc(studentId);
    const studentSnapshot = await studentRef.get();

    if (!studentSnapshot.exists) {
      return NextResponse.json(
        {
          error: `Student profile not found for studentId: ${studentId}`,
        },
        { status: 404 },
      );
    }

    const studentData = studentSnapshot.data();

    console.log("Student profile keys:", Object.keys(studentData ?? {}));

    // Resume analysis should normally be stored here
    let resumeAnalysis = studentData?.resumeAnalysis;

    /*
     * Compatibility:
     * Some versions of the resume-analysis flow may store the result
     * inside a nested resume object instead of directly on the user.
     */
    if (!resumeAnalysis && studentData?.resume?.analysis) {
      resumeAnalysis = studentData.resume.analysis;
    }

    /*
     * Some older data may use storedAnalysis.
     */
    if (!resumeAnalysis && studentData?.storedAnalysis) {
      resumeAnalysis = studentData.storedAnalysis;
    }

    if (!resumeAnalysis) {
      return NextResponse.json(
        {
          error:
            "Resume analysis not found for this student. Please ask the student to upload and analyze their resume first.",
        },
        { status: 400 },
      );
    }

    console.log("Resume analysis found for student:", studentId);

    // 7. Get internship
    const internshipRef = adminDb.collection("internships").doc(internshipId);

    const internshipSnapshot = await internshipRef.get();

    if (!internshipSnapshot.exists) {
      return NextResponse.json(
        { error: "Internship not found." },
        { status: 404 },
      );
    }

    const internshipData = internshipSnapshot.data();

    console.log("Internship data:", {
      internshipId,
      title: internshipData?.title,
    });

    // 8. Prepare candidate information
    const candidate = {
      skills: resumeAnalysis.skills ?? resumeAnalysis.technicalSkills ?? [],

      programmingLanguages: resumeAnalysis.programmingLanguages ?? [],

      frameworks: resumeAnalysis.frameworks ?? [],

      databases: resumeAnalysis.databases ?? [],

      tools: resumeAnalysis.tools ?? [],

      projects: (resumeAnalysis.projects ?? []).map(
        (project: {
          name?: string;
          description?: string;
          technologies?: string[];
        }) =>
          `${project.name ?? ""}: ${project.description ?? ""}. Technologies: ${
            project.technologies?.join(", ") ?? ""
          }`,
      ),

      experience: (
        resumeAnalysis.experience ??
        resumeAnalysis.workExperience ??
        []
      ).map(
        (experience: {
          company?: string;
          role?: string;
          position?: string;
          title?: string;
          description?: string;
        }) =>
          `${
            experience.role ?? experience.position ?? experience.title ?? ""
          } at ${experience.company ?? ""}: ${experience.description ?? ""}`,
      ),

      internships: (resumeAnalysis.internships ?? []).map(
        (internship: {
          company?: string;
          role?: string;
          position?: string;
          title?: string;
          description?: string;
        }) =>
          `${
            internship.role ?? internship.position ?? internship.title ?? ""
          } at ${internship.company ?? ""}: ${internship.description ?? ""}`,
      ),

      certifications: resumeAnalysis.certifications ?? [],

      summary: resumeAnalysis.summary ?? "",
    };

    // 9. Prepare internship information
    const internship = {
      title: internshipData.title ?? internshipData.name ?? "",

      description: internshipData.description ?? "",

      requirements:
        internshipData.requirements ??
        internshipData.internshipRequirements ??
        [],

      skills: internshipData.skills ?? internshipData.requiredSkills ?? [],

      domain: internshipData.domain ?? "",
    };

    // 10. Send candidate + internship data to Gemini
    console.log(
      `Starting AI candidate matching for application ${applicationId}`,
    );

    const analysis = await analyzeCandidateMatch({
      candidate,
      internship,
    });

    // 11. Build CandidateMatch result
    const match: CandidateMatch = {
      applicationId,
      internshipId,
      studentId,
      matchScore: analysis.matchScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      reasoning: analysis.reasoning,
      recommendation: analysis.recommendation,
      analyzedAt: new Date().toISOString(),
    };

    // 12. Save AI result
    await applicationRef.set(
      {
        candidateMatch: match,

        matchScore: match.matchScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        matchReasoning: match.reasoning,

        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    console.log(
      `AI candidate matching completed for application ${applicationId}`,
    );

    // 13. Return result
    return NextResponse.json({
      success: true,
      match,
    });
  } catch (error) {
    console.error("Candidate matching API error:", error);

    if (
      error instanceof Error &&
      (error.message.toLowerCase().includes("token") ||
        error.message.toLowerCase().includes("auth"))
    ) {
      return NextResponse.json(
        { error: "Authentication failed." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Candidate matching failed.",
      },
      { status: 500 },
    );
  }
}
