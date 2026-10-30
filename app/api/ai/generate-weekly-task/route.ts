import { NextResponse } from 'next/server';
import type { TaskSuggestion } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domain, week, description, studentName } = body as {
      domain?: string;
      week?: number;
      description?: string;
      studentName?: string;
    };

    const targetWeek = typeof week === 'number' ? week : 1;
    const targetDomain = domain || 'Web Development';
    const targetDesc = description || '';

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (apiKey) {
      const prompt = `You are an expert technical mentor creating a weekly internship task for a student.

Domain: "${targetDomain}"
Week Number: Week ${targetWeek}
Target Student: "${studentName || 'Student Intern'}"
${targetDesc ? `Specific Project / Topic Requirements:\n"""\n${targetDesc}\n"""` : ''}

Generate a realistic, comprehensive, actionable task tailored to this domain and week.
Output MUST be JSON matching this EXACT schema:
{
  "week": ${targetWeek},
  "title": "Clear Actionable Task Title",
  "description": "2-3 sentence overview of the task deliverable and goals",
  "instructions": "1. Detailed step 1\\n2. Detailed step 2\\n3. Detailed step 3\\n4. Detailed step 4",
  "estimatedHours": 20,
  "resources": ["Resource 1", "Resource 2"],
  "tags": ["${targetDomain}", "Tag2", "Tag3"],
  "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
}`;

      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.3,
                },
              }),
            }
          );

          if (res.ok) {
            const json = await res.json();
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              return NextResponse.json({
                week: targetWeek,
                title: parsed.title || `Week ${targetWeek}: ${targetDomain} Deliverable`,
                description: parsed.description || 'Complete weekly milestone task.',
                instructions:
                  typeof parsed.instructions === 'string'
                    ? parsed.instructions
                    : Array.isArray(parsed.instructions)
                    ? parsed.instructions.join('\n')
                    : '1. Review requirements.\n2. Build feature.\n3. Submit for review.',
                estimatedHours: parsed.estimatedHours || 20,
                resources: parsed.resources || ['Documentation'],
                tags: parsed.tags || [targetDomain],
                learningObjectives: parsed.learningObjectives || ['Master core concepts'],
              });
            }
          }
        } catch (e) {
          console.warn(`Error generating weekly task with model ${model}:`, e);
        }
      }
    }

    // Fallback template
    return NextResponse.json({
      week: targetWeek,
      title: `Week ${targetWeek}: ${targetDomain} Core Milestone`,
      description: `Implement core ${targetDomain} features and deliverables matching weekly learning outcomes.`,
      instructions: `1. Review feature requirements and architectural specifications.\n2. Implement modular solution components using ${targetDomain} standards.\n3. Write automated unit tests for key methods.\n4. Prepare documentation and submit deliverable for mentor review.`,
      estimatedHours: 20,
      resources: [`${targetDomain} Official Documentation`, 'Code Review Guidelines'],
      tags: [targetDomain, `Week-${targetWeek}`],
      learningObjectives: ['Implement industry design patterns', 'Deliver production quality code', 'Write automated tests'],
    });
  } catch (error: any) {
    console.error('Error in generate-weekly-task route:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate task' }, { status: 500 });
  }
}
