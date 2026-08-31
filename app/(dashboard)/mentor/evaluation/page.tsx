'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Award, CheckCircle2, Star } from 'lucide-react';

export default function MentorEvaluationPage() {
  const [completed, setCompleted] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Final Internship Evaluation</h1>
        <p className="text-xs text-slate-500">Grade overall student performance to approve certificate generation by HR</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Evaluation Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Select Student</label>
            <Select defaultValue="john">
              <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="john">Thiru (Frontend Web Development Intern)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Technical Skills Rating (1-5)</label>
              <Select defaultValue="5">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Teamwork & Communication (1-5)</label>
              <Select defaultValue="5">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={r.toString()}>{r}.0 Stars</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Final Summary Remarks</label>
            <Textarea defaultValue="John demonstrated exceptional technical mastery in React and TypeScript throughout the 12-week internship. All tasks were delivered on time with clean architecture and strong test coverage. Recommended for full-time offer." className="min-h-[100px]" />
          </div>

          {completed ? (
            <div className="p-4 rounded-xl bg-green-50 text-green-700 border border-green-200 text-center font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 inline mr-1" /> Final Evaluation Approved! HR has been notified to issue certificate.
            </div>
          ) : (
            <div className="flex justify-end pt-2">
              <Button onClick={() => setCompleted(true)} className="bg-green-600 hover:bg-green-700">
                <Award className="h-4 w-4 mr-1.5" /> Submit Final Evaluation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
