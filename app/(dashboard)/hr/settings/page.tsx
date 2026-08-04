'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function HRSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">HR Settings</h1>
        <p className="text-xs text-slate-500">Configure AI auto-shortlisting thresholds and notification alerts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">AI Automation Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="thresh">AI Match Score Highlight Threshold (%)</Label>
            <Input id="thresh" type="number" defaultValue="80" className="mt-1 max-w-xs" />
            <p className="text-[11px] text-slate-500 mt-1">Applicants scoring above this threshold are automatically flagged as Top Match.</p>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">Auto-Notify Mentors</p>
              <p className="text-xs text-slate-500">Automatically send email notification when mentor assignment is confirmed</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex justify-end pt-2">
            <Button className="bg-purple-600 hover:bg-purple-700">Save Configuration</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
