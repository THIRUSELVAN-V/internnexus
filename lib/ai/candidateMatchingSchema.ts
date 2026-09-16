import { z } from "zod";

// ======================================================
// Basic reusable schemas
// ======================================================

const text = z.string().trim().max(4000).catch("");

const skillList = z.array(z.string().trim().min(1).max(300)).catch([]);

// ======================================================
// Candidate Match Schema
// ======================================================

export const candidateMatchSchema = z.object({
  matchScore: z.number().min(0).max(100),

  matchedSkills: skillList,

  missingSkills: skillList,

  reasoning: text,

  recommendation: z.enum([
    "strong_match",
    "good_match",
    "partial_match",
    "weak_match",
  ]),
});

export type ExtractedCandidateMatch = z.infer<typeof candidateMatchSchema>;

// ======================================================
// Gemini Structured Output Schema
// ======================================================

export const geminiCandidateMatchSchema = {
  type: "object",

  additionalProperties: false,

  required: [
    "matchScore",
    "matchedSkills",
    "missingSkills",
    "reasoning",
    "recommendation",
  ],

  properties: {
    matchScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },

    matchedSkills: {
      type: "array",

      items: {
        type: "string",
      },
    },

    missingSkills: {
      type: "array",

      items: {
        type: "string",
      },
    },

    reasoning: {
      type: "string",
    },

    recommendation: {
      type: "string",

      enum: ["strong_match", "good_match", "partial_match", "weak_match"],
    },
  },
} as const;
