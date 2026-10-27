'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Check,
  X,
  Sparkles,
  FileText,
  Loader2,
  Star,
  CheckCircle2,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  CircleCheck,
  CircleX,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  getDocuments,
  getDocument,
  updateDocument,
  createDocument,
} from '@/lib/firebase/firestore';
import { Submission, Task, Project } from '@/lib/types';

// ─── AI result shape (mirrors the API) ────────────────────────────────────────

interface ReportAIResult {
  summary: string;
  completed: string[];
  missed: string[];
  completionScore: number;
  overallAssessment: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusVariant(status: string) {
  switch (status) {
    case 'approved':       return 'success';
    case 'submitted':      return 'purple';
    case 'revision_needed':return 'destructive';
    default:               return 'secondary';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'approved':       return 'Approved';
    case 'submitted':      return 'Pending Review';
    case 'revision_needed':return 'Revision Needed';
    default:               return status.replace(/_/g, ' ');
  }
}

function assessmentColour(a: string) {
  switch (a) {
    case 'Excellent':          return 'bg-green-100 text-green-700 border-green-200';
    case 'Good':               return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Satisfactory':       return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'Needs Improvement':  return 'bg-red-100 text-red-700 border-red-200';
    default:                   return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function scoreColour(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

// ─── Score ring (SVG) ─────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 72 72" width={72} height={72}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="#e2e8f0" strokeWidth={7} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke={score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#ef4444'}
          strokeWidth={7}
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={`relative text-lg font-extrabold ${scoreColour(score)}`}>
        {score}
        <span className="text-[10px] font-semibold">%</span>
      </span>
    </div>
  );
}

// ─── AI Result Panel ──────────────────────────────────────────────────────────

function AIResultPanel({ result }: { result: ReportAIResult }) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
      {/* header row: score ring + assessment + summary */}
      <div className="flex items-start gap-4">
        <div className="shrink-0 flex flex-col items-center gap-1">
          <ScoreRing score={result.completionScore} />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            Completion
          </span>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-purple-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI Evaluation
            </p>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${assessmentColour(result.overallAssessment)}`}
            >
              {result.overallAssessment}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* completed / missed chips */}
      {(result.completed.length > 0 || result.missed.length > 0) && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Completed */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1">
              <CircleCheck className="h-3 w-3" /> Completed
            </p>
            <div className="flex flex-col gap-1">
              {result.completed.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5"
                >
                  <Check className="h-2.5 w-2.5 shrink-0" /> {item}
                </span>
              ))}
            </div>
          </div>

          {/* Missed */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
              <CircleX className="h-3 w-3" /> Missed / Incomplete
            </p>
            <div className="flex flex-col gap-1">
              {result.missed.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Nothing missed 🎉</span>
              ) : (
                result.missed.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-0.5"
                  >
                    <X className="h-2.5 w-2.5 shrink-0" /> {item}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Submission list row ───────────────────────────────────────────────────────

function SubmissionRow({ sub, onClick }: { sub: Submission; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/40 transition-all"
    >
      <div className="shrink-0 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-green-100">
        <FileText className="h-5 w-5 text-slate-400 group-hover:text-green-600" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {sub.taskTitle || 'Task Submission'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
          <User className="h-3 w-3" />
          <span>{sub.studentName}</span>
          <span>·</span>
          <Calendar className="h-3 w-3" />
          <span>{sub.submittedAt?.slice(0, 10)}</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        {sub.status === 'approved' && sub.mentorRating != null && (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {sub.mentorRating}/5
          </span>
        )}
        <Badge variant={statusVariant(sub.status) as any} className="text-xs capitalize">
          {statusLabel(sub.status)}
        </Badge>
        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-green-500 transition-colors" />
      </div>
    </button>
  );
}

// ─── Detail modal ──────────────────────────────────────────────────────────────

function SubmissionModal({
  submission,
  onClose,
  onDecision,
}: {
  submission: Submission;
  onClose: () => void;
  onDecision: (status: 'approved' | 'rejected', rating: number, feedback: string) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState(submission.mentorFeedback || '');
  const [rating, setRating] = useState(String(submission.mentorRating || 5));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null);

  const [aiResult, setAiResult] = useState<ReportAIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const reportText = submission.description || '';

  const handleAnalyse = async () => {
    if (!reportText.trim()) { setAiError('No report text found to analyse.'); return; }
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const res = await fetch('/api/ai/summarise-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'AI analysis failed');
      }
      setAiResult(await res.json());
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDecision = async (status: 'approved' | 'rejected') => {
    setSaving(true);
    try {
      await onDecision(status, parseInt(rating), feedback);
      setDone(status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">

        {/* ── Modal header ── */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-6 pt-5 pb-4 bg-white border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-0.5">
              Report Submission
            </p>
            <h2 className="text-base font-bold text-slate-900 truncate">
              {submission.taskTitle || 'Task Submission'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{submission.studentName}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{submission.submittedAt?.slice(0, 10)}</span>
              <span>·</span>
              <Badge variant={statusVariant(submission.status) as any} className="text-xs">
                {statusLabel(submission.status)}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Report text ── */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Student Report
            </h3>
            {reportText ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                {reportText}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-xs text-slate-400 text-center">
                No written report text submitted. Student may have attached files only.
              </div>
            )}
          </div>

          {/* ── AI analyse ── */}
          <div className="space-y-3">
            <Button
              onClick={handleAnalyse}
              disabled={aiLoading || !reportText.trim()}
              variant="outline"
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold"
            >
              {aiLoading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing with AI…</>
                : <><Sparkles className="h-4 w-4 mr-2" />Analyse Report with AI</>}
            </Button>

            {aiError && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{aiError}
              </div>
            )}

            {aiResult && <AIResultPanel result={aiResult} />}
          </div>

          <div className="border-t border-slate-100" />

          {/* ── Decision ── */}
          {done ? (
            <div className={`p-5 rounded-xl border text-center font-bold text-sm ${done === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
              {done === 'approved'
                ? 'Submission approved! Task marked as completed.'
                : 'Submission rejected. Task moved back to pending for the student.'}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Mentor Evaluation
              </h3>

              {/* rating */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Rating (1–5 Stars)</label>
                <Select value={rating} onValueChange={setRating}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5 — Excellent</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ 4 — Good</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ 3 — Satisfactory</SelectItem>
                    <SelectItem value="2">⭐⭐ 2 — Needs Work</SelectItem>
                    <SelectItem value="1">⭐ 1 — Unsatisfactory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* feedback */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">Feedback &amp; Suggestions</label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write constructive feedback for the student…"
                  className="min-h-[90px] text-sm resize-none"
                />
              </div>

              {/* action buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  onClick={() => handleDecision('rejected')}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <X className="h-4 w-4 mr-1.5" />}
                  Reject &amp; Send Back
                </Button>
                <Button
                  onClick={() => handleDecision('approved')}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
                  Approve &amp; Complete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MentorSubmissionsPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revision_needed'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await getDocuments<Submission>('submissions');
      const mine = profile?.uid ? docs.filter((s) => s.mentorId === profile.uid) : docs;
      mine.sort((a, b) => {
        if (a.status === 'submitted' && b.status !== 'submitted') return -1;
        if (b.status === 'submitted' && a.status !== 'submitted') return 1;
        return (b.submittedAt ?? '').localeCompare(a.submittedAt ?? '');
      });
      setSubmissions(mine);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDecision = async (
    status: 'approved' | 'rejected',
    rating: number,
    feedback: string,
  ) => {
    if (!selected) return;
    const dbStatus  = status === 'approved' ? 'approved'  : 'revision_needed';
    const taskStatus= status === 'approved' ? 'completed' : 'pending';

    await updateDocument('submissions', selected.id, {
      status: dbStatus,
      mentorFeedback: feedback || '',
      mentorRating: rating,
      reviewedAt: new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    });

    if (selected.taskId) {
      await updateDocument('tasks', selected.taskId, {
        status: taskStatus,
        updatedAt: new Date().toISOString(),
      });

      if (status === 'approved') {
        try {
          const taskDoc = await getDocument<Task>('tasks', selected.taskId);
          if (taskDoc?.projectId && taskDoc?.stepIndex) {
            const projectDoc = await getDocument<Project>('projects', taskDoc.projectId);
            if (projectDoc?.aiRoadmap?.length) {
              const nextStepIndex = (taskDoc.stepIndex ?? 0) + 1;
              const nextPhase = projectDoc.aiRoadmap.find(
                (p) => p.stepIndex === nextStepIndex,
              );
              if (nextPhase) {
                // ── Guard: skip if this student already has a task for this step ──
                const existingTasks = await getDocuments<Task>('tasks', [
                  where('studentId',  '==', selected.studentId),
                  where('projectId',  '==', projectDoc.id),
                  where('stepIndex',  '==', nextStepIndex),
                ]);

                if (existingTasks.length === 0) {
                  // No existing task → safe to create
                  const nextTaskData: Omit<Task, 'id'> = {
                    internshipId: taskDoc.internshipId,
                    mentorId:     taskDoc.mentorId,
                    studentId:    selected.studentId,
                    studentName:  selected.studentName,
                    title:        nextPhase.title,
                    description:  nextPhase.description,
                    instructions: nextPhase.instructions,
                    week:         nextPhase.stepIndex,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0],
                    status:      'pending',
                    aiGenerated: true,
                    projectId:   projectDoc.id,
                    stepIndex:   nextPhase.stepIndex,
                    createdAt:   new Date().toISOString(),
                    updatedAt:   new Date().toISOString(),
                  };
                  await createDocument('tasks', nextTaskData);
                  await updateDocument('projects', projectDoc.id, {
                    currentStepIndex: {
                      ...(projectDoc.currentStepIndex || {}),
                      [selected.studentId]: nextPhase.stepIndex,
                    },
                    updatedAt: new Date().toISOString(),
                  });
                } else {
                  console.info(
                    `Auto-unlock skipped: task for student ${selected.studentId} at step ${nextStepIndex} already exists (id: ${existingTasks[0].id})`,
                  );
                }
              }
            }
          }
        } catch (e) { console.error('Auto-unlock error:', e); }
      }
    }

    await fetchData();
  };

  const filtered = submissions.filter((s) => {
    if (filter === 'all')     return true;
    if (filter === 'pending') return s.status === 'submitted';
    return s.status === filter;
  });

  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Report Submissions</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review evaluation reports from your mentees. Click a row to view details, run AI analysis, and give your decision.
        </p>
      </div>

      {/* filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: 'all',              label: 'All' },
            { key: 'pending',          label: `Pending Review${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { key: 'approved',         label: 'Approved' },
            { key: 'revision_needed',  label: 'Revision Needed' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === key
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
          <span className="ml-3 text-sm text-slate-500">Loading submissions…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-xs text-slate-500">
            {filter === 'all'
              ? 'No submissions found. Your mentees have not submitted any reports yet.'
              : `No submissions with status "${statusLabel(filter === 'pending' ? 'submitted' : filter)}".`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <SubmissionRow key={sub.id} sub={sub} onClick={() => setSelected(sub)} />
          ))}
        </div>
      )}

      {selected && (
        <SubmissionModal
          submission={selected}
          onClose={() => setSelected(null)}
          onDecision={handleDecision}
        />
      )}
    </div>
  );
}
