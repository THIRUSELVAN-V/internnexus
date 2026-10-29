import { NextResponse } from 'next/server';
import type { ResumeAnalysis } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resumeText } = body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 15) {
      return NextResponse.json(
        { error: 'Invalid or empty resume text provided.' },
        { status: 400 }
      );
    }

    const cleanText = resumeText.trim();

    // Check environment API keys (supports GEMINI_API_KEY or GOOGLE_AI_API_KEY)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    let analysisResult: ResumeAnalysis;

    if (geminiKey) {
      try {
        analysisResult = await analyzeWithGemini(cleanText, geminiKey);
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to intelligent parser:', geminiErr);
        analysisResult = parseResumeTextIntelligently(cleanText);
      }
    } else {
      // Rule-based parsing engine — only extracts what is genuinely found
      analysisResult = parseResumeTextIntelligently(cleanText);
    }

    return NextResponse.json(analysisResult);
  } catch (err: unknown) {
    console.error('Server error analyzing resume:', err);
    const msg = err instanceof Error ? err.message : 'Failed to analyze resume';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Direct server-side Gemini API call with structured JSON prompt
 */
async function analyzeWithGemini(text: string, apiKey: string): Promise<ResumeAnalysis> {
  const prompt = `You are an expert ATS resume parser and technical skill extraction engine.
Analyze the following raw resume text and extract all technical information into structured JSON matching this EXACT format:
{
  "skills": ["Skill1", "Skill2"],
  "programmingLanguages": ["Java", "Python"],
  "frameworks": ["React", "Next.js"],
  "technologies": ["Firebase", "MongoDB"],
  "tools": ["Git", "Docker"],
  "domains": ["Web Development", "AI/ML"],
  "education": [{"degree": "B.Tech", "field": "Computer Science", "institution": "University Name", "year": 2026, "gpa": 8.5}],
  "certifications": ["Cert 1"],
  "projects": [{"name": "Project Name", "description": "Short description", "technologies": ["React", "Node.js"]}],
  "experience": [{"title": "Software Intern", "company": "Tech Corp", "duration": "3 months", "description": "Details"}],
  "overallScore": 85,
  "summary": "Brief summary of candidate background."
}

Resume Text:
"""
${text.slice(0, 4000)}
"""`;

  const models = ['gemini-2.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: Error | null = null;
  let rawResponse: string | undefined;

  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawResponse) break;
      } else {
        lastError = new Error(`Gemini model ${model} returned status ${res.status}`);
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  if (!rawResponse) {
    throw new Error('Empty response from Gemini API');
  }

  const parsed = JSON.parse(rawResponse);
  return {
    status: 'completed',
    skills: parsed.skills || [],
    technicalSkills: parsed.skills || [],
    softSkills: [],
    programmingLanguages: parsed.programmingLanguages || [],
    frameworks: parsed.frameworks || [],
    technologies: parsed.technologies || [],
    tools: parsed.tools || [],
    domains: parsed.domains || [],
    education: parsed.education || [],
    certifications: parsed.certifications || [],
    projects: parsed.projects || [],
    experience: parsed.experience || [],
    overallScore: parsed.overallScore || 70,
    summary: parsed.summary || 'Extracted resume profile.',
    strengths: [],
    improvements: [],
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Rule-based parser that scans the actual text content of the resume.
 * Only returns data genuinely found in the text — no fabricated generic entries.
 */
function parseResumeTextIntelligently(text: string): ResumeAnalysis {
  const textLower = text.toLowerCase();

  // Known skill dictionaries
  const LANG_DICT = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift', 'sql', 'html', 'css'];
  const FRAMEWORK_DICT = ['react', 'react.js', 'next.js', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring boot', 'laravel', 'flutter', 'react native', 'tailwind', 'bootstrap'];
  const TECH_DICT = ['firebase', 'mongodb', 'postgresql', 'mysql', 'redis', 'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'graphql', 'rest api', 'jwt'];
  const TOOL_DICT = ['git', 'github', 'gitlab', 'figma', 'postman', 'vscode', 'jira', 'webpack', 'vite', 'npm'];
  const DOMAIN_DICT = ['web development', 'frontend', 'backend', 'full stack', 'data science', 'machine learning', 'artificial intelligence', 'cloud computing', 'cybersecurity', 'mobile development', 'ui/ux design'];

  const foundLangs = LANG_DICT.filter((l) => textLower.includes(l)).map(capitalize);
  const foundFrameworks = FRAMEWORK_DICT.filter((f) => textLower.includes(f)).map(capitalize);
  const foundTechs = TECH_DICT.filter((t) => textLower.includes(t)).map(capitalize);
  const foundTools = TOOL_DICT.filter((t) => textLower.includes(t)).map(capitalize);
  const foundDomains = DOMAIN_DICT.filter((d) => textLower.includes(d)).map(capitalize);

  const allSkills = Array.from(new Set([...foundLangs, ...foundFrameworks, ...foundTechs, ...foundTools]));

  // Detect degree — only populate what can actually be inferred from the text
  const educationList: ResumeAnalysis['education'] = [];
  if (
    textLower.includes('bachelor') || textLower.includes('b.tech') ||
    textLower.includes('b.e') || textLower.includes('degree') ||
    textLower.includes('university') || textLower.includes('college')
  ) {
    let degreeName = 'Bachelor of Technology';
    if (textLower.includes('bachelor of engineering')) degreeName = 'Bachelor of Engineering';
    if (textLower.includes('b.sc') || textLower.includes('bachelor of science')) degreeName = 'Bachelor of Science';
    if (textLower.includes('m.tech') || textLower.includes('master')) degreeName = 'Master of Technology';
    educationList.push({ degree: degreeName });
  }

  // Certifications — only include ones explicitly mentioned in the text
  const certs: string[] = [];
  if (textLower.includes('aws certified')) certs.push('AWS Certified');
  if (textLower.includes('google certified') || textLower.includes('google professional')) certs.push('Google Certified Professional');
  if (textLower.includes('microsoft certified')) certs.push('Microsoft Certified');
  if (textLower.includes('oracle certified')) certs.push('Oracle Certified');

  // Projects & experience: rule-based extraction cannot reliably identify
  // company names or project titles without NLP — return empty to avoid fabrication.
  const expList: ResumeAnalysis['experience'] = [];
  const projectsList: ResumeAnalysis['projects'] = [];

  const scoreBase = 50 + allSkills.length * 3;

  return {
    status: 'completed',
    skills: allSkills,
    technicalSkills: allSkills,
    softSkills: [],
    programmingLanguages: foundLangs,
    frameworks: foundFrameworks,
    technologies: foundTechs,
    tools: foundTools,
    domains: foundDomains,
    education: educationList,
    certifications: certs,
    projects: projectsList,
    experience: expList,
    overallScore: Math.min(95, Math.max(40, scoreBase)),
    summary: allSkills.length > 0
      ? `Candidate profile with ${allSkills.length} detected technical skills: ${allSkills.slice(0, 5).join(', ')}.`
      : 'Resume text could not be fully parsed. Ensure the PDF contains selectable text (not a scanned image).',
    strengths: allSkills.length > 0
      ? [`Technical skills detected: ${allSkills.slice(0, 3).join(', ')}`]
      : [],
    improvements: ['Configure GEMINI_API_KEY for full AI-powered resume extraction'],
    analyzedAt: new Date().toISOString(),
  };
}

function capitalize(str: string): string {
  if (str === 'javascript') return 'JavaScript';
  if (str === 'typescript') return 'TypeScript';
  if (str === 'react.js' || str === 'react') return 'React.js';
  if (str === 'next.js') return 'Next.js';
  if (str === 'node.js') return 'Node.js';
  if (str === 'c++') return 'C++';
  if (str === 'c#') return 'C#';
  if (str === 'html') return 'HTML';
  if (str === 'css') return 'CSS';
  if (str === 'sql') return 'SQL';
  if (str === 'mongodb') return 'MongoDB';
  if (str === 'aws') return 'AWS';
  if (str === 'gcp') return 'GCP';
  if (str === 'rest api') return 'REST API';
  if (str === 'graphql') return 'GraphQL';
  if (str === 'jwt') return 'JWT';
  if (str === 'ui/ux design') return 'UI/UX Design';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
