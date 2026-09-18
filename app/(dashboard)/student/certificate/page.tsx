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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    async function fetchCertificate() {
      setLoading(true);
      try {
        const certDocs = await getDocuments<Certificate>('certificates');
        const myCerts = profile?.uid ? certDocs.filter((c) => c.studentId === profile.uid) : [];
        setCertificates(myCerts);
        if (myCerts.length > 0) {
          setSelectedCert(myCerts[0]);
        }
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

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Digital Internship Certificates</h1>
          <p className="text-xs text-slate-500">Official verified completion credentials for completed internships</p>
        </div>
        {selectedCert && (
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs">
              <Printer className="h-4 w-4 mr-1.5" /> Print / Download PDF
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading certificate credentials...</span>
        </div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Certificates Available</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Complete an internship and all required deliverables to receive an official verified certificate of completion.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Certificate Selector for multiple completed internships */}
          {certificates.length > 1 && (
            <Card className="print:hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                  Completed Internship Certificates ({certificates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-wrap gap-2">
                {certificates.map((cert, idx) => (
                  <Button
                    key={cert.id}
                    variant={selectedCert?.id === cert.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCert(cert)}
                    className="text-xs"
                  >
                    <Award className="h-3.5 w-3.5 mr-1" />
                    {idx + 1}. {cert.internshipTitle} ({cert.companyName})
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {selectedCert && (
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
                      {selectedCert.studentName || profile?.displayName || 'Student'}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                      for outstanding performance and successful completion of the <strong className="text-slate-900">{selectedCert.internshipTitle}</strong> program at <strong className="text-slate-900">{selectedCert.companyName}</strong> under the mentorship of <strong className="text-slate-900">{selectedCert.mentorName}</strong> with an overall performance rating of <strong className="text-amber-700 font-bold">{selectedCert.overallRating || 5.0}.0 / 5.0</strong>.
                    </p>
                    {(selectedCert.startDate || selectedCert.endDate) && (
                      <p className="text-xs text-slate-500">
                        Duration: {selectedCert.startDate} {selectedCert.endDate ? `to ${selectedCert.endDate}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-sm">{selectedCert.mentorName}</p>
                      <p className="text-[11px] text-slate-500">Industrial Mentor · {selectedCert.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[11px] font-bold text-slate-700">ID: CERT-{selectedCert.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[11px] text-slate-500">Completion Date: {selectedCert.completionDate || selectedCert.issuedAt?.slice(0, 10)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
