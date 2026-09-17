'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FolderGit2,
  Plus,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument } from '@/lib/firebase/firestore';
import { Project, MentorAssignment, MentorProfile } from '@/lib/types';
import { DUMMY_MENTEES } from '@/lib/utils/constants';

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-demo-1',
    title: 'Enterprise AI Portal & Analytics Dashboard',
    domain: 'Full Stack Web Development',
    description:
      'Architect and build an end-to-end enterprise portal with user authentication, real-time analytics pipelines, responsive React dashboards, and AI recommendation engines.',
    mentorId: 'mock-mentor-id',
    mentorName: 'Dr. Aris Thorne',
    companyId: 'comp-1',
    companyName: 'TechCorp Solutions',
    assignedMenteeIds: ['std-1', 'std-2'],
    assignedMenteeNames: ['Alex Rivera', 'Priya Sharma'],
    status: 'planning',
    currentStepIndex: {
      'std-1': 1,
      'std-2': 1,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function MentorProjectsPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mentees, setMentees] = useState<{ id: string; name: string }[]>([]);

  // Dialog Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('Full Stack Web Development');
  const [description, setDescription] = useState('');
  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projDocs, assignmentDocs] = await Promise.all([
        getDocuments<Project>('projects'),
        getDocuments<MentorAssignment>('mentorAssignments'),
      ]);

      const myAssignments = profile?.uid
        ? assignmentDocs.filter((a) => a.mentorId === profile.uid)
        : assignmentDocs;

      const existingMenteeIds = new Set(myAssignments.map((a) => a.studentId));
      const combinedMentees = [
        ...myAssignments.map((a) => ({ id: a.studentId, name: a.studentName })),
        ...DUMMY_MENTEES.filter((d) => !existingMenteeIds.has(d.studentId)).map((d) => ({
          id: d.studentId,
          name: d.name,
        })),
      ];
      setMentees(combinedMentees);

      const myProjects = profile?.uid
        ? projDocs.filter((p) => p.mentorId === profile.uid)
        : projDocs;

      if (myProjects.length > 0) {
        setProjects(myProjects);
      } else {
        setProjects(DEFAULT_PROJECTS);
      }
    } catch (err) {
      console.error('Error fetching mentor projects data:', err);
      setProjects(DEFAULT_PROJECTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleToggleMentee = (menteeId: string) => {
    setSelectedMenteeIds((prev) =>
      prev.includes(menteeId) ? prev.filter((id) => id !== menteeId) : [...prev, menteeId]
    );
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedNames = mentees
        .filter((m) => selectedMenteeIds.includes(m.id))
        .map((m) => m.name);

      const newProjectData: Omit<Project, 'id'> = {
        title: title.trim(),
        domain: domain.trim(),
        description: description.trim(),
        mentorId: profile?.uid || 'mentor-demo',
        mentorName: profile?.displayName || 'Industrial Mentor',
        companyId: (profile as MentorProfile)?.companyId || 'company-1',
        companyName: (profile as MentorProfile)?.companyName || 'TechCorp',
        assignedMenteeIds: selectedMenteeIds.length > 0 ? selectedMenteeIds : ['std-1'],
        assignedMenteeNames: selectedNames.length > 0 ? selectedNames : ['Alex Rivera'],
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await createDocument('projects', newProjectData);

      setIsDialogOpen(false);
      setTitle('');
      setDescription('');
      setSelectedMenteeIds([]);
      await fetchData();
    } catch (err) {
      console.error('Error creating new project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-green-600" />
            My Internship Projects
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define project specifications, run AI roadmap analysis, and distribute phase-based tasks to your mentees
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Create New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-green-600" />
                Create New Mentorship Project
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateProject} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="proj-title" className="text-xs font-semibold text-slate-700">
                  Project Title *
                </Label>
                <Input
                  id="proj-title"
                  placeholder="e.g. Next.js SaaS Platform & AI Chatbot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="proj-domain" className="text-xs font-semibold text-slate-700">
                  Domain / Specialization
                </Label>
                <Input
                  id="proj-domain"
                  placeholder="e.g. Full Stack Web Development, Data Science, AI/ML"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="proj-desc" className="text-xs font-semibold text-slate-700">
                  Project Specification / Description *
                </Label>
                <Textarea
                  id="proj-desc"
                  placeholder="Describe the core features, technologies, architectural goals, and deliverables for this project..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Assign Mentees</Label>
                <div className="border border-slate-200 rounded-xl p-3 space-y-2 max-h-36 overflow-y-auto bg-slate-50">
                  {mentees.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMenteeIds.includes(m.id)}
                        onChange={() => handleToggleMentee(m.id)}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span>{m.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : projects.length === 0 ? (
        <Card className="border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
          <CardContent className="space-y-3">
            <FolderGit2 className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No Projects Created Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first mentorship project to organize tasks into multi-phase roadmap steps for your assigned students.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project) => {
            const hasRoadmap = Boolean(project.aiRoadmap && project.aiRoadmap.length > 0);
            return (
              <Card
                key={project.id}
                className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="text-[10px] font-semibold mb-1 text-slate-600 border-slate-300">
                        {project.domain}
                      </Badge>
                      <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                        {project.title}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'success'
                          : project.status === 'completed'
                          ? 'purple'
                          : 'warning'
                      }
                      className="capitalize text-[10px] font-bold shrink-0"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-xs text-slate-600 pb-5">
                  <p className="line-clamp-3 leading-relaxed text-slate-600">
                    {project.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{project.assignedMenteeNames?.length || 0} Mentee(s)</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium">
                      <Layers className="h-3.5 w-3.5 text-purple-600" />
                      <span>
                        {hasRoadmap ? `${project.aiRoadmap?.length} Phases Generated` : 'Roadmap Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href={`/mentor/projects/${project.id}`} className="block">
                      <Button
                        size="sm"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        Manage Project & AI Roadmap
                        <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
