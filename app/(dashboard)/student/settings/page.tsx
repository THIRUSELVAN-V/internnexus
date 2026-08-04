'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function StudentSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Account Settings</h1>
        <p className="text-xs text-slate-500">Manage notification preferences, password updates, and account security</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: 'Task Assignments', desc: 'Receive notification when mentor assigns a new task' },
            { title: 'Submission Feedback', desc: 'Get notified when mentor reviews your submission' },
            { title: 'Application Updates', desc: 'Receive alerts on HR shortlist and match status changes' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-none">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current-pass">Current Password</Label>
            <Input id="current-pass" type="password" placeholder="••••••••" className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-pass">New Password</Label>
              <Input id="new-pass" type="password" placeholder="Min 8 characters" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirm-pass">Confirm New Password</Label>
              <Input id="confirm-pass" type="password" placeholder="Re-enter new password" className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline">Update Password</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
