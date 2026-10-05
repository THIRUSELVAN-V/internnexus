'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Award, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, updateDocument, createDocument } from '@/lib/firebase/firestore';
import { MentorAssignment, Feedback } from '@/lib/types';

export default function MentorEvaluationPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState<MentorAssignment[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [techRating, setTechRating] = useState('5');
  const [commRating, setCommRating] = useState('5');
  const [problemRating, setProblemRating] = useState('5');
  const [remarks, setRemarks] = useState('Demonstrated exceptional technical mastery in React and TypeScript throughout the 12-week internship. All tasks were delivered on time with clean architecture and strong test coverage. Recommended for full-time offer.');

  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function loadMentees() {
      setLoading(true);
      try {
        const assignments = await getDocuments<MentorAssignment>('mentorAssignments');
        setMentees(assignments);
        if (assignments.length > 0) {
          setSelectedStudentId(assignments[0].studentId);
        }
      } catch (err) {
        console.error('Error loading mentees:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMentees();
  }, [profile]);

  const handleSubmitEvaluation = async () => {
    if (!selectedStudentId || !profile?.uid) return;
    setSubmitting(true);
    try {
      const selectedMentee = mentees.find((m) => m.studentId === selectedStudentId);

      const avgRating = Math.round(
        (parseInt(techRating) + parseInt(commRating) + parseInt(problemRating)) / 3
      );

      const newFeedback: Omit<Feedback, 'id'> = {
        internshipId: selectedMentee?.internshipId || 'int-1',
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

      setCompleted(true);
    } catch (err) {
      console.error('Error submitting final evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Final Intern Evaluation & Grading</h1>
        <p className="text-xs text-slate-500">Grade overall student technical performance and submit final mentor sign-off to unlock HR certificate issuance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading student mentees...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Evaluation Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Student Mentee</label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
                <SelectContent>
                  {mentees.map((m) => (
                    <SelectItem key={m.studentId} value={m.studentId}>
                      {m.studentName} (Frontend Development Intern)
                    </SelectItem>
                  ))}
                  {mentees.length === 0 && (
                    <SelectItem value="std-1">Thiru (Frontend Web Development Intern)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Technical Mastery (1-5)</label>
                <Select value={techRating} onValueChange={setTechRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Communication (1-5)</label>
                <Select value={commRating} onValueChange={setCommRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Problem Solving (1-5)</label>
                <Select value={problemRating} onValueChange={setProblemRating}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Final Performance Remarks & Recommendations</label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {completed ? (
              <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-200 text-center font-bold text-xs space-y-1 animate-fade-in">
                <CheckCircle2 className="h-6 w-6 mx-auto text-green-600" />
                <p>Final Intern Evaluation Submitted Successfully!</p>
                <p className="text-[11px] font-normal text-green-800">HR has been notified to generate and issue the official completion certificate.</p>
              </div>
            ) : (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSubmitEvaluation}
                  disabled={submitting || !selectedStudentId}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Award className="h-4 w-4 mr-1.5" />}
                  Submit Final Evaluation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
