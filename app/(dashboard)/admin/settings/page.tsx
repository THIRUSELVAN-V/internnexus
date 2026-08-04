'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System Settings</h1>
        <p className="text-xs text-slate-500">Configure global platform security, company auto-verification, and API keys</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Global Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">Require Admin Approval for Companies</p>
              <p className="text-xs text-slate-500">New company registrations must be manually verified before posting jobs</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">AI Guardrail Enforcement</p>
              <p className="text-xs text-slate-500">Ensure AI never automatically approves candidates without human review</p>
            </div>
            <Switch defaultChecked disabled />
          </div>

          <div className="pt-2">
            <Label htmlFor="max-mentees">Default Max Mentees Per Mentor</Label>
            <Input id="max-mentees" type="number" defaultValue="5" className="mt-1 max-w-xs" />
          </div>

          <div className="flex justify-end pt-2">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">Save System Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
