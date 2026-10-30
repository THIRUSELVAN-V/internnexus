import { NextResponse } from 'next/server';
import type { ProjectTaskRoadmap } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

interface MenteeInput {
  id: string;
  name: string;
  skills?: string[];
  role?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectTitle,
      domain,
      projectDescription,
      mentees = [],
    } = body as {
      projectTitle?: string;
      domain?: string;
      projectDescription?: string;
      mentees?: MenteeInput[];
    };

    const cleanTitle = (projectTitle || '').trim();
    const cleanDomain = (domain || '').trim();
    const cleanDesc = (projectDescription || '').trim();

    if (!cleanDesc || cleanDesc.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a descriptive project specification.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (apiKey) {
      try {
        const roadmap = await generateWithGemini(
          cleanTitle,
          cleanDomain,
          cleanDesc,
          mentees,
          apiKey
        );
        if (roadmap && roadmap.length > 0) {
          return NextResponse.json({ roadmap, source: 'ai' });
        }
      } catch (geminiErr) {
        console.warn('Gemini roadmap generation failed, using intelligent analyzer fallback:', geminiErr);
      }
    }

    // Dynamic smart fallback matching the specific project text
    const fallbackRoadmap = generateDynamicFallbackRoadmap(cleanTitle, cleanDomain, cleanDesc, mentees);
    return NextResponse.json({ roadmap: fallbackRoadmap, source: 'dynamic-parser' });
  } catch (error: any) {
    console.error('Error generating project roadmap:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate project roadmap' },
      { status: 500 }
    );
  }
}

async function generateWithGemini(
  title: string,
  domain: string,
  description: string,
  mentees: MenteeInput[],
  apiKey: string
): Promise<ProjectTaskRoadmap[]> {
  const menteesSummary =
    mentees.length > 0
      ? mentees
          .map(
            (m) =>
              `- ID: "${m.id}", Name: "${m.name}", Role: "${m.role || 'Intern'}", Skills: [${(m.skills || []).join(', ')}]`
          )
          .join('\n')
      : 'No specific mentees assigned yet. Use placeholders (suggestedMenteeId: null, suggestedMenteeName: "Assigned Mentee").';

  const prompt = `You are an expert Chief Technology Officer, Technical Lead, and Engineering Mentor.
You are tasked with breaking down a specific software/engineering project into a structured, sequential multi-phase roadmap for student interns.

PROJECT TITLE: "${title || 'Engineering Project'}"
DOMAIN / TECH STACK: "${domain || 'Software Engineering'}"
PROJECT SPECIFICATION & DESCRIPTION:
"""
${description}
"""

AVAILABLE STUDENT MENTEES:
${menteesSummary}

CRITICAL INSTRUCTIONS:
1. Thoroughly read and analyze the project description above.
2. Break THIS SPECIFIC PROJECT down into 4 to 6 sequential milestone phases (Phase 1, Phase 2, etc.).
   - DO NOT generate generic boilerplate or unrelated platform tasks (e.g. DO NOT create "Student Registration" or "Resume Parser" unless the project description is literally about that).
   - EVERY task MUST directly reflect the concrete architecture, features, data models, APIs, and technologies described in the project description.
   - Sequence the phases logically from initial scaffolding and schemas -> core services/APIs -> frontend/UI components -> integration & real-time features -> testing & deployment.
3. For each phase:
   - "stepIndex": integer starting at 1 (1, 2, 3...)
   - "title": Actionable milestone title including the phase number (e.g. "Phase 1: Environment Setup & Database Schema Design")
   - "description": 2 to 3 sentences explaining the phase goals in the context of this specific project
   - "instructions": Detailed numbered step-by-step technical instructions (1. ..., 2. ..., 3. ..., 4. ...) referencing the exact technologies, tools, or components to implement
   - "estimatedHours": Realistic estimate in hours (e.g. 15 to 40)
   - "resources": 2 to 4 relevant documentation links or library names
   - "tags": 3 to 5 relevant technical tags (e.g. ["Python", "FastAPI", "PostgreSQL", "Backend"])
   - "priority": "HIGH" | "MEDIUM" | "LOW"
   - "suggestedMenteeId": The ID of the best suited mentee from the provided list, or null
   - "suggestedMenteeName": The Name of the best suited mentee, or "Assigned Mentee"
   - "matchReasoning": 1 sentence explaining why this mentee was matched based on their specific skills
   - "dependencies": Array of prerequisite phase titles, or empty array for phase 1

Output MUST be valid JSON with this EXACT structure:
{
  "roadmap": [
    {
      "stepIndex": 1,
      "title": "Phase 1: ...",
      "description": "...",
      "instructions": "1. ...\\n2. ...",
      "estimatedHours": 20,
      "resources": ["...", "..."],
      "tags": ["...", "..."],
      "priority": "HIGH",
      "suggestedMenteeId": "...",
      "suggestedMenteeName": "...",
      "matchReasoning": "...",
      "dependencies": []
    }
  ]
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini model ${model} returned HTTP ${response.status}`);
        continue;
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const list = parsed.roadmap || parsed.tasks || (Array.isArray(parsed) ? parsed : null);

      if (Array.isArray(list) && list.length > 0) {
        return list.map((item: any, idx: number) => ({
          stepIndex: typeof item.stepIndex === 'number' ? item.stepIndex : idx + 1,
          title: item.title || `Phase ${idx + 1}: ${title || 'Core Milestone'}`,
          description: item.description || description.slice(0, 150),
          instructions:
            typeof item.instructions === 'string'
              ? item.instructions
              : Array.isArray(item.instructions)
              ? item.instructions.join('\n')
              : '1. Review requirements.\n2. Implement module.\n3. Verify output.',
          estimatedHours: typeof item.estimatedHours === 'number' ? item.estimatedHours : 20,
          resources: Array.isArray(item.resources) ? item.resources : ['Documentation & Architecture Guide'],
          tags: Array.isArray(item.tags) ? item.tags : [domain || 'Software Development'],
          priority: ['HIGH', 'MEDIUM', 'LOW'].includes(item.priority) ? item.priority : 'HIGH',
          suggestedMenteeId: item.suggestedMenteeId || (mentees[idx % mentees.length]?.id ?? null),
          suggestedMenteeName:
            item.suggestedMenteeName || (mentees[idx % mentees.length]?.name ?? 'Assigned Mentee'),
          matchReasoning:
            item.matchReasoning ||
            (mentees.length > 0
              ? `Matched with ${mentees[idx % mentees.length]?.name} based on domain profile.`
              : 'Assigned to active project mentee.'),
          dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
        }));
      }
    } catch (e) {
      console.warn(`Error generating with model ${model}:`, e);
    }
  }

  throw new Error('All Gemini models failed to generate roadmap.');
}

/**
 * Intelligent fallback that parses the actual project description sentences & technical keywords
 * to dynamically construct customized milestones matching this specific project.
 */
function generateDynamicFallbackRoadmap(
  title: string,
  domain: string,
  description: string,
  mentees: MenteeInput[]
): ProjectTaskRoadmap[] {
  const cleanTitle = title || 'Project Core';
  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const keyConcepts = extractTechnicalTerms(description);
  const techStackStr = keyConcepts.length > 0 ? keyConcepts.slice(0, 4).join(', ') : domain || 'Modern Tech';

  const phases: Omit<ProjectTaskRoadmap, 'suggestedMenteeId' | 'suggestedMenteeName' | 'matchReasoning'>[] = [
    {
      stepIndex: 1,
      title: `Phase 1: Architecture Blueprint & Environment Setup for ${cleanTitle}`,
      description: `Establish project repository, configure development environment, and model data structures for ${cleanTitle}. Context: ${sentences[0] || description.slice(0, 120)}`,
      instructions: `1. Initialize repository with clean directory hierarchy and linter configurations.\n2. Set up environment variables and baseline dependencies (${techStackStr}).\n3. Design entity-relationship schema and configure persistent storage.\n4. Validate local builds and document local setup instructions.`,
      estimatedHours: 20,
      resources: ['Environment Configuration Guide', `${domain} Best Practices`],
      tags: ['Architecture', 'Setup', domain || 'Engineering'],
      priority: 'HIGH',
      dependencies: [],
    },
    {
      stepIndex: 2,
      title: `Phase 2: Core Domain Logic & Backend API Services`,
      description: `Develop primary backend services, data access layers, and business logic according to specifications: ${sentences[1] || 'Implement core controllers and CRUD operations.'}`,
      instructions: `1. Implement modular API endpoints covering key project workflows.\n2. Add input validation schemas, error handling middleware, and logging.\n3. Integrate database operations with transaction safety.\n4. Write comprehensive unit tests for core service methods.`,
      estimatedHours: 25,
      resources: ['RESTful API Design Standards', 'Database Query Optimization'],
      tags: ['Backend', 'API', 'Business Logic'],
      priority: 'HIGH',
      dependencies: [`Phase 1: Architecture Blueprint & Environment Setup for ${cleanTitle}`],
    },
    {
      stepIndex: 3,
      title: `Phase 3: User Interface & Component Architecture`,
      description: `Build responsive client interface and interactive components matching requirements: ${sentences[2] || 'Design intuitive user views and state management.'}`,
      instructions: `1. Scaffold UI component hierarchy with clean state management.\n2. Connect frontend views to backend API endpoints with async loading and error states.\n3. Implement data visualization, filtering, and responsive mobile/desktop layouts.\n4. Conduct accessibility audits and refine interactive feedback.`,
      estimatedHours: 25,
      resources: ['Design System Specs', 'Component Accessibility (WCAG)'],
      tags: ['Frontend', 'UI/UX', 'Components'],
      priority: 'HIGH',
      dependencies: [`Phase 2: Core Domain Logic & Backend API Services`],
    },
    {
      stepIndex: 4,
      title: `Phase 4: Advanced Features, Integrations & Real-Time Sync`,
      description: `Implement advanced feature specifications, third-party integrations, and end-to-end data synchronization for ${cleanTitle}. ${sentences[3] || ''}`,
      instructions: `1. Implement specialized business logic and third-party service connections.\n2. Optimize query performance and implement caching layers where appropriate.\n3. Conduct end-to-end user journey tests across all integrated modules.\n4. Perform security checks, input sanitization, and access permission validation.`,
      estimatedHours: 30,
      resources: ['System Integration Docs', 'Performance Profiling Reference'],
      tags: ['Integration', 'Advanced', 'Security'],
      priority: 'MEDIUM',
      dependencies: [`Phase 3: User Interface & Component Architecture`],
    },
    {
      stepIndex: 5,
      title: `Phase 5: Performance Optimization, Quality Assurance & Deployment`,
      description: `Conduct end-to-end testing, audit performance benchmarks, and prepare deployment pipeline for final project deliverable.`,
      instructions: `1. Run full automated integration test suite and fix edge-case anomalies.\n2. Audit build sizes, load times, and resource consumption.\n3. Prepare deployment configurations and configure continuous integration.\n4. Assemble technical documentation and project walkthrough demo.`,
      estimatedHours: 20,
      resources: ['Production Deployment Checklist', 'Final Evaluation Guidelines'],
      tags: ['QA', 'DevOps', 'Deployment'],
      priority: 'HIGH',
      dependencies: [`Phase 4: Advanced Features, Integrations & Real-Time Sync`],
    },
  ];

  // Assign matching mentees
  return phases.map((phase, idx) => {
    let bestMentee: MenteeInput | null = null;
    let matchReasoning = 'Assigned to team mentee.';

    if (mentees.length > 0) {
      // Find mentee with skills matching tags
      for (const m of mentees) {
        const skillsLower = (m.skills || []).map((s) => s.toLowerCase());
        const hasMatch = phase.tags.some((tag) =>
          skillsLower.some((s) => s.includes(tag.toLowerCase()) || tag.toLowerCase().includes(s))
        );
        if (hasMatch) {
          bestMentee = m;
          matchReasoning = `Matched based on expertise in ${(m.skills || []).slice(0, 3).join(', ')}.`;
          break;
        }
      }

      if (!bestMentee) {
        bestMentee = mentees[idx % mentees.length];
        matchReasoning = `Assigned based on workload allocation.`;
      }
    }

    return {
      ...phase,
      suggestedMenteeId: bestMentee?.id,
      suggestedMenteeName: bestMentee?.name || 'Assigned Mentee',
      matchReasoning,
    };
  });
}

function extractTechnicalTerms(text: string): string[] {
  const dictionary = [
    'React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Express', 'Python', 'FastAPI',
    'Django', 'Flask', 'PyTorch', 'TensorFlow', 'PostgreSQL', 'MongoDB', 'Firebase',
    'Redis', 'Docker', 'Kubernetes', 'GraphQL', 'REST', 'WebSockets', 'Tailwind',
    'TypeScript', 'JavaScript', 'AWS', 'GCP', 'Azure', 'Microservices', 'OpenCV'
  ];

  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const term of dictionary) {
    if (lower.includes(term.toLowerCase())) {
      found.push(term);
    }
  }
  return found;
}
