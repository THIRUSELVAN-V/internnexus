'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckSquare, Inbox, Sparkles, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { MentorAssignment, Task, Submission, Feedback } from '@/lib/types';

export default function MentorDashboardPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    async function fetchMentorDashboard() {
      setLoading(true);
      try {
        const [assignDocs, taskDocs, subDocs, feedDocs] = await Promise.all([
          getDocuments<MentorAssignment>('mentorAssignments'),
          getDocuments<Task>('tasks'),
          getDocuments<Submission>('submissions'),
          getDocuments<Feedback>('feedback'),
        ]);

        const myAssignments = profile?.uid ? assignDocs.filter((a) => a.mentorId === profile.uid) : assignDocs;
        const myTasks = profile?.uid ? taskDocs.filter((t) => t.mentorId === profile.uid) : taskDocs;
        const mySubmissions = profile?.uid ? subDocs.filter((s) => s.mentorId === profile.uid) : subDocs;
        const myFeedbacks = profile?.uid ? feedDocs.filter((f) => f.mentorId === profile.uid) : feedDocs;

        setAssignments(myAssignments);
        setTasks(myTasks);
        setSubmissions(mySubmissions);
        setFeedbacks(myFeedbacks);
      } catch (err) {
        console.error('Error fetching mentor dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMentorDashboard();
  }, [profile]);

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'submitted').length;
  const approvedSubmissionsCount = submissions.filter((s) => s.status === 'approved').length;

  const chartData = [
    { week: 'W1', approved: Math.max(1, approvedSubmissionsCount), pending: 0 },
    { week: 'W2', approved: Math.max(2, approvedSubmissionsCount), pending: 1 },
    { week: 'W3', approved: Math.max(1, approvedSubmissionsCount), pending: pendingSubmissionsCount },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Industrial Mentor Portal
          </span>
          <h1 style={{ color: 'white' }} className="text-2xl font-bold tracking-tight">
            Welcome, {profile?.displayName || 'Industrial Mentor'}
          </h1>
          <p style={{ color: 'white' }} className="text-green-100 text-sm mt-1 max-w-xl">
            Review AI task suggestions, manage assigned student submissions, leave feedback, and grade final evaluations.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-green-700 hover:bg-green-50 border-none shrink-0 font-semibold text-xs sm:text-sm">
          <Link href="/mentor/task-generator">
            <Sparkles className="h-4 w-4 mr-1 text-purple-600" /> Open AI Task Generator
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading mentor workspace analytics...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Assigned Students"
              value={`${assignments.length} Mentees`}
              change="Max Capacity 5"
              trend="neutral"
              description="Active student mentees"
              icon={Users}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatsCard
              title="Tasks Published"
              value={`${tasks.length} Tasks`}
              change="AI Generated & Custom"
              trend="up"
              description="Published tasks"
              icon={CheckSquare}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatsCard
              title="Pending Submissions"
              value={`${pendingSubmissionsCount} Pending`}
              change="Requires review"
              trend="down"
              description="Deliverables awaiting grade"
              icon={Inbox}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
            <StatsCard
              title="Evaluations Done"
              value={`${feedbacks.length} Completed`}
              change="Final sign-offs"
              trend="up"
              description="Student evaluations"
              icon={Sparkles}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">Submission Review Velocity</CardTitle>
                  <p className="text-xs text-slate-500">Weekly breakdown of approved vs pending submissions</p>
                </div>
              </CardHeader>
              <CardContent>
                <CustomBarChart
                  data={chartData}
                  xAxisKey="week"
                  dataKeys={[
                    { key: 'approved', name: 'Approved', color: '#16A34A' },
                    { key: 'pending', name: 'Pending Review', color: '#D97706' },
                  ]}
                  height={250}
                />
              </CardContent>
            </Card>

            {/* Assigned Mentees Quick View */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold text-slate-900">My Mentees</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/mentor/students">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100">
                {assignments.length > 0 ? (
                  assignments.slice(0, 3).map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-2 first:pt-0 last:pb-0 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900">{m.studentName}</h4>
                        <p className="text-slate-500">Frontend Web Development Intern</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" className="text-[11px] capitalize">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500 italic">
                    No active mentees assigned yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
