"use client";

import {
  Brain,
  Briefcase,
  CheckCircle2,
  Code,
  GraduationCap,
  Wrench,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import type { ResumeAnalysis } from "@/lib/types";

// ---------------------------------------------------------
// Skill Group
// ---------------------------------------------------------

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-700">{title}</p>

      <div className="flex flex-wrap gap-1.5">
        {items.map((item, index) => (
          <Badge
            key={`${item}-${index}`}
            variant="secondary"
            className="border-slate-200 bg-white text-xs text-slate-700"
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Experience List
// ---------------------------------------------------------

function ExperienceList({
  items,
  emptyLabel,
}: {
  items: ResumeAnalysis["workExperience"];
  emptyLabel: string;
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.title}-${item.company}-${index}`}>
          <p className="text-xs font-semibold text-slate-900">
            {item.title}
            {item.company ? ` · ${item.company}` : ""}
          </p>

          {item.duration && (
            <p className="text-[11px] text-slate-500">{item.duration}</p>
          )}

          {item.description && (
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {item.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------
// Resume Analysis Card
// ---------------------------------------------------------

export default function ResumeAnalysisCard({
  analysis,
}: {
  analysis: ResumeAnalysis;
}) {
  // -------------------------------------------------------
  // Normalize array fields
  // -------------------------------------------------------

  const workExperience = Array.isArray(analysis.workExperience)
    ? analysis.workExperience
    : Array.isArray(analysis.experience)
      ? analysis.experience
      : [];

  const technicalSkills = Array.isArray(analysis.technicalSkills)
    ? analysis.technicalSkills
    : Array.isArray(analysis.skills)
      ? analysis.skills
      : [];

  const programmingLanguages = Array.isArray(analysis.programmingLanguages)
    ? analysis.programmingLanguages
    : [];

  const frameworks = Array.isArray(analysis.frameworks)
    ? analysis.frameworks
    : [];

  const databases = Array.isArray(analysis.databases) ? analysis.databases : [];

  const tools = Array.isArray(analysis.tools) ? analysis.tools : [];

  const education = Array.isArray(analysis.education) ? analysis.education : [];

  const projects = Array.isArray(analysis.projects) ? analysis.projects : [];

  const internships = Array.isArray(analysis.internships)
    ? analysis.internships
    : [];

  const certifications = Array.isArray(analysis.certifications)
    ? analysis.certifications
    : [];

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------

  return (
    <Card className="border-indigo-100 bg-gradient-to-b from-white to-slate-50/60">
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600">
            <Brain className="h-4 w-4" />
          </div>

          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              AI Resume Analysis
            </CardTitle>

            <p className="text-xs text-slate-500">
              Information extracted from your uploaded resume
            </p>
          </div>
        </div>

        <Badge
          variant="default"
          className="shrink-0 border-green-200 bg-green-50 text-green-700"
        >
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Analysis Completed
        </Badge>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-5 pt-3">
        {/* Professional Summary */}
        {analysis.summary && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs leading-relaxed text-slate-700">
            <strong className="mb-1 block font-semibold text-indigo-900">
              Professional Summary
            </strong>

            {analysis.summary}
          </div>
        )}

        {/* Skills */}
        <div className="space-y-4">
          <SkillGroup title="Technical Skills" items={technicalSkills} />

          <SkillGroup
            title="Programming Languages"
            items={programmingLanguages}
          />

          <SkillGroup title="Frameworks" items={frameworks} />

          <SkillGroup title="Databases" items={databases} />

          <SkillGroup title="Tools & Technologies" items={tools} />
        </div>

        {/* Education & Work Experience */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Education */}
          <section className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
              Education
            </p>

            {education.length > 0 ? (
              <div className="space-y-2">
                {education.map((item, index) => (
                  <div key={`${item.degree}-${index}`}>
                    <p className="text-xs font-medium text-slate-900">
                      {item.degree}
                    </p>

                    <p className="text-xs text-slate-500">
                      {[item.fieldOfStudy, item.institution, item.dates]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No education listed in the resume.
              </p>
            )}
          </section>

          {/* Work Experience */}
          <section className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Briefcase className="h-3.5 w-3.5 text-indigo-600" />
              Work Experience
            </p>

            <ExperienceList
              items={workExperience}
              emptyLabel="No work experience listed in the resume."
            />
          </section>
        </div>

        {/* Projects / Internships / Certifications */}
        {projects.length > 0 ||
        internships.length > 0 ||
        certifications.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
            {/* Projects */}
            <section>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Code className="h-3.5 w-3.5 text-blue-600" />
                Projects
              </p>

              <ul className="space-y-2">
                {projects.map((project, index) => (
                  <li key={`${project.name}-${index}`}>
                    <p className="text-xs font-medium text-slate-900">
                      {project.name}
                    </p>

                    {project.description && (
                      <p className="text-[11px] text-slate-500">
                        {project.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Internships */}
            <section>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                Internships
              </p>

              <ExperienceList items={internships} emptyLabel="" />
            </section>

            {/* Certifications */}
            <section>
              <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Wrench className="h-3.5 w-3.5 text-blue-600" />
                Certifications
              </p>

              <ul className="space-y-1 text-xs text-slate-600">
                {certifications.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
