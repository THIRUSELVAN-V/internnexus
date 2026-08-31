import type { MentorRecommendation } from '@/lib/types';

export async function recommendMentors(
  domain: string,
  studentSkills: string[]
): Promise<MentorRecommendation[]> {
  await new Promise((res) => setTimeout(res, 900));

  return [
    {
      mentorId: 'men-1',
      mentorName: 'Mr. Vijay',
      designation: 'Principal Software Architect',
      expertise: ['Web Development', 'React', 'Cloud Architecture', 'TypeScript'],
      matchScore: 95,
      currentWorkload: 2,
      maxMentees: 5,
      reasoning: '95% domain match. Excellent mentor record with 4 previous successful cohorts. Capacity available (2/5 mentees).',
      rank: 1,
    },
    {
      mentorId: 'men-2',
      mentorName: 'Ananya Deshmukh',
      designation: 'Senior Frontend Lead',
      expertise: ['UI/UX Design', 'React', 'Frontend Engineering', 'State Management'],
      matchScore: 88,
      currentWorkload: 1,
      maxMentees: 4,
      reasoning: '88% match. Specialized in frontend engineering and UI performance optimization. Light workload (1/4 mentees).',
      rank: 2,
    },
    {
      mentorId: 'men-3',
      mentorName: 'Vikram Mehta',
      designation: 'Engineering Manager',
      expertise: ['Full Stack', 'Node.js', 'System Design', 'Agile Methodologies'],
      matchScore: 82,
      currentWorkload: 3,
      maxMentees: 5,
      reasoning: '82% match. Strong full-stack expertise with focus on enterprise architecture and mentorship.',
      rank: 3,
    },
  ];
}
