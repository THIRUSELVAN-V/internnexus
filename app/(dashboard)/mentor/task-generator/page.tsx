'use client';

import React, { useState } from 'react';
import TaskGeneratorCard from '@/components/ai/TaskGeneratorCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { generateWeeklyTasks } from '@/lib/ai/taskGenerator';
import type { TaskSuggestion } from '@/lib/types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function MentorTaskGeneratorPage() {
  const [week, setWeek] = useState<number>(3);
  const [domain, setDomain] = useState<string>('Web Development');
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null);
  const [published, setPublished] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setPublished(false);
    try {
      const res = await generateWeeklyTasks(domain, week);
      setSuggestion(res);
    } catch {
      // fallback
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Task Generator</h1>
        <p className="text-xs text-slate-500">Generate weekly internship task suggestions. Review, edit instructions, and publish to students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">Select Task Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <label className="text-xs font-semibold text-slate-700 block mb-1">Domain</label>
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

          <Button onClick={handleGenerate} loading={generating} className="bg-green-600 hover:bg-green-700">
            <Sparkles className="h-4 w-4 mr-1.5" /> Generate AI Task Suggestion
          </Button>
        </CardContent>
      </Card>

      {published && (
        <Card className="border-green-200 bg-green-50/40 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5" /> Task Successfully Published to Students!
          </div>
        </Card>
      )}

      {suggestion && !published && (
        <TaskGeneratorCard
          suggestion={suggestion}
          onPublishTask={() => setPublished(true)}
        />
      )}
    </div>
  );
}
