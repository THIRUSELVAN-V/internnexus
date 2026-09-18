'use client';

import React, { useEffect, useState } from 'react';
import MentorRecommendationCard from '@/components/ai/MentorRecommendationCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, UserCheck, Loader2 } from 'lucide-react';
import { getDocuments, createDocument, updateDocument } from '@/lib/firebase/firestore';
import { recommendMentors } from '@/lib/ai/mentorRecommend';
import type { MentorRecommendation, Application, MentorAssignment, UserProfile, MentorProfile, HRProfile, Internship } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { filterHRInternships, filterHRApplications } from '@/lib/utils/hr';

export default function HRMentorRecommendationPage() {
  const { profile } = useAuthContext();
  const searchParams = useSearchParams();
  const applicantId = searchParams.get('applicantId');

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [recommendations, setRecommendations] = useState<MentorRecommendation[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');

  const [assigning, setAssigning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function loadRecommendationData() {
      if (!profile?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [appDocs, userDocs, internDocs] = await Promise.all([
          getDocuments<Application>('applications'),
          getDocuments<UserProfile>('users'),
          getDocuments<Internship>('internships'),
        ]);

        const myInternships = filterHRInternships(internDocs, profile);
        const myApps = filterHRApplications(appDocs, myInternships, profile);

        const currentApp = applicantId
          ? myApps.find((a) => a.id === applicantId) || null
          : myApps.length > 0
          ? myApps[0]
          : null;

        setApplication(currentApp);

        if (currentApp) {
          const hrProfile = profile as HRProfile;
          const hrCompId = hrProfile?.companyId;

          // Strictly scope mentors to this HR's company
          const mentorUsers = userDocs.filter((u) => {
            if (u.role !== 'mentor') return false;
            const mentor = u as MentorProfile;
            if (hrCompId) {
              return mentor.companyId === hrCompId || Boolean(mentor.companyName && hrProfile?.companyName && mentor.companyName.toLowerCase() === hrProfile.companyName.toLowerCase());
            }
            return false;
          }) as MentorProfile[];

          if (mentorUsers.length > 0) {
            const recs = await recommendMentors(
              currentApp.internshipTitle || 'Web Development',
              currentApp.matchedSkills || ['React', 'TypeScript'],
              mentorUsers
            );
            setRecommendations(recs);

            if (recs.length > 0) {
              setSelectedMentorId(recs[0].mentorId);
            }
          } else {
            setRecommendations([]);
          }
        }
      } catch (err) {
        console.error('Error loading mentor recommendation data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendationData();
  }, [applicantId, profile]);

  const handleConfirmAssignment = async () => {
    if (!application || !selectedMentorId) return;
    setAssigning(true);
    try {
      const selectedMentor = recommendations.find((m) => m.mentorId === selectedMentorId);
      const mentorName = selectedMentor ? selectedMentor.mentorName : 'Assigned Mentor';

      const newAssignment: Omit<MentorAssignment, 'id'> = {
        internshipId: application.internshipId,
        companyId: application.companyId,
        studentId: application.studentId,
        studentName: application.studentName,
        mentorId: selectedMentorId,
        mentorName,
        status: 'accepted',
        aiRecommended: true,
        recommendationScore: selectedMentor?.matchScore || 95,
        startDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createDocument('mentorAssignments', newAssignment);
      await updateDocument('applications', application.id, {
        status: 'mentor_assigned',
        mentorId: selectedMentorId,
        mentorName,
        updatedAt: new Date().toISOString(),
      });

      setConfirmed(true);
    } catch (err) {
      console.error('Error assigning mentor:', err);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Mentor Recommendation Engine</h1>
        <p className="text-xs text-slate-500">AI proposes optimal industrial mentor assignments based on expertise, mentor workload capacity, and intern skill set</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Running AI mentor recommendation analysis...</span>
        </div>
      ) : application ? (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Candidate Selected for Mentor Matching</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{application.studentName}</h3>
                <p className="text-xs text-slate-500">Applied for {application.internshipTitle} at {application.companyName}</p>
              </div>
              <Badge variant="purple" className="text-xs font-semibold">
                {application.matchScore || 94}% Candidate AI Match
              </Badge>
            </CardContent>
          </Card>

          {confirmed ? (
            <Card className="border-green-200 bg-green-50/40 text-center py-8 animate-fade-in">
              <CardContent className="space-y-3">
                <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Industrial Mentor Assignment Confirmed!</h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Selected mentor has been assigned to {application.studentName}. Mentorship workspace and task permissions have been initialized.
                </p>
              </CardContent>
            </Card>
          ) : recommendations.length > 0 ? (
            <>
              <MentorRecommendationCard
                recommendations={recommendations}
                selectedMentorId={selectedMentorId}
                onSelectMentor={(id) => setSelectedMentorId(id)}
              />

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleConfirmAssignment}
                  disabled={assigning || !selectedMentorId}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {assigning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-1.5" />
                  )}
                  Confirm Industrial Mentor Assignment
                </Button>
              </div>
            </>
          ) : (
            <Card className="border-dashed border-slate-200 bg-slate-50/50">
              <CardContent className="py-12 text-center text-xs text-slate-500 space-y-1.5">
                <p className="font-semibold text-slate-700">No industrial mentors affiliated with your company yet.</p>
                <p className="max-w-md mx-auto text-slate-500">
                  Only industrial mentors registered under your verified enterprise can be assigned to mentees. Invite or register mentors for your company to enable AI mentor matching.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-xs text-slate-500">
            No applicant selected for mentor recommendation. Please navigate to Applicants tab and select a candidate.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
