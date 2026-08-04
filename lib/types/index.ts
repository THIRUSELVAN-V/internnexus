// TypeScript type definitions for InternNexus

export type UserRole = 'student' | 'hr' | 'mentor' | 'admin';

export type ApplicationStatus =
  | 'pending'
  | 'ai_reviewed'
  | 'hr_shortlisted'
  | 'mentor_assigned'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type TaskStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'revision_needed';

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type InternshipStatus = 'draft' | 'active' | 'closed' | 'completed';

export type MentorAssignmentStatus = 'pending' | 'accepted' | 'declined';

export type CertificateStatus = 'not_generated' | 'generated' | 'issued';

// ─── User ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile extends UserProfile {
  role: 'student';
  university?: string;
  degree?: string;
  graduationYear?: number;
  skills?: string[];
  gpa?: number;
  resumeURL?: string;
  resumeAnalysis?: ResumeAnalysis;
  linkedinURL?: string;
  githubURL?: string;
  portfolioURL?: string;
  bio?: string;
  location?: string;
  companyId?: string;
  currentInternshipId?: string;
}

export interface HRProfile extends UserProfile {
  role: 'hr';
  companyId?: string;
  companyName?: string;
  designation?: string;
  department?: string;
}

export interface MentorProfile extends UserProfile {
  role: 'mentor';
  companyId?: string;
  companyName?: string;
  designation?: string;
  expertise?: string[];
  yearsOfExperience?: number;
  currentWorkload?: number; // number of active mentees
  maxMentees?: number;
  bio?: string;
  linkedinURL?: string;
}

export interface AdminProfile extends UserProfile {
  role: 'admin';
  permissions?: string[];
}

// ─── Company ────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  website?: string;
  logoURL?: string;
  location: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  status: CompanyStatus;
  hrId: string;
  hrName: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  internshipsCount?: number;
  activeInternsCount?: number;
}

// ─── Internship ──────────────────────────────────────────────────────────────

export interface Internship {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoURL?: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  domain: string;
  duration: number; // weeks
  stipend?: number;
  location: string;
  mode: 'remote' | 'onsite' | 'hybrid';
  openings: number;
  applicationDeadline: string;
  startDate: string;
  status: InternshipStatus;
  hrId: string;
  createdAt: string;
  updatedAt: string;
  applicantsCount?: number;
  selectedCount?: number;
}

// ─── Application ─────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  internshipId: string;
  internshipTitle: string;
  companyId: string;
  companyName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  resumeURL: string;
  coverLetter?: string;
  status: ApplicationStatus;
  aiAnalysis?: ResumeAnalysis;
  matchScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  matchReasoning?: string;
  hrNotes?: string;
  appliedAt: string;
  updatedAt: string;
  mentorId?: string;
  mentorName?: string;
}

// ─── Mentor Assignment ────────────────────────────────────────────────────────

export interface MentorAssignment {
  id: string;
  internshipId: string;
  companyId: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  status: MentorAssignmentStatus;
  aiRecommended: boolean;
  recommendationScore?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  internshipId: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  instructions: string;
  week: number;
  dueDate: string;
  status: TaskStatus;
  aiGenerated: boolean;
  resources?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  submissionId?: string;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  internshipId: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  fileURLs: string[];
  fileTypes: string[];
  description?: string;
  status: TaskStatus;
  aiAnalysis?: SubmissionAnalysis;
  mentorFeedback?: string;
  mentorRating?: number; // 1-5
  submittedAt: string;
  reviewedAt?: string;
  updatedAt: string;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────

export interface Feedback {
  id: string;
  internshipId: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  type: 'weekly' | 'mid_term' | 'final';
  rating: number; // 1-5
  communication: number;
  technicalSkills: number;
  problemSolving: number;
  teamwork: number;
  initiative: number;
  comments: string;
  strengths?: string[];
  improvements?: string[];
  createdAt: string;
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export interface Certificate {
  id: string;
  internshipId: string;
  internshipTitle: string;
  companyId: string;
  companyName: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  startDate: string;
  endDate: string;
  completionDate: string;
  overallRating: number;
  status: CertificateStatus;
  certificateURL?: string;
  issuedAt?: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'application' | 'task' | 'feedback' | 'assignment' | 'certificate' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export interface ResumeAnalysis {
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  education: {
    degree: string;
    institution: string;
    year?: number;
    gpa?: number;
  }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }[];
  certifications: string[];
  overallScore: number; // 0-100
  summary: string;
  strengths: string[];
  improvements: string[];
  analyzedAt: string;
}

export interface CandidateMatch {
  applicationId: string;
  internshipId: string;
  studentId: string;
  matchScore: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
  recommendation: 'strong_match' | 'good_match' | 'partial_match' | 'weak_match';
  analyzedAt: string;
}

export interface MentorRecommendation {
  mentorId: string;
  mentorName: string;
  designation: string;
  expertise: string[];
  matchScore: number; // 0-100
  currentWorkload: number;
  maxMentees: number;
  reasoning: string;
  rank: number;
}

export interface TaskSuggestion {
  week: number;
  title: string;
  description: string;
  instructions: string;
  estimatedHours: number;
  resources: string[];
  tags: string[];
  learningObjectives: string[];
}

export interface SubmissionAnalysis {
  completionStatus: 'complete' | 'partial' | 'incomplete';
  completionPercentage: number;
  summary: string;
  missingSections: string[];
  strengths: string[];
  suggestions: string[];
  codeQuality?: number; // 0-10, if code submission
  documentQuality?: number; // 0-10
  analyzedAt: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalStudents?: number;
  activeInternships?: number;
  pendingReviews?: number;
  assignedMentors?: number;
  totalApplications?: number;
  completedInternships?: number;
  certificatesIssued?: number;
  totalCompanies?: number;
}
