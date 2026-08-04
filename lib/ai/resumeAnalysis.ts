import type { ResumeAnalysis } from '@/lib/types';

export async function analyzeResume(resumeTextOrFile: string | File): Promise<ResumeAnalysis> {
  // Simulate AI parsing latency
  await new Promise((res) => setTimeout(res, 1200));

  return {
    skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Python', 'Git', 'REST APIs', 'SQL'],
    technicalSkills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'Git'],
    softSkills: ['Problem Solving', 'Team Collaboration', 'Communication', 'Time Management', 'Adaptability'],
    education: [
      {
        degree: 'Bachelor of Technology in Computer Science & Engineering',
        institution: 'Indian Institute of Technology (IIT), Madras',
        year: 2026,
        gpa: 8.9,
      },
    ],
    experience: [
      {
        title: 'Frontend Developer Intern',
        company: 'InnovateTech Solutions',
        duration: 'May 2025 – Aug 2025 (3 months)',
        description: 'Developed responsive UI components using React and Tailwind CSS. Integrated REST APIs and improved page load performance by 35%.',
      },
    ],
    projects: [
      {
        name: 'AI Smart Task Planner',
        description: 'Web application leveraging OpenAI API to auto-schedule student assignments and project deadlines.',
        technologies: ['React', 'TypeScript', 'Node.js', 'OpenAI API'],
        url: 'https://github.com/example/smart-task-planner',
      },
      {
        name: 'Real-time Chat App',
        description: 'Socket.io powered real-time messaging application with end-to-end encryption.',
        technologies: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
      },
    ],
    certifications: [
      'AWS Certified Cloud Practitioner',
      'Meta Front-End Developer Professional Certificate',
    ],
    overallScore: 88,
    summary: 'High-performing Computer Science undergraduate with strong practical experience in modern web development, TypeScript ecosystem, and cloud fundamentals.',
    strengths: [
      'Strong proficiency in modern JavaScript/TypeScript frameworks',
      'Proven track record of building production web apps and APIs',
      'High academic standing with relevant project portfolio',
    ],
    improvements: [
      'Could add more backend microservices or system design experience',
      'Include metrics or key performance indicators for past projects',
    ],
    analyzedAt: new Date().toISOString(),
  };
}
