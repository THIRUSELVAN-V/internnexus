'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, CheckCircle2, ShieldCheck, Zap, Printer, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments } from '@/lib/firebase/firestore';
import { Certificate } from '@/lib/types';

export default function StudentCertificatePage() {
  const { profile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    async function fetchCertificate() {
      setLoading(true);
      try {
        const certDocs = await getDocuments<Certificate>('certificates');
        const myCert = certDocs.find((c) => c.studentId === profile?.uid) || certDocs[0] || null;
        setCertificate(myCert);
      } catch (err) {
        console.error('Error fetching certificate:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [profile]);

  const handlePrint = () => {
    window.print();
  };

  const studentName = profile?.displayName || certificate?.studentName || 'Student';
  const internshipTitle = certificate?.internshipTitle || 'Frontend Web Development Internship';
  const companyName = certificate?.companyName || 'TechCorp India';
  const mentorName = certificate?.mentorName || 'Mr. Vijay';
  const overallRating = certificate?.overallRating || 5.0;
  const certId = certificate?.id ? `CERT-${certificate.id.slice(0, 8).toUpperCase()}` : 'CERT-2026-NEX-8842';
  const completionDate = certificate?.completionDate || 'August 2026';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Digital Internship Certificate</h1>
          <p className="text-xs text-slate-500">Official verified completion certificate issued by {companyName} & InternNexus</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs">
            <Printer className="h-4 w-4 mr-1.5" /> Print / Download PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Verifying certificate credentials...</span>
        </div>
      ) : (
        <Card className="border-amber-200 bg-gradient-to-b from-white to-amber-50/20 shadow-sm print:border-none print:shadow-none">
          <CardContent className="p-4 sm:p-8 text-center space-y-6">
            {/* Certificate Frame Preview */}
            <div className="mx-auto max-w-3xl rounded-2xl border-4 border-double border-amber-300 bg-white p-6 sm:p-10 shadow-md relative print:shadow-none print:border-amber-500">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-base font-bold text-slate-900 tracking-tight">InternNexus</span>
                </div>
                <Badge variant="success" className="text-xs font-semibold px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified Certificate
                </Badge>
              </div>

              <div className="space-y-4 my-8">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
                  Certificate of Internship Completion
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-serif">This is proudly presented to</h2>
                <p className="text-2xl sm:text-4xl font-bold text-blue-700 font-serif underline decoration-amber-400 decoration-2 py-1">
                  {studentName}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                  for outstanding performance and successful completion of the <strong className="text-slate-900">{internshipTitle}</strong> program at <strong className="text-slate-900">{companyName}</strong> under the mentorship of <strong className="text-slate-900">{mentorName}</strong> with an overall performance rating of <strong className="text-amber-700 font-bold">{overallRating}.0 / 5.0</strong>.
                </p>
              </div>

              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">{mentorName}</p>
                  <p className="text-[11px] text-slate-500">Industrial Mentor · {companyName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[11px] font-bold text-slate-700">ID: {certId}</p>
                  <p className="text-[11px] text-slate-500">Completion Date: {completionDate}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
