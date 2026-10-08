"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, Loader2, Printer } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { getDocuments } from "@/lib/firebase/firestore";
import { Certificate } from "@/lib/types";

interface CertificatePrintData {
  certificateId: string;
  studentName: string;
  internshipTitle: string;
  companyName: string;
  mentorName: string;
  startDate: string;
  endDate: string;
  completionDate: string;
  issueDate: string;
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function openCertificateForPrint(data: CertificatePrintData) {
  const certificateWindow = window.open("", "_blank", "width=1200,height=850");

  if (!certificateWindow) {
    throw new Error(
      "The certificate window was blocked by your browser. Please allow pop-ups and try again.",
    );
  }

  const verificationUrl = `${window.location.origin}/verify/${encodeURIComponent(
    data.certificateId,
  )}`;

  certificateWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(data.certificateId)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            background: #f1f5f9;
            font-family: Georgia, 'Times New Roman', serif;
          }

          .page {
            width: 1123px;
            height: 794px;
            margin: 30px auto;
            background: white;
            position: relative;
            overflow: hidden;
            border: 18px solid #4c1d95;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          }

          .inner-border {
            position: absolute;
            inset: 18px;
            border: 2px solid #c4b5fd;
            pointer-events: none;
          }

          .content {
            height: 100%;
            padding: 62px 90px 55px;
            text-align: center;
            position: relative;
            z-index: 2;
          }

          .brand {
            font-family: Arial, sans-serif;
            font-size: 17px;
            font-weight: 700;
            letter-spacing: 4px;
            color: #5b21b6;
            text-transform: uppercase;
            margin-top: 4px;
          }

          .title {
            margin-top: 18px;
            font-size: 46px;
            letter-spacing: 5px;
            color: #1e1b4b;
            font-weight: 700;
            text-transform: uppercase;
          }

          .subtitle {
            margin-top: 7px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            letter-spacing: 3px;
            color: #64748b;
            text-transform: uppercase;
          }

          .presented {
            margin-top: 38px;
            font-family: Arial, sans-serif;
            font-size: 15px;
            color: #64748b;
          }

          .student {
            margin-top: 8px;
            font-size: 39px;
            color: #4c1d95;
            font-weight: 700;
          }

          .line {
            width: 580px;
            height: 1px;
            background: #cbd5e1;
            margin: 10px auto 24px;
          }

          .statement {
            max-width: 820px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            font-size: 17px;
            line-height: 1.75;
            color: #334155;
          }

          .highlight {
            color: #4c1d95;
            font-weight: 700;
          }

          .details {
            display: flex;
            justify-content: center;
            gap: 75px;
            margin-top: 35px;
            font-family: Arial, sans-serif;
          }

          .detail {
            min-width: 180px;
          }

          .detail-label {
            font-size: 11px;
            color: #94a3b8;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .detail-value {
            font-size: 14px;
            color: #1e293b;
            font-weight: 700;
          }

          .footer {
            position: absolute;
            left: 90px;
            right: 90px;
            bottom: 42px;
            display: flex;
            justify-content: space-between;
            align-items: end;
            font-family: Arial, sans-serif;
          }

          .signature {
            width: 220px;
            text-align: center;
          }

          .signature-line {
            border-top: 1px solid #64748b;
            margin-bottom: 7px;
          }

          .signature-name {
            font-size: 12px;
            font-weight: 700;
            color: #334155;
          }

          .signature-role {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 3px;
          }

          .certificate-id {
            position: absolute;
            bottom: 12px;
            left: 0;
            right: 0;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 9px;
            color: #94a3b8;
            letter-spacing: 1px;
          }

          .seal {
            position: absolute;
            right: 52px;
            top: 55px;
            width: 88px;
            height: 88px;
            border: 2px solid #7c3aed;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6d28d9;
            font-family: Arial, sans-serif;
            font-size: 10px;
            font-weight: 700;
            text-align: center;
            letter-spacing: 1px;
            transform: rotate(8deg);
          }

          .verification {
            position: absolute;
            left: 52px;
            top: 60px;
            width: 145px;
            font-family: Arial, sans-serif;
            font-size: 8px;
            color: #94a3b8;
            line-height: 1.4;
            text-align: left;
          }

          @media print {
            @page {
              size: A4 landscape;
              margin: 0;
            }

            body {
              background: white;
            }

            .page {
              margin: 0;
              box-shadow: none;
              width: 297mm;
              height: 210mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="page">
          <div class="inner-border"></div>

          <div class="verification">
            DIGITAL VERIFICATION<br />
            ${escapeHtml(verificationUrl)}
          </div>

          <div class="seal">
            INTERN<br />
            NEXUS<br />
            VERIFIED
          </div>

          <div class="content">
            <div class="brand">
              InternNexus
            </div>

            <div class="title">
              Certificate of Internship
            </div>

            <div class="subtitle">
              Internship Completion Certificate
            </div>

            <div class="presented">
              This certificate is proudly presented to
            </div>

            <div class="student">
              ${escapeHtml(data.studentName)}
            </div>

            <div class="line"></div>

            <div class="statement">
              This is to certify that
              <span class="highlight">
                ${escapeHtml(data.studentName)}
              </span>
              has successfully completed the internship in
              <span class="highlight">
                ${escapeHtml(data.internshipTitle)}
              </span>
              at
              <span class="highlight">
                ${escapeHtml(data.companyName)}
              </span>.
              The internship was successfully completed under
              the guidance and supervision of the assigned
              industrial mentor.
            </div>

            <div class="details">
              <div class="detail">
                <div class="detail-label">
                  Internship Period
                </div>

                <div class="detail-value">
                  ${escapeHtml(formatDate(data.startDate))}
                  -
                  ${escapeHtml(formatDate(data.endDate))}
                </div>
              </div>

              <div class="detail">
                <div class="detail-label">
                  Industrial Mentor
                </div>

                <div class="detail-value">
                  ${escapeHtml(data.mentorName)}
                </div>
              </div>

              <div class="detail">
                <div class="detail-label">
                  Date of Issue
                </div>

                <div class="detail-value">
                  ${escapeHtml(formatDate(data.issueDate))}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>

              <div class="signature-name">
                Industrial Mentor
              </div>

              <div class="signature-role">
                ${escapeHtml(data.mentorName)}
              </div>
            </div>

            <div class="signature">
              <div class="signature-line"></div>

              <div class="signature-name">
                HR / Authorized Representative
              </div>

              <div class="signature-role">
                ${escapeHtml(data.companyName)}
              </div>
            </div>
          </div>

          <div class="certificate-id">
            Certificate ID:
            ${escapeHtml(data.certificateId)}
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);

  certificateWindow.document.close();
}

export default function StudentCertificatePage() {
  const { profile } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    async function fetchCertificates() {
      if (!profile?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const certDocs = await getDocuments<Certificate>("certificates");

        const myCerts = certDocs.filter(
          (certificate) =>
            certificate.studentId === profile.uid &&
            certificate.status === "issued",
        );

        setCertificates(myCerts);

        if (myCerts.length > 0) {
          setSelectedCert(myCerts[0]);
        }
      } catch (err) {
        console.error("Error fetching certificates:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificates();
  }, [profile]);

  const getCertificateId = (certificate: Certificate) => {
    /*
     * HR-generated certificate IDs may be stored
     * separately from the Firestore document ID.
     *
     * Your current Certificate type appears to
     * use the Firestore document ID as the available
     * identifier, so use that consistently here.
     */
    return `INT-${new Date(
      certificate.issuedAt || certificate.createdAt || new Date().toISOString(),
    ).getFullYear()}-${certificate.id.slice(0, 6).toUpperCase()}`;
  };

  const handlePrint = () => {
    if (!selectedCert) {
      return;
    }

    setPrinting(true);

    try {
      const certificateId = getCertificateId(selectedCert);

      const certificateData: CertificatePrintData = {
        certificateId,

        studentName:
          selectedCert.studentName || profile?.displayName || "Student",

        internshipTitle: selectedCert.internshipTitle || "Internship",

        companyName: selectedCert.companyName || "Company",

        mentorName: selectedCert.mentorName || "Industrial Mentor",

        startDate: selectedCert.startDate || "",

        endDate: selectedCert.endDate || "",

        completionDate:
          selectedCert.completionDate || selectedCert.issuedAt || "",

        issueDate:
          selectedCert.issuedAt ||
          selectedCert.createdAt ||
          new Date().toISOString(),
      };

      openCertificateForPrint(certificateData);
    } catch (err) {
      console.error("Error opening certificate:", err);

      window.alert(
        err instanceof Error ? err.message : "Unable to open certificate.",
      );
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Digital Internship Certificates
          </h1>

          <p className="text-xs text-slate-500">
            Official verified completion credentials for completed internships
          </p>
        </div>

        {selectedCert && (
          <Button
            onClick={handlePrint}
            disabled={printing}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
          >
            {printing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Opening Certificate...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-1.5" />
                Print / Download PDF
              </>
            )}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />

          <span className="ml-3 text-sm text-slate-500 font-medium">
            Loading certificate credentials...
          </span>
        </div>
      ) : certificates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Award className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">
              No Certificates Available
            </h3>

            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Complete an internship and all required deliverables to receive an
              official verified certificate of completion.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {certificates.length > 1 && (
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-purple-600" />

                  <p className="text-xs font-semibold uppercase text-slate-500">
                    Completed Internship Certificates ({certificates.length})
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {certificates.map((certificate, index) => (
                    <Button
                      key={certificate.id}
                      variant={
                        selectedCert?.id === certificate.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCert(certificate)}
                      className="text-xs"
                    >
                      <Award className="h-3.5 w-3.5 mr-1" />
                      {index + 1}. {certificate.internshipTitle}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedCert && (
            <Card>
              <CardContent className="p-6">
                <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />

                        <p className="font-bold text-slate-900">
                          Certificate Issued
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        Your official certificate is available for viewing and
                        PDF download.
                      </p>
                    </div>

                    <Badge variant="success" className="w-fit">
                      Verified Certificate
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Student
                      </p>

                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {selectedCert.studentName || profile?.displayName}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Internship
                      </p>

                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {selectedCert.internshipTitle}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Company
                      </p>

                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        {selectedCert.companyName}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        Certificate ID
                      </p>

                      <p className="text-sm font-semibold text-purple-700 mt-1">
                        {getCertificateId(selectedCert)}
                      </p>
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
