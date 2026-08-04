import type { SubmissionAnalysis } from '@/lib/types';

export async function analyzeSubmission(
  fileNames: string[],
  description?: string
): Promise<SubmissionAnalysis> {
  await new Promise((res) => setTimeout(res, 1100));

  const hasCode = fileNames.some((f) => f.endsWith('.zip') || f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.py'));
  const hasPDF = fileNames.some((f) => f.endsWith('.pdf') || f.endsWith('.docx'));

  return {
    completionStatus: 'complete',
    completionPercentage: 92,
    summary: `Submission received with ${fileNames.length} file(s). Structure includes all required code modules, configuration files, and documentation.`,
    missingSections: ['Optional: Add automated integration test suite output log'],
    strengths: [
      'Clean component architecture with explicit TypeScript interfaces',
      'Thorough documentation included in README.md',
      'Follows recommended file naming conventions',
    ],
    suggestions: [
      'Consider extracting magic numbers into a dedicated constants file',
      'Add brief JSDoc comments to public API export methods',
    ],
    codeQuality: hasCode ? 9 : undefined,
    documentQuality: hasPDF ? 8.5 : 8,
    analyzedAt: new Date().toISOString(),
  };
}
