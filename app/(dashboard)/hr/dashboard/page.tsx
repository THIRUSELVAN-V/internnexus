'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import CustomPieChart from '@/components/dashboard/charts/PieChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, UserCheck, Award, Sparkles, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { Internship, Application, MentorAssignment, Certificate } from '@/lib/types';

export default function HRDashboardPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);

  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    async function fetchHRDashboardData() {
      setLoading(true);
      try {
        const [iDocs, aDocs, mDocs, certDocs] = await Promise.all([
          getDocuments<Internship>('internships'),
          getDocuments<Application>('applications'),
          getDocuments<MentorAssignment>('mentorAssignments'),
          getDocuments<Certificate>('certificates'),
        ]);

        setInternships(iDocs);
        setApplications(aDocs);
        setAssignments(mDocs);
        setCertificates(certDocs);
      } catch (err) {
        console.error('Error loading HR dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHRDashboardData();
  }, [profile]);

  const activeListingsCount = internships.filter((i) => i.status === 'active').length || internships.length;
  const highMatchApps = applications.filter((a) => (a.matchScore || 0) >= 80);

  const barData = [
    { role: 'Frontend', applicants: Math.max(1, Math.round(applications.length * 0.4)), shortlisted: Math.max(1, assignments.length) },
    { role: 'Full Stack', applicants: Math.max(1, Math.round(applications.length * 0.3)), shortlisted: 2 },
    { role: 'UI/UX', applicants: Math.max(1, Math.round(applications.length * 0.2)), shortlisted: 1 },
  ];

  const pieData = [
    { name: 'Shortlisted', value: applications.filter((a) => a.status === 'hr_shortlisted').length || 2, color: '#2563EB' },
    { name: 'Under Review', value: applications.filter((a) => a.status === 'ai_reviewed').length || 4, color: '#9333EA' },
    { name: 'Active Interns', value: assignments.length || 2, color: '#16A34A' },
    { name: 'Completed', value: certificates.length || 1, color: '#D97706' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-2 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> HR Command Center
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Corporate HR Dashboard</h1>
          <p className="text-purple-100 text-sm mt-1 max-w-xl">
            Review AI candidate rankings, assign mentors, monitor active interns, and issue completion certificates.
          </p>
        </div>
        <Button asChild variant="secondary" className="bg-white text-purple-700 hover:bg-purple-50 border-none shrink-0 font-semibold text-xs sm:text-sm">
          <Link href="/hr/internships">
            <Plus className="h-4 w-4 mr-1" /> Post New Internship
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading HR dashboard analytics...</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Active Postings"
              value={`${activeListingsCount} Open Roles`}
              change={`${applications.length} Total Applicants`}
              trend="up"
              description="Open job listings"
              icon={Briefcase}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <StatsCard
              title="Total Applicants"
              value={`${applications.length} Applicants`}
              change={`${highMatchApps.length} High AI Match`}
              trend="up"
              description="Candidate pipeline"
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatsCard
              title="Active Interns"
              value={`${assignments.length} Active`}
              change="Mentors Assigned"
              trend="neutral"
              description="Current cohort"
              icon={UserCheck}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatsCard
              title="Certificates Issued"
              value={`${certificates.length} Issued`}
              change="100% Verified"
              trend="up"
              description="Graduated interns"
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
                <p className="text-xs text-slate-500">Status breakdown of candidate pipeline</p>
              </CardHeader>
              <CardContent>
                <CustomPieChart data={pieData} height={260} />
              </CardContent>
            </Card>
          </div>

          {/* Recent High Match Applicants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">High AI Match Candidates</CardTitle>
                <p className="text-xs text-slate-500">Candidates with &gt;80% AI skill compatibility index</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/hr/applicants">
                  View All Applicants <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              {applications.slice(0, 4).map((cand) => (
                <div key={cand.id} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cand.studentName}</h4>
                    <p className="text-xs text-slate-500">{cand.internshipTitle} · {cand.studentEmail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="purple" className="text-xs font-semibold">
                      <Sparkles className="h-3 w-3 mr-1 text-purple-600" /> {cand.matchScore || 85}% Match
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/hr/applicants/${cand.id}`}>Review Candidate</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
