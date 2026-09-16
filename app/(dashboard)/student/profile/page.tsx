'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, GraduationCap, MapPin, Globe, Code, Save, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
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
      setUniversity(student.university || 'Indian Institute of Technology, Madras');
      setDegree(student.degree || 'B.Tech Computer Science & Engineering');
      setGpa(student.gpa ? String(student.gpa) : '8.9');
      setGradYear(student.graduationYear ? String(student.graduationYear) : '2026');
      setBio(student.bio || 'Passionate Computer Science undergraduate interested in full-stack web development, AI integration, and cloud architectures.');
      setLinkedinURL(student.linkedinURL || 'https://linkedin.com/in/student');
      setGithubURL(student.githubURL || 'https://github.com/student');
      setSkillsInput((student.skills || ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Python', 'Git']).join(', '));
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

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" /> {university}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" /> Class of {gradYear}
              </div>
            </div>

            {/* Skills Badges */}
            <div className="pt-3 border-t border-slate-100 text-left">
              <Label className="text-xs font-bold text-slate-700">Skills Overview</Label>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {skillsInput.split(',').map((sk, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">
                    {sk.trim()}
                  </Badge>
                ))}
              </div>
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
    </div>
  );
}
