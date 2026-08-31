'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Briefcase, CheckSquare, Brain, Award, ArrowRight, Clock,
  Sparkles, FileText, UserCheck, Calendar
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudentDashboardPage() {
  const chartData = [
    { week: 'W1', completed: 2, total: 3 },
    { week: 'W2', completed: 3, total: 3 },
    { week: 'W3', completed: 4, total: 4 },
    { week: 'W4', completed: 3, total: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Welcome back, Student!
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Your Internship Portal</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Track applications, complete mentor-assigned tasks, view AI resume matches, and download certificates.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50 border-none shrink-0">
          <Link href="/student/internships">
            Browse Internships <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Applications"
          value="4"
          change="+1 this week"
          trend="up"
          description="Active applications"
          icon={Briefcase}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Completed Tasks"
          value="12 / 15"
          change="80% Done"
          trend="up"
          description="Assigned tasks"
          icon={CheckSquare}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatsCard
          title="AI Match Score"
          value="94%"
          change="High Match"
          trend="up"
          description="Top matching role"
          icon={Brain}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatsCard
          title="Certificates"
          value="1 Ready"
          change="Ready to download"
          trend="neutral"
          description="Issued certificate"
          icon={Award}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Progress & Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Task Completion Velocity</CardTitle>
                <p className="text-xs text-slate-500">Weekly breakdown of completed vs assigned tasks</p>
              </div>
              <Badge variant="outline" className="text-xs">Month 1</Badge>
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
              <CardTitle className="text-base font-bold text-slate-900">My Recent Applications</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/applications">View All</Link>
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              {[
                { title: 'Frontend Developer Intern', company: 'TechCorp India', status: 'mentor_assigned', date: '2 days ago', score: 94 },
                { title: 'Full Stack Engineering Intern', company: 'Innovate Labs', status: 'hr_shortlisted', date: '5 days ago', score: 88 },
                { title: 'UI/UX Design Intern', company: 'CreativeStudio', status: 'ai_reviewed', date: '1 week ago', score: 76 },
              ].map((app, i) => (
                <div key={i} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">
                      {app.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{app.title}</h4>
                      <p className="text-xs text-slate-500">{app.company} · Applied {app.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="purple" className="text-xs font-semibold">
                      {app.score}% Match
                    </Badge>
                    <Badge variant="default" className="text-xs capitalize">
                      {app.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Mentor & Next Steps */}
        <div className="space-y-6">
          {/* Assigned Mentor Card */}
          <Card className="border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Assigned Industrial Mentor</span>
              <CardTitle className="text-base font-bold text-slate-900 mt-1">Mr. Vijay</CardTitle>
              <p className="text-xs text-slate-500">Principal Software Architect · TechCorp</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Mentorship Domain:</span>
                  <span className="font-semibold text-slate-900">Web Development</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Weekly Check-in:</span>
                  <span className="font-semibold text-slate-900">Fridays, 4:00 PM</span>
                </div>
              </div>
              <Button asChild className="w-full" variant="outline" size="sm">
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
                <Badge variant="warning" className="text-xs">Due in 2 days</Badge>
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                Week 3: API Integration & State Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect dashboard UI components to backend endpoints and manage global async state cleanly.
              </p>
              <Button style={{color:"white"}} asChild className="w-full" size="sm">
                <Link href="/student/tasks">Submit Work <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
