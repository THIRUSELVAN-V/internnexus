'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase, CheckSquare, Brain, Award, ArrowRight, Clock,
  Sparkles, FileText, UserCheck, Calendar, Loader2
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { Application, Task, MentorAssignment, Certificate } from '@/lib/types';

export default function StudentDashboardPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mentorAssignment, setMentorAssignment] = useState<MentorAssignment | null>(null);
  const [hasCert, setHasCert] = useState(false);

  useEffect(() => {
    async function fetchStudentDashboard() {
      setLoading(true);
      try {
        const [appDocs, taskDocs, mentorDocs, certDocs] = await Promise.all([
          getDocuments<Application>('applications'),
          getDocuments<Task>('tasks'),
          getDocuments<MentorAssignment>('mentorAssignments'),
          getDocuments<Certificate>('certificates'),
        ]);

        const myApps = profile?.uid ? appDocs.filter((a) => a.studentId === profile.uid) : appDocs;
        const myTasks = profile?.uid ? taskDocs.filter((t) => t.studentId === profile.uid) : taskDocs;
        const myMentor = mentorDocs.find((m) => m.studentId === profile?.uid) || mentorDocs[0] || null;
        const myCert = certDocs.some((c) => c.studentId === profile?.uid);

        setApplications(myApps);
        setTasks(myTasks);
        setMentorAssignment(myMentor);
        setHasCert(myCert);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentDashboard();
  }, [profile]);

  const completedTasks = tasks.filter((t) => t.status === 'approved').length;
  const totalTasks = tasks.length || 4;
  const topMatch = applications.length > 0 ? Math.max(...applications.map((a) => a.matchScore || 0)) : 94;

  const chartData = [
    { week: 'W1', completed: Math.min(completedTasks, 2), total: 2 },
    { week: 'W2', completed: Math.min(completedTasks, 3), total: 3 },
    { week: 'W3', completed: Math.min(completedTasks, 4), total: 4 },
    { week: 'W4', completed: completedTasks, total: totalTasks },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back, {profile?.displayName || 'Student'}!
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Student Internship Hub</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Track applications, complete mentor-assigned deliverables, view AI match scores, and download certificates.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50 border-none shrink-0 font-semibold text-xs sm:text-sm">
          <Link href="/student/internships">
            Browse Internships <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading student dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Applications"
              value={`${applications.length}`}
              change={`${applications.filter((a) => a.status === 'mentor_assigned' || a.status === 'hr_shortlisted').length} Active`}
              trend="up"
              description="Submitted applications"
              icon={Briefcase}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatsCard
              title="Completed Tasks"
              value={`${completedTasks} / ${totalTasks}`}
              change={`${Math.round((completedTasks / totalTasks) * 100)}% Done`}
              trend="up"
              description="Assigned task progress"
              icon={CheckSquare}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatsCard
              title="Top AI Match Score"
              value={`${topMatch}%`}
              change="Strong Candidate Match"
              trend="up"
              description="Skill compatibility index"
              icon={Brain}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <StatsCard
              title="Certificates"
              value={hasCert ? '1 Ready' : 'Pending Tasks'}
              change={hasCert ? 'Ready to download' : 'Complete 100% tasks'}
              trend={hasCert ? 'up' : 'neutral'}
              description="Verified completion certificate"
              icon={Award}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Progress & Recent Applications */}
            <div className="lg:col-span-2 space-y-6">
              {/* Chart */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Task Completion Velocity</CardTitle>
                    <p className="text-xs text-slate-500">Weekly breakdown of completed vs assigned tasks</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">Active Cohort</Badge>
                </CardHeader>
                <CardContent>
                  <CustomBarChart
                    data={chartData}
                    xAxisKey="week"
                    dataKeys={[
                      { key: 'completed', name: 'Completed', color: '#2563EB' },
                      { key: 'total', name: 'Total Assigned', color: '#E2E8F0' },
                    ]}
                    height={260}
                  />
                </CardContent>
              </Card>

              {/* Active Applications */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-bold text-slate-900">My Applications</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/student/applications">View All Applications</Link>
                  </Button>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100">
                  {applications.length > 0 ? (
                    applications.slice(0, 3).map((app) => (
                      <div key={app.id} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs border border-blue-100">
                            {app.companyName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{app.internshipTitle}</h4>
                            <p className="text-xs text-slate-500">{app.companyName} · Applied {app.appliedAt?.slice(0, 10)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="purple" className="text-xs font-semibold">
                            {app.matchScore || 85}% Match
                          </Badge>
                          <Badge variant="default" className="text-xs capitalize font-semibold">
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500 italic">
                      No active applications found. Click Browse Internships above to apply!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Mentor & Next Steps */}
            <div className="space-y-6">
              {/* Assigned Mentor Card */}
              <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 shadow-sm">
                <CardHeader className="pb-2">
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Assigned Industrial Mentor</span>
                  <CardTitle className="text-base font-bold text-slate-900 mt-1">
                    {mentorAssignment?.mentorName || 'Mr. Vijay'}
                  </CardTitle>
                  <p className="text-xs text-slate-500">Corporate Lead Architect · TechCorp</p>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Mentorship Domain:</span>
                      <span className="font-semibold text-slate-900">Software Engineering</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Weekly Check-in:</span>
                      <span className="font-semibold text-slate-900">Fridays, 4:00 PM</span>
                    </div>
                  </div>
                  <Button asChild className="w-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-semibold" size="sm">
                    <Link href="/student/mentor">Contact Mentor</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Next Task Due */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Next Task Due
                    </span>
                    <Badge variant="warning" className="text-xs font-semibold">In Progress</Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                    Week 3: API Integration & State Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Connect dashboard UI components to backend REST endpoints and handle async state gracefully.
                  </p>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold" size="sm">
                    <Link href="/student/tasks">Submit Deliverables <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
