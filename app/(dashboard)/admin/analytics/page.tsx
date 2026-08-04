'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CustomBarChart from '@/components/dashboard/charts/BarChart';
import CustomLineChart from '@/components/dashboard/charts/LineChart';

export default function AdminAnalyticsPage() {
  const lineData = [
    { month: 'May', activeUsers: 200, applications: 150 },
    { month: 'Jun', activeUsers: 450, applications: 380 },
    { month: 'Jul', activeUsers: 700, applications: 620 },
    { month: 'Aug', activeUsers: 925, applications: 890 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Analytics</h1>
        <p className="text-xs text-slate-500">Platform activity trends, user throughput, and AI service usage stats</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Active Users vs Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomLineChart
              data={lineData}
              xAxisKey="month"
              dataKeys={[
                { key: 'activeUsers', name: 'Active Users', color: '#2563EB' },
                { key: 'applications', name: 'Applications Submitted', color: '#9333EA' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">AI Service Latency (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={[
                { service: 'Resume AI', ms: 1200 },
                { service: 'Matching AI', ms: 800 },
                { service: 'Mentor AI', ms: 900 },
                { service: 'Task Gen AI', ms: 1000 },
              ]}
              xAxisKey="service"
              dataKeys={[{ key: 'ms', name: 'Latency (ms)', color: '#16A34A' }]}
              height={260}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
