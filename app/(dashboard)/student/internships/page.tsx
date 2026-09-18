'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, MapPin, Building2, Clock, Sparkles, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import CandidateMatchCard from '@/components/ai/CandidateMatchCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument } from '@/lib/firebase/firestore';
import { matchCandidateWithInternship } from '@/lib/ai/candidateMatch';
import { Internship, Application, StudentProfile } from '@/lib/types';
import { hasActiveInternship, getActiveApplication } from '@/lib/utils/constants';

export default function BrowseInternshipsPage() {
  const { profile } = useAuthContext();
  const student = profile as StudentProfile;

  const [query, setQuery] = useState('');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [matches, setMatches] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [internDocs, appDocs] = await Promise.all([
          getDocuments<Internship>('internships'),
          getDocuments<Application>('applications'),
        ]);

        // Fallback default internships if collection is empty
        let displayInternships = internDocs;
        if (!displayInternships || displayInternships.length === 0) {
          displayInternships = [
            {
              id: 'int-1',
              companyId: 'comp-1',
              companyName: 'TechCorp India',
              title: 'Frontend Web Development Intern',
              description: 'Build production React & TypeScript components for our flagship SaaS platform. Work directly under senior engineers.',
              requirements: ['React', 'TypeScript', 'Tailwind CSS', 'Git', 'REST APIs'],
              skills: ['React', 'TypeScript', 'Tailwind CSS', 'Git'],
              domain: 'Software Development',
              duration: 12,
              stipend: 25000,
              location: 'Remote / Bangalore',
              mode: 'remote',
              openings: 5,
              applicationDeadline: '2026-09-30',
              startDate: '2026-10-01',
              status: 'active',
              hrId: 'hr-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'int-2',
              companyId: 'comp-2',
              companyName: 'InnovateTech Solutions',
              title: 'Full Stack Engineering Intern',
              description: 'Develop REST APIs and React frontend dashboards for enterprise client analytics application.',
              requirements: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
              skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
              domain: 'Software Development',
              duration: 16,
              stipend: 30000,
              location: 'Hyderabad, India',
              mode: 'hybrid',
              openings: 3,
              applicationDeadline: '2026-10-15',
              startDate: '2026-11-01',
              status: 'active',
              hrId: 'hr-2',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'int-3',
              companyId: 'comp-3',
              companyName: 'CreativeStudio',
              title: 'UI/UX Design & Frontend Intern',
              description: 'Design wireframes in Figma and build interactive HTML/CSS/React prototypes.',
              requirements: ['Figma', 'React', 'CSS Animations', 'UI/UX Design'],
              skills: ['Figma', 'React', 'CSS Animations', 'UI/UX Design'],
              domain: 'UI/UX Design',
              duration: 8,
              stipend: 20000,
              location: 'Mumbai, India',
              mode: 'onsite',
              openings: 2,
              applicationDeadline: '2026-09-25',
              startDate: '2026-10-05',
              status: 'active',
              hrId: 'hr-3',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }

        setInternships(displayInternships);
        setApplications(appDocs);

        // Run AI matching for student skills vs internship requirements
        const studentSkills = student?.skills || ['React', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Git'];
        const matchMap: Record<string, any> = {};

        for (const item of displayInternships) {
          const matchResult = await matchCandidateWithInternship(
            studentSkills,
            item.requirements || item.skills || [],
            'preview-app',
            item.id,
            profile?.uid || 'std-1'
          );
          matchMap[item.id] = matchResult;
        }

        setMatches(matchMap);
      } catch (err) {
        console.error('Error fetching internships:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile]);

  const myApplications = applications.filter((a) => a.studentId === profile?.uid);
  const studentAppliedIds = myApplications.map((a) => a.internshipId);
  const studentHasActiveInternship = hasActiveInternship(myApplications);
  const activeApp = getActiveApplication(myApplications);

  const filtered = internships.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.companyName.toLowerCase().includes(query.toLowerCase()) ||
    (item.skills || []).some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  const handleApply = async (internship: Internship) => {
    if (!profile?.uid) return;
    if (studentHasActiveInternship) {
      alert('You already have an active internship. You can apply for another internship after completing the current internship.');
      return;
    }
    setApplyingId(internship.id);
    try {
      const matchInfo = matches[internship.id];

      const newApp: Omit<Application, 'id'> = {
        internshipId: internship.id,
        internshipTitle: internship.title,
        companyId: internship.companyId,
        companyName: internship.companyName,
        studentId: profile.uid,
        studentName: profile.displayName || 'Student',
        studentEmail: profile.email || '',
        resumeURL: student?.resumeURL || '',
        status: 'ai_reviewed',
        matchScore: matchInfo?.matchScore || 85,
        matchedSkills: matchInfo?.matchedSkills || [],
        missingSkills: matchInfo?.missingSkills || [],
        matchReasoning: matchInfo?.reasoning || 'Strong skill alignment.',
        appliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newDocId = await createDocument('applications', newApp);
      setApplications((prev) => [...prev, { id: newDocId, ...newApp }]);
      setSelectedInternship(null);
    } catch (err) {
      console.error('Error applying to internship:', err);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Internship Warning Banner */}
      {studentHasActiveInternship && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-950 text-sm">Active Internship in Progress</p>
            <p className="text-amber-800 leading-relaxed">
              You already have an active internship ({activeApp?.internshipTitle} at {activeApp?.companyName}).
              You can apply for another internship after completing the current internship.
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Browse Open Internships</h1>
          <p className="text-xs text-slate-500">Explore active listings with real-time AI candidate compatibility scores</p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search role, company or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Running AI match engine against open positions...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isApplied = studentAppliedIds.includes(item.id);
            const match = matches[item.id];
            const score = match?.matchScore || 80;

            return (
              <Card key={item.id} className="flex flex-col justify-between hover:border-blue-300 transition-all shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="purple" className="text-[11px] font-semibold mb-2">
                        <Sparkles className="h-3 w-3 mr-1 text-purple-600" /> {score}% AI Match
                      </Badge>
                      <CardTitle className="text-base font-bold text-slate-900 leading-snug">{item.title}</CardTitle>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{item.companyName}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                      {item.companyName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs text-slate-600 flex-1">
                  <p className="line-clamp-2 leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {item.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {item.duration} wks</span>
                    <span className="font-semibold text-slate-900">₹{(item.stipend || 20000).toLocaleString()}/mo</span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(item.skills || []).map((sk) => (
                      <Badge key={sk} variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">
                        {sk}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <div className="p-4 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedInternship(item)}>
                    Details & AI Match
                  </Button>
                  <Button
                    size="sm"
                    disabled={isApplied || applyingId === item.id || studentHasActiveInternship}
                    onClick={() => handleApply(item)}
                    title={studentHasActiveInternship ? 'You already have an active internship.' : undefined}
                    className={
                      isApplied
                        ? 'bg-green-600 hover:bg-green-600 text-white'
                        : studentHasActiveInternship
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed hover:bg-slate-100'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }
                  >
                    {applyingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isApplied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Applied
                      </>
                    ) : studentHasActiveInternship ? (
                      'Apply Disabled'
                    ) : (
                      'Apply Now'
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details & AI Match Dialog */}
      {selectedInternship && (
        <Dialog open={!!selectedInternship} onOpenChange={() => setSelectedInternship(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="purple" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> {matches[selectedInternship.id]?.matchScore || 85}% Match
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">{selectedInternship.mode}</Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">{selectedInternship.title}</DialogTitle>
              <DialogDescription>{selectedInternship.companyName} · {selectedInternship.location}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Job Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedInternship.description}
                </p>
              </div>

              {/* AI Match Component */}
              <CandidateMatchCard
                matchScore={matches[selectedInternship.id]?.matchScore || 85}
                matchedSkills={matches[selectedInternship.id]?.matchedSkills || selectedInternship.skills || []}
                missingSkills={matches[selectedInternship.id]?.missingSkills || []}
                reasoning={matches[selectedInternship.id]?.reasoning || 'Good skill overlap with student resume profile.'}
                recommendation={
                  (matches[selectedInternship.id]?.matchScore || 85) >= 80 ? 'strong_match' : 'good_match'
                }
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedInternship(null)}>
                Close
              </Button>
              <Button
                onClick={() => handleApply(selectedInternship)}
                disabled={studentAppliedIds.includes(selectedInternship.id) || applyingId === selectedInternship.id || studentHasActiveInternship}
                className={
                  studentHasActiveInternship
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
              >
                {studentAppliedIds.includes(selectedInternship.id)
                  ? 'Already Applied'
                  : studentHasActiveInternship
                  ? 'Active Internship in Progress'
                  : 'Confirm Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
