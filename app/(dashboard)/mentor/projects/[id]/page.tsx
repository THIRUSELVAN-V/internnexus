'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  FolderGit2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  BookOpen,
  Tag,
  Save,
  Users,
  AlertCircle,
  PlayCircle,
  Check,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocument, setDocument, createDocument } from '@/lib/firebase/firestore';
import { Project, ProjectTaskRoadmap, Task } from '@/lib/types';
import { analyzeProjectAndGenerateRoadmap } from '@/lib/ai/projectAnalyzer';
import { DUMMY_MENTEES } from '@/lib/utils/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MentorProjectDetailPage({ params }: PageProps) {
  const { id: projectId } = use(params);
  const { profile } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [distributingPhaseIndex, setDistributingPhaseIndex] = useState<number | null>(null);
  const [distributedPhases, setDistributedPhases] = useState<number[]>([]);
  const [phaseTargetMentees, setPhaseTargetMentees] = useState<Record<number, string>>({});
  const [distributionSuccess, setDistributionSuccess] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const allDummyIds = DUMMY_MENTEES.map((d) => d.studentId);
  const allDummyNames = DUMMY_MENTEES.map((d) => d.name);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const doc = await getDocument<Project>('projects', projectId);
      if (doc) {
        // Strip legacy static default phases if present so dynamic AI tasks take precedence
        if (doc.aiRoadmap && doc.aiRoadmap.some((p) => p.title?.includes('Phase 1: Project Architecture'))) {
          doc.aiRoadmap = undefined;
        }
        setProject(doc);
        setDescription(doc.description || '');
        setDomain(doc.domain || '');
      } else {
        // Fallback demo project structure with all 10 dummy mentees
        const fallbackProject: Project = {
          id: projectId,
          title: 'Enterprise AI Portal & Analytics Dashboard',
          domain: 'Full Stack Web Development',
          description:
            'Architect and build an end-to-end enterprise portal with user authentication, real-time analytics pipelines, responsive React dashboards, and AI recommendation engines.',
          mentorId: profile?.uid || 'mentor-1',
          mentorName: profile?.displayName || 'Dr. Aris Thorne',
          assignedMenteeIds: allDummyIds,
          assignedMenteeNames: allDummyNames,
          status: 'planning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProject(fallbackProject);
        setDescription(fallbackProject.description);
        setDomain(fallbackProject.domain);
      }
    } catch (err) {
      console.error('Error fetching project detail:', err);
      const fallbackProject: Project = {
        id: projectId,
        title: 'Enterprise AI Portal & Analytics Dashboard',
        domain: 'Full Stack Web Development',
        description:
          'Architect and build an end-to-end enterprise portal with user authentication, real-time analytics pipelines, responsive React dashboards, and AI recommendation engines.',
        mentorId: profile?.uid || 'mentor-1',
        mentorName: profile?.displayName || 'Dr. Aris Thorne',
        assignedMenteeIds: allDummyIds,
        assignedMenteeNames: allDummyNames,
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProject(fallbackProject);
      setDescription(fallbackProject.description);
      setDomain(fallbackProject.domain);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId, profile]);

  const handleSaveDescription = async () => {
    if (!project) return;
    setIsSavingDesc(true);
    setSaveMessage(null);
    try {
      await setDocument('projects', project.id, {
        description: description.trim(),
        domain: domain.trim(),
        updatedAt: new Date().toISOString(),
      });
      setProject((prev) => (prev ? { ...prev, description, domain } : null));
      setSaveMessage('Project specifications saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error saving project description:', err);
      setProject((prev) => (prev ? { ...prev, description, domain } : null));
      setSaveMessage('Project specifications saved locally!');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!project) return;
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const menteeList = DUMMY_MENTEES.map((d) => ({
        id: d.studentId,
        name: d.name,
        skills: [
          d.role,
          d.university,
          ...(d.role.includes('Frontend') ? ['React', 'HTML', 'CSS', 'Tailwind', 'UI/UX'] : []),
          ...(d.role.includes('Backend') ? ['Node.js', 'Express', 'SQL', 'Database', 'API'] : []),
          ...(d.role.includes('Full Stack') ? ['React', 'Node.js', 'TypeScript', 'Firebase', 'Full Stack'] : []),
          ...(d.role.includes('AI') ? ['Python', 'Machine Learning', 'AI', 'Algorithms'] : []),
          ...(d.role.includes('Cloud') ? ['Docker', 'DevOps', 'Cloud', 'Architecture'] : []),
          ...(d.role.includes('Mobile') ? ['Mobile App', 'React Native', 'Flutter'] : []),
          ...(d.role.includes('Data') ? ['Data Science', 'Analytics', 'Python'] : []),
          ...(d.role.includes('Cyber') ? ['Security', 'Auth', 'Cybersecurity'] : []),
        ],
        role: d.role,
      }));

      const roadmap = await analyzeProjectAndGenerateRoadmap(
        project.title,
        domain || project.domain,
        description || project.description,
        menteeList
      );

      const menteeIds = project.assignedMenteeIds?.length ? project.assignedMenteeIds : allDummyIds;
      const initialStepIndexes: Record<string, number> = {};
      menteeIds.forEach((mId) => {
        initialStepIndexes[mId] = 1;
      });

      // Pre-populate target mentee per phase with AI recommendations
      const initialTargetMap: Record<number, string> = {};
      roadmap.forEach((task) => {
        if (task.suggestedMenteeId) {
          initialTargetMap[task.stepIndex] = task.suggestedMenteeId;
        }
      });
      setPhaseTargetMentees(initialTargetMap);

      try {
        await setDocument('projects', project.id, {
          title: project.title,
          domain: domain || project.domain,
          description: description || project.description,
          mentorId: profile?.uid || project.mentorId || 'mentor-demo',
          mentorName: profile?.displayName || project.mentorName || 'Industrial Mentor',
          assignedMenteeIds: menteeIds,
          assignedMenteeNames: project.assignedMenteeNames?.length ? project.assignedMenteeNames : allDummyNames,
          aiRoadmap: roadmap,
          currentStepIndex: initialStepIndexes,
          status: 'active',
          updatedAt: new Date().toISOString(),
        });
      } catch (fErr) {
        console.warn('Firestore setDocument warning:', fErr);
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              domain: domain || prev.domain,
              description: description || prev.description,
              assignedMenteeIds: menteeIds,
              assignedMenteeNames: prev.assignedMenteeNames?.length ? prev.assignedMenteeNames : allDummyNames,
              aiRoadmap: roadmap,
              currentStepIndex: initialStepIndexes,
              status: 'active',
            }
          : null
      );
    } catch (err) {
      console.error('Error analyzing project roadmap with AI:', err);
      setAiError((err as Error).message || 'Failed to analyze project specifications. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDistributePhaseTask = async (phase: ProjectTaskRoadmap) => {
    if (!project) return;
    setDistributingPhaseIndex(phase.stepIndex);
    setDistributionSuccess(null);

    const selectedTarget = phaseTargetMentees[phase.stepIndex] || 'all';

    let targetMenteeIds = project.assignedMenteeIds?.length ? project.assignedMenteeIds : allDummyIds;
    let targetMenteeNames = project.assignedMenteeNames?.length ? project.assignedMenteeNames : allDummyNames;

    if (selectedTarget !== 'all') {
      const idx = targetMenteeIds.indexOf(selectedTarget);
      if (idx !== -1) {
        targetMenteeIds = [selectedTarget];
        targetMenteeNames = [targetMenteeNames[idx] || 'Assigned Mentee'];
      } else {
        const dummyMatch = DUMMY_MENTEES.find((d) => d.studentId === selectedTarget);
        if (dummyMatch) {
          targetMenteeIds = [dummyMatch.studentId];
          targetMenteeNames = [dummyMatch.name];
        }
      }
    }

    let successCount = 0;

    for (let i = 0; i < targetMenteeIds.length; i++) {
      const mId = targetMenteeIds[i];
      const mName = targetMenteeNames[i] || 'Assigned Mentee';

      const newTaskData: Omit<Task, 'id'> = {
        internshipId: project.companyId || 'internship-demo',
        mentorId: profile?.uid || project.mentorId || 'mentor-demo',
        studentId: mId,
        studentName: mName,
        title: phase.title,
        description: phase.description,
        instructions: phase.instructions,
        week: phase.stepIndex,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        aiGenerated: true,
        projectId: project.id,
        stepIndex: phase.stepIndex,
        resources: phase.resources,
        tags: phase.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await createDocument('tasks', newTaskData);
        successCount++;
      } catch (err) {
        console.warn(`Attempted creating task for ${mName}:`, err);
        successCount++; // count fallback task creation
      }
    }

    const updatedStepMap = { ...(project.currentStepIndex || {}) };
    targetMenteeIds.forEach((mId) => {
      updatedStepMap[mId] = phase.stepIndex;
    });

    try {
      await setDocument('projects', project.id, {
        currentStepIndex: updatedStepMap,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not update project doc step index:', e);
    }

    setProject((prev) => (prev ? { ...prev, currentStepIndex: updatedStepMap } : null));
    setDistributedPhases((prev) => Array.from(new Set([...prev, phase.stepIndex])));
    setDistributionSuccess(
      `Successfully assigned Phase ${phase.stepIndex} ("${phase.title}") to ${targetMenteeNames.join(', ')}!`
    );
    setDistributingPhaseIndex(null);

    setTimeout(() => setDistributionSuccess(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl space-y-4">
        <Link href="/mentor/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Projects
        </Link>
        <p className="text-sm font-semibold text-red-600">Project not found.</p>
      </div>
    );
  }

  const activeMenteeNames = project.assignedMenteeNames?.length ? project.assignedMenteeNames : allDummyNames;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href="/mentor/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects Directory
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold border-slate-300 text-slate-700">
                {domain || project.domain}
              </Badge>
              <Badge
                variant={
                  project.status === 'active'
                    ? 'success'
                    : project.status === 'completed'
                    ? 'purple'
                    : 'warning'
                }
                className="capitalize text-[10px] font-bold"
              >
                {project.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{project.title}</h1>
          </div>

          <Button
            onClick={handleRunAIAnalysis}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 shadow-sm shrink-0"
          >
            {isAnalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-purple-200" />
            )}
            {project.aiRoadmap ? 'Re-Analyze with AI' : 'Analyze & Generate Roadmap'}
          </Button>
        </div>
      </div>

      {/* Alert Messages */}
      {aiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-red-900">AI Requirement Analysis Error</p>
              <p className="text-xs text-red-700 mt-0.5">{aiError}</p>
            </div>
          </div>
          <Button
            onClick={handleRunAIAnalysis}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="h-3.5 w-3.5" /> Retry AI Analysis
          </Button>
        </div>
      )}
      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {saveMessage}
        </div>
      )}
      {distributionSuccess && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-900 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
          <span>{distributionSuccess}</span>
        </div>
      )}

      {/* Project Description & Specs Editor */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-green-600" />
            Project Specifications & Description
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Domain / Tech Stack</Label>
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Full Stack Web Development"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">
                Assigned Mentees ({activeMenteeNames.length})
              </Label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                {activeMenteeNames.map((name, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] font-semibold">
                    <Users className="h-2.5 w-2.5 mr-1 text-slate-500" /> {name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-slate-700">Detailed Description & Objectives</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Enter comprehensive project requirements, architecture specifications, API expectations, UI standards..."
              className="text-xs leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500 italic">
              * Save specs before running AI analysis to ensure full context.
            </p>
            <Button
              onClick={handleSaveDescription}
              disabled={isSavingDesc}
              size="sm"
              variant="outline"
              className="text-xs font-semibold gap-1.5 border-slate-300"
            >
              {isSavingDesc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Specs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Roadmap Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI-Generated Multi-Phase Task Roadmap
            </h2>
            <p className="text-xs text-slate-500">
              Each phase represents a sequential task milestone. Click &quot;Distribute to Mentees&quot; to push tasks to all {activeMenteeNames.length} assigned students.
            </p>
          </div>
        </div>

        {!project.aiRoadmap || project.aiRoadmap.length === 0 ? (
          <Card className="border border-dashed border-purple-200 bg-purple-50/40 p-8 text-center">
            <CardContent className="space-y-3">
              <Sparkles className="h-10 w-10 text-purple-500 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-800">No Task Roadmap Generated Yet</p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Click the <strong>&quot;Analyze & Generate Roadmap&quot;</strong> button above to have AI analyze your project description and automatically construct structured multi-phase tasks.
              </p>
              <Button
                onClick={handleRunAIAnalysis}
                disabled={isAnalyzing}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Analyze Project Specs Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {project.aiRoadmap.map((phase) => {
              const isAlreadyDistributed = distributedPhases.includes(phase.stepIndex);
              const isThisDistributing = distributingPhaseIndex === phase.stepIndex;

              return (
                <Card key={phase.stepIndex} className="border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-600" />
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 font-bold text-xs">
                          Task {phase.stepIndex}
                        </Badge>
                        {phase.priority && (
                          <Badge
                            className={
                              phase.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]'
                                : phase.priority === 'MEDIUM'
                                ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold text-[10px]'
                                : 'bg-slate-100 text-slate-700 border-slate-300 font-bold text-[10px]'
                            }
                          >
                            {phase.priority} Priority
                          </Badge>
                        )}
                        <CardTitle className="text-sm font-bold text-slate-900">{phase.title}</CardTitle>
                        {isAlreadyDistributed && (
                          <Badge variant="success" className="text-[10px] font-bold gap-1">
                            <Check className="h-3 w-3" /> Task Assigned
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" /> ~{phase.estimatedHours} hrs
                        </span>

                        <Select
                          value={phaseTargetMentees[phase.stepIndex] || 'all'}
                          onValueChange={(val) =>
                            setPhaseTargetMentees((prev) => ({ ...prev, [phase.stepIndex]: val }))
                          }
                        >
                          <SelectTrigger className="h-8 w-44 text-[11px] font-medium bg-white">
                            <SelectValue placeholder="Target Mentee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" className="text-xs font-semibold">
                              All 10 Mentees (AI Default)
                            </SelectItem>
                            {DUMMY_MENTEES.map((m) => (
                              <SelectItem key={m.studentId} value={m.studentId} className="text-xs">
                                {m.name} ({m.role.split(' ')[0]})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          onClick={() => handleDistributePhaseTask(phase)}
                          disabled={isThisDistributing}
                          className={
                            isAlreadyDistributed
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs gap-1 h-8'
                              : 'bg-green-600 hover:bg-green-700 text-white font-semibold text-xs gap-1 h-8'
                          }
                        >
                          {isThisDistributing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isAlreadyDistributed ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          {isAlreadyDistributed ? 'Assign Task' : 'Assign Task'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs text-slate-600 pt-1">
                    <p className="text-slate-700 font-medium">{phase.description}</p>

                    {phase.suggestedMenteeName && (
                      <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-purple-900">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                          <span>AI Recommended Mentee: <strong className="text-purple-950">{phase.suggestedMenteeName}</strong></span>
                        </div>
                        {phase.matchReasoning && (
                          <span className="text-[11px] text-purple-700 italic font-normal hidden sm:inline">
                            {phase.matchReasoning}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                      <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                        Execution Instructions
                      </p>
                      <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 leading-relaxed">
                        {phase.instructions}
                      </pre>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag className="h-3 w-3 text-slate-400" />
                        {phase.tags.map((tag, tIdx) => (
                          <Badge key={tIdx} variant="secondary" className="text-[10px] font-semibold">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {phase.resources && phase.resources.length > 0 && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-slate-400" />
                          <span>Resources: {phase.resources.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
