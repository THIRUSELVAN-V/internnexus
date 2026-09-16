'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Eye, UserCheck, Check, X, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, updateDocument } from '@/lib/firebase/firestore';
import { Application } from '@/lib/types';

export default function HRApplicantsPage() {
  const { profile } = useAuthContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const docs = await getDocuments<Application>('applications');
      setApplications(docs);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [profile]);

  const handleShortlist = async (appId: string) => {
    try {
      await updateDocument('applications', appId, {
        status: 'hr_shortlisted',
        updatedAt: new Date().toISOString(),
      });
      fetchApplicants();
    } catch (err) {
      console.error('Error shortlisting applicant:', err);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await updateDocument('applications', appId, {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });
      fetchApplicants();
    } catch (err) {
      console.error('Error rejecting applicant:', err);
    }
  };

  const columns: Column<Application>[] = [
    {
      key: 'studentName',
      header: 'Applicant Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.studentName}</p>
          <p className="text-xs text-slate-500">{item.studentEmail}</p>
        </div>
      ),
    },
    {
      key: 'internshipTitle',
      header: 'Applied Role',
      render: (item) => (
        <div>
          <p className="text-xs font-semibold text-slate-800">{item.internshipTitle}</p>
          <p className="text-[11px] text-slate-500">{item.companyName}</p>
        </div>
      ),
    },
    {
      key: 'matchScore',
      header: 'AI Match Score',
      render: (item) => (
        <Badge variant="purple" className="font-bold text-xs">
          <Sparkles className="h-3 w-3 mr-1 text-purple-600" /> {item.matchScore || 85}% Match
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={
            item.status === 'mentor_assigned' || item.status === 'accepted'
              ? 'success'
              : item.status === 'hr_shortlisted'
              ? 'default'
              : item.status === 'rejected'
              ? 'destructive'
              : 'warning'
          }
          className="capitalize text-xs font-semibold"
        >
          {item.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/hr/applicants/${item.id}`}>
              <Eye className="h-3.5 w-3.5 mr-1" /> Review AI
            </Link>
          </Button>

          {item.status === 'ai_reviewed' || item.status === 'pending' ? (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(item.id)}
                className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleShortlist(item.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Shortlist
              </Button>
            </div>
          ) : (
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs" asChild>
              <Link href={`/hr/mentor-recommendation?applicantId=${item.id}`}>
                <UserCheck className="h-3.5 w-3.5 mr-1" /> Assign Mentor
              </Link>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Applicants Management Directory</h1>
        <p className="text-xs text-slate-500">Review candidate applications, AI resume summaries, match scores, and assign industrial mentors</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching candidate applications...</span>
            </div>
          ) : (
            <DataTable
              data={applications}
              columns={columns}
              searchKey="studentName"
              searchPlaceholder="Search applicants by name..."
              emptyMessage="No applicants found in system database."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
