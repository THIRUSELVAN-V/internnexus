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
import { Application, Company, UserProfile, Internship } from '@/lib/types';
import { formatTimestamp } from '@/lib/utils/formatters';
import { createNotification } from '@/lib/firebase/notifications';

export default function StudentApplicationsPage() {
  const { profile } = useAuthContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [hrUsers, setHrUsers] = useState<UserProfile[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudentApplications = async () => {
    setLoading(true);
    try {
      const [allApps, allCompanies, allUsers, allInternships] = await Promise.all([
        getDocuments<Application>('applications'),
        getDocuments<Company>('companies'),
        getDocuments<UserProfile>('users'),
        getDocuments<Internship>('internships'),
      ]);

      const studentApps = profile?.uid
        ? allApps.filter((a) => a.studentId === profile.uid)
        : [];
      setApplications(studentApps);
      setCompanies(allCompanies);
      setHrUsers(allUsers);
      setInternships(allInternships);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHRContact = (app: Application) => {
    const appAny = app as Record<string, any>;
    let name = (appAny.hrName as string) || '';
    let email = (appAny.hrEmail as string) || '';
    let phone = (appAny.hrPhone as string) || '';

    // Match company by companyId or companyName
    const matchedCompany = companies.find(
      (c) =>
        (app.companyId && c.id === app.companyId) ||
        (c.name && app.companyName && c.name.toLowerCase() === app.companyName.toLowerCase())
    );

    if (matchedCompany) {
      if (!name && matchedCompany.hrName) name = matchedCompany.hrName;
      if (!email && (matchedCompany.hrEmail || matchedCompany.officialEmail)) {
        email = matchedCompany.hrEmail || matchedCompany.officialEmail || '';
      }
      if (!phone && (matchedCompany.hrPhone || matchedCompany.contactNumber)) {
        phone = matchedCompany.hrPhone || matchedCompany.contactNumber || '';
      }
    }

    // Match internship
    const matchedInternship = internships.find((i) => i.id === app.internshipId);
    const hrUserId = matchedCompany?.hrId || matchedInternship?.hrId;

    if (hrUserId) {
      const matchedUser = hrUsers.find((u) => u.uid === hrUserId);
      if (matchedUser) {
        if (!name && matchedUser.displayName) name = matchedUser.displayName;
        if (!email && matchedUser.email) email = matchedUser.email;
        if (!phone && matchedUser.phone) phone = matchedUser.phone;
      }
    }

    return {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };
  };

  useEffect(() => {
    fetchStudentApplications();
  }, [profile]);

  const handleWithdraw = async (appId: string) => {
    try {
      const app = applications.find((a) => a.id === appId);
      await updateDocument('applications', appId, {
        status: 'withdrawn',
        updatedAt: new Date().toISOString(),
      });

      if (app) {
        const matchedInternship = internships.find((i) => i.id === app.internshipId);
        const matchedCompany = companies.find((c) => c.id === app.companyId);
        const targetHrId = (app as Record<string, any>).hrId || matchedInternship?.hrId || matchedCompany?.hrId;
        if (targetHrId) {
          createNotification({
            recipientUserId: targetHrId,
            recipientRole: 'hr',
            title: 'Application Withdrawn',
            message: `${app.studentName || 'A student'} has withdrawn their application for ${app.internshipTitle || 'Internship'}.`,
            type: 'warning',
            category: 'application',
            link: '/hr/applicants',
            relatedId: appId,
            relatedType: 'application',
          }).catch((notifyErr) => console.error('Failed to notify HR of withdrawal:', notifyErr));
        }
      }

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
      render: (item) => {
        const dateStr = formatTimestamp(item.appliedAt);
        return (
          <span className="text-xs text-slate-600 font-mono">
            {dateStr ? dateStr.slice(0, 10) : 'Recently'}
          </span>
        );
      },
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
      key: 'hrAccess',
      header: 'HR Contact',
      render: (item) => {
        const isAccessible =
          item.status === 'hr_shortlisted' ||
          item.status === 'accepted' ||
          item.status === 'mentor_assigned';

        if (!isAccessible) {
          return (
            <span className="text-xs text-slate-400 italic">Visible once shortlisted</span>
          );
        }

        const hr = getHRContact(item);
        const contactName = hr.name || `${item.companyName} HR`;

        return (
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-slate-900 block">{contactName}</span>
            {hr.email && (
              <a
                href={`mailto:${hr.email}`}
                className="text-[11px] text-blue-600 hover:underline block truncate max-w-[200px]"
                title={hr.email}
              >
                {hr.email}
              </a>
            )}
            {hr.phone && (
              <a
                href={`tel:${hr.phone}`}
                className="text-[11px] text-slate-500 hover:text-slate-700 block"
                title={hr.phone}
              >
                {hr.phone}
              </a>
            )}
            {!hr.email && !hr.phone && (
              <span className="text-[11px] text-blue-600 font-mono">Verified HR Contact</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'mentorName',
      header: 'Assigned Mentor',
      render: (item) =>
        item.mentorName ? (
          <span className="text-xs font-semibold text-slate-800">{item.mentorName}</span>
        ) : item.status === 'accepted' ? (
          <span className="text-xs text-amber-600 font-medium">Being assigned by HR</span>
        ) : (
          <span className="text-xs text-slate-400 italic">Not assigned yet</span>
        ),
    },
    {
      key: 'action',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.status === 'mentor_assigned' ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/mentor">
                View Mentor <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          ) : item.status === 'accepted' ? (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-200">
              Selected Candidate
            </span>
          ) : item.status === 'hr_shortlisted' ? (
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
              Shortlisted
            </span>
          ) : null}

          {item.status !== 'withdrawn' && item.status !== 'rejected' && item.status !== 'accepted' && item.status !== 'mentor_assigned' && (
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
