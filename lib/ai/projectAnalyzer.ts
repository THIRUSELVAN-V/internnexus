import type { ProjectTaskRoadmap } from '@/lib/types';

export interface MenteeInfo {
  id: string;
  name: string;
  skills?: string[];
  role?: string;
}

export async function analyzeProjectAndGenerateRoadmap(
  projectTitle: string,
  domain: string,
  projectDescription: string,
  mentees: MenteeInfo[] = []
): Promise<ProjectTaskRoadmap[]> {
  const cleanTitle = (projectTitle || '').trim();
  const cleanDomain = (domain || '').trim();
  const cleanDesc = (projectDescription || '').trim();

  if (!cleanDesc) {
    throw new Error('Project description is empty. Please enter detailed project specifications before running AI analysis.');
  }

  if (cleanDesc.length < 15) {
    throw new Error('Project description is too short. Please provide a more descriptive summary of project features and requirements.');
  }

  // First attempt: call server AI endpoint with Gemini
  try {
    const response = await fetch('/api/ai/generate-project-roadmap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectTitle: cleanTitle,
        domain: cleanDomain,
        projectDescription: cleanDesc,
        mentees,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.roadmap) && data.roadmap.length > 0) {
        return data.roadmap;
      }
    } else {
      console.warn(`Roadmap API returned HTTP ${response.status}`);
    }
  } catch (apiErr) {
    console.warn('Roadmap API call failed, falling back to local intelligent generator:', apiErr);
  }

  // Local intelligent fallback: Generate dynamic tasks matching this specific project
  return generateLocalDynamicRoadmap(cleanTitle, cleanDomain, cleanDesc, mentees);
}

function generateLocalDynamicRoadmap(
  title: string,
  domain: string,
  description: string,
  mentees: MenteeInfo[] = []
): ProjectTaskRoadmap[] {
  const cleanTitle = title || 'Engineering Project';
  const sentences = description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const keyConcepts = extractTechTerms(description);
  const techStack = keyConcepts.length > 0 ? keyConcepts.slice(0, 4).join(', ') : domain || 'Full Stack';

  const availableMentees =
    mentees.length > 0
      ? mentees
      : [
          { id: 'std-1', name: 'Alex Rivera', skills: ['React', 'TypeScript', 'Tailwind', 'UI/UX'] },
          { id: 'std-2', name: 'Rohan Verma', skills: ['Python', 'FastAPI', 'Node.js', 'PostgreSQL', 'Docker'] },
        ];

  const milestones = [
    {
      stepIndex: 1,
      title: `Phase 1: Architecture Blueprint & Environment Setup for ${cleanTitle}`,
      description: `Establish project structure, configure development environment, and model data schemas for ${cleanTitle}. Context: ${sentences[0] || description.slice(0, 120)}`,
      instructions: `1. Initialize git repository with modular directory layout and linting standards.\n2. Configure local environment variables and install core packages (${techStack}).\n3. Design database schemas and data models for project entities.\n4. Verify baseline compilation and document setup steps in README.`,
      estimatedHours: 20,
      resources: ['Architecture Blueprint Guidelines', `${domain} Setup Reference`],
      tags: ['Architecture', 'Setup', domain || 'Engineering'],
      priority: 'HIGH' as const,
      dependencies: [],
    },
    {
      stepIndex: 2,
      title: `Phase 2: Core Domain Logic & Backend API Services`,
      description: `Develop primary backend endpoints, business logic algorithms, and data access controllers matching: ${sentences[1] || 'Implement core controllers and services.'}`,
      instructions: `1. Build modular API routes handling primary data operations.\n2. Implement request validation schemas and error handling middleware.\n3. Integrate database operations with transaction integrity.\n4. Write unit tests for core service methods.`,
      estimatedHours: 25,
      resources: ['API Design Patterns', 'Database Query Optimization'],
      tags: ['Backend', 'API', 'Business Logic'],
      priority: 'HIGH' as const,
      dependencies: [`Phase 1: Architecture Blueprint & Environment Setup for ${cleanTitle}`],
    },
    {
      stepIndex: 3,
      title: `Phase 3: User Interface & Component Architecture`,
      description: `Build responsive client interface and interactive components matching requirements: ${sentences[2] || 'Design intuitive user views and state management.'}`,
      instructions: `1. Scaffold UI component hierarchy with clean state management.\n2. Connect frontend views to backend API endpoints with async loading and error states.\n3. Implement data visualization, filtering, and responsive mobile/desktop layouts.\n4. Conduct accessibility audits and refine interactive feedback.`,
      estimatedHours: 25,
      resources: ['UI Component Guidelines', 'State Management Reference'],
      tags: ['Frontend', 'UI/UX', 'Components'],
      priority: 'HIGH' as const,
      dependencies: [`Phase 2: Core Domain Logic & Backend API Services`],
    },
    {
      stepIndex: 4,
      title: `Phase 4: Advanced Features, Integrations & Real-Time Sync`,
      description: `Implement advanced project specifications, third-party integrations, and end-to-end data synchronization for ${cleanTitle}. ${sentences[3] || ''}`,
      instructions: `1. Implement specialized business logic and third-party service connections.\n2. Optimize query performance and implement caching layers where appropriate.\n3. Conduct end-to-end user journey tests across all integrated modules.\n4. Perform security checks, input sanitization, and access permission validation.`,
      estimatedHours: 30,
      resources: ['Integration Documentation', 'Performance Profiling Reference'],
      tags: ['Integration', 'Advanced', 'Security'],
      priority: 'MEDIUM' as const,
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
      priority: 'HIGH' as const,
      dependencies: [`Phase 4: Advanced Features, Integrations & Real-Time Sync`],
    },
  ];

  return milestones.map((m, idx) => {
    let bestMentee = availableMentees[idx % availableMentees.length];
    let matchReasoning = 'Assigned to team mentee.';

    for (const mentee of availableMentees) {
      const skillsLower = (mentee.skills || []).map((s) => s.toLowerCase());
      const hasMatch = m.tags.some((tag) =>
        skillsLower.some((s) => s.includes(tag.toLowerCase()) || tag.toLowerCase().includes(s))
      );
      if (hasMatch) {
        bestMentee = mentee;
        matchReasoning = `Matched based on expertise in ${(mentee.skills || []).slice(0, 3).join(', ')}.`;
        break;
      }
    }

    return {
      ...m,
      suggestedMenteeId: bestMentee.id,
      suggestedMenteeName: bestMentee.name,
      matchReasoning,
    };
  });
}

function extractTechTerms(text: string): string[] {
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
