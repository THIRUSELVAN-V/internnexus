'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument, deleteDocument, updateDocument } from '@/lib/firebase/firestore';
import { Internship, Application } from '@/lib/types';
import { INTERNSHIP_DOMAINS, INTERNSHIP_MODES } from '@/lib/utils/constants';

export default function HRInternshipsPage() {
  const { profile } = useAuthContext();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState(INTERNSHIP_DOMAINS[0]);
  const [stipend, setStipend] = useState('25000');
  const [openings, setOpenings] = useState('5');
  const [duration, setDuration] = useState('12');
  const [mode, setMode] = useState<'remote' | 'onsite' | 'hybrid'>('remote');
  const [location, setLocation] = useState('Remote / Bangalore');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('React, TypeScript, Tailwind CSS, Git');

  const fetchInternshipsData = async () => {
    setLoading(true);
    try {
      const [internDocs, appDocs] = await Promise.all([
        getDocuments<Internship>('internships'),
        getDocuments<Application>('applications'),
      ]);

      setInternships(internDocs);
      setApplications(appDocs);
    } catch (err) {
      console.error('Error fetching internships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternshipsData();
  }, [profile]);

  const handleCreatePosting = async () => {
    if (!title || !description) return;
    setPublishing(true);
    try {
      const skillsArray = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);

      const newPosting: Omit<Internship, 'id'> = {
        companyId: 'comp-techcorp',
        companyName: 'TechCorp India',
        title,
        domain,
        description,
        requirements: skillsArray,
        skills: skillsArray,
        duration: parseInt(duration) || 12,
        stipend: parseInt(stipend) || 25000,
        location,
        mode,
        openings: parseInt(openings) || 5,
        applicationDeadline: '2026-10-31',
        startDate: '2026-11-01',
        status: 'active',
        hrId: profile?.uid || 'hr-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createDocument('internships', newPosting);
      setOpenModal(false);

      // Reset form
      setTitle('');
      setDescription('');
      fetchInternshipsData();
    } catch (err) {
      console.error('Error creating internship posting:', err);
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePosting = async (id: string) => {
    try {
      await deleteDocument('internships', id);
      fetchInternshipsData();
    } catch (err) {
      console.error('Error deleting posting:', err);
    }
  };

  const columns: Column<Internship>[] = [
    {
      key: 'title',
      header: 'Internship Title',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{item.domain} · {item.mode}</p>
        </div>
      ),
    },
    {
      key: 'stipend',
      header: 'Stipend',
      render: (item) => <span className="font-semibold text-slate-800">₹{(item.stipend || 20000).toLocaleString()}/mo</span>,
    },
    {
      key: 'openings',
      header: 'Openings',
      render: (item) => <span className="text-xs font-mono text-slate-700">{item.openings} positions</span>,
    },
    {
      key: 'applicantsCount',
      header: 'Total Applicants',
      render: (item) => {
        const count = applications.filter((a) => a.internshipId === item.id).length;
        return (
          <Badge variant="purple" className="text-xs font-bold">
            {count} Applicants
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'active' ? 'success' : 'secondary'} className="capitalize text-xs font-semibold">
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePosting(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Internship Postings & Listings</h1>
          <p className="text-xs text-slate-500">Publish open positions and monitor total candidate application volume</p>
        </div>
        <Button onClick={() => setOpenModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="h-4 w-4 mr-1.5" /> Post New Internship
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching job listings...</span>
            </div>
          ) : (
            <DataTable
              data={internships}
              columns={columns}
              searchKey="title"
              searchPlaceholder="Search postings by title..."
              emptyMessage="No internship postings found. Click Post New Internship to create one!"
            />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {openModal && (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">Publish New Internship Listing</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div>
                <Label htmlFor="post-title" required>Internship Title</Label>
                <Input
                  id="post-title"
                  placeholder="e.g. Frontend Web Development Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="post-domain">Domain Sector</Label>
                  <Input
                    id="post-domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="post-mode">Work Mode</Label>
                  <Input
                    id="post-mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    placeholder="remote / onsite / hybrid"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="post-stipend" required>Stipend (INR/mo)</Label>
                  <Input
                    id="post-stipend"
                    type="number"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="post-openings" required>Openings</Label>
                  <Input
                    id="post-openings"
                    type="number"
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="post-duration" required>Duration (Wks)</Label>
                  <Input
                    id="post-duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="post-skills">Required Skills (Comma separated)</Label>
                <Input
                  id="post-skills"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="React, TypeScript, Git..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="post-desc" required>Description & Key Deliverables</Label>
                <Textarea
                  id="post-desc"
                  placeholder="Enter detailed job description, responsibilities, and learning outcomes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[90px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenModal(false)} disabled={publishing}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePosting}
                disabled={!title || !description || publishing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Publish Listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
