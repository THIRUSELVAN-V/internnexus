import { NextResponse } from "next/server";
import { z } from "zod";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { adminAuth } from "@/lib/firebase/admin";
import { withServerDb } from "@/lib/firebase/serverDb";

export const runtime = "nodejs";
export const maxDuration = 60;

const GEMINI_MODEL = "gemini-1.5-flash";

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
  email?: string;
  companyId: string;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string" && value.trim()) {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Tech stack affinities for semantic skill matching
const SKILL_CLUSTERS: Record<string, string[]> = {
  frontend: [
    "react",
    "reactjs",
    "nextjs",
    "vue",
    "vuejs",
    "angular",
    "javascript",
    "typescript",
    "html",
    "css",
    "tailwind",
    "ui",
    "ux",
    "figma",
    "web",
    "frontend",
  ],
  backend: [
    "nodejs",
    "node",
    "express",
    "expressjs",
    "java",
    "springboot",
    "python",
    "django",
    "flask",
    "fastapi",
    "c#",
    "dotnet",
    "go",
    "golang",
    "restapi",
    "rest",
    "api",
    "microservices",
    "backend",
  ],
  data_ai: [
    "python",
    "sql",
    "etl",
    "spark",
    "apachespark",
    "pandas",
    "numpy",
    "machinelearning",
    "ml",
    "ai",
    "dataengineering",
    "datascience",
    "tensorflow",
    "pytorch",
    "aws",
    "bigdata",
  ],
  database: [
    "sql",
    "mysql",
    "postgresql",
    "postgres",
    "mongodb",
    "redis",
    "firebase",
    "firestore",
    "database",
  ],
  cloud_devops: [
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "git",
    "github",
    "cicd",
    "linux",
    "cloud",
  ],
  design: [
    "figma",
    "ui",
    "ux",
    "uidesign",
    "uxdesign",
    "wireframing",
    "prototyping",
    "userresearch",
    "productdesign",
  ],
};

function calculateIntelligentMatch(
  mentor: MentorCandidate,
  studentSkills: string[],
  internshipRequirements: string[],
  internshipDomain: string,
  hasResumeData: boolean,
  studentName: string,
): { matchScore: number; reasoning: string } {
  const normMentorExpertise = mentor.expertise.map(normalize);
  const normStudentSkills = studentSkills.map(normalize);
  const normRequirements = internshipRequirements.map(normalize);
  const normDomain = normalize(internshipDomain);

  // 1. Direct matches between student skills and mentor expertise
  const directStudentMatches: string[] = [];
  mentor.expertise.forEach((exp, idx) => {
    const normExp = normMentorExpertise[idx];
    const isMatched = normStudentSkills.some(
      (s) => s.includes(normExp) || normExp.includes(s),
    );
    if (isMatched) {
      directStudentMatches.push(exp);
    }
  });

  // 2. Direct matches between mentor expertise and internship requirements / domain
  const directRequirementMatches: string[] = [];
  mentor.expertise.forEach((exp, idx) => {
    const normExp = normMentorExpertise[idx];
    const matchesReq = normRequirements.some(
      (r) => r.includes(normExp) || normExp.includes(r),
    );
    const matchesDomain = normDomain && (normDomain.includes(normExp) || normExp.includes(normDomain));
    if (matchesReq || matchesDomain) {
      directRequirementMatches.push(exp);
    }
  });

  // 3. Cluster / domain synergy
  let clusterSynergy = 0;
  for (const cluster of Object.values(SKILL_CLUSTERS)) {
    const mentorInCluster = normMentorExpertise.some((e) => cluster.includes(e));
    const studentInCluster = normStudentSkills.some((s) => cluster.includes(s));
    const reqInCluster = normRequirements.some((r) => cluster.includes(r));
    const domainInCluster = normDomain && cluster.some((c) => normDomain.includes(c));

    if (mentorInCluster && (reqInCluster || domainInCluster)) {
      clusterSynergy += 8;
    } else if (mentorInCluster && studentInCluster) {
      clusterSynergy += 4;
    }
  }
  clusterSynergy = Math.min(clusterSynergy, 16);

  // Workload availability bonus: mentors with more open slots get a small boost
  const availableSlots = Math.max(0, mentor.maxMentees - mentor.currentWorkload);
  const availabilityBonus = Math.min(5, availableSlots);

  let matchScore: number;
  let reasoning: string;

  if (hasResumeData && studentSkills.length > 0) {
    const directRatio = directStudentMatches.length / Math.max(mentor.expertise.length, 1);
    const studentScore = Math.round(directRatio * 22);
    const reqScore = Math.min(15, directRequirementMatches.length * 5);

    matchScore = Math.min(98, Math.max(60, 50 + studentScore + reqScore + clusterSynergy + availabilityBonus));

    const matchedList = Array.from(new Set([...directStudentMatches, ...directRequirementMatches]));
    if (matchedList.length > 0) {
      reasoning = `Strong technical alignment on ${matchedList.slice(0, 4).join(", ")}. As ${mentor.designation}, ${mentor.mentorName} has direct domain expertise matching ${studentName}'s background and the internship requirements (${mentor.currentWorkload}/${mentor.maxMentees} active mentees).`;
    } else {
      reasoning = `${mentor.mentorName} brings established industrial experience as ${mentor.designation} with core expertise in ${mentor.expertise.slice(0, 3).join(", ")}, offering hands-on technical guidance with open capacity (${mentor.currentWorkload}/${mentor.maxMentees} mentees).`;
    }
  } else {
    const reqScore = Math.min(22, directRequirementMatches.length * 6);
    matchScore = Math.min(92, Math.max(62, 58 + reqScore + clusterSynergy + availabilityBonus));

    const matchedList = directRequirementMatches.length > 0 ? directRequirementMatches : mentor.expertise;
    reasoning = `Resume analysis is pending for ${studentName}. Recommended based on ${mentor.mentorName}'s verified expertise in ${matchedList.slice(0, 3).join(", ")} matching the ${internshipDomain || "internship"} requirements (${mentor.currentWorkload}/${mentor.maxMentees} active mentees).`;
  }

  return { matchScore: Math.round(matchScore), reasoning };
}

async function callGeminiIfAvailable(
  candidateData: unknown,
  mentorCandidates: MentorCandidate[],
): Promise<{ mentorId: string; matchScore: number; reasoning: string }[] | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const prompt = `You are an AI mentor recommendation assistant for InternNexus.
Recommend industrial mentors for a student's internship from the supplied eligible company mentor list ONLY.

Rules:
- Recommend ONLY mentors from the supplied mentor list.
- Never invent a mentor.
- mentorId MUST exactly match one of the provided mentor IDs.
- matchScore must be between 0 and 100 based on technical expertise alignment and workload.
- Explain every recommendation clearly and concisely.
- Return recommendations in descending order of suitability (maximum 5).

Data:
${JSON.stringify(candidateData, null, 2)}
`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
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
                      mentorId: { type: "string" },
                      matchScore: { type: "number", minimum: 0, maximum: 100 },
                      reasoning: { type: "string" },
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

    if (!response.ok) {
      console.warn(`Gemini returned status ${response.status}, falling back to intelligent matcher.`);
      return null;
    }

    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    const validated = mentorRecommendationSchema.safeParse(parsed);
    if (!validated.success) return null;

    const validMentorIds = new Set(mentorCandidates.map((m) => m.mentorId));
    const filtered = validated.data.recommendations.filter((r) =>
      validMentorIds.has(r.mentorId),
    );

    return filtered.length > 0 ? filtered : null;
  } catch (err) {
    console.warn("Gemini call failed or timed out, continuing with intelligent matching:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    // =========================================================
    // 1. Verify Authentication
    // =========================================================
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    const token = authorization.substring("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication token is missing." },
        { status: 401 },
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const hrUid = decodedToken.uid;

    // =========================================================
    // 2. Read Request Body
    // =========================================================
    const body = await request.json().catch(() => null);
    const applicationId =
      typeof body?.applicationId === "string" ? body.applicationId.trim() : "";

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required." },
        { status: 400 },
      );
    }

    // =========================================================
    // 3. Process with Database Connection
    // =========================================================
    return await withServerDb(async (db) => {
      // -------------------------------------------------------
      // 3A. Fetch HR User Profile
      // -------------------------------------------------------
      const hrSnap = await getDoc(doc(db, "users", hrUid));
      if (!hrSnap.exists()) {
        return NextResponse.json(
          { success: false, error: "HR user profile was not found." },
          { status: 404 },
        );
      }

      const hrData = hrSnap.data() || {};
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

      // -------------------------------------------------------
      // 3B. Fetch Application
      // -------------------------------------------------------
      const appRef = doc(db, "applications", applicationId);
      const appSnap = await getDoc(appRef);
      if (!appSnap.exists()) {
        return NextResponse.json(
          { success: false, error: "Application record was not found." },
          { status: 404 },
        );
      }

      const application = appSnap.data() || {};
      const studentId = typeof application.studentId === "string" ? application.studentId.trim() : "";
      const internshipId = typeof application.internshipId === "string" ? application.internshipId.trim() : "";
      const appCompanyId = typeof application.companyId === "string" ? application.companyId.trim() : "";

      if (!studentId || !internshipId) {
        return NextResponse.json(
          {
            success: false,
            error: "The application is missing student or internship reference information.",
          },
          { status: 400 },
        );
      }

      // -------------------------------------------------------
      // 3C. Fetch Internship
      // -------------------------------------------------------
      const internshipSnap = await getDoc(doc(db, "internships", internshipId));
      if (!internshipSnap.exists()) {
        return NextResponse.json(
          { success: false, error: "Internship details were not found." },
          { status: 404 },
        );
      }

      const internship = internshipSnap.data() || {};
      const internshipCompanyId =
        typeof internship.companyId === "string"
          ? internship.companyId.trim()
          : "";

      // Target company offering the student's internship
      const targetCompanyId = appCompanyId || internshipCompanyId;

      if (!targetCompanyId) {
        return NextResponse.json(
          {
            success: false,
            error: "Company details are missing for this internship application.",
          },
          { status: 400 },
        );
      }

      // -------------------------------------------------------
      // 3D. Fetch Target Company Details & Verify HR Authorization
      // -------------------------------------------------------
      const companySnap = await getDoc(doc(db, "companies", targetCompanyId));
      const companyData = companySnap.exists() ? companySnap.data() : null;
      const resolvedCompanyName =
        companyData?.name ||
        application.companyName ||
        internship.companyName ||
        "the offering company";

      if (hrRole === "hr") {
        const isAuthorizedCompany =
          (hrCompanyId && hrCompanyId === targetCompanyId) ||
          (companyData?.hrId && companyData.hrId === hrUid) ||
          (Array.isArray(companyData?.hrIds) && companyData.hrIds.includes(hrUid));

        if (!isAuthorizedCompany) {
          return NextResponse.json(
            {
              success: false,
              error: `You are not authorized to view mentor recommendations for ${resolvedCompanyName}.`,
            },
            { status: 403 },
          );
        }
      }

      // -------------------------------------------------------
      // 3E. Fetch Student Profile & Resume Data
      // -------------------------------------------------------
      const studentSnap = await getDoc(doc(db, "users", studentId));
      if (!studentSnap.exists()) {
        return NextResponse.json(
          { success: false, error: "Student profile was not found." },
          { status: 404 },
        );
      }

      const student = studentSnap.data() || {};
      const studentName =
        student.displayName ||
        student.name ||
        application.studentName ||
        "the student";

      // Handle resume analysis gracefully (support various storage locations)
      const resumeAnalysis =
        (student.resumeAnalysis && typeof student.resumeAnalysis === "object"
          ? student.resumeAnalysis
          : null) ||
        (student.resume?.analysis && typeof student.resume.analysis === "object"
          ? student.resume.analysis
          : null) ||
        (student.storedAnalysis && typeof student.storedAnalysis === "object"
          ? student.storedAnalysis
          : null) ||
        (application.aiAnalysis && typeof application.aiAnalysis === "object"
          ? application.aiAnalysis
          : null);

      // Collect all student skills
      const extractedSkills = [
        ...toStringArray(student.skills),
        ...toStringArray(resumeAnalysis?.skills),
        ...toStringArray(resumeAnalysis?.technicalSkills),
        ...toStringArray(resumeAnalysis?.programmingLanguages),
        ...toStringArray(resumeAnalysis?.frameworks),
        ...toStringArray(resumeAnalysis?.technologies),
        ...toStringArray(resumeAnalysis?.tools),
        ...toStringArray(resumeAnalysis?.domains),
      ].filter((val, idx, self) => self.indexOf(val) === idx);

      const hasResumeData = Boolean(
        resumeAnalysis || extractedSkills.length > 0,
      );

      // -------------------------------------------------------
      // 3F. Query ONLY Mentors Registered with THIS Company
      // -------------------------------------------------------
      // Mentors must strictly belong to targetCompanyId!
      const mentorsMap = new Map<string, {
        mentorId: string;
        mentorName: string;
        designation: string;
        expertise: string[];
        maxMentees: number;
        companyId: string;
        email?: string;
      }>();

      // 1. Check users collection for mentors of target company
      const usersSnap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "mentor"),
          where("companyId", "==", targetCompanyId),
        ),
      );

      for (const mentorDoc of usersSnap.docs) {
        const m = mentorDoc.data() || {};
        const mId = m.uid || mentorDoc.id;
        const name = m.displayName || m.name || "Industrial Mentor";
        const designation = m.designation || "Industrial Mentor";
        const expertise = [
          ...toStringArray(m.expertise),
          ...toStringArray(m.skills),
        ].filter((v, i, a) => a.indexOf(v) === i);

        mentorsMap.set(mId, {
          mentorId: mId,
          mentorName: name,
          designation,
          expertise,
          maxMentees: typeof m.maxMentees === "number" && m.maxMentees > 0 ? m.maxMentees : 5,
          companyId: targetCompanyId,
          email: m.email || "",
        });
      }

      // 2. Cross-reference company's authorizedMentors subcollection
      const authMentorsSnap = await getDocs(
        collection(db, "companies", targetCompanyId, "authorizedMentors"),
      );

      let unregisteredCount = 0;
      for (const authDoc of authMentorsSnap.docs) {
        const authData = authDoc.data() || {};
        if (authData.registered && authData.mentorUserId) {
          const uid = String(authData.mentorUserId).trim();
          const existing = mentorsMap.get(uid);

          if (existing) {
            // Augment with any authorized records details if missing
            const extraExp = toStringArray(authData.expertise);
            if (extraExp.length > 0) {
              existing.expertise = [
                ...existing.expertise,
                ...extraExp,
              ].filter((v, i, a) => a.indexOf(v) === i);
            }
            if (!existing.designation || existing.designation === "Industrial Mentor") {
              if (authData.designation) existing.designation = authData.designation;
            }
          } else {
            // Fetch user record if not in previous query
            const userDocSnap = await getDoc(doc(db, "users", uid));
            if (userDocSnap.exists() && userDocSnap.data()?.role === "mentor") {
              const uData = userDocSnap.data() || {};
              const expertise = [
                ...toStringArray(uData.expertise),
                ...toStringArray(uData.skills),
                ...toStringArray(authData.expertise),
              ].filter((v, i, a) => a.indexOf(v) === i);

              mentorsMap.set(uid, {
                mentorId: uid,
                mentorName: uData.displayName || uData.name || authData.name || "Industrial Mentor",
                designation: uData.designation || authData.designation || "Industrial Mentor",
                expertise,
                maxMentees: typeof uData.maxMentees === "number" && uData.maxMentees > 0 ? uData.maxMentees : 5,
                companyId: targetCompanyId,
                email: uData.email || authData.email || "",
              });
            }
          }
        } else if (!authData.registered) {
          unregisteredCount++;
        }
      }

      // Check if any mentors are registered with this company
      if (mentorsMap.size === 0) {
        if (unregisteredCount > 0) {
          return NextResponse.json(
            {
              success: false,
              error: `No registered mentors found for "${resolvedCompanyName}". ${unregisteredCount} mentor(s) have been authorized by HR but have not completed their account registration yet.`,
            },
            { status: 404 },
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: `No mentors are registered with "${resolvedCompanyName}". HR must authorize company mentors in the Company Mentors section before recommendations can be generated.`,
          },
          { status: 404 },
        );
      }

      // -------------------------------------------------------
      // 3G. Calculate Workload for Eligible Mentors
      // -------------------------------------------------------
      // Get all active applications for target company to calculate mentor mentee counts
      const companyAppsSnap = await getDocs(
        query(
          collection(db, "applications"),
          where("companyId", "==", targetCompanyId),
        ),
      );

      const activeApplications = companyAppsSnap.docs.filter((d) => {
        const st = (d.data()?.status || "").trim().toLowerCase();
        return !["completed", "rejected", "withdrawn"].includes(st);
      });

      const workloadCountByMentor = new Map<string, number>();
      for (const d of activeApplications) {
        const mId = d.data()?.mentorId;
        if (mId) {
          workloadCountByMentor.set(mId, (workloadCountByMentor.get(mId) || 0) + 1);
        }
      }

      // Build available candidates with workload
      const mentorCandidates: MentorCandidate[] = [];
      for (const mentor of mentorsMap.values()) {
        const currentWorkload = workloadCountByMentor.get(mentor.mentorId) || 0;
        if (currentWorkload >= mentor.maxMentees) {
          console.log(`Mentor ${mentor.mentorName} (${mentor.mentorId}) is at full capacity (${currentWorkload}/${mentor.maxMentees}).`);
          continue;
        }

        mentorCandidates.push({
          ...mentor,
          currentWorkload,
        });
      }

      if (mentorCandidates.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `All mentors registered with "${resolvedCompanyName}" have reached their maximum mentee capacity. Please authorize new mentors or wait until existing internships conclude.`,
          },
          { status: 409 },
        );
      }

      // -------------------------------------------------------
      // 3H. Intelligent Skill Matching & Recommendations
      // -------------------------------------------------------
      const internshipSkills = toStringArray(internship.skills);
      const internshipReqs = toStringArray(internship.requirements);
      const internshipDomain = internship.domain || internship.title || "";

      // Calculate intelligent local recommendations
      const localRecommendations = mentorCandidates.map((mentor) => {
        const { matchScore, reasoning } = calculateIntelligentMatch(
          mentor,
          extractedSkills,
          [...internshipSkills, ...internshipReqs],
          internshipDomain,
          hasResumeData,
          studentName,
        );

        return {
          mentorId: mentor.mentorId,
          mentorName: mentor.mentorName,
          designation: mentor.designation,
          expertise: mentor.expertise,
          matchScore,
          currentWorkload: mentor.currentWorkload,
          maxMentees: mentor.maxMentees,
          reasoning,
        };
      });

      // Sort descending by matchScore
      localRecommendations.sort((a, b) => b.matchScore - a.matchScore);

      // Attempt Gemini enhancement if configured
      let finalRecommendations = localRecommendations;
      const candidatePayloadForAI = {
        student: {
          name: studentName,
          skills: extractedSkills,
          summary: resumeAnalysis?.summary || "",
        },
        internship: {
          title: internship.title || "",
          domain: internshipDomain,
          requiredSkills: internshipSkills,
          requirements: internshipReqs,
        },
        mentors: mentorCandidates.map((m) => ({
          mentorId: m.mentorId,
          mentorName: m.mentorName,
          designation: m.designation,
          expertise: m.expertise,
          currentWorkload: m.currentWorkload,
          maxMentees: m.maxMentees,
        })),
      };

      const geminiRecs = await callGeminiIfAvailable(
        candidatePayloadForAI,
        mentorCandidates,
      );

      if (geminiRecs && geminiRecs.length > 0) {
        const candidateMap = new Map(mentorCandidates.map((m) => [m.mentorId, m]));
        finalRecommendations = geminiRecs
          .filter((gr) => candidateMap.has(gr.mentorId))
          .map((gr) => {
            const m = candidateMap.get(gr.mentorId)!;
            return {
              mentorId: m.mentorId,
              mentorName: m.mentorName,
              designation: m.designation,
              expertise: m.expertise,
              matchScore: Math.round(gr.matchScore),
              currentWorkload: m.currentWorkload,
              maxMentees: m.maxMentees,
              reasoning: gr.reasoning,
            };
          });
      }

      // Rank top 5 recommendations
      const rankedRecommendations = finalRecommendations.slice(0, 5).map((rec, index) => ({
        ...rec,
        rank: index + 1,
      }));

      // -------------------------------------------------------
      // 3I. Save Recommendations to Application Record
      // -------------------------------------------------------
      try {
        await updateDoc(appRef, {
          mentorRecommendations: rankedRecommendations,
          mentorRecommendationUpdatedAt: new Date().toISOString(),
        });
      } catch (saveErr) {
        console.warn("Could not cache mentor recommendations on application doc:", saveErr);
      }

      return NextResponse.json({
        success: true,
        recommendations: rankedRecommendations,
      });
    });
  } catch (error: unknown) {
    console.error("Mentor recommendation API error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
