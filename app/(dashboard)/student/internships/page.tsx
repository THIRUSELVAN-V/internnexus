'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, MapPin, Building2, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import CandidateMatchCard from '@/components/ai/CandidateMatchCard';

const mockInternships = [
  {
    id: 'int-1',
    title: 'Frontend Web Development Intern',
    company: 'TechCorp India',
    location: 'Remote / Bangalore',
    mode: 'remote',
    duration: 12,
    stipend: 25000,
    openings: 5,
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Git'],
    description: 'Build production React components for our flagship SaaS application. Work directly under senior architects.',
    matchScore: 94,
    matchedSkills: ['React', 'TypeScript', 'Tailwind CSS', 'Git'],
    missingSkills: ['GraphQL'],
    reasoning: 'Extremely high skill overlap with student resume. Matches 4 out of 5 required technical skills.',
  },
  {
    id: 'int-2',
    title: 'Full Stack Engineering Intern',
    company: 'InnovateTech Solutions',
    location: 'Hyderabad, India',
    mode: 'hybrid',
    duration: 16,
    stipend: 30000,
    openings: 3,
    skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    description: 'Develop REST APIs and frontend views for enterprise analytics platform.',
    matchScore: 88,
    matchedSkills: ['React', 'Node.js'],
    missingSkills: ['PostgreSQL', 'Docker'],
    reasoning: 'Strong foundation in Node and React. Backend database experience will be learned during onboarding.',
  },
  {
    id: 'int-3',
    title: 'UI/UX Design & Frontend Intern',
    company: 'CreativeStudio',
    location: 'Mumbai, India',
    mode: 'onsite',
    duration: 8,
    stipend: 20000,
    openings: 2,
    skills: ['Figma', 'React', 'CSS Animations', 'Design Systems'],
    description: 'Design interactive web wireframes in Figma and implement responsive HTML/CSS prototypes.',
    matchScore: 72,
    matchedSkills: ['React', 'CSS Animations'],
    missingSkills: ['Figma Design'],
    reasoning: 'Good coding alignment, but lacks formal UI/UX portfolio projects.',
  },
];

export default function BrowseInternshipsPage() {
  const [query, setQuery] = useState('');
  const [selectedInternship, setSelectedInternship] = useState<typeof mockInternships[0] | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);

  const filtered = mockInternships.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.company.toLowerCase().includes(query.toLowerCase()) ||
    item.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  const handleApply = (id: string) => {
    setAppliedIds((prev) => [...prev, id]);
    setSelectedInternship(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Browse Internships</h1>
          <p className="text-xs text-slate-500">Explore open internship postings with instant AI compatibility scoring</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => {
          const isApplied = appliedIds.includes(item.id);
          return (
            <Card key={item.id} className="flex flex-col justify-between hover:border-blue-300 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="purple" className="text-[11px] font-semibold mb-2">
                      <Sparkles className="h-3 w-3 mr-1" /> {item.matchScore}% Match
                    </Badge>
                    <CardTitle className="text-base font-bold text-slate-900 leading-snug">{item.title}</CardTitle>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{item.company}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {item.company.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0 text-xs text-slate-600 flex-1">
                <p className="line-clamp-2 leading-relaxed">{item.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {item.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {item.duration} weeks</span>
                  <span className="font-semibold text-slate-900">₹{item.stipend.toLocaleString()}/mo</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {item.skills.map((sk) => (
                    <Badge key={sk} variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">
                      {sk}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <div className="p-6 pt-0 border-t border-slate-100 mt-3 pt-3 flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedInternship(item)}>
                  View Details & AI Match
                </Button>
                <Button
                  size="sm"
                  disabled={isApplied}
                  onClick={() => handleApply(item.id)}
                  className={isApplied ? 'bg-green-600 hover:bg-green-600' : ''}
                >
                  {isApplied ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Applied</> : 'Apply Now'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Details & AI Match Dialog */}
      {selectedInternship && (
        <Dialog open={!!selectedInternship} onOpenChange={() => setSelectedInternship(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="purple" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> {selectedInternship.matchScore}% Match
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">{selectedInternship.mode}</Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">{selectedInternship.title}</DialogTitle>
              <DialogDescription>{selectedInternship.company} · {selectedInternship.location}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedInternship.description}</p>
              </div>

              {/* AI Match Component */}
              <CandidateMatchCard
                matchScore={selectedInternship.matchScore}
                matchedSkills={selectedInternship.matchedSkills}
                missingSkills={selectedInternship.missingSkills}
                reasoning={selectedInternship.reasoning}
                recommendation={selectedInternship.matchScore >= 80 ? 'strong_match' : 'good_match'}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedInternship(null)}>Close</Button>
              <Button onClick={() => handleApply(selectedInternship.id)} disabled={appliedIds.includes(selectedInternship.id)}>
                {appliedIds.includes(selectedInternship.id) ? 'Already Applied' : 'Confirm Application'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
