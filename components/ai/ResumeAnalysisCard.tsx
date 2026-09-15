'use client';

import { Brain, Briefcase, CheckCircle2, Code, GraduationCap, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ResumeAnalysis } from '@/lib/types';

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return <div><p className="mb-2 text-xs font-semibold text-slate-700">{title}</p><div className="flex flex-wrap gap-1.5">{items.map((item) => <Badge key={item} variant="secondary" className="border-slate-200 bg-white text-xs text-slate-700">{item}</Badge>)}</div></div>;
}

function ExperienceList({ items, emptyLabel }: { items: ResumeAnalysis['workExperience']; emptyLabel: string }) {
  if (items.length === 0) return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  return <div className="space-y-3">{items.map((item, index) => <div key={`${item.title}-${item.company}-${index}`}><p className="text-xs font-semibold text-slate-900">{item.title}{item.company ? ` · ${item.company}` : ''}</p>{item.duration && <p className="text-[11px] text-slate-500">{item.duration}</p>}{item.description && <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>}</div>)}</div>;
}

export default function ResumeAnalysisCard({ analysis }: { analysis: ResumeAnalysis }) {
  const workExperience = analysis.workExperience?.length ? analysis.workExperience : (analysis.experience ?? []);
  const technicalSkills = analysis.technicalSkills?.length ? analysis.technicalSkills : (analysis.skills ?? []);
  return (
    <Card className="border-indigo-100 bg-gradient-to-b from-white to-slate-50/60">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600"><Brain className="h-4 w-4" /></div><div><CardTitle className="text-base font-bold text-slate-900">AI Resume Analysis</CardTitle><p className="text-xs text-slate-500">Information extracted from your uploaded resume</p></div></div><Badge variant="default" className="shrink-0 border-green-200 bg-green-50 text-green-700"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Analysis Completed</Badge></CardHeader>
      <CardContent className="space-y-5 pt-3">
        {analysis.summary && <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs leading-relaxed text-slate-700"><strong className="mb-1 block font-semibold text-indigo-900">Professional Summary</strong>{analysis.summary}</div>}
        <div className="space-y-4"><SkillGroup title="Technical Skills" items={technicalSkills} /><SkillGroup title="Programming Languages" items={analysis.programmingLanguages ?? []} /><SkillGroup title="Frameworks" items={analysis.frameworks ?? []} /><SkillGroup title="Databases" items={analysis.databases ?? []} /><SkillGroup title="Tools & Technologies" items={analysis.tools ?? []} /></div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><section className="rounded-xl border border-slate-200 bg-white p-3"><p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800"><GraduationCap className="h-3.5 w-3.5 text-indigo-600" /> Education</p>{analysis.education.length ? <div className="space-y-2">{analysis.education.map((item, index) => <div key={`${item.degree}-${index}`}><p className="text-xs font-medium text-slate-900">{item.degree}</p><p className="text-xs text-slate-500">{[item.fieldOfStudy, item.institution, item.dates].filter(Boolean).join(' · ')}</p></div>)}</div> : <p className="text-xs text-slate-500">No education listed in the resume.</p>}</section><section className="rounded-xl border border-slate-200 bg-white p-3"><p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800"><Briefcase className="h-3.5 w-3.5 text-indigo-600" /> Work Experience</p><ExperienceList items={workExperience} emptyLabel="No work experience listed in the resume." /></section></div>
        {(analysis.projects.length > 0 || analysis.internships.length > 0 || analysis.certifications.length > 0) && <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-3"><section><p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700"><Code className="h-3.5 w-3.5 text-blue-600" /> Projects</p><ul className="space-y-2">{analysis.projects.map((project, index) => <li key={`${project.name}-${index}`}><p className="text-xs font-medium text-slate-900">{project.name}</p>{project.description && <p className="text-[11px] text-slate-500">{project.description}</p>}</li>)}</ul></section><section><p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700"><Briefcase className="h-3.5 w-3.5 text-blue-600" /> Internships</p><ExperienceList items={analysis.internships} emptyLabel="" /></section><section><p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700"><Wrench className="h-3.5 w-3.5 text-blue-600" /> Certifications</p><ul className="space-y-1 text-xs text-slate-600">{analysis.certifications.map((item) => <li key={item}>• {item}</li>)}</ul></section></div>}
      </CardContent>
    </Card>
  );
}
