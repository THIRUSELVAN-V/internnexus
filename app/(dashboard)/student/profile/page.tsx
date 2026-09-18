'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Globe, Code, Save, Link as LinkIcon, Check, Loader2, Sparkles, Brain,
  Briefcase, Award, ChevronRight, RefreshCw, GraduationCap, MapPin,
  Languages, Wrench, Layers, Server, BookOpen,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/firebase/auth';
import { StudentProfile } from '@/lib/types';
import { getInitials } from '@/lib/utils/formatters';

export default function StudentProfilePage() {
  const { profile, refreshProfile } = useAuthContext();
  const student = profile as StudentProfile;

  const [displayName, setDisplayName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [gpa, setGpa] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [bio, setBio] = useState('');
  const [linkedinURL, setLinkedinURL] = useState('');
  const [githubURL, setGithubURL] = useState('');
  const [skillsInput, setSkillsInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (student) {
      setDisplayName(student.displayName || '');
      setUniversity(student.university || '');
      setDegree(student.degree || '');
      setGpa(student.gpa ? String(student.gpa) : '');
      setGradYear(student.graduationYear ? String(student.graduationYear) : '');
      setBio(student.bio || '');
      setLinkedinURL(student.linkedinURL || '');
      setGithubURL(student.githubURL || '');
      setSkillsInput((student.skills || []).join(', '));
    }
  }, [student]);

  const handleSave = async () => {
    if (!profile?.uid) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const skillsArray = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      await updateUserProfile(profile.uid, {
        displayName,
        university,
        degree,
        gpa: parseFloat(gpa) || undefined,
        graduationYear: parseInt(gradYear) || undefined,
        bio,
        linkedinURL,
        githubURL,
        skills: skillsArray,
      } as Partial<StudentProfile>);

      if (refreshProfile) {
        await refreshProfile();
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving student profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const analysis = student?.resumeAnalysis;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Student Profile & Skills</h1>
        <p className="text-xs text-slate-500">Manage your educational background, technical skills, and portfolio links</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="h-4 w-4 text-green-600 shrink-0" /> Student profile updated successfully in Firestore.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <Card className="md:col-span-1 text-center">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-4 border-slate-100 shadow-sm">
                <AvatarImage src={profile?.photoURL} />
                <AvatarFallback className="text-xl font-bold text-blue-700">
                  {getInitials(displayName || 'Student')}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{displayName || 'Student User'}</h2>
              <p className="text-xs text-slate-500">{profile?.email}</p>
              <Badge variant="purple" className="mt-2 text-xs font-semibold">
                Student Account
              </Badge>
            </div>

            {(university || gradYear) && (
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left">
                {university && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" /> {university}
                  </div>
                )}
                {gradYear && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" /> Class of {gradYear}
                  </div>
                )}
              </div>
            )}

            {/* Skills Badges */}
            {skillsInput.trim() && (
              <div className="pt-3 border-t border-slate-100 text-left">
                <Label className="text-xs font-bold text-slate-700">Skills Overview</Label>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {skillsInput.split(',').filter(s => s.trim()).map((sk, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">
                      {sk.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Analysis Status */}
            <div className="pt-3 border-t border-slate-100">
              {student?.resumeAnalyzed ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center mb-2">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  AI Resume Analyzed
                </div>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center mb-2">
                  No resume analyzed yet
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full text-xs">
                <Link href="/student/resume">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  {student?.resumeAnalyzed ? 'Re-analyze Resume' : 'Upload & Analyze Resume'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Editable Profile Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Edit Personal & Educational Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={profile?.email || ''} disabled className="mt-1 bg-slate-50 text-slate-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University / Institute</Label>
                <Input id="university" value={university} onChange={(e) => setUniversity(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="degree">Degree & Major</Label>
                <Input id="degree" value={degree} onChange={(e) => setDegree(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gpa">GPA / CGPA</Label>
                <Input id="gpa" value={gpa} onChange={(e) => setGpa(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="gradYear">Graduation Year</Label>
                <Input id="gradYear" value={gradYear} onChange={(e) => setGradYear(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="skills">Technical Skills (Comma separated)</Label>
              <Input
                id="skills"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="React, TypeScript, Node.js, Python..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 min-h-[80px]" />
            </div>

            <div className="space-y-3 pt-2">
              <Label>Social & Portfolio Links</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  leftIcon={<LinkIcon className="h-4 w-4" />}
                  value={linkedinURL}
                  onChange={(e) => setLinkedinURL(e.target.value)}
                  placeholder="LinkedIn URL"
                />
                <Input
                  leftIcon={<Code className="h-4 w-4" />}
                  value={githubURL}
                  onChange={(e) => setGithubURL(e.target.value)}
                  placeholder="GitHub URL"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" /> Save Profile Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Resume Analysis Section */}
      {analysis ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">AI-Extracted Resume Profile</h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-purple-700 hover:text-purple-800">
              <Link href="/student/resume">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Update Resume
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Programming Languages */}
            {analysis.programmingLanguages && analysis.programmingLanguages.length > 0 && (
              <Card className="border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Languages className="h-4 w-4 text-blue-600" /> Programming Languages
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.programmingLanguages.map((lang) => (
                      <Badge key={lang} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{lang}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Frameworks */}
            {analysis.frameworks && analysis.frameworks.length > 0 && (
              <Card className="border-indigo-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-indigo-600" /> Frameworks
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.frameworks.map((fw) => (
                      <Badge key={fw} className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">{fw}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technologies */}
            {analysis.technologies && analysis.technologies.length > 0 && (
              <Card className="border-violet-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-violet-600" /> Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.technologies.map((tech) => (
                      <Badge key={tech} className="bg-violet-50 text-violet-700 border-violet-200 text-xs">{tech}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tools */}
            {analysis.tools && analysis.tools.length > 0 && (
              <Card className="border-amber-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-amber-600" /> Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.tools.map((tool) => (
                      <Badge key={tool} className="bg-amber-50 text-amber-700 border-amber-200 text-xs">{tool}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Domains */}
            {analysis.domains && analysis.domains.length > 0 && (
              <Card className="border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-600" /> Domains / Interests
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.domains.map((d) => (
                      <Badge key={d} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">{d}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {analysis.certifications && analysis.certifications.length > 0 && (
              <Card className="border-rose-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-rose-600" /> Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {analysis.certifications.map((cert, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold mt-0.5">•</span> {cert}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Education */}
          {analysis.education && analysis.education.length > 0 && (
            <Card className="border-sky-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-sky-600" /> Education
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {analysis.education.map((edu, idx) => (
                  <div key={idx} className="flex flex-col text-xs">
                    <span className="font-semibold text-slate-900">
                      {edu.degree}{edu.field ? ` – ${edu.field}` : ''}
                    </span>
                    <span className="text-slate-500">
                      {edu.institution}
                      {edu.year ? ` · ${edu.year}` : ''}
                      {edu.gpa ? ` · GPA ${edu.gpa}` : ''}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Projects */}
          {analysis.projects && analysis.projects.length > 0 && (
            <Card className="border-purple-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-purple-600" /> Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {analysis.projects.map((proj, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-bold text-slate-900">{proj.name}</p>
                    {proj.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">{proj.description}</p>
                    )}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.technologies.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 border-purple-100">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {analysis.experience && analysis.experience.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-slate-600" /> Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {analysis.experience.map((exp, idx) => (
                  <div key={idx} className="border border-slate-100 rounded-lg p-3 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{exp.title}</p>
                    <p className="text-xs text-slate-500">{exp.company} · {exp.duration}</p>
                    {exp.description && (
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {student?.resumeAnalyzedAt && (
            <p className="text-[11px] text-slate-400 text-right">
              AI analysis completed: {new Date(student.resumeAnalyzedAt).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        /* Prompt to upload resume when no analysis exists */
        <Card className="border-dashed border-purple-200 bg-purple-50/30">
          <CardContent className="py-10 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No AI Resume Analysis Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your resume to automatically extract skills, programming languages, frameworks, projects, education, and more — all stored securely in your profile.
            </p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white mt-2">
              <Link href="/student/resume">
                <Sparkles className="h-4 w-4 mr-1.5" /> Upload &amp; Analyze Resume
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
