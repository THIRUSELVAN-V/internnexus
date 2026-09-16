'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Download, FileBarChart, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getDocuments } from '@/lib/firebase/firestore';
import { downloadCSV } from '@/lib/utils/exportCSV';
import { Company, Certificate, UserProfile, Application } from '@/lib/types';

export default function AdminReportsPage() {
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const exportCompanyReport = async () => {
    setDownloadingReport('companies');
    try {
      const companies = await getDocuments<Company>('companies');
      const rows = companies.map((c) => ({
        CompanyID: c.id,
        Name: c.name,
        Industry: c.industry,
        Size: c.size,
        Location: c.location,
        HR_Name: c.hrName,
        Status: c.status,
        RegisteredAt: c.createdAt,
        ApprovedAt: c.approvedAt || 'N/A',
      }));
      downloadCSV('Company_Registration_Audit', rows);
    } catch (err) {
      console.error('Error generating company report:', err);
    } finally {
      setDownloadingReport(null);
    }
  };

  const exportCertificateReport = async () => {
    setDownloadingReport('certificates');
    try {
      const certificates = await getDocuments<Certificate>('certificates');
      const rows = certificates.map((cert) => ({
        CertificateID: cert.id,
        StudentName: cert.studentName,
        InternshipTitle: cert.internshipTitle,
        CompanyName: cert.companyName,
        MentorName: cert.mentorName,
        OverallRating: cert.overallRating,
        Status: cert.status,
        CompletionDate: cert.completionDate,
        IssuedAt: cert.issuedAt || cert.createdAt,
      }));
      downloadCSV('Certificate_Issuance_Log', rows);
    } catch (err) {
      console.error('Error generating certificate report:', err);
    } finally {
      setDownloadingReport(null);
    }
  };

  const exportUserDirectoryReport = async () => {
    setDownloadingReport('users');
    try {
      const users = await getDocuments<UserProfile>('users');
      const rows = users.map((u) => ({
        UID: u.uid,
        DisplayName: u.displayName,
        Email: u.email,
        Role: u.role,
        JoinedDate: u.createdAt,
        Suspended: (u as any).suspended ? 'Yes' : 'No',
      }));
      downloadCSV('User_Access_Directory_Log', rows);
    } catch (err) {
      console.error('Error generating user report:', err);
    } finally {
      setDownloadingReport(null);
    }
  };

  const exportAiReport = async () => {
    setDownloadingReport('ai');
    try {
      const apps = await getDocuments<Application>('applications');
      const rows = apps.map((a) => ({
        ApplicationID: a.id,
        StudentName: a.studentName,
        InternshipTitle: a.internshipTitle,
        CompanyName: a.companyName,
        Status: a.status,
        MatchScore: a.matchScore || 'N/A',
        HasAIAnalysis: a.aiAnalysis ? 'Yes' : 'No',
        AppliedAt: a.appliedAt,
      }));
      downloadCSV('AI_Service_Usage_Report', rows);
    } catch (err) {
      console.error('Error generating AI usage report:', err);
    } finally {
      setDownloadingReport(null);
    }
  };

  const exportAllLogs = async () => {
    await exportCompanyReport();
    await exportCertificateReport();
    await exportUserDirectoryReport();
    await exportAiReport();
  };

  const reportsList = [
    {
      id: 'companies',
      title: 'Company Registration Audit',
      desc: 'Complete log of all verified, pending, and suspended company accounts with approval timestamps.',
      action: exportCompanyReport,
    },
    {
      id: 'certificates',
      title: 'Certificate Issuance Ledger',
      desc: 'Audit trail of digitally issued student internship completion certificates.',
      action: exportCertificateReport,
    },
    {
      id: 'users',
      title: 'User Access & Account Directory',
      desc: 'Full directory of Students, HR Managers, Mentors, and Administrators with account status.',
      action: exportUserDirectoryReport,
    },
    {
      id: 'ai',
      title: 'AI Service & Match Analysis Log',
      desc: 'Breakdown of AI candidate match scores, resume analyses, and application screening logs.',
      action: exportAiReport,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit & System Reports"
        description="Generate official compliance logs, certificate ledgers, and system audit reports in downloadable CSV format."
        icon={FileBarChart}
        badgeText="Compliance Ledger"
        action={
          <Button
            variant="secondary"
            className="bg-white text-slate-900 hover:bg-slate-100 border-none shrink-0 font-semibold text-xs sm:text-sm"
            onClick={exportAllLogs}
          >
            <Download className="h-4 w-4 mr-1.5 text-blue-600" /> Export All Audit Reports
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep) => (
          <Card key={rep.id} className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-rose-600 shrink-0" /> {rep.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0 text-xs flex-1 flex flex-col justify-between">
              <p className="text-slate-500 leading-relaxed">{rep.desc}</p>

              <Button
                size="sm"
                variant="outline"
                className="w-full font-semibold border-slate-200 hover:bg-slate-50 text-slate-800"
                onClick={rep.action}
                disabled={downloadingReport === rep.id}
              >
                {downloadingReport === rep.id ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-blue-600" /> Generating CSV...
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5 mr-1.5 text-slate-600" /> Download CSV Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
