'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit & System Reports</h1>
          <p className="text-xs text-slate-500">Generate compliance, security audit, and system health reports</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1.5" /> Export All Audit Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Company Registration Audit', desc: 'Detailed log of all company approval requests and admin actions' },
          { title: 'Certificate Issuance Log', desc: 'Immutable ledger of issued completion certificates' },
          { title: 'AI API Usage & Cost Report', desc: 'Breakdown of AI token usage across resume, task, and submission endpoints' },
          { title: 'User Access & Security Log', desc: 'Security audit trail of user logins, role changes, and auth events' },
        ].map((rep, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-rose-600" /> {rep.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs">
              <p className="text-slate-500">{rep.desc}</p>
              <Button size="sm" variant="secondary" className="w-full">Download CSV Report</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
