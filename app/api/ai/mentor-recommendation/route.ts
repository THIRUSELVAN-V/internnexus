import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 130;

const GEMINI_MODEL = "gemini-3.6-flash";

const mentorRecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      mentorId: z.string().min(1),
      matchScore: z.number().min(0).max(100),
      reasoning: z.string().max(4000),
    }),
  ),
});

type MentorCandidate = {
  mentorId: string;
  mentorName: string;
  designation: string;
  expertise: string[];
  currentWorkload: number;
  maxMentees: number;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const token = authorization.substring("Bearer ".length).trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication token is missing.",
        },
        { status: 401 },
      );
    }

    // ---------------------------------------------------------
    // 1. Verify logged-in user
    // ---------------------------------------------------------

    const decodedToken = await adminAuth.verifyIdToken(token);
    const hrUid = decodedToken.uid;

    const hrSnapshot = await adminDb.collection("users").doc(hrUid).get();

    if (!hrSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "HR profile was not found.",
        },
        { status: 404 },
      );
    }

    const hrData = hrSnapshot.data() ?? {};
    const hrRole = hrData.role;

    if (hrRole !== "hr" && hrRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Only HR or Admin users can generate mentor recommendations.",
        },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);

    const applicationId =
      typeof body?.applicationId === "string" ? body.applicationId.trim() : "";

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Application ID is required.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 2. Get application
    // ---------------------------------------------------------

    const applicationSnapshot = await adminDb
      .collection("applications")
      .doc(applicationId)
      .get();

    if (!applicationSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Application was not found.",
        },
        { status: 404 },
      );
    }

    const application = applicationSnapshot.data() ?? {};

    const studentId =
      typeof application.studentId === "string" ? application.studentId : "";

    const internshipId =
      typeof application.internshipId === "string"
        ? application.internshipId
        : "";

    const applicationCompanyId =
      typeof application.companyId === "string" ? application.companyId : "";

    if (!studentId || !internshipId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The application does not contain student or internship information.",
        },
        { status: 400 },
      );
    }

    // ---------------------------------------------------------
    // 3. HR company authorization
    // ---------------------------------------------------------

    const hrCompanyId =
      typeof hrData.companyId === "string" ? hrData.companyId : "";

    if (
      hrRole === "hr" &&
      hrCompanyId &&
      applicationCompanyId &&
      hrCompanyId !== applicationCompanyId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorized to access this application's mentor recommendations.",
        },
        { status: 403 },
      );
    }

    // ---------------------------------------------------------
    // 4. Get student profile
    // ---------------------------------------------------------

    const studentSnapshot = await adminDb
      .collection("users")
      .doc(studentId)
      .get();

    if (!studentSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Student profile was not found.",
        },
        { status: 404 },
      );
    }

    const student = studentSnapshot.data() ?? {};

    const resumeAnalysis =
      student.resumeAnalysis && typeof student.resumeAnalysis === "object"
        ? student.resumeAnalysis
        : {};

    // ---------------------------------------------------------
    // 5. Get internship
    // ---------------------------------------------------------

    const internshipSnapshot = await adminDb
      .collection("internships")
      .doc(internshipId)
      .get();

    if (!internshipSnapshot.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Internship was not found.",
        },
        { status: 404 },
      );
    }

    const internship = internshipSnapshot.data() ?? {};

    const internshipCompanyId =
      typeof internship.companyId === "string" ? internship.companyId : "";

    if (
      hrRole === "hr" &&
      hrCompanyId &&
      internshipCompanyId &&
      hrCompanyId !== internshipCompanyId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to access this internship.",
        },
        { status: 403 },
      );
    }

    // ---------------------------------------------------------
    // 6. Find mentors
    // ---------------------------------------------------------

    const mentorSnapshot = await adminDb
      .collection("users")
      .where("role", "==", "mentor")
      .get();

    const mentorCandidates: MentorCandidate[] = [];

    for (const mentorDoc of mentorSnapshot.docs) {
      const mentor = mentorDoc.data() ?? {};

      const mentorCompanyId =
        typeof mentor.companyId === "string" ? mentor.companyId : "";

      // For HR users, recommend mentors belonging to the same company.
      if (
        hrRole === "hr" &&
        hrCompanyId &&
        mentorCompanyId &&
        mentorCompanyId !== hrCompanyId
      ) {
        continue;
      }

      const mentorName =
        typeof mentor.name === "string" ? mentor.name : "Unnamed Mentor";

      const designation =
        typeof mentor.designation === "string"
          ? mentor.designation
          : "Industrial Mentor";

      const expertise = [
        ...toStringArray(mentor.expertise),
        ...toStringArray(mentor.skills),
      ].filter((value, index, array) => array.indexOf(value) === index);

      const maxMentees =
        typeof mentor.maxMentees === "number" && mentor.maxMentees > 0
          ? mentor.maxMentees
          : 5;

      // Count applications currently assigned to this mentor.
      const workloadSnapshot = await adminDb
        .collection("applications")
        .where("mentorId", "==", mentorDoc.id)
        .get();

      const currentWorkload = workloadSnapshot.docs.filter((doc) => {
        const data = doc.data() ?? {};

        const status =
          typeof data.status === "string" ? data.status.toLowerCase() : "";

        // Completed/rejected applications should not consume
        // active mentor capacity.
        return (
          status !== "completed" &&
          status !== "rejected" &&
          status !== "withdrawn"
        );
      }).length;

      // Skip mentors who have no available capacity.
      if (currentWorkload >= maxMentees) {
        continue;
      }

      mentorCandidates.push({
        mentorId: mentorDoc.id,
        mentorName,
        designation,
        expertise,
        currentWorkload,
        maxMentees,
      });
    }

    if (mentorCandidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No available mentors were found for this company.",
        },
        { status: 404 },
      );
    }

    // ---------------------------------------------------------
    // 7. Prepare AI input
    // ---------------------------------------------------------

    const candidateData = {
      student: {
        name: typeof student.name === "string" ? student.name : "",
        skills: toStringArray(resumeAnalysis.skills),
        technicalSkills: toStringArray(resumeAnalysis.technicalSkills),
        programmingLanguages: toStringArray(
          resumeAnalysis.programmingLanguages,
        ),
        frameworks: toStringArray(resumeAnalysis.frameworks),
        databases: toStringArray(resumeAnalysis.databases),
        tools: toStringArray(resumeAnalysis.tools),
        projects: Array.isArray(resumeAnalysis.projects)
          ? resumeAnalysis.projects
          : [],
        experience: Array.isArray(resumeAnalysis.workExperience)
          ? resumeAnalysis.workExperience
          : [],
        certifications: toStringArray(resumeAnalysis.certifications),
        summary:
          typeof resumeAnalysis.summary === "string"
            ? resumeAnalysis.summary
            : "",
      },

      internship: {
        title: typeof internship.title === "string" ? internship.title : "",
        domain: typeof internship.domain === "string" ? internship.domain : "",
        description:
          typeof internship.description === "string"
            ? internship.description
            : "",
        requirements: toStringArray(internship.requirements),
        skills: toStringArray(internship.skills),
      },

      mentors: mentorCandidates,
    };

    // ---------------------------------------------------------
    // 8. Ask Gemini to rank mentors
    // ---------------------------------------------------------

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "AI service is not configured.",
        },
        { status: 500 },
      );
    }

    const prompt = `
You are an AI mentor recommendation assistant for an internship management portal.

Your task is to recommend suitable industrial mentors for a student.

Use the following factors:

1. Student skills and technical background.
2. Internship domain and requirements.
3. Mentor expertise and designation.
4. Mentor's current workload and maximum mentee capacity.

Important rules:

- Recommend ONLY mentors from the provided mentor list.
- Never invent a mentor.
- The mentorId in your response MUST exactly match one of the provided mentor IDs.
- Do not modify mentor names, designations, expertise, workload, or capacity.
- A mentor with greater relevant expertise should receive stronger consideration.
- Available capacity should also be considered.
- The matchScore must represent the overall suitability from 0 to 100.
- Explain the recommendation using only the supplied information.
- Do not make hiring decisions.
- The HR user will make the final mentor assignment decision.
- Return the mentors ordered by rank, with rank 1 being the first recommendation.
- Return at most 5 recommendations.

Student and internship information:

${JSON.stringify(candidateData, null, 2)}

Return ONLY valid JSON in this exact structure:

{
  "recommendations": [
    {
      "mentorId": "exact mentor ID from the provided list",
      "matchScore": 0,
      "reasoning": "brief explanation"
    }
  ]
}
`;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 120000);

    let geminiResponse: Response;

    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
              responseJsonSchema: {
                type: "object",
                additionalProperties: false,
                required: ["recommendations"],
                properties: {
                  recommendations: {
                    type: "array",
                    maxItems: 5,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["mentorId", "matchScore", "reasoning"],
                      properties: {
                        mentorId: {
                          type: "string",
                        },
                        matchScore: {
                          type: "number",
                          minimum: 0,
                          maximum: 100,
                        },
                        reasoning: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();

      console.error(
        "Gemini mentor recommendation failed:",
        geminiResponse.status,
        errorText,
      );

      if (geminiResponse.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: "The AI service is temporarily busy. Please try again.",
          },
          { status: 429 },
        );
      }

      if (geminiResponse.status >= 500 || geminiResponse.status === 504) {
        return NextResponse.json(
          {
            success: false,
            error: "The AI service is temporarily unavailable.",
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "The AI mentor recommendation request failed.",
        },
        { status: 502 },
      );
    }

    const geminiPayload = await geminiResponse.json();

    const generatedText =
      geminiPayload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof generatedText !== "string") {
      throw new Error(
        "Gemini returned an empty mentor recommendation response.",
      );
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(generatedText);
    } catch {
      throw new Error(
        "Gemini returned invalid JSON for mentor recommendations.",
      );
    }

    const validated = mentorRecommendationSchema.safeParse(parsedResponse);

    if (!validated.success) {
      console.error(
        "Invalid Gemini mentor recommendation:",
        validated.error.flatten(),
      );

      throw new Error(
        "The AI returned an invalid mentor recommendation format.",
      );
    }

    // ---------------------------------------------------------
    // 9. Convert AI IDs back to trusted Firestore mentor data
    // ---------------------------------------------------------

    const mentorMap = new Map(
      mentorCandidates.map((mentor) => [mentor.mentorId, mentor]),
    );

    const recommendations = validated.data.recommendations
      .filter((recommendation) => mentorMap.has(recommendation.mentorId))
      .map((recommendation, index) => {
        const mentor = mentorMap.get(recommendation.mentorId)!;

        return {
          mentorId: mentor.mentorId,
          mentorName: mentor.mentorName,
          designation: mentor.designation,
          expertise: mentor.expertise,
          matchScore: Math.round(recommendation.matchScore),
          currentWorkload: mentor.currentWorkload,
          maxMentees: mentor.maxMentees,
          reasoning: recommendation.reasoning,
          rank: index + 1,
        };
      });

    if (recommendations.length === 0) {
      throw new Error("The AI did not return any valid available mentors.");
    }

    // ---------------------------------------------------------
    // 10. Save recommendation result
    // ---------------------------------------------------------

    await adminDb.collection("applications").doc(applicationId).update({
      mentorRecommendations: recommendations,
      mentorRecommendationUpdatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error("Mentor recommendation API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
