'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, createDocument } from '@/lib/firebase/firestore';
import { Certificate, MentorAssignment, Application } from '@/lib/types';

interface CertRow {
  id: string;
  studentId: string;
  studentName: string;
  role: string;
  companyName: string;
  mentorName: string;
  issueDate: string;
  status: 'ready' | 'issued';
}

export default function HRCertificatesPage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [certRows, setCertRows] = useState<CertRow[]>([]);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const fetchCertificatesData = async () => {
    setLoading(true);
    try {
      const [assignments, certDocs, applications] = await Promise.all([
        getDocuments<MentorAssignment>('mentorAssignments'),
        getDocuments<Certificate>('certificates'),
        getDocuments<Application>('applications'),
      ]);

      let rows: CertRow[] = assignments.map((assign) => {
        const app = applications.find((a) => a.studentId === assign.studentId);
        const isIssued = certDocs.some((c) => c.studentId === assign.studentId);

        return {
          id: assign.id,
          studentId: assign.studentId,
          studentName: assign.studentName,
          role: app?.internshipTitle || 'Frontend Web Development Intern',
          companyName: assign.companyId || 'TechCorp India',
          mentorName: assign.mentorName,
          issueDate: new Date().toISOString().slice(0, 10),
          status: isIssued ? 'issued' : 'ready',
        };
      });

      if (!rows || rows.length === 0) {
        rows = [
          { id: '1', studentId: 'std-1', studentName: 'Thiru', role: 'Frontend Web Development Intern', companyName: 'TechCorp India', mentorName: 'Mr. Vijay', issueDate: '2026-08-04', status: 'ready' },
          { id: '2', studentId: 'std-2', studentName: 'Priya Sharma', role: 'Full Stack Engineering Intern', companyName: 'TechCorp India', mentorName: 'Ananya Deshmukh', issueDate: '2026-07-30', status: 'issued' },
        ];
      }

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
        internshipId: 'int-1',
        internshipTitle: item.role,
        companyId: 'comp-techcorp',
        companyName: 'TechCorp India',
        studentId: item.studentId,
        studentName: item.studentName,
        mentorId: 'men-1',
        mentorName: item.mentorName,
        startDate: '2026-07-15',
        endDate: '2026-10-15',
        completionDate: new Date().toISOString().slice(0, 10),
        overallRating: 5.0,
        status: 'issued',
        certificateURL: `https://storage.googleapis.com/certificates/CERT-${item.studentId.slice(0, 6)}.pdf`,
        issuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await createDocument('certificates', newCert);
      fetchCertificatesData();
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
            <DataTable data={certRows} columns={columns} searchKey="studentName" searchPlaceholder="Search student..." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
