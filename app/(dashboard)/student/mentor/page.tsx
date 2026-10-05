'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, Mail, Building2, Calendar, MessageSquare, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { MentorAssignment, UserProfile, MentorProfile } from '@/lib/types';
import { getInitials } from '@/lib/utils/formatters';

export default function StudentMentorPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<MentorAssignment | null>(null);
  const [mentorUser, setMentorUser] = useState<MentorProfile | null>(null);

  useEffect(() => {
    async function fetchMentorData() {
      setLoading(true);
      try {
        const [assignments, users] = await Promise.all([
          getDocuments<MentorAssignment>('mentorAssignments'),
          getDocuments<UserProfile>('users'),
        ]);

        const myAssignment = profile?.uid
          ? assignments.find((a) => a.studentId === profile.uid) || null
          : null;
        setAssignment(myAssignment);

        if (myAssignment) {
          const mentorDoc = users.find((u) => u.uid === myAssignment.mentorId) as MentorProfile;
          if (mentorDoc) {
            setMentorUser(mentorDoc);
          }
        }
      } catch (err) {
        console.error('Error fetching mentor data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMentorData();
  }, [profile]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Industrial Mentor</h1>
        <p className="text-xs text-slate-500">Your assigned corporate mentor for technical guidance, weekly code reviews, and evaluation</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading mentor details...</span>
        </div>
      ) : assignment ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mentor Profile Summary Card */}
          <Card className="md:col-span-1 border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20 text-center">
            <CardContent className="pt-6 space-y-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md mx-auto">
                <AvatarImage src={mentorUser?.photoURL} />
                <AvatarFallback className="text-lg font-bold text-indigo-700 bg-indigo-100">
                  {getInitials(assignment.mentorName || 'IM')}
                </AvatarFallback>
              </Avatar>

              <div>
                <h2 className="text-base font-bold text-slate-900">{assignment.mentorName}</h2>
                <p className="text-xs text-indigo-600 font-medium">{mentorUser?.designation || 'Industrial Mentor'}</p>
                {mentorUser?.companyName && (
                  <p className="text-xs text-slate-500 mt-0.5">{mentorUser.companyName}</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left">
                {mentorUser?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-500 shrink-0" /> {mentorUser.email}
                  </div>
                )}
                {mentorUser?.companyName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-500 shrink-0" /> {mentorUser.companyName}
                  </div>
                )}
              </div>

              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message Mentor
              </Button>
            </CardContent>
          </Card>

          {/* Mentorship Program Details */}
          <Card className="md:col-span-2 space-y-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900">Mentorship Status & Schedule</CardTitle>
                <Badge variant="success" className="text-xs font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Active Mentorship
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium">Assignment Date</span>
                  <p className="font-semibold text-slate-900">
                    {assignment.startDate ? new Date(assignment.startDate).toLocaleDateString() : 'Active'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium">Status</span>
                  <p className="font-semibold text-slate-900 capitalize">
                    {assignment.status || 'Active'}
                  </p>
                </div>
              </div>

              {/* Mentor Expertise */}
              {mentorUser?.expertise && mentorUser.expertise.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700">Mentor Focus Areas & Expertise</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mentorUser.expertise.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Mentorship Guidelines */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs space-y-2">
                <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Mentorship Responsibilities
                </span>
                <ul className="list-disc list-inside text-indigo-800 space-y-1 leading-relaxed">
                  <li>Your mentor posts weekly technical tasks and learning objectives.</li>
                  <li>Submit your code/deliverables by the due date for evaluation.</li>
                  <li>Request feedback or revision through the task submission tab.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <GraduationCap className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Mentor Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once your application is shortlisted by HR, an industrial mentor will be assigned to guide your internship.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
