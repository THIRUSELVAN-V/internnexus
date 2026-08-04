'use client';

import React from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import CustomPieChart from '@/components/dashboard/charts/PieChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, ShieldCheck, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const barData = [
    { month: 'May', companies: 12, users: 150 },
    { month: 'Jun', companies: 25, users: 320 },
    { month: 'Jul', companies: 40, users: 650 },
    { month: 'Aug', companies: 55, users: 920 },
  ];

  const pieData = [
    { name: 'Students', value: 700, color: '#2563EB' },
    { name: 'HR Managers', value: 80, color: '#9333EA' },
    { name: 'Mentors', value: 120, color: '#16A34A' },
    { name: 'Admins', value: 5, color: '#DC2626' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-rose-900 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> System Administrator
          </span>
          <h1 className="text-2xl font-bold tracking-tight">InternNexus Admin Control Panel</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Approve company registrations, manage global platform users, monitor analytics, and maintain system security.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100 border-none shrink-0">
          <Link href="/admin/approve-companies">
            <ShieldCheck className="h-4 w-4 mr-1" /> Approve Companies (2 Pending)
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Companies"
          value="55 Companies"
          change="2 Pending Approval"
          trend="up"
          description="Registered enterprise accounts"
          icon={Building2}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <StatsCard
          title="Total Platform Users"
          value="925 Users"
          change="+140 this month"
          trend="up"
          description="Students, HR & Mentors"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Active Internships"
          value="85 Active"
          change="Across 40 companies"
          trend="neutral"
          description="System-wide roles"
          icon={BarChart3}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatsCard
          title="Platform Uptime"
          value="99.98%"
          change="All services healthy"
          trend="up"
          description="Cloud Firestore & Auth"
          icon={ShieldCheck}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Platform Growth Trajectory</CardTitle>
              <p className="text-xs text-slate-500">Monthly breakdown of onboarded companies and total users</p>
            </div>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={barData}
              xAxisKey="month"
              dataKeys={[
                { key: 'users', name: 'Total Users', color: '#2563EB' },
                { key: 'companies', name: 'Companies', color: '#DC2626' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">Role Composition</CardTitle>
            <p className="text-xs text-slate-500">Distribution of platform user roles</p>
          </CardHeader>
          <CardContent>
            <CustomPieChart data={pieData} height={260} />
          </CardContent>
        </Card>
      </div>

      {/* Pending Company Registrations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Pending Company Registrations</CardTitle>
            <p className="text-xs text-slate-500">Review and verify new company profiles before approving platform access</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/approve-companies">View All Approvals <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {[
            { name: 'InnovateTech Labs', industry: 'AI & Cloud Software', size: 'Medium (150 employees)', hr: 'Suresh Raina' },
            { name: 'NextGen CyberSec', industry: 'Cybersecurity Services', size: 'Startup (30 employees)', hr: 'Deepika Padukone' },
          ].map((c, i) => (
            <div key={i} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                <p className="text-xs text-slate-500">{c.industry} · {c.size} · HR: {c.hr}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/admin/approve-companies">Review & Approve</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
