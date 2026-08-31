'use client';

import React from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import CustomPieChart from '@/components/dashboard/charts/PieChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, UserCheck, Award, Sparkles, Plus, ArrowRight } from 'lucide-react';

export default function HRDashboardPage() {
  const barData = [
    { role: 'Frontend', applicants: 42, shortlisted: 12 },
    { role: 'Full Stack', applicants: 35, shortlisted: 8 },
    { role: 'UI/UX', applicants: 28, shortlisted: 6 },
    { role: 'Data Sci', applicants: 20, shortlisted: 4 },
  ];

  const pieData = [
    { name: 'Shortlisted', value: 30, color: '#2563EB' },
    { name: 'Under Review', value: 45, color: '#9333EA' },
    { name: 'Active Interns', value: 20, color: '#16A34A' },
    { name: 'Completed', value: 30, color: '#D97706' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> HR Command Center
          </span>
          <h1 className="text-2xl font-bold tracking-tight">TechCorp India HR Dashboard</h1>
          <p className="text-purple-100 text-sm mt-1 max-w-xl">
            Review AI candidate rankings, assign mentors, monitor active interns, and generate completion certificates.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-purple-700 hover:bg-purple-50 border-none shrink-0">
          <Link href="/hr/internships">
            <Plus className="h-4 w-4 mr-1" /> Post New Internship
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Postings"
          value="6 Roles"
          change="125 Total Applicants"
          trend="up"
          description="Open listings"
          icon={Briefcase}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatsCard
          title="Total Applicants"
          value="125"
          change="+18 this week"
          trend="up"
          description="Across all roles"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Active Interns"
          value="20 Interns"
          change="8 Assigned Mentors"
          trend="neutral"
          description="In progress"
          icon={UserCheck}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatsCard
          title="Certificates Issued"
          value="30 Issued"
          change="100% Verified"
          trend="up"
          description="Completed cohorts"
          icon={Award}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Applicants per Internship Role</CardTitle>
              <p className="text-xs text-slate-500">Comparison of total applicants vs shortlisted candidates</p>
            </div>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={barData}
              xAxisKey="role"
              dataKeys={[
                { key: 'applicants', name: 'Total Applicants', color: '#9333EA' },
                { key: 'shortlisted', name: 'Shortlisted', color: '#2563EB' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Cohort Distribution</CardTitle>
            <p className="text-xs text-slate-500">Status breakdown of current cohort</p>
          </CardHeader>
          <CardContent>
            <CustomPieChart data={pieData} height={260} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Applicants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Recent High AI Match Applicants</CardTitle>
            <p className="text-xs text-slate-500">Candidates with &gt;80% AI match score</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/hr/applicants">View All Applicants <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {[
            { name: 'Thiru', role: 'Frontend Web Development Intern', score: 94, college: 'IIT Madras', status: 'ai_reviewed' },
            { name: 'Priya Sharma', role: 'Full Stack Engineering Intern', score: 88, college: 'BITS Pilani', status: 'hr_shortlisted' },
            { name: 'Rahul Verma', role: 'UI/UX Design & Frontend Intern', score: 84, college: 'NIT Trichy', status: 'ai_reviewed' },
          ].map((cand, i) => (
            <div key={i} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{cand.name}</h4>
                <p className="text-xs text-slate-500">{cand.role} · {cand.college}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="purple" className="text-xs font-semibold">
                  <Sparkles className="h-3 w-3 mr-1" /> {cand.score}% Match
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/hr/applicants/${i + 1}`}>Review Candidate</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
