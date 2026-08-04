export const APP_NAME = 'InternNexus';

export const ROLES = {
  STUDENT: 'student',
  HR: 'hr',
  MENTOR: 'mentor',
  ADMIN: 'admin',
} as const;

export const INTERNSHIP_DOMAINS = [
  'Software Development',
  'Web Development',
  'Mobile Development',
  'Data Science & ML',
  'Artificial Intelligence',
  'Cloud & DevOps',
  'Cybersecurity',
  'UI/UX Design',
  'Product Management',
  'Business Analysis',
  'Marketing & Growth',
  'Finance & Accounting',
  'Human Resources',
  'Operations',
  'Research & Development',
];

export const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1–10)' },
  { value: 'small', label: 'Small (11–50)' },
  { value: 'medium', label: 'Medium (51–200)' },
  { value: 'large', label: 'Large (201–1000)' },
  { value: 'enterprise', label: 'Enterprise (1000+)' },
];

export const INTERNSHIP_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  ai_reviewed: 'AI Reviewed',
  hr_shortlisted: 'Shortlisted',
  mentor_assigned: 'Mentor Assigned',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_needed: 'Revision Needed',
};

export const COMPANY_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  ai_reviewed: 'bg-purple-50 text-purple-700 border-purple-200',
  hr_shortlisted: 'bg-blue-50 text-blue-700 border-blue-200',
  mentor_assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  withdrawn: 'bg-gray-50 text-gray-600 border-gray-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  submitted: 'bg-purple-50 text-purple-700 border-purple-200',
  revision_needed: 'bg-orange-50 text-orange-700 border-orange-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  draft: 'bg-gray-50 text-gray-600 border-gray-200',
  closed: 'bg-slate-50 text-slate-600 border-slate-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
};

export const STUDENT_NAV_ITEMS = [
  { label: 'Dashboard', href: '/student/dashboard', icon: 'LayoutDashboard' },
  { label: 'My Profile', href: '/student/profile', icon: 'User' },
  { label: 'Resume & AI', href: '/student/resume', icon: 'FileText' },
  { label: 'Browse Internships', href: '/student/internships', icon: 'Search' },
  { label: 'My Applications', href: '/student/applications', icon: 'ClipboardList' },
  { label: 'My Mentor', href: '/student/mentor', icon: 'GraduationCap' },
  { label: 'Tasks', href: '/student/tasks', icon: 'CheckSquare' },
  { label: 'Submissions', href: '/student/submissions', icon: 'Upload' },
  { label: 'Progress', href: '/student/progress', icon: 'TrendingUp' },
  { label: 'Certificate', href: '/student/certificate', icon: 'Award' },
  { label: 'Settings', href: '/student/settings', icon: 'Settings' },
];

export const HR_NAV_ITEMS = [
  { label: 'Dashboard', href: '/hr/dashboard', icon: 'LayoutDashboard' },
  { label: 'Company Profile', href: '/hr/company', icon: 'Building2' },
  { label: 'Internships', href: '/hr/internships', icon: 'Briefcase' },
  { label: 'Applicants', href: '/hr/applicants', icon: 'Users' },
  { label: 'Mentor Assignment', href: '/hr/mentor-recommendation', icon: 'UserCheck' },
  { label: 'Active Interns', href: '/hr/interns', icon: 'Activity' },
  { label: 'Certificates', href: '/hr/certificates', icon: 'Award' },
  { label: 'Reports', href: '/hr/reports', icon: 'BarChart3' },
  { label: 'Settings', href: '/hr/settings', icon: 'Settings' },
];

export const MENTOR_NAV_ITEMS = [
  { label: 'Dashboard', href: '/mentor/dashboard', icon: 'LayoutDashboard' },
  { label: 'My Students', href: '/mentor/students', icon: 'Users' },
  { label: 'AI Task Generator', href: '/mentor/task-generator', icon: 'Sparkles' },
  { label: 'Task Management', href: '/mentor/tasks', icon: 'CheckSquare' },
  { label: 'Submissions', href: '/mentor/submissions', icon: 'Inbox' },
  { label: 'Feedback', href: '/mentor/feedback', icon: 'MessageSquare' },
  { label: 'Progress Tracking', href: '/mentor/progress', icon: 'TrendingUp' },
  { label: 'Final Evaluation', href: '/mentor/evaluation', icon: 'Star' },
];

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: 'LayoutDashboard' },
  { label: 'Approve Companies', href: '/admin/approve-companies', icon: 'ShieldCheck' },
  { label: 'Companies', href: '/admin/companies', icon: 'Building2' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' },
  { label: 'Reports', href: '/admin/reports', icon: 'FileBarChart' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
];
