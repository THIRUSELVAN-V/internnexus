'use client';

import React, { useEffect, useState } from 'react';
import TaskGeneratorCard from '@/components/ai/TaskGeneratorCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { generateWeeklyTasks } from '@/lib/ai/taskGenerator';
import type { TaskSuggestion, MentorAssignment, Task } from '@/lib/types';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument } from '@/lib/firebase/firestore';

export default function MentorTaskGeneratorPage() {
  const { profile } = useAuthContext();
  const [week, setWeek] = useState<number>(3);
  const [domain, setDomain] = useState<string>('Web Development');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [mentees, setMentees] = useState<MentorAssignment[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    async function loadMentees() {
      try {
        const assignments = await getDocuments<MentorAssignment>('mentorAssignments');
        setMentees(assignments);
        if (assignments.length > 0) {
          setSelectedStudentId(assignments[0].studentId);
        }
      } catch (err) {
        console.error('Error loading mentees for task generator:', err);
      }
    }
    loadMentees();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setPublished(false);
    try {
      const res = await generateWeeklyTasks(domain, week);
      setSuggestion(res);
    } catch (err) {
      console.error('Error generating task:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishTask = async () => {
    if (!suggestion || !profile?.uid) return;
    setPublishing(true);
    try {
      const selectedMentee = mentees.find((m) => m.studentId === selectedStudentId);

      const newTask: Omit<Task, 'id'> = {
        internshipId: selectedMentee?.internshipId || 'int-1',
        mentorId: profile.uid,
        studentId: selectedStudentId || 'std-1',
        studentName: selectedMentee?.studentName || 'Student',
        title: suggestion.title,
        description: suggestion.description,
        instructions: suggestion.instructions,
        week: suggestion.week,
        dueDate: '2026-09-30',
        status: 'pending',
        aiGenerated: true,
        resources: suggestion.resources,
        tags: suggestion.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createDocument('tasks', newTask);
      setPublished(true);
    } catch (err) {
      console.error('Error publishing task to Firestore:', err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Internship Task Generator</h1>
        <p className="text-xs text-slate-500">Generate structured weekly internship task suggestions with AI. Review, customize instructions, and assign to students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Select Target Student & Task Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Student Mentee</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {mentees.map((m) => (
                    <SelectItem key={m.studentId} value={m.studentId}>
                      {m.studentName}
                    </SelectItem>
                  ))}
                  {mentees.length === 0 && (
                    <SelectItem value="std-1">Thiru (Frontend Web Dev)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Week</label>
              <Select value={week.toString()} onValueChange={(v) => setWeek(parseInt(v))}>
                <SelectTrigger><SelectValue placeholder="Select week" /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                    <SelectItem key={w} value={w.toString()}>Week {w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Domain Focus</label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="Full Stack Engineering">Full Stack Engineering</SelectItem>
                  <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                  <SelectItem value="Data Science & ML">Data Science & ML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            Generate AI Task Suggestion
          </Button>
        </CardContent>
      </Card>

      {published && (
        <Card className="border-green-200 bg-green-50/40 p-4 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5" /> Task Successfully Published to Student Workspace!
          </div>
        </Card>
      )}

      {suggestion && !published && (
        <TaskGeneratorCard
          suggestion={suggestion}
          onPublishTask={handlePublishTask}
        />
      )}
    </div>
  );
}
