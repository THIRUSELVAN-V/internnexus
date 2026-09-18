'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import CustomPieChart from '@/components/dashboard/charts/PieChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, UserCheck, Award, Sparkles, Plus, ArrowRight, Loader2, Inbox } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { Internship, Application, MentorAssignment, Certificate } from '@/lib/types';
import { filterHRInternships, filterHRApplications, filterHRAssignments, filterHRCertificates } from '@/lib/utils/hr';

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

        const myInternships = filterHRInternships(iDocs, profile);
        const myApplications = filterHRApplications(aDocs, myInternships, profile);
        const myAssignments = filterHRAssignments(mDocs, myInternships, profile);
        const myCertificates = filterHRCertificates(certDocs, myInternships, profile);

        setInternships(myInternships);
        setApplications(myApplications);
        setAssignments(myAssignments);
        setCertificates(myCertificates);
      } catch (err) {
        console.error('Error loading HR dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile?.uid) {
      fetchHRDashboardData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  // Specific required HR statistics calculated strictly from real Firestore data
  const totalInternships = internships.length;
  const applicationsCount = applications.length;
  const shortlistedCount = applications.filter((a) => a.status === 'hr_shortlisted').length;
  const selectedCount = applications.filter(
    (a) => a.status === 'accepted' || a.status === 'mentor_assigned'
  ).length;

  const highMatchApps = applications.filter((a) => (a.matchScore || 0) >= 80);

  // Dynamic bar data from actual applications
  const roleMap: Record<string, { applicants: number; shortlisted: number }> = {};
  applications.forEach((app) => {
    const role = app.internshipTitle || 'General';
    if (!roleMap[role]) {
      roleMap[role] = { applicants: 0, shortlisted: 0 };
    }
    roleMap[role].applicants += 1;
    if (app.status === 'hr_shortlisted' || app.status === 'accepted' || app.status === 'mentor_assigned') {
      roleMap[role].shortlisted += 1;
    }
  });

  const barData = Object.entries(roleMap).map(([role, counts]) => ({
    role: role.length > 15 ? `${role.slice(0, 15)}...` : role,
    applicants: counts.applicants,
    shortlisted: counts.shortlisted,
  }));

  // Dynamic pie data from actual status counts
  const underReviewCount = applications.filter((a) => a.status === 'ai_reviewed' || a.status === 'pending').length;
  const activeInternsCount = assignments.length;
  const completedCount = certificates.length;

  const pieData = [
    { name: 'Shortlisted', value: shortlistedCount, color: '#2563EB' },
    { name: 'Under Review', value: underReviewCount, color: '#9333EA' },
    { name: 'Active Interns', value: activeInternsCount, color: '#16A34A' },
    { name: 'Completed', value: completedCount, color: '#D97706' },
  ].filter((slice) => slice.value > 0);

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
          {/* Empty state notice if new HR */}
          {totalInternships === 0 && (
            <Card className="border-dashed border-purple-200 bg-purple-50/40">
              <CardContent className="p-6 text-center space-y-2">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">No internships created yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Get started by publishing your company&apos;s first internship posting to begin receiving candidate applications.
                </p>
                <div className="pt-2">
                  <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Link href="/hr/internships">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Create Your First Internship
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4 Required KPI Cards strictly from actual Firestore data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Internships"
              value={String(totalInternships)}
              change={totalInternships === 0 ? 'No postings yet' : `${totalInternships} Open Roles`}
              trend={totalInternships > 0 ? 'up' : 'neutral'}
              description="Internships published"
              icon={Briefcase}
              iconColor="text-purple-600"
              iconBg="bg-purple-50"
            />
            <StatsCard
              title="Applications"
              value={String(applicationsCount)}
              change={applicationsCount === 0 ? 'No applications yet' : `${highMatchApps.length} High Match`}
              trend={applicationsCount > 0 ? 'up' : 'neutral'}
              description="Candidates applied"
              icon={Users}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <StatsCard
              title="Shortlisted"
              value={String(shortlistedCount)}
              change={shortlistedCount === 0 ? 'Awaiting shortlisting' : 'Passed initial review'}
              trend={shortlistedCount > 0 ? 'up' : 'neutral'}
              description="Candidates shortlisted"
              icon={UserCheck}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
            />
            <StatsCard
              title="Selected"
              value={String(selectedCount)}
              change={selectedCount === 0 ? 'None selected yet' : `${assignments.length} Mentors Assigned`}
              trend={selectedCount > 0 ? 'up' : 'neutral'}
              description="Accepted & Assigned"
              icon={Award}
              iconColor="text-green-600"
              iconBg="bg-green-50"
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
                {barData.length > 0 ? (
                  <CustomBarChart
                    data={barData}
                    xAxisKey="role"
                    dataKeys={[
                      { key: 'applicants', name: 'Total Applicants', color: '#9333EA' },
                      { key: 'shortlisted', name: 'Shortlisted', color: '#2563EB' },
                    ]}
                    height={260}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[260px] text-center border border-dashed border-slate-200 rounded-xl p-6">
                    <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No application data available yet</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Role applicant metrics will populate automatically when candidates apply for your postings.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-slate-900">Cohort Distribution</CardTitle>
                <p className="text-xs text-slate-500">Status breakdown of candidate pipeline</p>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <CustomPieChart data={pieData} height={260} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[260px] text-center border border-dashed border-slate-200 rounded-xl p-6">
                    <Users className="h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No cohort data available yet</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Pipeline distribution across Shortlisted, Review, and Active Interns will display here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent High Match Applicants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Candidate Pipeline</CardTitle>
                <p className="text-xs text-slate-500">Recent applicants for your posted internships</p>
              </div>
              {applications.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/hr/applicants">
                    View All Applicants <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-xs font-medium text-slate-500">No applications received yet.</p>
                  <p className="text-[11px] text-slate-400">
                    When students apply to your internships, their profiles and AI match scores will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
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
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
