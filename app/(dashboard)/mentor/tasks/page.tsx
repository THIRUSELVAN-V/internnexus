'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, deleteDocument } from '@/lib/firebase/firestore';
import { Task } from '@/lib/types';

export default function MentorTasksPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchMentorTasks = async () => {
    setLoading(true);
    try {
      const taskDocs = await getDocuments<Task>('tasks');
      const myTasks = profile?.uid ? taskDocs.filter((t) => t.mentorId === profile.uid) : taskDocs;
      setTasks(myTasks);
    } catch (err) {
      console.error('Error fetching mentor tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorTasks();
  }, [profile]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDocument('tasks', taskId);
      fetchMentorTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'week',
      header: 'Week',
      render: (item) => <Badge variant="outline" className="font-semibold text-xs">Week {item.week}</Badge>,
    },
    {
      key: 'title',
      header: 'Task Title',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            {item.title}
            {item.aiGenerated && <Sparkles className="h-3 w-3 text-purple-600 shrink-0" />}
          </p>
          <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'studentName',
      header: 'Assigned Student',
      render: (item) => <span className="text-xs font-semibold text-slate-800">{item.studentName}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (item) => <span className="text-xs font-mono text-slate-600">{item.dueDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'approved' ? 'success' : item.status === 'submitted' ? 'purple' : 'warning'}
          className="capitalize text-xs font-semibold"
        >
          {item.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDeleteTask(item.id)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Task Management Directory</h1>
          <p className="text-xs text-slate-500">Manage all weekly tasks assigned to your student mentees</p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700 text-white font-semibold">
          <Link href="/mentor/task-generator">
            <Plus className="h-4 w-4 mr-1.5" /> AI Task Generator
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-green-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching assigned tasks...</span>
            </div>
          ) : (
            <DataTable
              data={tasks}
              columns={columns}
              searchKey="title"
              searchPlaceholder="Search tasks by title..."
              emptyMessage="No tasks published yet. Click AI Task Generator to create one!"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
