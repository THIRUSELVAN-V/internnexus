import "server-only";

import {
  candidateMatchSchema,
  geminiCandidateMatchSchema,
  type ExtractedCandidateMatch,
} from "./candidateMatchingSchema";

const GEMINI_MODEL = "gemini-3.6-flash";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const INSTRUCTION = `
You are an AI candidate-to-internship matching assistant for the InternNexus internship management platform.

Your task is to compare a student's documented qualifications with an internship's requirements.

Analyze:
- Technical skills
- Programming languages
- Frameworks
- Databases
- Tools
- Projects
- Work experience
- Internship experience
- Certifications
- Resume summary
- Internship title
- Internship description
- Required skills
- Internship requirements
- Internship domain

Rules:

1. Use ONLY the information provided.
2. Do not invent skills or experience.
3. Do not assume that a candidate knows a technology just because it is related to another technology.
4. Consider semantic similarity between skills where appropriate.
5. Identify skills explicitly or strongly supported by the candidate information as matched skills.
6. Identify internship requirements that are not supported by the candidate information as missing skills.
7. Calculate a match score from 0 to 100 based on the overall alignment.
8. The score must reflect the overall candidate-internship fit, not simply the number of matching keywords.
9. Give a concise explanation for the score.
10. Select exactly one recommendation:
   - strong_match
   - good_match
   - partial_match
   - weak_match
11. Do not make hiring decisions.
12. Do not claim that the candidate will succeed.
13. Return ONLY valid JSON matching the supplied schema.
`;

// ======================================================
// Error class
// ======================================================

export class CandidateMatchingError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502,
  ) {
    super(message);
    this.name = "CandidateMatchingError";
  }
}

// ======================================================
// Input type
// ======================================================

export interface CandidateMatchingData {
  candidate: {
    skills: string[];
    programmingLanguages?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
    projects?: string[];
    experience?: string[];
    internships?: string[];
    certifications?: string[];
    summary?: string;
  };

  internship: {
    title?: string;
    description?: string;
    requirements: string[];
    skills?: string[];
    domain?: string;
  };
}

// ======================================================
// Main AI matching function
// ======================================================

export async function analyzeCandidateMatch(
  data: CandidateMatchingData,
): Promise<ExtractedCandidateMatch> {
  // --------------------------------------------------
  // 1. Check API key
  // --------------------------------------------------

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing.");

    throw new CandidateMatchingError(
      "Candidate matching AI is not configured.",
      503,
    );
  }

  // --------------------------------------------------
  // 2. Build candidate information
  // --------------------------------------------------

  const candidateInformation = `
CANDIDATE INFORMATION

Skills:
${data.candidate.skills.join(", ") || "None provided"}

Programming Languages:
${data.candidate.programmingLanguages?.join(", ") || "None provided"}

Frameworks:
${data.candidate.frameworks?.join(", ") || "None provided"}

Databases:
${data.candidate.databases?.join(", ") || "None provided"}

Tools:
${data.candidate.tools?.join(", ") || "None provided"}

Projects:
${data.candidate.projects?.join("\n") || "None provided"}

Work Experience:
${data.candidate.experience?.join("\n") || "None provided"}

Internships:
${data.candidate.internships?.join("\n") || "None provided"}

Certifications:
${data.candidate.certifications?.join(", ") || "None provided"}

Resume Summary:
${data.candidate.summary || "None provided"}
`;

  // --------------------------------------------------
  // 3. Build internship information
  // --------------------------------------------------

  const internshipInformation = `
INTERNSHIP INFORMATION

Title:
${data.internship.title || "Not provided"}

Domain:
${data.internship.domain || "Not provided"}

Description:
${data.internship.description || "Not provided"}

Required Skills:
${data.internship.skills?.join(", ") || "None provided"}

Requirements:
${data.internship.requirements.join("\n") || "None provided"}
`;

  // --------------------------------------------------
  // 4. Create AI prompt
  // --------------------------------------------------

  const prompt = `
Compare the following candidate with the internship.

${candidateInformation}

${internshipInformation}

Return the candidate-internship matching analysis according to the supplied JSON schema.
`;

  // --------------------------------------------------
  // 5. Set timeout
  // --------------------------------------------------

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 120_000);

  try {
    // ------------------------------------------------
    // 6. Call Gemini
    // ------------------------------------------------

    const response = await fetch(GEMINI_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },

      signal: controller.signal,

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: INSTRUCTION,
            },
          ],
        },

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
          temperature: 0,

          responseMimeType: "application/json",

          responseJsonSchema: geminiCandidateMatchSchema,
        },
      }),
    });

    // ------------------------------------------------
    // 7. Handle Gemini errors
    // ------------------------------------------------

    if (!response.ok) {
      const detail = await response.text();

      console.error(
        "Gemini candidate matching failed:",
        response.status,
        detail.slice(0, 1000),
      );

      if (response.status === 400) {
        throw new CandidateMatchingError(
          "The candidate matching request was invalid.",
          400,
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new CandidateMatchingError(
          "The AI service authentication failed.",
          502,
        );
      }

      if (response.status === 429) {
        throw new CandidateMatchingError(
          "The AI service is busy. Please try again shortly.",
          429,
        );
      }

      if (response.status >= 500) {
        throw new CandidateMatchingError(
          "The AI service is temporarily unavailable.",
          502,
        );
      }

      throw new CandidateMatchingError(
        "The AI service could not calculate the candidate match.",
        502,
      );
    }

    // ------------------------------------------------
    // 8. Read Gemini response
    // ------------------------------------------------

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;

      promptFeedback?: {
        blockReason?: string;
      };
    };

    // ------------------------------------------------
    // 9. Check blocked response
    // ------------------------------------------------

    if (payload.promptFeedback?.blockReason) {
      console.error(
        "Gemini blocked candidate matching:",
        payload.promptFeedback.blockReason,
      );

      throw new CandidateMatchingError(
        "The AI service could not process the matching request.",
        422,
      );
    }

    // ------------------------------------------------
    // 10. Extract response text
    // ------------------------------------------------

    const resultText = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!resultText) {
      console.error(
        "Gemini returned an empty candidate match response:",
        JSON.stringify(payload).slice(0, 1000),
      );

      throw new CandidateMatchingError(
        "The AI returned an empty matching response.",
        502,
      );
    }

    // ------------------------------------------------
    // 11. Parse JSON
    // ------------------------------------------------

    let parsed: unknown;

    try {
      parsed = JSON.parse(resultText);
    } catch (caught) {
      console.error(
        "Failed to parse Gemini candidate match JSON:",
        caught,
        resultText.slice(0, 1000),
      );

      throw new CandidateMatchingError(
        "The AI returned an invalid matching response.",
        502,
      );
    }

    // ------------------------------------------------
    // 12. Validate using Zod
    // ------------------------------------------------

    const validated = candidateMatchSchema.safeParse(parsed);

    if (!validated.success) {
      console.error(
        "Invalid Gemini candidate match schema:",
        validated.error.flatten(),
      );

      throw new CandidateMatchingError(
        "The AI returned an invalid matching response.",
        502,
      );
    }

    // ------------------------------------------------
    // 13. Return validated result
    // ------------------------------------------------

    return validated.data;
  } catch (caught) {
    if (caught instanceof CandidateMatchingError) {
      throw caught;
    }

    if (caught instanceof DOMException && caught.name === "AbortError") {
      throw new CandidateMatchingError(
        "Candidate matching timed out. Please try again.",
        504,
      );
    }

    console.error("Unexpected candidate matching error:", caught);

    throw new CandidateMatchingError(
      "Unable to calculate the candidate match.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
