'use client';

import React, { useState } from 'react';
import MentorRecommendationCard from '@/components/ai/MentorRecommendationCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, UserCheck } from 'lucide-react';
import type { MentorRecommendation } from '@/lib/types';

const mockRecs: MentorRecommendation[] = [
  {
    mentorId: 'men-1',
    mentorName: 'Dr. Rajesh Kumar',
    designation: 'Principal Software Architect',
    expertise: ['Web Development', 'React', 'Cloud Architecture'],
    matchScore: 95,
    currentWorkload: 2,
    maxMentees: 5,
    reasoning: '95% domain match. Excellent mentor record with 4 previous successful cohorts. Capacity available (2/5 mentees).',
    rank: 1,
  },
  {
    mentorId: 'men-2',
    mentorName: 'Ananya Deshmukh',
    designation: 'Senior Frontend Lead',
    expertise: ['UI/UX Design', 'React', 'Frontend Engineering'],
    matchScore: 88,
    currentWorkload: 1,
    maxMentees: 4,
    reasoning: '88% match. Specialized in frontend engineering and UI performance optimization.',
    rank: 2,
  },
];

export default function HRMentorRecommendationPage() {
  const [selectedMentor, setSelectedMentor] = useState<string>('men-1');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Mentor Recommendation</h1>
        <p className="text-xs text-slate-500">AI proposes optimal mentor assignments based on expertise, workload capacity, and intern skills</p>
      </div>

      <div className="space-y-6">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-600 uppercase">Selected Intern</span>
              <h3 className="text-base font-bold text-slate-900">John Doe</h3>
              <p className="text-xs text-slate-500">Applied for Frontend Web Development Intern</p>
            </div>
            <Badge variant="purple" className="text-xs">94% AI Match Score</Badge>
          </CardContent>
        </Card>

        {confirmed ? (
          <Card className="border-green-200 bg-green-50/40 text-center py-8">
            <CardContent className="space-y-3">
              <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Mentor Assignment Confirmed!</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Dr. Rajesh Kumar has been successfully assigned to John Doe. Notification sent to both parties.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <MentorRecommendationCard
              recommendations={mockRecs}
              selectedMentorId={selectedMentor}
              onSelectMentor={(id) => setSelectedMentor(id)}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={() => setConfirmed(true)} className="bg-purple-600 hover:bg-purple-700">
                <UserCheck className="h-4 w-4 mr-1.5" /> Confirm Mentor Assignment
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
