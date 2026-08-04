'use client';

import React, { useState } from 'react';
import { Sparkles, Edit3, Check, BookOpen, Clock, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { TaskSuggestion } from '@/lib/types';

export interface TaskGeneratorCardProps {
  suggestion: TaskSuggestion;
  onPublishTask: (publishedTask: TaskSuggestion) => void;
}

export default function TaskGeneratorCard({ suggestion, onPublishTask }: TaskGeneratorCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [taskData, setTaskData] = useState<TaskSuggestion>(suggestion);

  const handlePublish = () => {
    onPublishTask(taskData);
    setIsEditing(false);
  };

  return (
    <Card className="border-amber-100 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900">AI Task Generator</CardTitle>
            <p className="text-xs text-slate-500">Suggested Weekly Task for Week {taskData.week}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 className="h-3.5 w-3.5" /> {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button size="sm" onClick={handlePublish} className="bg-amber-600 hover:bg-amber-700">
            <Check className="h-3.5 w-3.5" /> Publish Task
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Task Title</label>
              <Input
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <Textarea
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Instructions (Markdown)</label>
              <Textarea
                value={taskData.instructions}
                onChange={(e) => setTaskData({ ...taskData, instructions: e.target.value })}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-sm font-bold text-slate-900">{taskData.title}</h4>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" /> Est. {taskData.estimatedHours} hrs
                </Badge>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{taskData.description}</p>
              
              <div className="rounded-lg bg-white p-3 border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-line">
                {taskData.instructions}
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" /> Learning Objectives
              </p>
              <div className="flex flex-wrap gap-1.5">
                {taskData.learningObjectives.map((obj) => (
                  <Badge key={obj} variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                    {obj}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Resources & Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {taskData.tags.join(' · ')}
              </div>
              <div>
                Resources: {taskData.resources.join(', ')}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
