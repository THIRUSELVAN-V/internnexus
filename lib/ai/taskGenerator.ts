import type { TaskSuggestion } from '@/lib/types';

export async function generateWeeklyTasks(
  domain: string,
  weekNumber: number,
  description?: string,
  studentName?: string
): Promise<TaskSuggestion> {
  try {
    const res = await fetch('/api/ai/generate-weekly-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        week: weekNumber,
        description,
        studentName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return data as TaskSuggestion;
      }
    }
  } catch (err) {
    console.warn('AI weekly task API failed, falling back:', err);
  }

  // Fallback
  return {
    week: weekNumber,
    title: `Week ${weekNumber}: ${domain} Milestone`,
    description: `Targeted practical task focused on ${domain} best practices and real-world project deliverables.`,
    instructions: '1. Review feature requirements.\n2. Design modular solution architecture.\n3. Implement components and test edge cases.\n4. Submit code and documentation for mentor evaluation.',
    estimatedHours: 20,
    resources: [`${domain} Best Practices Guide`, 'Submission Checklist'],
    tags: [domain, `Week-${weekNumber}`],
    learningObjectives: ['Apply industry design patterns', 'Deliver production quality code'],
  };
}
