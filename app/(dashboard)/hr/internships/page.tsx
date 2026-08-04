'use client';

import React, { useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface InternshipPosting {
  id: string;
  title: string;
  domain: string;
  stipend: number;
  openings: number;
  applicantsCount: number;
  status: 'active' | 'closed' | 'draft';
  deadline: string;
}

const mockListings: InternshipPosting[] = [
  { id: 'int-1', title: 'Frontend Web Development Intern', domain: 'Web Development', stipend: 25000, openings: 5, applicantsCount: 42, status: 'active', deadline: '2026-08-30' },
  { id: 'int-2', title: 'Full Stack Engineering Intern', domain: 'Software Engineering', stipend: 30000, openings: 3, applicantsCount: 35, status: 'active', deadline: '2026-08-25' },
  { id: 'int-3', title: 'UI/UX Design & Frontend Intern', domain: 'UI/UX Design', stipend: 20000, openings: 2, applicantsCount: 28, status: 'active', deadline: '2026-08-20' },
];

export default function HRInternshipsPage() {
  const [openModal, setOpenModal] = useState(false);

  const columns: Column<InternshipPosting>[] = [
    {
      key: 'title',
      header: 'Internship Title',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{item.domain}</p>
        </div>
      ),
    },
    {
      key: 'stipend',
      header: 'Stipend',
      render: (item) => <span className="font-semibold text-slate-800">₹{item.stipend.toLocaleString()}/mo</span>,
    },
    {
      key: 'openings',
      header: 'Openings',
      render: (item) => <span className="text-xs font-mono">{item.openings} positions</span>,
    },
    {
      key: 'applicantsCount',
      header: 'Total Applicants',
      render: (item) => (
        <Badge variant="purple" className="text-xs font-bold">
          {item.applicantsCount} Applicants
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'active' ? 'success' : 'secondary'} className="capitalize text-xs">
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: () => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm"><Edit className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon-sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Internship Listings</h1>
          <p className="text-xs text-slate-500">Create and manage active internship postings</p>
        </div>
        <Button onClick={() => setOpenModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-1.5" /> Post New Internship
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockListings} columns={columns} searchKey="title" searchPlaceholder="Search postings..." />
        </CardContent>
      </Card>

      {/* Create Modal */}
      {openModal && (
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">Create Internship Posting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="post-title" required>Title</Label>
                <Input id="post-title" placeholder="e.g. Frontend Web Development Intern" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="post-stipend" required>Stipend (INR/mo)</Label>
                  <Input id="post-stipend" type="number" placeholder="25000" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="post-openings" required>Openings</Label>
                  <Input id="post-openings" type="number" placeholder="5" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="post-desc" required>Description & Requirements</Label>
                <Textarea id="post-desc" placeholder="Enter key responsibilities and required skills..." className="mt-1 min-h-[90px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button onClick={() => setOpenModal(false)} className="bg-purple-600 hover:bg-purple-700">Publish Posting</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
