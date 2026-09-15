import "server-only";

import {
  geminiResumeSchema,
  resumeAnalysisSchema,
  type ExtractedResumeAnalysis,
} from "./resumeAnalysisSchema";

const GEMINI_MODEL = "gemini-3.6-flash";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const INSTRUCTION = `
You are an AI resume analysis assistant for an internship management platform.

Analyze the provided student resume and extract ONLY information explicitly present in the resume.

Rules:
1. Do not infer information.
2. Do not estimate information.
3. Do not invent qualifications, skills, projects, experience, or education.
4. If information is not present, return an empty string or empty array.
5. Keep the extracted information accurate to the resume.
6. Do not add explanations outside the JSON.
7. Return ONLY valid JSON matching the supplied schema.
8. The summary must be concise and based only on the resume content.
`;

export class ResumeAnalysisError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502,
  ) {
    super(message);
    this.name = "ResumeAnalysisError";
  }
}

export async function analyzeResumePdf(
  pdf: Buffer,
): Promise<ExtractedResumeAnalysis> {
  // --------------------------------------------------
  // 1. Check Gemini API key
  // --------------------------------------------------

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing.");

    throw new ResumeAnalysisError("Resume analysis is not configured.", 503);
  }

  // --------------------------------------------------
  // 2. Validate PDF
  // --------------------------------------------------

  if (!pdf || pdf.length === 0) {
    throw new ResumeAnalysisError("The uploaded resume is empty.", 422);
  }

  // --------------------------------------------------
  // 3. Convert PDF to Base64
  // --------------------------------------------------

  const base64Pdf = pdf.toString("base64");

  // --------------------------------------------------
  // 4. Set timeout
  // --------------------------------------------------

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 120_000);

  try {
    // ------------------------------------------------
    // 5. Call Gemini
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
                text: "Extract the structured resume information from this PDF.",
              },

              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64Pdf,
                },
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0,

          responseMimeType: "application/json",

          responseJsonSchema: geminiResumeSchema,
        },
      }),
    });

    // ------------------------------------------------
    // 6. Handle Gemini errors
    // ------------------------------------------------

    if (!response.ok) {
      const detail = await response.text();

      console.error(
        "Gemini resume analysis failed:",
        response.status,
        detail.slice(0, 1000),
      );

      if (response.status === 400) {
        throw new ResumeAnalysisError(
          "The resume could not be processed by the AI service.",
          400,
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new ResumeAnalysisError(
          "The AI service authentication failed. Please check the Gemini API key.",
          502,
        );
      }

      if (response.status === 429) {
        throw new ResumeAnalysisError(
          "The AI service is busy. Please try again shortly.",
          429,
        );
      }

      if (response.status >= 500) {
        throw new ResumeAnalysisError(
          "The AI service is temporarily unavailable. Please try again.",
          502,
        );
      }

      throw new ResumeAnalysisError(
        "The AI service could not analyze this resume.",
        502,
      );
    }

    // ------------------------------------------------
    // 7. Read Gemini response
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
    // 8. Check for blocked response
    // ------------------------------------------------

    if (payload.promptFeedback?.blockReason) {
      console.error(
        "Gemini blocked the resume:",
        payload.promptFeedback.blockReason,
      );

      throw new ResumeAnalysisError(
        "The AI service could not process this resume.",
        422,
      );
    }

    // ------------------------------------------------
    // 9. Extract JSON text
    // ------------------------------------------------

    const resultText = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!resultText) {
      console.error(
        "Gemini returned no text:",
        JSON.stringify(payload).slice(0, 1000),
      );

      throw new ResumeAnalysisError("The AI returned an empty response.", 502);
    }

    // ------------------------------------------------
    // 10. Parse JSON
    // ------------------------------------------------

    let parsed: unknown;

    try {
      parsed = JSON.parse(resultText);
    } catch (caught) {
      console.error(
        "Failed to parse Gemini JSON:",
        caught,
        resultText.slice(0, 1000),
      );

      throw new ResumeAnalysisError(
        "The AI returned an invalid analysis response.",
        502,
      );
    }

    // ------------------------------------------------
    // 11. Validate JSON using Zod schema
    // ------------------------------------------------

    const validated = resumeAnalysisSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Invalid Gemini resume schema:", validated.error.flatten());

      throw new ResumeAnalysisError(
        "The AI returned an invalid analysis response.",
        502,
      );
    }

    // ------------------------------------------------
    // 12. Return structured resume analysis
    // ------------------------------------------------

    return validated.data;
  } catch (caught) {
    // Already handled ResumeAnalysisError
    if (caught instanceof ResumeAnalysisError) {
      throw caught;
    }

    // Request timeout
    if (caught instanceof DOMException && caught.name === "AbortError") {
      throw new ResumeAnalysisError(
        "Resume analysis timed out. Please try again.",
        504,
      );
    }

    console.error("Unexpected resume analysis error:", caught);

    throw new ResumeAnalysisError(
      "Unable to analyze the resume. Please try again.",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
