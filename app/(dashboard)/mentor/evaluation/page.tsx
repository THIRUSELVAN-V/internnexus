'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Award, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, updateDocument, createDocument } from '@/lib/firebase/firestore';
import { MentorAssignment, Feedback } from '@/lib/types';

export default function MentorEvaluationPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);

  // All of this mentor's mentees (unfiltered)
  const [allMentees, setAllMentees] = useState<MentorAssignment[]>([]);
  // Student IDs that already have a final evaluation from this mentor
  const [evaluatedIds, setEvaluatedIds] = useState<Set<string>>(new Set());

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [techRating, setTechRating] = useState('5');
  const [commRating, setCommRating] = useState('5');
  const [problemRating, setProblemRating] = useState('5');
  const [remarks, setRemarks] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  // Mentees that haven't been evaluated yet — drives the dropdown
  const pendingMentees = allMentees.filter((m) => !evaluatedIds.has(m.studentId));

  useEffect(() => {
    if (!profile?.uid) return;

    async function load() {
      setLoading(true);
      try {
        // 1. Load only this mentor's assignments
        const assignments = await getDocuments<MentorAssignment>('mentorAssignments');
        const mine = assignments.filter((a) => a.mentorId === profile!.uid);
        setAllMentees(mine);

        // 2. Load existing final feedback submitted by this mentor
        const feedbackDocs = await getDocuments<Feedback>('feedback');
        const alreadyEvaluated = new Set(
          feedbackDocs
            .filter((f) => f.mentorId === profile!.uid && f.type === 'final')
            .map((f) => f.studentId)
        );
        setEvaluatedIds(alreadyEvaluated);

        // 3. Pre-select the first pending student
        const pending = mine.filter((m) => !alreadyEvaluated.has(m.studentId));
        if (pending.length > 0) {
          setSelectedStudentId(pending[0].studentId);
        }
      } catch (err) {
        console.error('Error loading evaluation data:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [profile]);

  const resetForm = () => {
    setTechRating('5');
    setCommRating('5');
    setProblemRating('5');
    setRemarks('');
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedStudentId || !profile?.uid) return;
    setSubmitting(true);
    try {
      const selectedMentee = allMentees.find((m) => m.studentId === selectedStudentId);

      const avgRating = Math.round(
        (parseInt(techRating) + parseInt(commRating) + parseInt(problemRating)) / 3
      );

      const newFeedback: Omit<Feedback, 'id'> = {
        internshipId: selectedMentee?.internshipId || '',
        studentId: selectedStudentId,
        studentName: selectedMentee?.studentName || 'Student',
        mentorId: profile.uid,
        mentorName: profile.displayName || 'Industrial Mentor',
        type: 'final',
        rating: avgRating,
        communication: parseInt(commRating) || 5,
        technicalSkills: parseInt(techRating) || 5,
        problemSolving: parseInt(problemRating) || 5,
        teamwork: 5,
        initiative: 5,
        comments: remarks,
        createdAt: new Date().toISOString(),
      };

      await createDocument('feedback', newFeedback);

      if (selectedMentee?.id) {
        await updateDocument('mentorAssignments', selectedMentee.id, {
          endDate: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        });
      }

      // Mark this student as evaluated and remove from dropdown
      const evaluatedName = selectedMentee?.studentName || 'Student';
      setEvaluatedIds((prev) => new Set([...prev, selectedStudentId]));
      setSuccessName(evaluatedName);

      // Move to the next pending student (excluding the one just evaluated)
      const nextPending = allMentees.filter(
        (m) => !evaluatedIds.has(m.studentId) && m.studentId !== selectedStudentId
      );
      if (nextPending.length > 0) {
        setSelectedStudentId(nextPending[0].studentId);
      } else {
        setSelectedStudentId('');
      }

      resetForm();
    } catch (err) {
      console.error('Error submitting final evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Final Intern Evaluation &amp; Grading</h1>
        <p className="text-xs text-slate-500">
          Grade overall student technical performance and submit final mentor sign-off to unlock HR certificate issuance
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading students...</span>
        </div>
      ) : allMentees.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No Assigned Students</p>
            <p className="text-xs text-slate-500">
              You don&apos;t have any students assigned to you yet. Evaluations will appear here once students are assigned.
            </p>
          </CardContent>
        </Card>
      ) : pendingMentees.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">All Students Evaluated!</p>
            <p className="text-xs text-slate-500">
              You have submitted final evaluations for all {allMentees.length} assigned student{allMentees.length !== 1 ? 's' : ''}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Evaluation Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">

            {/* Success banner (shown after each submission while more students remain) */}
            {successName && (
              <div className="p-3 rounded-xl bg-green-50 text-green-700 border border-green-200 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span>
                  Final evaluation for <strong>{successName}</strong> submitted successfully. HR has been notified.
                </span>
              </div>
            )}

            {/* Student selector — only pending (unevaluated) students */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Select Student Mentee
                <span className="ml-2 text-slate-400 font-normal">
                  ({pendingMentees.length} pending)
                </span>
              </label>
              <Select value={selectedStudentId} onValueChange={(val) => { setSelectedStudentId(val); setSuccessName(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  {pendingMentees.map((m) => (
                    <SelectItem key={m.studentId} value={m.studentId}>
                      {m.studentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Technical Mastery (1–5)</label>
                <Select value={techRating} onValueChange={setTechRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Communication (1–5)</label>
                <Select value={commRating} onValueChange={setCommRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Problem Solving (1–5)</label>
                <Select value={problemRating} onValueChange={setProblemRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Final Performance Remarks &amp; Recommendations
              </label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe the student's overall performance, strengths, areas for improvement, and whether you recommend them for a full-time role..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSubmitEvaluation}
                disabled={submitting || !selectedStudentId || !remarks.trim()}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Award className="h-4 w-4 mr-1.5" />
                )}
                Submit Final Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
