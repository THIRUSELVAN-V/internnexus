import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export interface ReportAIResult {
  summary: string;
  completed: string[];   // short phrases — what the student did
  missed: string[];      // short phrases — what was skipped / incomplete
  completionScore: number; // 0–100
  overallAssessment: string; // e.g. "Excellent" | "Good" | "Satisfactory" | "Needs Improvement"
}

function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let reportText: string;
  try {
    const body = await request.json();
    reportText = (body.reportText ?? '').trim();
  } catch {
    return errorResponse('Invalid request body.', 400);
  }

  if (!reportText || reportText.length < 10) {
    return errorResponse('Report text is too short to analyse.', 400);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (apiKey) {
    try {
      const result = await analyseWithGemini(reportText, apiKey);
      return NextResponse.json(result);
    } catch (err) {
      console.warn('Gemini analysis failed, using local fallback:', err);
    }
  }

  return NextResponse.json(localAnalyse(reportText));
}

// ─── Gemini call ───────────────────────────────────────────────────────────────

async function analyseWithGemini(text: string, apiKey: string): Promise<ReportAIResult> {
  const prompt = `You are an expert internship evaluator reviewing a student's task completion report.

Analyse the report below and return a JSON object with exactly these fields:

{
  "summary": "2-4 sentence professional evaluation of the student's work",
  "completed": ["2-4 word phrase", "2-4 word phrase"],   // 3–6 items the student clearly completed
  "missed": ["2-4 word phrase", "2-4 word phrase"],       // 2–4 items that are missing, incomplete, or weak (empty array if nothing missed)
  "completionScore": 85,                                  // integer 0–100 reflecting overall task completion quality
  "overallAssessment": "Good"                             // exactly one of: Excellent | Good | Satisfactory | Needs Improvement
}

Rules:
- "completed" and "missed" entries must be very short (2–5 words max each), action-noun style, e.g. "API integration done", "Unit tests missing"
- completionScore should reflect both completeness AND quality (not just if they submitted)
- Return ONLY the JSON object, no markdown, no explanation

Student Report:
"""
${text.slice(0, 5000)}
"""`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini API returned ${res.status}`);

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Empty Gemini response');

  const parsed = JSON.parse(raw);
  return {
    summary: String(parsed.summary || ''),
    completed: Array.isArray(parsed.completed) ? parsed.completed.map(String) : [],
    missed: Array.isArray(parsed.missed) ? parsed.missed.map(String) : [],
    completionScore: Math.min(100, Math.max(0, parseInt(parsed.completionScore) || 70)),
    overallAssessment: String(parsed.overallAssessment || 'Satisfactory'),
  };
}

// ─── Local fallback ────────────────────────────────────────────────────────────

function localAnalyse(text: string): ReportAIResult {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  const completed: string[] = [];
  const missed: string[] = [];

  if (lower.includes('complet') || lower.includes('finish') || lower.includes('done')) completed.push('Task completed');
  if (lower.includes('implement') || lower.includes('built') || lower.includes('created')) completed.push('Implementation done');
  if (lower.includes('test') || lower.includes('verif')) completed.push('Testing covered');
  if (lower.includes('document') || lower.includes('readme')) completed.push('Documentation added');
  if (lower.includes('deploy') || lower.includes('hosted')) completed.push('Deployment done');
  if (completed.length === 0) completed.push('Report submitted');

  if (!lower.includes('test')) missed.push('Testing missing');
  if (!lower.includes('document') && !lower.includes('readme')) missed.push('Documentation missing');

  const score = Math.min(95, Math.max(40, 50 + wordCount / 5));

  return {
    summary: `The student submitted a ${wordCount}-word report. Configure GEMINI_API_KEY for a full AI evaluation including detailed strengths and improvement areas.`,
    completed,
    missed,
    completionScore: Math.round(score),
    overallAssessment: score >= 80 ? 'Good' : score >= 60 ? 'Satisfactory' : 'Needs Improvement',
  };
}
