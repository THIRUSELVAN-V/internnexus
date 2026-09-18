import type { ResumeAnalysis } from '@/lib/types';
import { extractTextFromResumeFile } from '@/lib/utils/resumeExtractor';

export async function analyzeResume(resumeTextOrFile: string | File): Promise<ResumeAnalysis> {
  let resumeText = '';

  if (typeof resumeTextOrFile === 'string') {
    resumeText = resumeTextOrFile;
  } else if (resumeTextOrFile instanceof File) {
    // 1. Extract text in memory (PDF/DOCX)
    resumeText = await extractTextFromResumeFile(resumeTextOrFile);
  } else {
    throw new Error('Invalid resume input. Expected string or File object.');
  }

  if (!resumeText || resumeText.trim().length < 15) {
    throw new Error('Could not extract readable text from resume document.');
  }

  // 2. Call server-side API route for secure AI parsing
  const response = await fetch('/api/ai/analyze-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error during resume analysis (Status ${response.status})`);
  }

  const analysis: ResumeAnalysis = await response.json();
  return analysis;
}
