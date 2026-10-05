import type { ProjectTaskRoadmap } from '@/lib/types';

export interface MenteeInfo {
  id: string;
  name: string;
  skills?: string[];
  role?: string;
}

export async function analyzeProjectAndGenerateRoadmap(
  projectTitle: string,
  domain: string,
  projectDescription: string,
  mentees: MenteeInfo[] = []
): Promise<ProjectTaskRoadmap[]> {
  // Input Validation
  const cleanTitle = (projectTitle || '').trim();
  const cleanDesc = (projectDescription || '').trim();

  if (!cleanDesc) {
    throw new Error('Project description is empty. Please enter detailed project specifications before running AI analysis.');
  }

  if (cleanDesc.length < 15) {
    throw new Error('Project description is too short. Please provide a more descriptive summary of project features and requirements.');
  }

  // Simulate latency
  await new Promise((res) => setTimeout(res, 1400));

  const textLower = cleanDesc.toLowerCase();
  const titleLower = cleanTitle.toLowerCase();

  // Dynamic requirement breakdown based on project text
  const extractedRequirements: {
    title: string;
    description: string;
    instructions: string;
    estimatedHours: number;
    resources: string[];
    tags: string[];
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dependencies: string[];
  }[] = [];

  // Keyword-driven intelligent requirement decomposition
  const hasAuthOrUsers = textLower.includes('student') || textLower.includes('user') || textLower.includes('login') || textLower.includes('profile') || textLower.includes('auth') || textLower.includes('registration');
  const hasResume = textLower.includes('resume') || textLower.includes('cv') || textLower.includes('upload');
  const hasInternship = textLower.includes('internship') || textLower.includes('job') || textLower.includes('posting') || textLower.includes('listing') || textLower.includes('apply') || textLower.includes('application');
  const hasCompany = textLower.includes('company') || textLower.includes('hr') || textLower.includes('employer');
  const hasMentor = textLower.includes('mentor') || textLower.includes('assign') || textLower.includes('guidance');
  const hasTaskOrSubmission = textLower.includes('task') || textLower.includes('submission') || textLower.includes('review') || textLower.includes('feedback');
  const hasAnalyticsOrCert = textLower.includes('progress') || textLower.includes('certificate') || textLower.includes('report') || textLower.includes('analytics');

  // E-Commerce / Store keywords
  const hasCartOrOrder = textLower.includes('cart') || textLower.includes('checkout') || textLower.includes('order') || textLower.includes('payment') || textLower.includes('ecommerce');

  // AI / ML keywords
  const hasAIorML = textLower.includes('ai') || textLower.includes('machine learning') || textLower.includes('model') || textLower.includes('dataset') || textLower.includes('prediction');

  // Task 1: Authentication & User Profiles
  if (hasAuthOrUsers || (!hasCartOrOrder && !hasAIorML)) {
    extractedRequirements.push({
      title: `Student Registration & Profile Management`,
      description: `Build user authentication and comprehensive profile management views for students and mentors in ${cleanTitle}.`,
      instructions: `1. Design registration form with validation for email, university, GPA, and skills.\n2. Implement user profile page with editable fields.\n3. Integrate authentication logic and session storage.`,
      estimatedHours: 16,
      resources: ['Authentication Flow Specs', 'Form Validation & UI Guidelines'],
      tags: ['Frontend', 'Authentication', 'UI/UX', 'Profiles'],
      priority: 'HIGH',
      dependencies: [],
    });
  }

  // Task 2: Resume / Document Management
  if (hasResume) {
    extractedRequirements.push({
      title: `Resume Upload & Parser Module`,
      description: `Construct secure resume upload pipeline with PDF viewer and structured skill extraction for candidate applications.`,
      instructions: `1. Implement drag-and-drop file uploader accepting PDF/DOCX formats.\n2. Add file validation (max 5MB, mime-type check).\n3. Store files securely and extract parsed skills into student profile state.`,
      estimatedHours: 18,
      resources: ['File Upload Security Guide', 'PDF Parser Reference'],
      tags: ['Backend', 'Storage', 'File Upload', 'Parser'],
      priority: 'HIGH',
      dependencies: ['Student Registration & Profile Management'],
    });
  }

  // Task 3: Internship Listings & Search
  if (hasInternship) {
    extractedRequirements.push({
      title: `Internship Opportunity Directory & Advanced Filtering`,
      description: `Develop search and multi-criteria filtering interface for students to browse active internship openings.`,
      instructions: `1. Build responsive internship card list grid with pagination.\n2. Implement search input and domain/location/mode filters.\n3. Create detailed internship modal view with requirements and apply button.`,
      estimatedHours: 20,
      resources: ['Search & Filter Component Standards', 'API Query Optimization'],
      tags: ['Frontend', 'Search', 'Filter', 'UI Grid'],
      priority: 'HIGH',
      dependencies: ['Student Registration & Profile Management'],
    });
  }

  // Task 4: Company & HR Portal
  if (hasCompany) {
    extractedRequirements.push({
      title: `Company Dashboard & Internship Posting Management`,
      description: `Create employer interface for companies and HR personnel to post new internships and review applicants.`,
      instructions: `1. Design internship creation form with skills, stipend, openings, and deadline fields.\n2. Build applicant management dashboard displaying applicant status.\n3. Add applicant shortlisting and status update triggers.`,
      estimatedHours: 22,
      resources: ['HR Workflow Specs', 'Applicant Tracking System (ATS) Patterns'],
      tags: ['Full Stack', 'HR Portal', 'ATS', 'Forms'],
      priority: 'HIGH',
      dependencies: ['Internship Opportunity Directory & Advanced Filtering'],
    });
  }

  // Task 5: Mentor Assignment & Matching
  if (hasMentor) {
    extractedRequirements.push({
      title: `Industrial Mentor Recommendation & Student Assignment`,
      description: `Implement mentor-student matching logic based on domain expertise, current mentor workload, and company assignment.`,
      instructions: `1. Build mentor recommendation scoring function comparing mentor skills to internship domains.\n2. Implement HR mentor assignment UI with manual override capability.\n3. Send automated assignment notifications upon confirmation.`,
      estimatedHours: 20,
      resources: ['Mentor Matching Algorithm Guide', 'Notification System Docs'],
      tags: ['Backend', 'Matching Algorithm', 'Mentor Portal'],
      priority: 'MEDIUM',
      dependencies: ['Company Dashboard & Internship Posting Management'],
    });
  }

  // Task 6: Task Tracking & Submissions
  if (hasTaskOrSubmission) {
    extractedRequirements.push({
      title: `Mentor Task Assignment & Student Deliverable Submission`,
      description: `Develop task delivery system where mentors assign milestone tasks and students upload code/project deliverables.`,
      instructions: `1. Create task generation interface for mentors to specify instructions and due dates.\n2. Build student submission page with GitHub URL input and deliverable upload.\n3. Implement mentor review panel with grade rating and feedback controls.`,
      estimatedHours: 24,
      resources: ['Task Workflow Checklist', 'Submission Feedback Guidelines'],
      tags: ['Full Stack', 'Task Management', 'Submissions', 'Feedback'],
      priority: 'HIGH',
      dependencies: ['Industrial Mentor Recommendation & Student Assignment'],
    });
  }

  // Task 7: Progress Analytics & Certification
  if (hasAnalyticsOrCert) {
    extractedRequirements.push({
      title: `Student Internship Progress Tracker & Certificate Generation`,
      description: `Implement milestone completion progress bar, final evaluation portal, and automated certificate generation.`,
      instructions: `1. Calculate real-time completion percentage based on approved tasks.\n2. Build final mentor evaluation questionnaire.\n3. Generate downloadable digital internship completion certificate upon 100% approval.`,
      estimatedHours: 18,
      resources: ['Certificate Generation Library', 'Analytics Dashboard Specs'],
      tags: ['Analytics', 'Progress', 'Certificates', 'Reporting'],
      priority: 'MEDIUM',
      dependencies: ['Mentor Task Assignment & Student Deliverable Submission'],
    });
  }

  // Special E-Commerce fallback if project description is e-commerce related
  if (hasCartOrOrder && extractedRequirements.length < 3) {
    extractedRequirements.push(
      {
        title: `Product Catalog & Search Engine`,
        description: `Implement searchable product catalog with categorization, dynamic pricing, and inventory tracking for ${cleanTitle}.`,
        instructions: `1. Create responsive product grid with filter controls.\n2. Implement inventory query API.\n3. Add real-time stock availability indicators.`,
        estimatedHours: 20,
        resources: ['Catalog Specs', 'State Management Guide'],
        tags: ['Frontend', 'E-Commerce', 'Catalog'],
        priority: 'HIGH',
        dependencies: [],
      },
      {
        title: `Shopping Cart & Secure Checkout Pipeline`,
        description: `Construct client-side cart management and payment processing integration.`,
        instructions: `1. Build interactive cart drawer with quantity modifiers.\n2. Integrate Stripe/PayPal checkout flow.\n3. Add order confirmation email trigger.`,
        estimatedHours: 24,
        resources: ['Stripe Integration Docs', 'Cart Persistence Guide'],
        tags: ['Full Stack', 'Payments', 'Checkout'],
        priority: 'HIGH',
        dependencies: ['Product Catalog & Search Engine'],
      }
    );
  }

  // Fallback for general custom software if fewer than 3 requirement tasks were extracted
  if (extractedRequirements.length < 3) {
    extractedRequirements.push(
      {
        title: `${cleanTitle}: Core Feature Module Setup`,
        description: `Implement primary domain features and business logic based on specification: "${cleanDesc.slice(0, 80)}..."`,
        instructions: `1. Review feature requirements and outline component hierarchy.\n2. Build API service controllers.\n3. Integrate views with state management.`,
        estimatedHours: 22,
        resources: ['Feature Specification Guide', 'API Design Patterns'],
        tags: [domain || 'Software Development', 'Feature Module'],
        priority: 'HIGH',
        dependencies: [],
      },
      {
        title: `${cleanTitle}: Data Processing & API Integration`,
        description: `Construct API endpoints and database operations matching project specifications.`,
        instructions: `1. Define data models and validation schemas.\n2. Build API endpoints with error handling.\n3. Write unit tests for core methods.`,
        estimatedHours: 25,
        resources: ['API Endpoint Reference'],
        tags: ['API', 'Backend', 'Data Processing'],
        priority: 'HIGH',
        dependencies: [`${cleanTitle}: Core Feature Module Setup`],
      }
    );
  }

  // Skill-Aware Mentee Matching Helper
  const availableMentees = mentees.length > 0
    ? mentees
    : [
        { id: 'std-1', name: 'Alex Rivera', skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind', 'HTML', 'CSS'] },
        { id: 'std-2', name: 'Priya Sharma', skills: ['Node.js', 'Express', 'Firebase', 'REST APIs', 'SQL'] },
        { id: 'std-3', name: 'Rohan Verma', skills: ['Backend', 'Python', 'System Architecture', 'Database', 'Docker'] },
        { id: 'std-4', name: 'Ananya Iyer', skills: ['UI/UX', 'Figma', 'Frontend', 'Analytics', 'React'] },
      ];

  const finalRoadmap: ProjectTaskRoadmap[] = extractedRequirements.map((req, idx) => {
    const stepIndex = idx + 1;

    // Determine best mentee match based on skills & task tags
    let bestMentee = availableMentees[idx % availableMentees.length];
    let highestScore = -1;
    let matchReasoning = `Recommended based on general domain alignment.`;

    for (const mentee of availableMentees) {
      const menteeSkills = (mentee.skills || []).map((s) => s.toLowerCase());
      let score = 0;
      const matchedSkillsList: string[] = [];

      req.tags.forEach((tag) => {
        const tagLower = tag.toLowerCase();
        menteeSkills.forEach((skill) => {
          if (skill.includes(tagLower) || tagLower.includes(skill)) {
            score += 2;
            if (!matchedSkillsList.includes(skill)) matchedSkillsList.push(skill);
          }
        });
      });

      if (score > highestScore) {
        highestScore = score;
        bestMentee = mentee;
        if (matchedSkillsList.length > 0) {
          matchReasoning = `Matches mentee's skills in ${matchedSkillsList.slice(0, 3).join(', ')}.`;
        } else {
          matchReasoning = `Recommended for ${req.priority.toLowerCase()} priority ${req.tags[0] || 'development'} task based on mentee workload.`;
        }
      }
    }

    return {
      stepIndex,
      title: req.title,
      description: req.description,
      instructions: req.instructions,
      estimatedHours: req.estimatedHours,
      resources: req.resources,
      tags: req.tags,
      priority: req.priority,
      suggestedMenteeId: bestMentee.id,
      suggestedMenteeName: bestMentee.name,
      matchReasoning,
      dependencies: req.dependencies,
    };
  });

  return finalRoadmap;
}
