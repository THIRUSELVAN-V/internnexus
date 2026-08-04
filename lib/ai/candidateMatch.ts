import type { CandidateMatch } from '@/lib/types';

export async function matchCandidateWithInternship(
  candidateSkills: string[],
  internshipRequirements: string[],
  applicationId: string = 'app-1',
  internshipId: string = 'int-1',
  studentId: string = 'std-1'
): Promise<CandidateMatch> {
  await new Promise((res) => setTimeout(res, 800));

  const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  internshipRequirements.forEach((req) => {
    if (candidateSkillsLower.some((s) => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  const matchRatio = internshipRequirements.length > 0 ? matchedSkills.length / internshipRequirements.length : 0.85;
  const matchScore = Math.min(100, Math.max(40, Math.round(matchRatio * 100)));

  let recommendation: CandidateMatch['recommendation'] = 'good_match';
  if (matchScore >= 80) recommendation = 'strong_match';
  else if (matchScore >= 60) recommendation = 'good_match';
  else if (matchScore >= 40) recommendation = 'partial_match';
  else recommendation = 'weak_match';

  return {
    applicationId,
    internshipId,
    studentId,
    matchScore,
    matchedSkills,
    missingSkills,
    reasoning: `The candidate possesses ${matchedSkills.length} out of ${internshipRequirements.length} required key technical skills. Demonstrated strong experience with ${matchedSkills.slice(0, 3).join(', ')}. ${missingSkills.length > 0 ? `Missing skills in ${missingSkills.join(', ')} can be bridged with onboarding.` : 'Covers all primary requirements.'}`,
    recommendation,
    analyzedAt: new Date().toISOString(),
  };
}
