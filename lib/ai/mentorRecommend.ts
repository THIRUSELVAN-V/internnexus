import type { MentorProfile, MentorRecommendation } from '@/lib/types';

export async function recommendMentors(
  domain: string,
  studentSkills: string[] = [],
  mentors: MentorProfile[] = []
): Promise<MentorRecommendation[]> {
  await new Promise((res) => setTimeout(res, 400));

  if (!mentors || mentors.length === 0) {
    return [];
  }

  const normalizedDomain = (domain || '').toLowerCase();
  const normalizedSkills = studentSkills.map((s) => s.toLowerCase());

  const scoredMentors = mentors.map((mentor) => {
    const expertise = mentor.expertise || [];
    let matchCount = 0;

    expertise.forEach((exp) => {
      const expLower = exp.toLowerCase();
      if (normalizedDomain.includes(expLower) || expLower.includes(normalizedDomain)) {
        matchCount += 2;
      }
      if (normalizedSkills.some((sk) => sk.includes(expLower) || expLower.includes(sk))) {
        matchCount += 1;
      }
    });

    const maxWorkload = mentor.maxMentees || 5;
    const currentWorkload = mentor.currentWorkload || 0;
    const capacityAvailable = Math.max(0, maxWorkload - currentWorkload);

    // Calculate score (base 60 + match score + capacity bonus)
    const rawScore = 60 + matchCount * 10 + (capacityAvailable > 0 ? 10 : 0);
    const matchScore = Math.min(98, Math.max(65, rawScore));

    const reasoning = `${matchScore}% expertise alignment in ${domain}. Capacity available (${currentWorkload}/${maxWorkload} active mentees).`;

    return {
      mentorId: mentor.uid,
      mentorName: mentor.displayName || 'Mentor',
      designation: mentor.designation || 'Industrial Mentor',
      expertise: expertise.length > 0 ? expertise : [domain],
      matchScore,
      currentWorkload,
      maxMentees: maxWorkload,
      reasoning,
      rank: 1,
    };
  });

  // Sort descending by match score
  scoredMentors.sort((a, b) => b.matchScore - a.matchScore);

  return scoredMentors.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

