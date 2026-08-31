'use client';

import React from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, CheckSquare, Inbox, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';

export default function MentorDashboardPage() {
  const chartData = [
    { week: 'W1', approved: 4, pending: 0 },
    { week: 'W2', approved: 5, pending: 1 },
    { week: 'W3', approved: 3, pending: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Industrial Mentor Portal
          </span>
          <h1 style={{color:"white"}} className="text-2xl font-bold tracking-tight">Welcome, Mr. Vijay</h1>
          <p className="text-green-100 text-sm mt-1 max-w-xl">
            Review AI task suggestions, manage assigned student submissions, leave feedback, and grade final evaluations.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-green-700 hover:bg-green-50 border-none shrink-0">
          <Link href="/mentor/task-generator">
            <Sparkles className="h-4 w-4 mr-1" /> Open AI Task Generator
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Students"
          value="3 Interns"
          change="Max capacity 5"
          trend="neutral"
          description="Active mentees"
          icon={Users}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatsCard
          title="Tasks Published"
          value="12 Tasks"
          change="AI Assisted"
          trend="up"
          description="Across all weeks"
          icon={CheckSquare}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Pending Submissions"
          value="2 Pending"
          change="Requires review"
          trend="down"
          description="Awaiting feedback"
          icon={Inbox}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Evaluations Done"
          value="2 Completed"
          change="1 In Progress"
          trend="up"
          description="Cohort progress"
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
            <CardTitle className="text-base font-bold text-slate-900">My Students</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mentor/students">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {[
              { name: 'Thiru', role: 'Frontend Intern', progress: '12/15 Tasks', status: 'On Track' },
              { name: 'Priya Sharma', role: 'Full Stack Intern', progress: '14/16 Tasks', status: 'Ahead' },
              { name: 'Rahul Verma', role: 'UI/UX Intern', progress: '9/15 Tasks', status: 'Needs Support' },
            ].map((m, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-2 first:pt-0 last:pb-0 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{m.name}</h4>
                  <p className="text-slate-500">{m.role}</p>
                </div>
                <div className="text-right">
                  <Badge variant={m.status === 'On Track' ? 'success' : m.status === 'Ahead' ? 'purple' : 'warning'} className="text-[11px]">
                    {m.status}
                  </Badge>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{m.progress}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
