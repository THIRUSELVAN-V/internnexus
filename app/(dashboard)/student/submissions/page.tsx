'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import FileUpload from '@/components/shared/FileUpload';
import SubmissionAnalysisCard from '@/components/ai/SubmissionAnalysisCard';
import {
  Briefcase,
  CheckSquare,
  Clock,
  BookOpen,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  Star,
  Loader2,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Paperclip,
  Check,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument, updateDocument } from '@/lib/firebase/firestore';
import { createNotification } from '@/lib/firebase/notifications';
import { analyzeSubmission } from '@/lib/ai/submissionAnalysis';
import type { Task, Submission, SubmissionAnalysis, Application } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils/formatters';

export default function StudentSubmissionsPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [hasInternship, setHasInternship] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Form state
  const [reportText, setReportText] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SubmissionAnalysis | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSubmissionsData = async () => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [appDocs, taskDocs, subDocs] = await Promise.all([
        getDocuments<Application>('applications'),
        getDocuments<Task>('tasks'),
        getDocuments<Submission>('submissions'),
      ]);

      const myApps = appDocs.filter(
        (a) => a.studentId === profile.uid && a.status !== 'withdrawn'
      );
      const studentHasInternship = Boolean(
        myApps.length > 0 || (profile as Record<string, any>)?.currentInternshipId
      );
      setHasInternship(studentHasInternship);

      const myTasks = taskDocs.filter((t) => t.studentId === profile.uid);
      setTasks(myTasks);

      const mySubmissions = subDocs.filter((s) => s.studentId === profile.uid);
      setSubmissions(mySubmissions);

      if (myTasks.length > 0) {
        setSelectedTaskId((prev) => {
          if (prev && myTasks.some((t) => t.id === prev)) {
            return prev;
          }
          return myTasks[0].id;
        });
      } else {
        setSelectedTaskId('');
      }
    } catch (err) {
      console.error('Error fetching student submissions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionsData();
  }, [profile]);

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0] || null;
  const activeSubmission = activeTask
    ? submissions.find((s) => s.taskId === activeTask.id) || null
    : null;

  const handleFileSelect = async (file: File) => {
    setUploadedFile(file);
    setAnalyzing(true);
    setErrorMsg('');
    try {
      const res = await analyzeSubmission([file.name], reportText);
      setAnalysis(res);
    } catch (err) {
      console.error('Error analyzing submission deliverable:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTask || !profile?.uid) return;

    if (!reportText.trim() && !submissionLink.trim() && !uploadedFile) {
      setErrorMsg('Please enter a report description, provide a submission link, or upload a file.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      let finalAnalysis = analysis;
      if (!finalAnalysis && (uploadedFile || reportText.trim())) {
        try {
          finalAnalysis = await analyzeSubmission(
            uploadedFile ? [uploadedFile.name] : [],
            reportText
          );
        } catch {
          // Non-blocking analysis fallback
        }
      }

      const newSubmission: Omit<Submission, 'id'> = {
        taskId: activeTask.id,
        taskTitle: activeTask.title,
        internshipId: activeTask.internshipId,
        studentId: profile.uid,
        studentName: profile.displayName || 'Student',
        mentorId: activeTask.mentorId,
        fileURLs: uploadedFile ? [uploadedFile.name] : [],
        fileTypes: uploadedFile?.name.endsWith('.pdf') ? ['pdf'] : uploadedFile ? ['zip'] : [],
        description: reportText.trim() || 'Task report submitted.',
        submissionLink: submissionLink.trim() || undefined,
        status: 'submitted',
        aiAnalysis: finalAnalysis || undefined,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createDocument('submissions', newSubmission);
      await updateDocument('tasks', activeTask.id, {
        status: 'submitted',
        updatedAt: new Date().toISOString(),
      });

      if (activeTask.mentorId) {
        createNotification({
          recipientUserId: activeTask.mentorId,
          recipientRole: 'mentor',
          title: 'Task Report Submitted',
          message: `${profile.displayName || 'A student'} submitted a report for "${activeTask.title}".`,
          type: 'info',
          category: 'task',
          link: '/mentor/submissions',
          relatedId: activeTask.id,
          relatedType: 'task',
        }).catch((notifyErr) =>
          console.error('Failed to notify mentor of submission:', notifyErr)
        );
      }

      setSubmitSuccess(true);
      setReportText('');
      setSubmissionLink('');
      setUploadedFile(null);
      setAnalysis(null);

      await fetchSubmissionsData();

      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('Error submitting report:', err);
      setErrorMsg('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Task Submission &amp; Reports</h1>
        <p className="text-xs text-slate-500">
          Review mentor-assigned task instructions, submit milestone reports and links, and track evaluations
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">
            Loading submission records...
          </span>
        </div>
      ) : !hasInternship ? (
        /* Case 1: Student has no selected internship */
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Internship Selected</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Select an internship to view your assigned tasks and submit reports.
            </p>
            <div className="pt-2">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">
                <Link href="/student/internships">
                  Browse Internships <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        /* Case 2: Student has selected an internship but no mentor has assigned a task */
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Tasks Assigned</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your mentor has not assigned any tasks yet.
            </p>
          </CardContent>
        </Card>
      ) : activeTask ? (
        /* Case 3: Student has an internship and mentor-assigned task */
        <div className="space-y-6">
          {/* Task Selector (if multiple tasks) */}
          {tasks.length > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Switch Assigned Task</span>
                <span className="text-[11px] text-slate-500">
                  Select which mentor deliverable to view or report on
                </span>
              </div>
              <Select
                value={activeTask.id}
                onValueChange={(val) => {
                  setSelectedTaskId(val);
                  setReportText('');
                  setSubmissionLink('');
                  setUploadedFile(null);
                  setAnalysis(null);
                  setErrorMsg('');
                }}
              >
                <SelectTrigger className="w-full sm:w-72 bg-white text-xs">
                  <SelectValue placeholder="Choose task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      Week {t.week}: {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Assigned Task Info & Submission Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Task Details Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                        Week {activeTask.week}
                      </span>
                      <Badge
                        variant={
                          activeTask.status === 'approved'
                            ? 'success'
                            : activeTask.status === 'submitted'
                            ? 'purple'
                            : 'warning'
                        }
                        className="text-[10px] capitalize font-semibold"
                      >
                        {activeTask.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {activeTask.dueDate && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" /> Due: {activeTask.dueDate}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 mt-2">
                    {activeTask.title}
                  </CardTitle>
                  {activeTask.description && (
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {activeTask.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-1">
                  {/* Task Instructions */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span>Task Instructions from Industrial Mentor:</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-6">
                      {activeTask.instructions || 'Follow milestone requirements and submit report deliverables.'}
                    </p>
                  </div>

                  {/* Mentor Resources / Links if provided */}
                  {activeTask.resources && activeTask.resources.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-semibold text-slate-700 block">
                        Reference Resources:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {activeTask.resources.map((res, idx) => (
                          <a
                            key={idx}
                            href={res.startsWith('http') ? res : `https://${res}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50/70 border border-blue-200 px-2.5 py-1 rounded-lg"
                          >
                            <ExternalLink className="h-3 w-3" /> {res}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submission Form Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-600" />
                    {activeSubmission ? 'Submit Revision / Additional Report' : 'Submit Task Report'}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Provide your report details, deliverables link, or upload supporting files.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submitSuccess && (
                    <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2 animate-fade-in font-medium">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      Report submitted successfully! Your industrial mentor has been notified.
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  {/* Report Text Input */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Report / Submission Text <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Enter your task report, work summary, technical decisions, or questions for your mentor..."
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      className="min-h-[100px] text-xs"
                    />
                  </div>

                  {/* Submission Link Input */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Report / Submission Link (GitHub, Google Drive, Live Demo)
                    </label>
                    <Input
                      placeholder="e.g. https://github.com/my-org/project or https://drive.google.com/..."
                      value={submissionLink}
                      onChange={(e) => setSubmissionLink(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* File Upload (Optional) */}
                  <div>
                    <FileUpload
                      label="Upload Report / Deliverable File (Optional)"
                      description="PDF, ZIP or code archive (Max 25MB)"
                      onFileSelect={handleFileSelect}
                    />
                    {uploadedFile && (
                      <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800">
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <Paperclip className="h-3.5 w-3.5 text-blue-600" /> {uploadedFile.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                          onClick={() => {
                            setUploadedFile(null);
                            setAnalysis(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* AI Analyzing banner */}
                  {analyzing && (
                    <div className="rounded-xl bg-purple-50 border border-purple-100 p-3.5 text-center space-y-1">
                      <Loader2 className="animate-spin h-4 w-4 text-purple-600 mx-auto" />
                      <p className="text-xs font-semibold text-purple-900">
                        Running AI Deliverable Check...
                      </p>
                      <p className="text-[11px] text-purple-600">
                        Evaluating code structure and completion criteria
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                    disabled={
                      submitting ||
                      analyzing ||
                      (!reportText.trim() && !submissionLink.trim() && !uploadedFile)
                    }
                    onClick={() => handleSubmitReport()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Submitting Report...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1.5" /> Submit Report to Mentor
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Submission Status, Result & AI Analysis */}
            <div className="lg:col-span-5 space-y-6">
              {/* Current Task Submission Status / Result */}
              {activeSubmission ? (
                <Card className="border-blue-100 shadow-sm">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-900">
                            Submission Result
                          </CardTitle>
                          <span className="text-[11px] text-slate-500">
                            Submitted on {formatTimestamp(activeSubmission.submittedAt)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          activeSubmission.status === 'approved'
                            ? 'success'
                            : activeSubmission.status === 'revision_needed'
                            ? 'warning'
                            : 'purple'
                        }
                        className="capitalize font-semibold text-xs"
                      >
                        {activeSubmission.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4 text-xs">
                    {/* Mentor Evaluation & Rating if reviewed */}
                    {(activeSubmission.mentorRating || activeSubmission.mentorFeedback) && (
                      <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> Mentor Evaluation
                          </span>
                          {activeSubmission.mentorRating && (
                            <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                              {activeSubmission.mentorRating}.0 / 5.0
                            </span>
                          )}
                        </div>
                        {activeSubmission.mentorFeedback && (
                          <p className="text-amber-950 leading-relaxed">
                            {activeSubmission.mentorFeedback}
                          </p>
                        )}
                        {activeSubmission.reviewedAt && (
                          <p className="text-[10px] text-amber-700">
                            Reviewed on {formatTimestamp(activeSubmission.reviewedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Submitted Report Summary */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 block">Submitted Report:</span>
                      <p className="text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                        {activeSubmission.description || 'No report notes provided.'}
                      </p>
                    </div>

                    {/* Submitted Link */}
                    {activeSubmission.submissionLink && (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">Deliverables Link:</span>
                        <a
                          href={activeSubmission.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline font-medium break-all"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          {activeSubmission.submissionLink}
                        </a>
                      </div>
                    )}

                    {/* Attached files */}
                    {activeSubmission.fileURLs && activeSubmission.fileURLs.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">Attached Deliverables:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSubmission.fileURLs.map((file, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              <Paperclip className="h-3 w-3 text-slate-400" />
                              {file.split('/').pop() || file}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Analysis if attached to submission */}
                    {activeSubmission.aiAnalysis && (
                      <div className="pt-2">
                        <SubmissionAnalysisCard analysis={activeSubmission.aiAnalysis} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* No Submission for this task yet */
                <Card className="border-dashed border-slate-200">
                  <CardContent className="py-12 text-center space-y-3">
                    <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      No Report Submitted for this Task
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Fill out the report description and submission link on the left to submit your
                      deliverable to your mentor.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Pre-submit AI Analysis view if generated for uploaded file */}
              {!activeSubmission && analysis && (
                <div className="space-y-2">
                  <SubmissionAnalysisCard analysis={analysis} />
                </div>
              )}

              {/* All Submissions History */}
              {submissions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Submission History ({submissions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-slate-100 pt-0">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="py-3 flex items-start justify-between gap-3 text-xs first:pt-2 last:pb-1"
                      >
                        <div className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(sub.taskId)}
                            className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span>{sub.taskTitle || 'Task Deliverable'}</span>
                          </button>
                          <p className="text-[11px] text-slate-400">
                            {formatTimestamp(sub.submittedAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {sub.mentorRating && (
                            <span className="flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {sub.mentorRating}.0
                            </span>
                          )}
                          <Badge
                            variant={
                              sub.status === 'approved'
                                ? 'success'
                                : sub.status === 'revision_needed'
                                ? 'warning'
                                : 'purple'
                            }
                            className="text-[10px] capitalize"
                          >
                            {sub.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
