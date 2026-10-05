'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CustomPieChart from '@/components/dashboard/charts/PieChart';
import CustomLineChart from '@/components/dashboard/charts/LineChart';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart, Loader2, Inbox, PieChart as PieIcon } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { downloadCSV } from '@/lib/utils/exportCSV';
import { Application, Internship } from '@/lib/types';
import { filterHRInternships, filterHRApplications } from '@/lib/utils/hr';

const DOMAIN_COLORS = ['#2563EB', '#9333EA', '#16A34A', '#D97706', '#E11D48', '#0D9488'];

export default function HRReportsPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    async function fetchReportData() {
      if (!profile?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [appDocs, internDocs] = await Promise.all([
          getDocuments<Application>('applications'),
          getDocuments<Internship>('internships'),
        ]);

        const myInternships = filterHRInternships(internDocs, profile);
        const myApps = filterHRApplications(appDocs, myInternships, profile);

        setInternships(myInternships);
        setApplications(myApps);
      } catch (err) {
        console.error('Error fetching HR report data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [profile]);

  const exportApplicantPipelineReport = async () => {
    if (applications.length === 0) return;
    setDownloading(true);
    try {
      const rows = applications.map((a) => ({
        ApplicationID: a.id,
        StudentName: a.studentName,
        Email: a.studentEmail,
        InternshipTitle: a.internshipTitle,
        MatchScore: a.matchScore ?? 'N/A',
        Status: a.status,
        AppliedAt: a.appliedAt,
      }));
      downloadCSV('HR_Applicant_Pipeline_Report', rows);
    } catch (err) {
      console.error('Error exporting applicant report:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Group applications by month
  const monthMap: Record<string, { applicants: number; hires: number }> = {};
  applications.forEach((app) => {
    const month = app.appliedAt
      ? new Date(app.appliedAt).toLocaleString('default', { month: 'short' })
      : 'Recent';
    if (!monthMap[month]) {
      monthMap[month] = { applicants: 0, hires: 0 };
    }
    monthMap[month].applicants += 1;
    if (app.status === 'accepted' || app.status === 'mentor_assigned') {
      monthMap[month].hires += 1;
    }
  });

  const lineData = Object.entries(monthMap).map(([month, counts]) => ({
    month,
    applicants: counts.applicants,
    hires: counts.hires,
  }));

  // Group by domain from real internships / applications
  const domainMap: Record<string, number> = {};
  internships.forEach((item) => {
    const domain = item.domain || 'Other';
    domainMap[domain] = (domainMap[domain] || 0) + 1;
  });

  const domainData = Object.entries(domainMap).map(([name, value], index) => ({
    name: name.length > 14 ? `${name.slice(0, 14)}...` : name,
    value,
    color: DOMAIN_COLORS[index % DOMAIN_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recruitment &amp; Cohort Reports</h1>
          <p className="text-xs text-slate-500">Analytics on applicant pipelines, AI matching accuracy, and intern completion rates</p>
        </div>
        <Button
          onClick={exportApplicantPipelineReport}
          disabled={downloading || applications.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
          Export Applicants CSV Report
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Compiling recruitment analytics...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Application vs Hiring Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              {lineData.length > 0 ? (
                <CustomLineChart
                  data={lineData}
                  xAxisKey="month"
                  dataKeys={[
                    { key: 'applicants', name: 'Total Applicants', color: '#9333EA' },
                    { key: 'hires', name: 'Selected Interns', color: '#16A34A' },
                  ]}
                  height={260}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[260px] text-center border border-dashed border-slate-200 rounded-xl p-6">
                  <Inbox className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No recruitment velocity data available yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Monthly applicant trends and hiring progress will display here as candidates apply.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Domain Offerings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {domainData.length > 0 ? (
                <CustomPieChart data={domainData} height={260} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[260px] text-center border border-dashed border-slate-200 rounded-xl p-6">
                  <PieIcon className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No domain breakdown available yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Internship domain categories will display here once you publish internship listings.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
