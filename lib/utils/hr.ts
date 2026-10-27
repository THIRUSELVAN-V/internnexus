import type { Application, Internship, MentorAssignment, Certificate, HRProfile, UserProfile } from '@/lib/types';

/**
 * Checks if an internship belongs to the current HR user or their company.
 */
export function isHROwnedInternship(
  internship: Internship,
  profile: UserProfile | null
): boolean {
  if (!profile || !profile.uid) return false;
  const hr = profile as HRProfile;
  if (internship.hrId === profile.uid) return true;
  if (hr.companyId && internship.companyId === hr.companyId) return true;
  return false;
}

/**
 * Filters a list of internships to only those belonging to the logged-in HR.
 */
export function filterHRInternships(
  internships: Internship[],
  profile: UserProfile | null
): Internship[] {
  if (!profile || !profile.uid) return [];
  return internships.filter((item) => isHROwnedInternship(item, profile));
}

/**
 * Filters a list of applications to only those belonging to the logged-in HR's internships or company.
 */
export function filterHRApplications(
  applications: Application[],
  myInternships: Internship[],
  profile: UserProfile | null
): Application[] {
  if (!profile || !profile.uid) return [];
  const hr = profile as HRProfile;
  const myInternshipIds = new Set(myInternships.map((i) => i.id));

  return applications.filter((app) => {
    if (app.internshipId && myInternshipIds.has(app.internshipId)) return true;
    if (hr.companyId && app.companyId === hr.companyId) return true;
    return false;
  });
}

/**
 * Filters a list of mentor assignments to only those belonging to the logged-in HR's internships or company.
 */
export function filterHRAssignments(
  assignments: MentorAssignment[],
  myInternships: Internship[],
  profile: UserProfile | null
): MentorAssignment[] {
  if (!profile || !profile.uid) return [];
  const hr = profile as HRProfile;
  const myInternshipIds = new Set(myInternships.map((i) => i.id));

  return assignments.filter((assign) => {
    if (assign.internshipId && myInternshipIds.has(assign.internshipId)) return true;
    if (hr.companyId && assign.companyId === hr.companyId) return true;
    return false;
  });
}

/**
 * Filters a list of certificates to only those belonging to the logged-in HR's internships or company.
 */
export function filterHRCertificates(
  certificates: Certificate[],
  myInternships: Internship[],
  profile: UserProfile | null
): Certificate[] {
  if (!profile || !profile.uid) return [];
  const hr = profile as HRProfile;
  const myInternshipIds = new Set(myInternships.map((i) => i.id));

  return certificates.filter((cert) => {
    if (cert.internshipId && myInternshipIds.has(cert.internshipId)) return true;
    if (hr.companyId && cert.companyId === hr.companyId) return true;
    return false;
  });
}
