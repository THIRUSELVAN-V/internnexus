import { z } from "zod";

// ======================================================
// Basic reusable schemas
// ======================================================

const text = z.string().trim().max(4000).catch("");

const list = z.array(z.string().trim().min(1).max(300)).catch([]);

// ======================================================
// Education Schema
// ======================================================

const educationSchema = z.object({
  degree: text,

  institution: text,

  fieldOfStudy: text.optional().default(""),

  dates: text.optional().default(""),
});

// ======================================================
// Project Schema
// ======================================================

const projectSchema = z.object({
  name: text,

  description: text,

  technologies: list,

  url: text.optional().default(""),
});

// ======================================================
// Experience Schema
// ======================================================

const experienceSchema = z.object({
  title: text,

  company: text,

  duration: text,

  description: text,
});

// ======================================================
// Complete Resume Analysis Schema
// ======================================================

export const resumeAnalysisSchema = z.object({
  fullName: text,

  email: text,

  phone: text,

  // ------------------------------
  // Skills
  // ------------------------------

  technicalSkills: list,

  programmingLanguages: list,

  frameworks: list,

  databases: list,

  tools: list,

  // ------------------------------
  // Education
  // ------------------------------

  education: z.array(educationSchema).catch([]),

  // ------------------------------
  // Projects
  // ------------------------------

  projects: z.array(projectSchema).catch([]),

  // ------------------------------
  // Experience
  // ------------------------------

  workExperience: z.array(experienceSchema).catch([]),

  internships: z.array(experienceSchema).catch([]),

  // ------------------------------
  // Certifications
  // ------------------------------

  certifications: list,

  // ------------------------------
  // Summary
  // ------------------------------

  summary: text,
});

export type ExtractedResumeAnalysis = z.infer<typeof resumeAnalysisSchema>;

// ======================================================
// Gemini JSON Schema
// ======================================================

const stringArraySchema = {
  type: "array",

  items: {
    type: "string",
  },
};

const experienceGeminiSchema = {
  type: "object",

  additionalProperties: false,

  required: ["title", "company", "duration", "description"],

  properties: {
    title: {
      type: "string",
    },

    company: {
      type: "string",
    },

    duration: {
      type: "string",
    },

    description: {
      type: "string",
    },
  },
};

const educationGeminiSchema = {
  type: "object",

  additionalProperties: false,

  required: ["degree", "institution", "fieldOfStudy", "dates"],

  properties: {
    degree: {
      type: "string",
    },

    institution: {
      type: "string",
    },

    fieldOfStudy: {
      type: "string",
    },

    dates: {
      type: "string",
    },
  },
};

const projectGeminiSchema = {
  type: "object",

  additionalProperties: false,

  required: ["name", "description", "technologies", "url"],

  properties: {
    name: {
      type: "string",
    },

    description: {
      type: "string",
    },

    technologies: stringArraySchema,

    url: {
      type: "string",
    },
  },
};

// ======================================================
// Gemini Resume JSON Schema
// ======================================================

export const geminiResumeSchema = {
  type: "object",

  additionalProperties: false,

  required: [
    "fullName",
    "email",
    "phone",
    "education",
    "technicalSkills",
    "programmingLanguages",
    "frameworks",
    "databases",
    "tools",
    "projects",
    "workExperience",
    "internships",
    "certifications",
    "summary",
  ],

  properties: {
    // ------------------------------
    // Personal information
    // ------------------------------

    fullName: {
      type: "string",
    },

    email: {
      type: "string",
    },

    phone: {
      type: "string",
    },

    // ------------------------------
    // Education
    // ------------------------------

    education: {
      type: "array",

      items: educationGeminiSchema,
    },

    // ------------------------------
    // Skills
    // ------------------------------

    technicalSkills: stringArraySchema,

    programmingLanguages: stringArraySchema,

    frameworks: stringArraySchema,

    databases: stringArraySchema,

    tools: stringArraySchema,

    // ------------------------------
    // Projects
    // ------------------------------

    projects: {
      type: "array",

      items: projectGeminiSchema,
    },

    // ------------------------------
    // Experience
    // ------------------------------

    workExperience: {
      type: "array",

      items: experienceGeminiSchema,
    },

    internships: {
      type: "array",

      items: experienceGeminiSchema,
    },

    // ------------------------------
    // Certifications
    // ------------------------------

    certifications: stringArraySchema,

    // ------------------------------
    // Summary
    // ------------------------------

    summary: {
      type: "string",
    },
  },
} as const;
