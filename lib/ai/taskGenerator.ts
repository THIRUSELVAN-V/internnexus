import type { TaskSuggestion } from '@/lib/types';

export async function generateWeeklyTasks(
  domain: string,
  weekNumber: number
): Promise<TaskSuggestion> {
  await new Promise((res) => setTimeout(res, 1000));

  const taskTemplates: Record<number, TaskSuggestion> = {
    1: {
      week: 1,
      title: 'Environment Setup & Codebase Onboarding',
      description: 'Set up local development workspace, review architectural documentation, and build your first feature branch.',
      instructions: '1. Clone repository and install dependencies.\n2. Configure local environment variables according to .env.example.\n3. Complete the starter bug fix in ticket #102 and submit a PR for review.',
      estimatedHours: 20,
      resources: ['Architecture Guide (PDF)', 'Git Workflow Standards', 'API Endpoint Documentation'],
      tags: ['Onboarding', 'Setup', 'Git'],
      learningObjectives: ['Understand workspace architecture', 'Master project git flow', 'Run test suites locally'],
    },
    2: {
      week: 2,
      title: 'Component Development & UI Integration',
      description: 'Implement reusable dashboard UI components using React and Tailwind CSS matching design specifications.',
      instructions: '1. Review Figma design specs for dashboard cards.\n2. Build responsive React components with TypeScript props.\n3. Add unit tests and ensure accessibility standards (WCAG AA).',
      estimatedHours: 25,
      resources: ['Figma Design System', 'Component Guidelines', 'Accessibility Cheat Sheet'],
      tags: ['Frontend', 'React', 'Tailwind'],
      learningObjectives: ['Master clean component props', 'Implement responsive layouts', 'Write unit tests'],
    },
    3: {
      week: 3,
      title: 'API Integration & State Management',
      description: 'Connect dashboard UI components to backend REST/GraphQL APIs and manage global state cleanly.',
      instructions: '1. Create async data fetching hooks.\n2. Implement loading skeletons and error boundaries.\n3. Integrate authentication tokens in header requests.',
      estimatedHours: 30,
      resources: ['API Docs', 'React Query / SWR Guide', 'Error Handling Best Practices'],
      tags: ['API', 'Async', 'State Management'],
      learningObjectives: ['Handle network states gracefully', 'Implement clean caching strategies', 'Manage JWT tokens'],
    },
    4: {
      week: 4,
      title: 'Performance Optimization & Final Project Deliverable',
      description: 'Optimize bundle size, audit performance with Lighthouse, and prepare final project demo for evaluation.',
      instructions: '1. Conduct Lighthouse performance audit (target score 90+).\n2. Implement lazy loading and dynamic imports.\n3. Prepare demo deck and record 3-minute video walkthrough.',
      estimatedHours: 35,
      resources: ['Lighthouse Audit Guide', 'Next.js Optimization Docs', 'Presentation Template'],
      tags: ['Performance', 'Optimization', 'Demo'],
      learningObjectives: ['Identify render bottlenecks', 'Optimize web vitals', 'Present technical projects'],
    },
  };

  return taskTemplates[weekNumber] || {
    week: weekNumber,
    title: `Week ${weekNumber} Industry Capstone Feature`,
    description: `Advanced domain task focused on ${domain} best practices and real-world project deliverables.`,
    instructions: '1. Analyze feature specification document.\n2. Design modular solution architecture.\n3. Submit code and documentation for mentor evaluation.',
    estimatedHours: 25,
    resources: ['Domain Best Practices Guide', 'Submission Checklist'],
    tags: [domain, 'Capstone'],
    learningObjectives: ['Apply industry design patterns', 'Deliver production quality code'],
  };
}
