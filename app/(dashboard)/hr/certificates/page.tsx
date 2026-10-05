'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument } from '@/lib/firebase/firestore';
import { Certificate, MentorAssignment, Application, Internship, HRProfile } from '@/lib/types';
import { filterHRInternships, filterHRAssignments, filterHRCertificates, filterHRApplications } from '@/lib/utils/hr';

interface CertRow {
  id: string;
  internshipId: string;
  companyId: string;
  studentId: string;
  studentName: string;
  role: string;
  companyName: string;
  mentorId: string;
  mentorName: string;
  startDate: string;
  endDate: string;
  issueDate: string;
  status: 'ready' | 'issued';
}

export default function HRCertificatesPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [certRows, setCertRows] = useState<CertRow[]>([]);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const fetchCertificatesData = async () => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [assignments, certDocs, applications, internships] = await Promise.all([
        getDocuments<MentorAssignment>('mentorAssignments'),
        getDocuments<Certificate>('certificates'),
        getDocuments<Application>('applications'),
        getDocuments<Internship>('internships'),
      ]);

      const myInternships = filterHRInternships(internships, profile);
      const myAssignments = filterHRAssignments(assignments, myInternships, profile);
      const myCertDocs = filterHRCertificates(certDocs, myInternships, profile);
      const myApps = filterHRApplications(applications, myInternships, profile);

      const hr = profile as HRProfile;
      const hrCompany = hr?.companyName || (profile.displayName ? `${profile.displayName}'s Organization` : 'Company');

      const rows: CertRow[] = myAssignments.map((assign) => {
        const app = myApps.find((a) => a.studentId === assign.studentId && a.internshipId === assign.internshipId) ||
                    myApps.find((a) => a.studentId === assign.studentId);
        const isIssued = myCertDocs.some((c) => c.studentId === assign.studentId && c.internshipId === assign.internshipId);

        return {
          id: assign.id,
          internshipId: assign.internshipId || app?.internshipId || '',
          companyId: assign.companyId || hr?.companyId || '',
          studentId: assign.studentId,
          studentName: assign.studentName || 'Student',
          role: app?.internshipTitle || 'Intern',
          companyName: app?.companyName || hrCompany,
          mentorId: assign.mentorId || '',
          mentorName: assign.mentorName || 'Assigned Mentor',
          startDate: assign.startDate || app?.appliedAt || new Date().toISOString().slice(0, 10),
          endDate: assign.endDate || new Date().toISOString().slice(0, 10),
          issueDate: new Date().toISOString().slice(0, 10),
          status: isIssued ? 'issued' : 'ready',
        };
      });

      setCertRows(rows);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificatesData();
  }, [profile]);

  const handleIssueCertificate = async (item: CertRow) => {
    setIssuingId(item.id);
    try {
      const newCert: Omit<Certificate, 'id'> = {
        internshipId: item.internshipId,
        internshipTitle: item.role,
        companyId: item.companyId,
        companyName: item.companyName,
        studentId: item.studentId,
        studentName: item.studentName,
        mentorId: item.mentorId,
        mentorName: item.mentorName,
        startDate: item.startDate,
        endDate: item.endDate,
        completionDate: new Date().toISOString().slice(0, 10),
        overallRating: 5.0,
        status: 'issued',
        certificateURL: `https://storage.googleapis.com/certificates/CERT-${item.studentId.slice(0, 6).toUpperCase()}-${Date.now()}.pdf`,
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await createDocument('certificates', newCert);
      await fetchCertificatesData();
    } catch (err) {
      console.error('Error issuing certificate:', err);
    } finally {
      setIssuingId(null);
    }
  };

  const columns: Column<CertRow>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.studentName}</p>
          <p className="text-xs text-slate-500">{item.role}</p>
        </div>
      ),
    },
    {
      key: 'mentorName',
      header: 'Industrial Mentor',
      render: (item) => <span className="text-xs font-semibold text-slate-800">{item.mentorName}</span>,
    },
    {
      key: 'status',
      header: 'Certificate Status',
      render: (item) => (
        <Badge variant={item.status === 'issued' ? 'success' : 'warning'} className="capitalize text-xs font-semibold">
          {item.status === 'issued' ? 'Issued & Verified' : 'Ready to Issue'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => {
        const isIssued = item.status === 'issued';
        return (
          <Button
            size="sm"
            onClick={() => handleIssueCertificate(item)}
            disabled={isIssued || issuingId === item.id}
            className={isIssued ? 'bg-green-600 hover:bg-green-600 text-white font-semibold' : 'bg-purple-600 hover:bg-purple-700 text-white font-semibold'}
          >
            {issuingId === item.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isIssued ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Certificate Issued
              </>
            ) : (
              <>
                <Award className="h-3.5 w-3.5 mr-1" /> Generate Certificate
              </>
            )}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Certificate Generation & Issuance</h1>
        <p className="text-xs text-slate-500">Approve final mentor evaluation and issue verified digital internship completion certificates</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching evaluated interns...</span>
            </div>
          ) : (
            <DataTable
              data={certRows}
              columns={columns}
              searchKey="studentName"
              searchPlaceholder="Search student..."
              emptyMessage="No evaluated interns found for certificate issuance."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
