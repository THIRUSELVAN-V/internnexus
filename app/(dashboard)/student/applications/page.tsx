'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ExternalLink, Loader2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, updateDocument } from '@/lib/firebase/firestore';
import { Application } from '@/lib/types';

export default function StudentApplicationsPage() {
  const { profile } = useAuthContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentApplications = async () => {
    setLoading(true);
    try {
      const allApps = await getDocuments<Application>('applications');
      const studentApps = profile?.uid
        ? allApps.filter((a) => a.studentId === profile.uid)
        : allApps;
      setApplications(studentApps);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentApplications();
  }, [profile]);

  const handleWithdraw = async (appId: string) => {
    try {
      await updateDocument('applications', appId, {
        status: 'withdrawn',
        updatedAt: new Date().toISOString(),
      });
      fetchStudentApplications();
    } catch (err) {
      console.error('Error withdrawing application:', err);
    }
  };

  const columns: Column<Application>[] = [
    {
      key: 'internshipTitle',
      header: 'Internship Role',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.internshipTitle}</p>
          <p className="text-xs text-slate-500">{item.companyName}</p>
        </div>
      ),
    },
    {
      key: 'matchScore',
      header: 'AI Match Score',
      render: (item) => (
        <Badge variant="purple" className="font-semibold text-xs">
          <Sparkles className="h-3 w-3 mr-1" /> {item.matchScore || 85}%
        </Badge>
      ),
    },
    {
      key: 'appliedAt',
      header: 'Applied Date',
      render: (item) => (
        <span className="text-xs text-slate-600 font-mono">
          {item.appliedAt ? item.appliedAt.slice(0, 10) : 'Recently'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const variants: Record<string, 'default' | 'purple' | 'success' | 'warning' | 'destructive'> = {
          pending: 'warning',
          ai_reviewed: 'purple',
          hr_shortlisted: 'default',
          mentor_assigned: 'success',
          accepted: 'success',
          rejected: 'destructive',
          withdrawn: 'destructive',
        };
        return (
          <Badge variant={variants[item.status] || 'default'} className="capitalize text-xs font-semibold">
            {item.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'mentorName',
      header: 'Assigned Mentor',
      render: (item) =>
        item.mentorName ? (
          <span className="text-xs font-semibold text-slate-800">{item.mentorName}</span>
        ) : (
          <span className="text-xs text-slate-400 italic">Not assigned yet</span>
        ),
    },
    {
      key: 'action',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.status === 'mentor_assigned' || item.status === 'accepted' ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/mentor">
                View Mentor <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/tasks">
                View Tasks <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          )}

          {item.status !== 'withdrawn' && item.status !== 'rejected' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleWithdraw(item.id)}
              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              <Ban className="h-3 w-3 mr-1" /> Withdraw
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Submitted Applications</h1>
        <p className="text-xs text-slate-500">Track application progress, shortlisting, and industrial mentor assignments</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching application records...</span>
            </div>
          ) : (
            <DataTable
              data={applications}
              columns={columns}
              searchKey="internshipTitle"
              searchPlaceholder="Search applications by title..."
              emptyMessage="You have not submitted any internship applications yet."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
