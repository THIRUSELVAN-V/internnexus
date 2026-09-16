'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import CustomPieChart from '@/components/dashboard/charts/PieChart';
import CustomLineChart from '@/components/dashboard/charts/LineChart';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart, Loader2 } from 'lucide-react';
import { getDocuments } from '@/lib/firebase/firestore';
import { downloadCSV } from '@/lib/utils/exportCSV';
import { Application, Certificate, MentorAssignment } from '@/lib/types';

export default function HRReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const exportApplicantPipelineReport = async () => {
    setDownloading(true);
    try {
      const apps = await getDocuments<Application>('applications');
      const rows = apps.map((a) => ({
        ApplicationID: a.id,
        StudentName: a.studentName,
        Email: a.studentEmail,
        InternshipTitle: a.internshipTitle,
        MatchScore: a.matchScore || 'N/A',
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

  const lineData = [
    { month: 'Jun', applicants: 45, hires: 8 },
    { month: 'Jul', applicants: 80, hires: 14 },
    { month: 'Aug', applicants: 125, hires: 20 },
  ];

  const domainData = [
    { name: 'Web Dev', value: 40, color: '#2563EB' },
    { name: 'Data Sci', value: 25, color: '#9333EA' },
    { name: 'UI/UX', value: 20, color: '#16A34A' },
    { name: 'DevOps', value: 15, color: '#D97706' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recruitment & Cohort Reports</h1>
          <p className="text-xs text-slate-500">Analytics on applicant pipelines, AI matching accuracy, and intern completion rates</p>
        </div>
        <Button onClick={exportApplicantPipelineReport} disabled={downloading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Download className="h-4 w-4 mr-1.5" />}
          Export Applicants CSV Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Application vs Hiring Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomLineChart
              data={lineData}
              xAxisKey="month"
              dataKeys={[
                { key: 'applicants', name: 'Total Applicants', color: '#9333EA' },
                { key: 'hires', name: 'Selected Interns', color: '#16A34A' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Domain Interest Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomPieChart data={domainData} height={260} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
