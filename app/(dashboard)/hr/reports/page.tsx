'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import CustomPieChart from '@/components/dashboard/charts/PieChart';
import CustomLineChart from '@/components/dashboard/charts/LineChart';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart } from 'lucide-react';

export default function HRReportsPage() {
  const lineData = [
    { month: 'May', applicants: 45, hires: 8 },
    { month: 'Jun', applicants: 80, hires: 14 },
    { month: 'Jul', applicants: 125, hires: 20 },
    { month: 'Aug', applicants: 150, hires: 25 },
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
          <h1 className="text-xl font-bold text-slate-900">Recruitment & Performance Reports</h1>
          <p className="text-xs text-slate-500">Analytics on applicant pipelines, AI matching accuracy, and intern completion rates</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1.5" /> Export PDF Report
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
