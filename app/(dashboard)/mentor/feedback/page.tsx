'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Star, Send, CheckCircle2 } from 'lucide-react';

export default function MentorFeedbackPage() {
  const [rating, setRating] = useState<number>(5);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Student Feedback Form</h1>
        <p className="text-xs text-slate-500">Provide weekly or milestone rating and constructive feedback to your mentee</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">Feedback Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Select Student</label>
            <Select defaultValue="john">
              <SelectTrigger><SelectValue placeholder="Choose student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="john">Thiru (Frontend Intern)</SelectItem>
                <SelectItem value="priya">Priya Sharma (Full Stack Intern)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Performance Rating (1-5)</label>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`h-6 w-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-2">{rating}.0 / 5.0</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Detailed Mentor Comments</label>
            <Textarea placeholder="Write specific observations on technical performance, problem solving, and teamwork..." className="min-h-[100px]" />
          </div>

          {submitted ? (
            <div className="p-3 rounded-xl bg-green-50 text-green-700 border border-green-200 text-center font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 inline mr-1" /> Feedback Saved & Shared with Student!
            </div>
          ) : (
            <div className="flex justify-end pt-2">
              <Button onClick={() => setSubmitted(true)} className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-1.5" /> Submit Feedback
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
