import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const maxDuration = 130;

const GEMINI_MODEL = "gemini-3.6-flash";

const MAX_GEMINI_ATTEMPTS = 3;

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

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    // =========================================================
    // 1. Verify authentication
    // =========================================================

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

    const decodedToken = await adminAuth.verifyIdToken(token);
    const hrUid = decodedToken.uid;

    // =========================================================
    // 2. Get HR profile
    // =========================================================

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

    const hrCompanyId =
      typeof hrData.companyId === "string" ? hrData.companyId.trim() : "";

    console.log("Mentor recommendation - HR:", {
      hrUid,
      hrRole,
      hrCompanyId,
    });

    // =========================================================
    // 3. Read request
    // =========================================================

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

    console.log("Mentor recommendation - application:", applicationId);

    // =========================================================
    // 4. Get application
    // =========================================================

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
      typeof application.studentId === "string"
        ? application.studentId.trim()
        : "";

    const internshipId =
      typeof application.internshipId === "string"
        ? application.internshipId.trim()
        : "";

    const applicationCompanyId =
      typeof application.companyId === "string"
        ? application.companyId.trim()
        : "";

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

    // =========================================================
    // 5. Verify HR company access
    // =========================================================

    if (
      hrRole === "hr" &&
      (!hrCompanyId ||
        !applicationCompanyId ||
        hrCompanyId !== applicationCompanyId)
    ) {
      console.error("Mentor recommendation - company mismatch:", {
        hrCompanyId,
        applicationCompanyId,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "You are not authorized to access this application's mentor recommendations.",
        },
        { status: 403 },
      );
    }

    // =========================================================
    // 6. Get student
    // =========================================================

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

    // =========================================================
    // 7. Get internship
    // =========================================================

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
      typeof internship.companyId === "string"
        ? internship.companyId.trim()
        : "";

    if (
      hrRole === "hr" &&
      (!internshipCompanyId || internshipCompanyId !== hrCompanyId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to access this internship.",
        },
        { status: 403 },
      );
    }

    // =========================================================
    // 8. Find mentors
    // =========================================================

    const usersSnapshot = await adminDb.collection("users").get();

    const allUsers = usersSnapshot.docs;

    const mentorDocs = allUsers.filter((doc) => {
      const data = doc.data() ?? {};
      return data.role === "mentor";
    });

    console.log("Mentor recommendation - database diagnostics:", {
      totalUsers: allUsers.length,
      mentorCount: mentorDocs.length,
      hrCompanyId,
      mentors: mentorDocs.map((doc) => {
        const data = doc.data() ?? {};

        return {
          documentId: doc.id,
          uid: data.uid ?? null,
          role: data.role ?? null,
          companyId: data.companyId ?? null,
          displayName: data.displayName ?? data.name ?? null,
        };
      }),
    });

    if (mentorDocs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No mentor users were found in the Firestore users collection.",
        },
        { status: 404 },
      );
    }

    // =========================================================
    // 9. Filter mentors by company
    // =========================================================

    const sameCompanyMentors = mentorDocs.filter((mentorDoc) => {
      const mentor = mentorDoc.data() ?? {};

      const mentorCompanyId =
        typeof mentor.companyId === "string" ? mentor.companyId.trim() : "";

      if (hrRole === "admin") {
        return true;
      }

      return mentorCompanyId === hrCompanyId;
    });

    console.log("Mentor recommendation - company filtering:", {
      hrCompanyId,
      mentorCount: mentorDocs.length,
      sameCompanyMentorCount: sameCompanyMentors.length,
      sameCompanyMentors: sameCompanyMentors.map((doc) => {
        const data = doc.data() ?? {};

        return {
          documentId: doc.id,
          uid: data.uid ?? null,
          displayName: data.displayName ?? data.name ?? null,
          companyId: data.companyId ?? null,
        };
      }),
    });

    if (sameCompanyMentors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No mentors are assigned to company "${hrCompanyId}".`,
        },
        { status: 404 },
      );
    }

    // =========================================================
    // 10. Build available mentor candidates
    // =========================================================

    const mentorCandidates: MentorCandidate[] = [];

    for (const mentorDoc of sameCompanyMentors) {
      const mentor = mentorDoc.data() ?? {};

      const mentorId =
        typeof mentor.uid === "string" && mentor.uid.trim()
          ? mentor.uid.trim()
          : mentorDoc.id;

      const mentorName =
        typeof mentor.displayName === "string" && mentor.displayName.trim()
          ? mentor.displayName.trim()
          : typeof mentor.name === "string" && mentor.name.trim()
            ? mentor.name.trim()
            : "Unnamed Mentor";

      const designation =
        typeof mentor.designation === "string" && mentor.designation.trim()
          ? mentor.designation.trim()
          : "Industrial Mentor";

      const expertise = [
        ...toStringArray(mentor.expertise),
        ...toStringArray(mentor.skills),
      ].filter((value, index, array) => array.indexOf(value) === index);

      const maxMentees =
        typeof mentor.maxMentees === "number" &&
        Number.isFinite(mentor.maxMentees) &&
        mentor.maxMentees > 0
          ? mentor.maxMentees
          : 5;

      // -------------------------------------------------------
      // Workload query using mentor UID
      // -------------------------------------------------------

      const workloadByMentorId = await adminDb
        .collection("applications")
        .where("mentorId", "==", mentorId)
        .get();

      // Also check document ID in case older data used it.
      const workloadByDocumentId =
        mentorId !== mentorDoc.id
          ? await adminDb
              .collection("applications")
              .where("mentorId", "==", mentorDoc.id)
              .get()
          : null;

      const workloadDocuments = new Map<
        string,
        (typeof workloadByMentorId.docs)[number]
      >();

      for (const doc of workloadByMentorId.docs) {
        workloadDocuments.set(doc.id, doc);
      }

      if (workloadByDocumentId) {
        for (const doc of workloadByDocumentId.docs) {
          workloadDocuments.set(doc.id, doc);
        }
      }

      const activeApplications = Array.from(workloadDocuments.values()).filter(
        (applicationDoc) => {
          const data = applicationDoc.data() ?? {};

          const status =
            typeof data.status === "string"
              ? data.status.trim().toLowerCase()
              : "";

          const assignedMentorId =
            typeof data.mentorId === "string" ? data.mentorId.trim() : "";

          if (
            assignedMentorId !== mentorId &&
            assignedMentorId !== mentorDoc.id
          ) {
            return false;
          }

          return !["completed", "rejected", "withdrawn"].includes(status);
        },
      );

      const currentWorkload = activeApplications.length;

      console.log("Mentor workload:", {
        mentorId,
        mentorDocumentId: mentorDoc.id,
        mentorName,
        maxMentees,
        currentWorkload,
        applicationIds: activeApplications.map((doc) => doc.id),
      });

      if (currentWorkload >= maxMentees) {
        console.log(
          `Mentor "${mentorName}" skipped because workload ${currentWorkload}/${maxMentees} is full.`,
        );

        continue;
      }

      mentorCandidates.push({
        mentorId,
        mentorName,
        designation,
        expertise,
        currentWorkload,
        maxMentees,
      });
    }

    console.log("Mentor recommendation - final candidates:", mentorCandidates);

    if (mentorCandidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Mentors were found for the company, but all available mentors have reached their maximum mentee capacity.",
        },
        { status: 409 },
      );
    }

    // =========================================================
    // 11. Prepare AI input
    // =========================================================

    const candidateData = {
      student: {
        name:
          typeof student.displayName === "string"
            ? student.displayName
            : typeof student.name === "string"
              ? student.name
              : "",

        skills: toStringArray(resumeAnalysis.skills),

        technicalSkills: toStringArray(resumeAnalysis.technicalSkills),

        programmingLanguages: toStringArray(
          resumeAnalysis.programmingLanguages,
        ),

        frameworks: toStringArray(resumeAnalysis.frameworks),

        technologies: toStringArray(resumeAnalysis.technologies),

        tools: toStringArray(resumeAnalysis.tools),

        domains: toStringArray(resumeAnalysis.domains),

        projects: Array.isArray(resumeAnalysis.projects)
          ? resumeAnalysis.projects
          : [],

        experience: Array.isArray(resumeAnalysis.experience)
          ? resumeAnalysis.experience
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

    // =========================================================
    // 12. Gemini API key
    // =========================================================

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

    // =========================================================
    // 13. AI prompt
    // =========================================================

    const prompt = `
You are an AI mentor recommendation assistant for an internship management portal.

Your task is to recommend suitable industrial mentors for a student.

Evaluate:

1. Student skills and technical background.
2. Student projects and experience.
3. Internship domain and requirements.
4. Mentor expertise and designation.
5. Mentor current workload and maximum mentee capacity.

Rules:

- Recommend ONLY mentors from the provided mentor list.
- Never invent a mentor.
- The mentorId MUST exactly match one of the provided mentor IDs.
- Do not modify mentor information.
- Consider relevant technical expertise strongly.
- Consider internship requirements and domain.
- Consider mentor workload and available capacity.
- matchScore must be between 0 and 100.
- Explain every recommendation using only the supplied information.
- Do not make hiring decisions.
- The HR user makes the final mentor assignment decision.
- Return recommendations in descending suitability order.
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

    // =========================================================
    // 14. Gemini request with automatic retry
    // =========================================================

    let geminiResponse: Response | null = null;
    let lastGeminiError = "";

    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 120000);

      try {
        console.log(
          `Gemini mentor recommendation attempt ${attempt}/${MAX_GEMINI_ATTEMPTS}`,
        );

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

        if (geminiResponse.ok) {
          break;
        }

        lastGeminiError = await geminiResponse.text();

        console.error("Gemini attempt failed:", {
          attempt,
          status: geminiResponse.status,
          statusText: geminiResponse.statusText,
          body: lastGeminiError,
        });

        // Retry only temporary failures.
        const shouldRetry =
          geminiResponse.status === 503 || geminiResponse.status === 429;

        if (!shouldRetry || attempt >= MAX_GEMINI_ATTEMPTS) {
          break;
        }

        // 2s → 4s
        const delayMs = 2000 * 2 ** (attempt - 1);

        console.warn(
          `Gemini returned ${geminiResponse.status}. ` +
            `Retrying in ${delayMs}ms...`,
        );

        await sleep(delayMs);
      } catch (error) {
        lastGeminiError = getErrorMessage(error);

        console.error("Gemini request error:", {
          attempt,
          error: lastGeminiError,
        });

        if (attempt >= MAX_GEMINI_ATTEMPTS) {
          break;
        }

        const delayMs = 2000 * 2 ** (attempt - 1);

        console.warn(`Retrying Gemini request in ${delayMs}ms...`);

        await sleep(delayMs);
      } finally {
        clearTimeout(timeout);
      }
    }

    // =========================================================
    // 15. Gemini unavailable
    // =========================================================

    if (!geminiResponse) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to connect to the Gemini AI service.",
        },
        { status: 502 },
      );
    }

    if (!geminiResponse.ok) {
      console.error("Gemini mentor recommendation failed after retries:", {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        body: lastGeminiError,
      });

      if (geminiResponse.status === 503) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Gemini is temporarily overloaded. Please try again in a moment.",
          },
          { status: 503 },
        );
      }

      if (geminiResponse.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The Gemini API rate limit was reached. Please try again shortly.",
          },
          { status: 429 },
        );
      }

      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: "The Gemini API key was rejected. Check GEMINI_API_KEY.",
          },
          { status: 502 },
        );
      }

      if (geminiResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: `The Gemini model "${GEMINI_MODEL}" is unavailable.`,
          },
          { status: 502 },
        );
      }

      if (geminiResponse.status === 400) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Gemini rejected the mentor recommendation request because the request data was invalid.",
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

    // =========================================================
    // 16. Parse Gemini response
    // =========================================================

    const geminiPayload = await geminiResponse.json();

    const generatedText =
      geminiPayload?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof generatedText !== "string" || !generatedText.trim()) {
      console.error(
        "Gemini returned unexpected response:",
        JSON.stringify(geminiPayload),
      );

      throw new Error(
        "Gemini returned an empty mentor recommendation response.",
      );
    }

    let parsedResponse: unknown;

    try {
      parsedResponse = JSON.parse(generatedText);
    } catch {
      console.error("Invalid Gemini JSON:", generatedText);

      throw new Error(
        "Gemini returned invalid JSON for mentor recommendations.",
      );
    }

    // =========================================================
    // 17. Validate AI result
    // =========================================================

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

    // =========================================================
    // 18. Trust only mentors we supplied to Gemini
    // =========================================================

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

    // =========================================================
    // 19. Save recommendations to application
    // =========================================================

    await adminDb.collection("applications").doc(applicationId).update({
      mentorRecommendations: recommendations,
      mentorRecommendationUpdatedAt: FieldValue.serverTimestamp(),
    });

    // =========================================================
    // 20. Return success
    // =========================================================

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
