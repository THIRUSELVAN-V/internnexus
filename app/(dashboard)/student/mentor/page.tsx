'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GraduationCap, Mail, Briefcase, Calendar, MessageSquare, Star, Send } from 'lucide-react';

export default function StudentMentorPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Industrial Mentor</h1>
        <p className="text-xs text-slate-500">View details of your assigned mentor and communicate directly</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Mentor Card */}
        <Card className="md:col-span-1 text-center border-purple-100 bg-gradient-to-b from-white to-purple-50/20">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                <AvatarFallback className="text-lg font-bold bg-purple-100 text-purple-700">RK</AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mr. Vijay</h2>
              <p className="text-xs text-slate-500">Principal Software Architect</p>
              <Badge variant="purple" className="mt-2 text-xs">TechCorp India</Badge>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-600" /> 15+ years experience
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" /> Web & Cloud Architecture
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" /> Assigned: Aug 2026
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Communication & Recent Feedback */}
        <div className="md:col-span-2 space-y-6">
          {/* Recent Mentor Feedback */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">Recent Mentor Feedback</CardTitle>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1">5.0 / 5</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900 mb-1">Week 2 Submission Evaluation:</p>
                &quot;Excellent work on the responsive dashboard component setup. Clean prop types and good test coverage. Focus next week on async state error boundaries.&quot;
                <p className="text-[11px] text-slate-400 mt-2 font-mono">— Mr. Vijay · 3 days ago</p>
              </div>
            </CardContent>
          </Card>

          {/* Direct Message to Mentor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Message Your Mentor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Type your message or question regarding your current internship task..." className="min-h-[100px]" />
              <div className="flex justify-end">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
