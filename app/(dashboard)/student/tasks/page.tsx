'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Clock, CheckSquare, Upload, ArrowRight, BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import FileUpload from '@/components/shared/FileUpload';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument, updateDocument } from '@/lib/firebase/firestore';
import { Task, Submission } from '@/lib/types';

export default function StudentTasksPage() {
  const { profile } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const taskDocs = await getDocuments<Task>('tasks');
      const myTasks = profile?.uid ? taskDocs.filter((t) => t.studentId === profile.uid) : [];
      setTasks(myTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [profile]);

  const handleSubmitWork = async () => {
    if (!selectedTask || !profile?.uid) return;
    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const newSubmission: Omit<Submission, 'id'> = {
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        internshipId: selectedTask.internshipId,
        studentId: profile.uid,
        studentName: profile.displayName || 'Student',
        mentorId: selectedTask.mentorId,
        fileURLs: [uploadedFileName || 'https://storage.googleapis.com/demo/deliverable.zip'],
        fileTypes: ['zip'],
        description: submissionNotes || 'Completed task deliverables according to weekly instructions.',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createDocument('submissions', newSubmission);
      await updateDocument('tasks', selectedTask.id, {
        status: 'submitted',
        updatedAt: new Date().toISOString(),
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setSelectedTask(null);
        fetchTasks();
      }, 1500);
    } catch (err) {
      console.error('Error submitting work:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Tasks & Deliverables</h1>
        <p className="text-xs text-slate-500">Weekly internship assignments published by your industrial mentor</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading assigned tasks...</span>
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Tasks Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once your industrial mentor is assigned to your selected internship, weekly assignments, deadlines, and technical deliverables will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isApproved = task.status === 'approved';
            const isInProgress = task.status === 'in_progress';
            const isSubmitted = task.status === 'submitted';

            return (
              <Card key={task.id} className={isInProgress ? 'border-blue-300 shadow-sm' : ''}>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-semibold">Week {task.week}</Badge>
                      <Badge
                        variant={isApproved ? 'success' : isSubmitted ? 'purple' : isInProgress ? 'default' : 'secondary'}
                        className="text-xs capitalize font-semibold"
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.aiGenerated && (
                        <Badge variant="purple" className="text-[10px]">AI Generated Task</Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Due {task.dueDate}
                    </span>
                    <Button
                      size="sm"
                      variant={isApproved ? 'outline' : 'default'}
                      onClick={() => {
                        setSelectedTask(task);
                        setSubmissionNotes('');
                        setUploadedFileName('');
                      }}
                      className={isApproved ? '' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                    >
                      {isApproved ? 'View Submission' : isSubmitted ? 'Update Submission' : 'Submit Work'}
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Submission Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Week {selectedTask.week}</Badge>
                <Badge variant="default" className="text-xs capitalize">{selectedTask.status}</Badge>
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">{selectedTask.title}</DialogTitle>
              <DialogDescription className="text-xs">{selectedTask.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {submitSuccess ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center space-y-1 animate-fade-in">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                  <p className="font-bold">Task Deliverable Submitted Successfully!</p>
                  <p className="text-[11px] text-green-700">Notification sent to your industrial mentor.</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="font-bold text-slate-700 block">Task Instructions:</span>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed">{selectedTask.instructions}</p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Upload Code / Deliverable File</label>
                    <FileUpload
                      label="Select ZIP / PDF File"
                      description="Upload code archive or report file"
                      onFileSelect={(file) => setUploadedFileName(file.name)}
                    />
                    {uploadedFileName && (
                      <p className="text-xs text-blue-600 font-semibold mt-1">Attached: {uploadedFileName}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Submission Notes & Demo Links</label>
                    <Textarea
                      placeholder="Add brief notes or GitHub/PR links for your mentor..."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </>
              )}
            </div>

            {!submitSuccess && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedTask(null)} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitWork} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  Submit to Mentor
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
