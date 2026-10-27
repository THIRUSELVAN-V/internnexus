'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Award,
  CheckCircle2,
  Loader2,
  Printer,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  getDocuments,
  createDocument,
} from '@/lib/firebase/firestore';
import {
  Certificate,
  MentorAssignment,
  Application,
  Internship,
  HRProfile,
} from '@/lib/types';
import {
  filterHRInternships,
  filterHRAssignments,
  filterHRCertificates,
  filterHRApplications,
} from '@/lib/utils/hr';

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
  certificateId?: string;
}

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
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function generateCertificateId(studentId: string) {
  const year = new Date().getFullYear();
  const studentPart = studentId.slice(0, 6).toUpperCase();
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `INT-${year}-${studentPart}-${randomPart}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openCertificateForPrint(data: CertificatePrintData) {
  const certificateWindow = window.open(
    '',
    '_blank',
    'width=1200,height=850',
  );

  if (!certificateWindow) {
    throw new Error(
      'The certificate window was blocked by your browser. Please allow pop-ups and try again.',
    );
  }

  const verificationUrl =
    `${window.location.origin}/verify/${encodeURIComponent(
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
              The internship was successfully completed under the guidance
              and supervision of the assigned industrial mentor.
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
            Certificate ID: ${escapeHtml(data.certificateId)}
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

export default function HRCertificatesPage() {
  const { profile } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [certRows, setCertRows] = useState<CertRow[]>([]);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);

  const fetchCertificatesData = async () => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [
        assignments,
        certDocs,
        applications,
        internships,
      ] = await Promise.all([
        getDocuments<MentorAssignment>('mentorAssignments'),
        getDocuments<Certificate>('certificates'),
        getDocuments<Application>('applications'),
        getDocuments<Internship>('internships'),
      ]);

      const myInternships = filterHRInternships(
        internships,
        profile,
      );

      const myAssignments = filterHRAssignments(
        assignments,
        myInternships,
        profile,
      );

      const myCertDocs = filterHRCertificates(
        certDocs,
        myInternships,
        profile,
      );

      const myApps = filterHRApplications(
        applications,
        myInternships,
        profile,
      );

      const hr = profile as HRProfile;

      const hrCompany =
        hr?.companyName ||
        (profile.displayName
          ? `${profile.displayName}'s Organization`
          : 'Company');

      const rows: CertRow[] = myAssignments.map((assign) => {
        const app =
          myApps.find(
            (a) =>
              a.studentId === assign.studentId &&
              a.internshipId === assign.internshipId,
          ) ||
          myApps.find(
            (a) => a.studentId === assign.studentId,
          );

        const existingCertificate = myCertDocs.find(
          (certificate) =>
            certificate.studentId === assign.studentId &&
            certificate.internshipId === assign.internshipId,
        );

        const isIssued = Boolean(existingCertificate);

        return {
          id: assign.id,

          internshipId:
            assign.internshipId ||
            app?.internshipId ||
            '',

          companyId:
            assign.companyId ||
            hr?.companyId ||
            '',

          studentId: assign.studentId,

          studentName:
            assign.studentName ||
            'Student',

          role:
            app?.internshipTitle ||
            'Intern',

          companyName:
            app?.companyName ||
            hrCompany,

          mentorId:
            assign.mentorId ||
            '',

          mentorName:
            assign.mentorName ||
            'Assigned Mentor',

          startDate:
            assign.startDate ||
            app?.appliedAt ||
            new Date().toISOString().slice(0, 10),

          endDate:
            assign.endDate ||
            new Date().toISOString().slice(0, 10),

          issueDate:
            existingCertificate?.issuedAt ||
            new Date().toISOString(),

          status:
            isIssued
              ? 'issued'
              : 'ready',

          certificateId:
            existingCertificate?.id,
        };
      });

      setCertRows(rows);
    } catch (err) {
      console.error(
        'Error fetching certificates:',
        err,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificatesData();
  }, [profile]);

  const buildCertificateData = (
    item: CertRow,
    certificateId: string,
  ): CertificatePrintData => {
    return {
      certificateId,

      studentName:
        item.studentName,

      internshipTitle:
        item.role,

      companyName:
        item.companyName,

      mentorName:
        item.mentorName,

      startDate:
        item.startDate,

      endDate:
        item.endDate,

      completionDate:
        new Date().toISOString(),

      issueDate:
        new Date().toISOString(),
    };
  };

  const handleIssueCertificate = async (
    item: CertRow,
  ) => {
    if (!item.internshipId) {
      window.alert(
        'This internship does not have a valid internship ID.',
      );
      return;
    }

    if (!item.studentId) {
      window.alert(
        'This certificate does not have a valid student.',
      );
      return;
    }

    if (!item.companyId) {
      window.alert(
        'This certificate does not have a valid company.',
      );
      return;
    }

    setIssuingId(item.id);

    try {
      /*
       * Prevent duplicate certificates.
       */
      const existingCertificates =
        await getDocuments<Certificate>(
          'certificates',
        );

      const alreadyIssued =
        existingCertificates.find(
          (certificate) =>
            certificate.studentId === item.studentId &&
            certificate.internshipId ===
              item.internshipId,
        );

      if (alreadyIssued) {
        window.alert(
          'A certificate has already been issued for this internship.',
        );

        await fetchCertificatesData();
        return;
      }

      /*
       * Generate a real unique certificate identifier.
       *
       * We deliberately do NOT create a fake
       * Firebase Storage URL because Storage is
       * not being used in the Spark-plan architecture.
       */
      const certificateId =
        generateCertificateId(
          item.studentId,
        );

      const now =
        new Date().toISOString();

      const newCert: Omit<
        Certificate,
        'id'
      > = {
        internshipId:
          item.internshipId,

        internshipTitle:
          item.role,

        companyId:
          item.companyId,

        companyName:
          item.companyName,

        studentId:
          item.studentId,

        studentName:
          item.studentName,

        mentorId:
          item.mentorId,

        mentorName:
          item.mentorName,

        startDate:
          item.startDate,

        endDate:
          item.endDate,

        completionDate:
          now,

        overallRating:
          5.0,

        status:
          'issued',

        /*
         * We intentionally don't store certificateURL.
         *
         * The certificate is represented by its
         * Firestore record + certificate ID and
         * generated as a printable digital document.
         */

        issuedAt:
          now,

        createdAt:
          now,
      };

      const createdCertificate =
        await createDocument(
          'certificates',
          newCert,
        );

      /*
       * createDocument normally returns the
       * generated Firestore document ID.
       *
       * If it does not, the generated certificate
       * ID above is still used for the printed
       * certificate.
       */
      const firestoreId =
        typeof createdCertificate === 'string'
          ? createdCertificate
          : '';

      const printableCertificateId =
        certificateId ||
        firestoreId;

      const certificateData =
        buildCertificateData(
          item,
          printableCertificateId,
        );

      /*
       * Refresh first so the UI immediately
       * changes to "Certificate Issued".
       */
      await fetchCertificatesData();

      /*
       * Generate the actual certificate
       * document for printing / Save as PDF.
       */
      openCertificateForPrint(
        certificateData,
      );
    } catch (err) {
      console.error(
        'Error issuing certificate:',
        err,
      );

      window.alert(
        err instanceof Error
          ? err.message
          : 'Unable to issue the certificate.',
      );
    } finally {
      setIssuingId(null);
    }
  };

  const handlePrintCertificate = async (
    item: CertRow,
  ) => {
    if (!item.certificateId) {
      window.alert(
        'Certificate ID is not available.',
      );
      return;
    }

    setPrintingId(item.id);

    try {
      const certificateData =
        buildCertificateData(
          item,
          item.certificateId,
        );

      openCertificateForPrint(
        certificateData,
      );
    } catch (err) {
      console.error(
        'Error opening certificate:',
        err,
      );

      window.alert(
        err instanceof Error
          ? err.message
          : 'Unable to open certificate.',
      );
    } finally {
      setPrintingId(null);
    }
  };

  const columns: Column<CertRow>[] = [
    {
      key: 'studentName',

      header: 'Student Name',

      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">
            {item.studentName}
          </p>

          <p className="text-xs text-slate-500">
            {item.role}
          </p>
        </div>
      ),
    },

    {
      key: 'mentorName',

      header: 'Industrial Mentor',

      render: (item) => (
        <span className="text-xs font-semibold text-slate-800">
          {item.mentorName}
        </span>
      ),
    },

    {
      key: 'status',

      header: 'Certificate Status',

      render: (item) => (
        <Badge
          variant={
            item.status === 'issued'
              ? 'success'
              : 'warning'
          }
          className="capitalize text-xs font-semibold"
        >
          {item.status === 'issued'
            ? 'Issued & Verified'
            : 'Ready to Issue'}
        </Badge>
      ),
    },

    {
      key: 'actions',

      header: 'Actions',

      render: (item) => {
        const isIssued =
          item.status === 'issued';

        const isIssuing =
          issuingId === item.id;

        const isPrinting =
          printingId === item.id;

        if (isIssued) {
          return (
            <Button
              size="sm"
              onClick={() =>
                handlePrintCertificate(item)
              }
              disabled={
                isPrinting
              }
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <Printer className="h-3.5 w-3.5 mr-1" />
                  View / Print
                </>
              )}
            </Button>
          );
        }

        return (
          <Button
            size="sm"
            onClick={() =>
              handleIssueCertificate(item)
            }
            disabled={isIssuing}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            {isIssuing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Award className="h-3.5 w-3.5 mr-1" />
                Generate Certificate
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
        <h1 className="text-xl font-bold text-slate-900">
          Certificate Generation & Issuance
        </h1>

        <p className="text-xs text-slate-500">
          Generate verified digital internship
          completion certificates for successfully
          completed internships
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-purple-600" />

              <span className="ml-3 text-xs text-slate-500 font-medium">
                Fetching evaluated interns...
              </span>
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