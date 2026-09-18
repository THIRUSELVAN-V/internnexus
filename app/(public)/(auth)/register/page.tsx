'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Zap, Mail, Lock, User as UserIcon, ChevronRight,
  GraduationCap, Building2, UserCheck, Shield, FileText, Upload, Sparkles, AlertCircle, Loader2, CheckCircle2,
  Phone, MapPin, Globe, Hash, Clock, ArrowRight, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { signUp, updateUserProfile } from '@/lib/firebase/auth';
import { setDocument, getDocuments, updateDocument } from '@/lib/firebase/firestore';
import { analyzeResume } from '@/lib/ai/resumeAnalysis';
import { cn } from '@/lib/utils/formatters';
import type { UserRole, StudentProfile, HRProfile, MentorProfile, Company } from '@/lib/types';
import { COMPANY_SIZES } from '@/lib/utils/constants';

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid official/work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type RegisterForm = z.infer<typeof schema>;

const ROLES: { value: UserRole; label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'student', label: 'Student', description: 'Apply to internships and track your progress', icon: GraduationCap, color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'hr', label: 'HR / Employer', description: 'Register company, post internships and manage candidates', icon: Building2, color: 'border-purple-200 bg-purple-50 text-purple-700' },
  { value: 'mentor', label: 'Industrial Mentor', description: 'Guide interns and assign tasks', icon: UserCheck, color: 'border-green-200 bg-green-50 text-green-700' },
  { value: 'admin', label: 'Admin', description: 'Manage the platform and approve companies', icon: Shield, color: 'border-rose-200 bg-rose-50 text-rose-700' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // Resume upload state (students only)
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [processingStage, setProcessingStage] = useState<string | null>(null);

  // HR Personal / Professional Details (HR only)
  const [hrPhone, setHrPhone] = useState('');
  const [designation, setDesignation] = useState('');

  // HR Company Details (HR only)
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [website, setWebsite] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [companySize, setCompanySize] = useState<Company['size']>('startup');
  const [companyDescription, setCompanyDescription] = useState('');

  // HR Post-submission state
  const [hrSuccessSubmitted, setHrSuccessSubmitted] = useState(false);
  const [submittedCompanyName, setSubmittedCompanyName] = useState('');
  const [isLinkedToExisting, setIsLinkedToExisting] = useState(false);

  // Mentor Affiliation (Mentor only)
  const [approvedCompanies, setApprovedCompanies] = useState<Company[]>([]);
  const [selectedMentorCompanyId, setSelectedMentorCompanyId] = useState('');
  const [mentorDesignation, setMentorDesignation] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  // Load approved companies for mentor affiliation
  useEffect(() => {
    async function loadCompanies() {
      try {
        const comps = await getDocuments<Company>('companies');
        const approved = comps.filter((c) => c.status === 'approved');
        setApprovedCompanies(approved);
      } catch (e) {
        console.error('Error loading companies:', e);
      }
    }
    loadCompanies();
  }, []);

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    setStep(2);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setResumeFile(null);
      return;
    }

    const nameLower = file.name.toLowerCase();
    const isValidType = nameLower.endsWith('.pdf') || nameLower.endsWith('.docx') || nameLower.endsWith('.doc');

    if (!isValidType) {
      setFileError('Invalid file format. Please select a PDF or DOCX file.');
      setResumeFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB limit.');
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!role) return;
    setError('');
    setWarningMessage('');
    setProcessingStage(null);

    // Validate HR-specific details
    if (role === 'hr') {
      if (!hrPhone.trim()) {
        setError('Please enter your Phone Number.');
        return;
      }
      const cleanPhone = hrPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Please enter a valid Phone Number (at least 10 digits).');
        return;
      }
      if (!designation.trim()) {
        setError('Please enter your Job Title / Designation (e.g. HR Manager).');
        return;
      }
      if (!companyName.trim()) {
        setError('Please enter your Company Name.');
        return;
      }
      if (!companyAddress.trim()) {
        setError('Please enter the Full Company Address.');
        return;
      }
      if (!city.trim()) {
        setError('Please enter the Company City.');
        return;
      }
      if (!state.trim()) {
        setError('Please enter the Company State.');
        return;
      }
      if (!country.trim()) {
        setError('Please enter the Company Country.');
        return;
      }
      if (!pincode.trim()) {
        setError('Please enter the Postal / Pincode.');
        return;
      }
      if (!officialEmail.trim()) {
        setError('Please enter the Official Company Email.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(officialEmail.trim())) {
        setError('Please enter a valid Official Company Email address.');
        return;
      }
      if (!contactNumber.trim()) {
        setError('Please enter the Company Contact Number.');
        return;
      }
      const cleanCompPhone = contactNumber.replace(/\D/g, '');
      if (cleanCompPhone.length < 10) {
        setError('Please enter a valid Company Contact Number (at least 10 digits).');
        return;
      }
      if (website.trim()) {
        const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
        if (!urlPattern.test(website.trim())) {
          setError('Please enter a valid Website URL (e.g. https://example.com or example.com).');
          return;
        }
      }
      if (registrationNumber.trim()) {
        if (registrationNumber.trim().length < 4 || registrationNumber.trim().length > 30) {
          setError('Registration / Udyam / GST Number must be between 4 and 30 characters.');
          return;
        }
      }
    }

    try {
      // 1. Create Firebase Auth user & basic profile
      setProcessingStage('Creating secure user account...');
      const userProfile = await signUp(data.email, data.password, data.displayName, role);

      // 2. If Student with uploaded resume: AI analysis in memory without file storage
      if (role === 'student' && resumeFile && userProfile?.uid) {
        try {
          setProcessingStage('Reading resume document...');
          await new Promise((res) => setTimeout(res, 300));

          setProcessingStage('Analyzing technical skills with AI...');
          const analysis = await analyzeResume(resumeFile);

          setProcessingStage('Saving structured profile to Firestore...');
          await updateUserProfile(userProfile.uid, {
            resumeAnalysis: analysis,
            skills: analysis.skills || [],
            resumeAnalyzed: true,
            resumeAnalyzedAt: new Date().toISOString(),
          } as Partial<StudentProfile>);
        } catch (resumeErr: unknown) {
          console.error('Resume AI analysis failed during registration:', resumeErr);
          setWarningMessage('Account created! Resume analysis failed, but you can retry anytime from your Student Profile.');
          await new Promise((res) => setTimeout(res, 2000));
        }
      }

      // 3. If Mentor: Associate with selected approved company
      if (role === 'mentor' && userProfile?.uid) {
        const matchedComp = approvedCompanies.find((c) => c.id === selectedMentorCompanyId);
        await updateUserProfile(userProfile.uid, {
          companyId: matchedComp ? matchedComp.id : undefined,
          companyName: matchedComp ? matchedComp.name : undefined,
          designation: mentorDesignation.trim() || 'Industrial Mentor',
        } as Partial<MentorProfile>);
      }

      // 4. If HR: Deduplicate company & set status strictly to 'pending'
      if (role === 'hr' && userProfile?.uid) {
        setProcessingStage('Verifying enterprise records with registry...');
        const allCompanies = await getDocuments<Company>('companies');

        const normName = companyName.trim().toLowerCase();
        const normOfficialEmail = officialEmail.trim().toLowerCase();
        const normRegNo = registrationNumber.trim().toUpperCase();

        let matchedCompany: Company | undefined;

        // A. Match by unique Registration / Udyam / GST Number
        if (normRegNo) {
          matchedCompany = allCompanies.find(
            (c) => c.registrationNumber && c.registrationNumber.trim().toUpperCase() === normRegNo
          );
        }

        // B. Match by Official Company Email
        if (!matchedCompany && normOfficialEmail) {
          matchedCompany = allCompanies.find(
            (c) => c.officialEmail && c.officialEmail.trim().toLowerCase() === normOfficialEmail
          );
        }

        // C. Match by exact normalized Company Name
        if (!matchedCompany && normName) {
          matchedCompany = allCompanies.find(
            (c) => c.name && c.name.trim().toLowerCase() === normName
          );
        }

        let targetCompId: string;
        const fullLocation = `${city.trim()}, ${state.trim()}`;

        if (matchedCompany) {
          // Existing company record found: associate HR without duplicating company
          targetCompId = matchedCompany.id;
          setIsLinkedToExisting(true);
          setSubmittedCompanyName(matchedCompany.name);

          const currentHrIds = matchedCompany.hrIds || (matchedCompany.hrId ? [matchedCompany.hrId] : []);
          const updatedHrIds = Array.from(new Set([...currentHrIds, userProfile.uid]));

          await updateDocument('companies', matchedCompany.id, {
            hrIds: updatedHrIds,
            // Fill in any details if previously unpopulated
            companyAddress: matchedCompany.companyAddress || companyAddress.trim(),
            city: matchedCompany.city || city.trim(),
            state: matchedCompany.state || state.trim(),
            country: matchedCompany.country || country.trim(),
            pincode: matchedCompany.pincode || pincode.trim(),
            officialEmail: matchedCompany.officialEmail || officialEmail.trim(),
            contactNumber: matchedCompany.contactNumber || contactNumber.trim(),
            registrationNumber: matchedCompany.registrationNumber || (registrationNumber.trim() ? registrationNumber.trim().toUpperCase() : undefined),
            updatedAt: new Date().toISOString(),
          });
        } else {
          // New company registration: generate unique ID & save pending company record
          targetCompId = `comp-${userProfile.uid.slice(0, 8)}`;
          setIsLinkedToExisting(false);
          setSubmittedCompanyName(companyName.trim());

          const newCompany: Omit<Company, 'id'> = {
            name: companyName.trim(),
            industry: 'Software & IT Services',
            website: website.trim() || '',
            location: fullLocation,
            companyAddress: companyAddress.trim(),
            city: city.trim(),
            state: state.trim(),
            country: country.trim(),
            pincode: pincode.trim(),
            officialEmail: officialEmail.trim(),
            contactNumber: contactNumber.trim(),
            registrationNumber: registrationNumber.trim() ? registrationNumber.trim().toUpperCase() : '',
            size: companySize || 'startup',
            description: companyDescription.trim() || '',
            status: 'pending', // REQUIRED: Strict initial pending status
            hrId: userProfile.uid,
            hrIds: [userProfile.uid],
            hrName: data.displayName,
            hrEmail: data.email,
            hrPhone: hrPhone.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setDocument('companies', targetCompId, newCompany);
        }

        // Update HR user profile
        await updateUserProfile(userProfile.uid, {
          phone: hrPhone.trim(),
          companyId: targetCompId,
          companyName: matchedCompany ? matchedCompany.name : companyName.trim(),
          designation: designation.trim(),
          approvalStatus: 'pending', // REQUIRED: Strict pending approval
        } as Partial<HRProfile>);

        setProcessingStage(null);
        setHrSuccessSubmitted(true);
        return;
      }

      setProcessingStage('Registration completed! Redirecting...');
      setTimeout(() => {
        router.push(`/${role}/dashboard`);
      }, 800);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('email-already-in-use')) setError('An account with this email already exists.');
      else setError(msg);
      setProcessingStage(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('w-full transition-all duration-300', role === 'hr' && step === 2 && !hrSuccessSubmitted ? 'max-w-2xl' : 'max-w-[540px]')}
      >
        {/* Platform Brand */}
        <Link href="/" className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">InternNexus</span>
        </Link>

        {/* Success Confirmation Screen for HR */}
        {hrSuccessSubmitted ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_25px_rgb(0,0,0,0.06)] p-6 sm:p-8 space-y-6 animate-in fade-in">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="h-7 w-7" />
            </div>

            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                Submitted for Admin Review
              </span>

              <h1 className="text-xl font-bold text-slate-900">
                Registration Submitted Successfully
              </h1>

              {/* Exact required text */}
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-4 text-xs font-medium text-amber-900 leading-relaxed max-w-lg mx-auto">
                Your HR account has been created and is pending Admin verification. You will be able to access HR features after your company is approved.
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Organization</span>
                <span className="font-bold text-slate-900">{submittedCompanyName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Record Association</span>
                <span className="font-semibold text-slate-800">
                  {isLinkedToExisting ? 'Linked to existing registered company' : 'New organization record created'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Initial Status</span>
                <span className="font-semibold text-amber-700 capitalize">pending</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => router.push('/hr/dashboard')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-11"
              >
                Go to Verification Dashboard
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_25px_rgb(0,0,0,0.06)] p-6 sm:p-8">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className={cn('h-1.5 flex-1 rounded-full transition-colors', step >= 1 ? 'bg-blue-600' : 'bg-slate-200')} />
              <div className={cn('h-1.5 flex-1 rounded-full transition-colors', step >= 2 ? 'bg-blue-600' : 'bg-slate-200')} />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
                  <p className="text-xs text-slate-500 mb-5">Choose your role to get started</p>

                  <div className="space-y-2.5">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => handleRoleSelect(r.value)}
                          className="w-full flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-150 group"
                        >
                          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', r.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900">{r.label}</p>
                            <p className="text-[11px] text-slate-500">{r.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-6 text-center text-xs text-slate-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">Sign in</Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                      ← Change Role
                    </button>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      Registering as <strong className="text-slate-900 capitalize">{role === 'hr' ? 'HR / Employer' : role}</strong>
                    </span>
                  </div>

                  <h1 className="text-lg font-bold text-slate-900 mb-1">Registration Information</h1>
                  <p className="text-xs text-slate-500 mb-5">
                    {role === 'hr'
                      ? 'Provide your professional contact details and enterprise information for Admin verification.'
                      : 'Fill in your credentials to complete account setup.'}
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* ─────────────────────────────────────────────────────────────
                        SECTION 1: HR / USER INFORMATION
                    ───────────────────────────────────────────────────────────── */}
                    <div className="space-y-3.5">
                      {role === 'hr' && (
                        <div className="pb-1">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-purple-700">
                            <UserIcon className="h-3.5 w-3.5 text-purple-600" />
                            1. HR Information
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Your official representative details. Please use your official company email.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="displayName" required>Full Name</Label>
                          <div className="mt-1">
                            <Input
                              id="displayName"
                              placeholder="e.g. Sarah Jenkins"
                              leftIcon={<UserIcon className="h-3.5 w-3.5 text-slate-400" />}
                              error={errors.displayName?.message}
                              {...register('displayName')}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="reg-email" required>{role === 'hr' ? 'Official / Work Email' : 'Email'}</Label>
                          <div className="mt-1">
                            <Input
                              id="reg-email"
                              type="email"
                              placeholder={role === 'hr' ? 'sarah@acmecorp.com' : 'you@example.com'}
                              leftIcon={<Mail className="h-3.5 w-3.5 text-slate-400" />}
                              error={errors.email?.message}
                              {...register('email')}
                            />
                          </div>
                        </div>
                      </div>

                      {role === 'hr' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="hrPhone" required>Phone Number</Label>
                            <div className="mt-1">
                              <Input
                                id="hrPhone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                leftIcon={<Phone className="h-3.5 w-3.5 text-slate-400" />}
                                value={hrPhone}
                                onChange={(e) => setHrPhone(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="designation" required>Designation / Job Title</Label>
                            <div className="mt-1">
                              <Input
                                id="designation"
                                placeholder="e.g. Lead Talent Acquisition Partner"
                                value={designation}
                                onChange={(e) => setDesignation(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="reg-password" required>Password</Label>
                          <div className="mt-1">
                            <Input
                              id="reg-password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min 8 characters"
                              leftIcon={<Lock className="h-3.5 w-3.5 text-slate-400" />}
                              rightIcon={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-slate-600 transition-colors">
                                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              }
                              error={errors.password?.message}
                              {...register('password')}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword" required>Confirm Password</Label>
                          <div className="mt-1">
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Re-enter password"
                              leftIcon={<Lock className="h-3.5 w-3.5 text-slate-400" />}
                              error={errors.confirmPassword?.message}
                              {...register('confirmPassword')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        SECTION 2: COMPANY INFORMATION (HR ONLY)
                    ───────────────────────────────────────────────────────────── */}
                    {role === 'hr' && (
                      <div className="pt-4 border-t border-slate-200 space-y-3.5">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-purple-700">
                            <Building2 className="h-3.5 w-3.5 text-purple-600" />
                            2. Company Information
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Required enterprise information for platform administrative verification.
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="companyName" required>Company Name</Label>
                          <div className="mt-1">
                            <Input
                              id="companyName"
                              placeholder="e.g. Acme Innovations Pvt Ltd"
                              leftIcon={<Building2 className="h-3.5 w-3.5 text-slate-400" />}
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Location / Full Address */}
                        <div>
                          <Label htmlFor="companyAddress" required>Full Company Address</Label>
                          <div className="mt-1">
                            <Input
                              id="companyAddress"
                              placeholder="Street Address, Building, Tech Park, Suite No."
                              leftIcon={<MapPin className="h-3.5 w-3.5 text-slate-400" />}
                              value={companyAddress}
                              onChange={(e) => setCompanyAddress(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <Label htmlFor="city" required>City</Label>
                            <Input id="city" placeholder="Bengaluru" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 text-xs" />
                          </div>
                          <div>
                            <Label htmlFor="state" required>State</Label>
                            <Input id="state" placeholder="Karnataka" value={state} onChange={(e) => setState(e.target.value)} className="mt-1 text-xs" />
                          </div>
                          <div>
                            <Label htmlFor="country" required>Country</Label>
                            <Input id="country" placeholder="India" value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 text-xs" />
                          </div>
                          <div>
                            <Label htmlFor="pincode" required>Pincode</Label>
                            <Input id="pincode" placeholder="560100" value={pincode} onChange={(e) => setPincode(e.target.value)} className="mt-1 text-xs" />
                          </div>
                        </div>

                        {/* Official Contact Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="officialEmail" required>Official Company Email</Label>
                            <div className="mt-1">
                              <Input
                                id="officialEmail"
                                type="email"
                                placeholder="contact@acmecorp.com"
                                leftIcon={<Mail className="h-3.5 w-3.5 text-slate-400" />}
                                value={officialEmail}
                                onChange={(e) => setOfficialEmail(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="contactNumber" required>Company Contact Number</Label>
                            <div className="mt-1">
                              <Input
                                id="contactNumber"
                                type="tel"
                                placeholder="+91 80 1234 5678"
                                leftIcon={<Phone className="h-3.5 w-3.5 text-slate-400" />}
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Website & Registration Number */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="website">Company Website (Recommended)</Label>
                            <div className="mt-1">
                              <Input
                                id="website"
                                placeholder="https://acmecorp.com"
                                leftIcon={<Globe className="h-3.5 w-3.5 text-slate-400" />}
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="registrationNumber">Registration / Udyam / GST Number</Label>
                            <div className="mt-1">
                              <Input
                                id="registrationNumber"
                                placeholder="e.g. 29ABCDE1234F1Z5 or UDYAM-XX-00..."
                                leftIcon={<Hash className="h-3.5 w-3.5 text-slate-400" />}
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="companySize">Company Size</Label>
                            <div className="mt-1">
                              <select
                                id="companySize"
                                value={companySize}
                                onChange={(e) => setCompanySize(e.target.value as any)}
                                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                              >
                                {COMPANY_SIZES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="companyDesc">Company Description (Optional)</Label>
                            <Textarea
                              id="companyDesc"
                              placeholder="Brief description of enterprise services..."
                              value={companyDescription}
                              onChange={(e) => setCompanyDescription(e.target.value)}
                              className="mt-1 text-xs min-h-[40px] h-10 py-2"
                              rows={1}
                            />
                          </div>
                        </div>

                        <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-[11px] text-amber-900 leading-relaxed">
                          <strong>Admin Approval Policy:</strong> Newly registered HR accounts start with a <strong>pending</strong> status. An administrator must verify your company information before internship posting and mentee matching unlock.
                        </div>
                      </div>
                    )}

                    {/* Mentor Organization Association Field */}
                    {role === 'mentor' && (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-green-600" />
                            Industrial Mentor Affiliation
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Select the verified company you are associated with.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="mentorCompany">Associated Organization</Label>
                            <div className="mt-1">
                              <select
                                id="mentorCompany"
                                value={selectedMentorCompanyId}
                                onChange={(e) => setSelectedMentorCompanyId(e.target.value)}
                                className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-700"
                              >
                                <option value="">Independent / Select Company</option>
                                {approvedCompanies.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.location})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="mentorDesignation">Designation</Label>
                            <div className="mt-1">
                              <Input
                                id="mentorDesignation"
                                placeholder="e.g. Senior Staff Architect"
                                value={mentorDesignation}
                                onChange={(e) => setMentorDesignation(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Student Resume Upload Field */}
                    {role === 'student' && (
                      <div className="pt-2 border-t border-slate-100">
                        <Label htmlFor="student-resume" className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          Upload Resume for AI Skill Extraction (Optional)
                        </Label>
                        <p className="text-[11px] text-slate-500 mb-2">
                          PDF or DOCX format (Max 5MB). File is analyzed in memory and never stored in cloud storage.
                        </p>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer border border-slate-200 transition-colors">
                            <Upload className="h-3.5 w-3.5 text-slate-600" />
                            <span>{resumeFile ? 'Change Resume' : 'Choose Resume'}</span>
                            <input
                              id="student-resume"
                              type="file"
                              accept=".pdf,.docx,.doc"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          {resumeFile && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl truncate">
                              <FileText className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                              <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                            </div>
                          )}
                        </div>
                        {fileError && <p className="text-xs text-red-600 mt-1 font-medium">{fileError}</p>}
                      </div>
                    )}

                    {/* Processing Status Banner */}
                    {processingStage && (
                      <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 flex items-center gap-2 text-xs font-semibold text-purple-900 animate-in fade-in">
                        <Loader2 className="h-4 w-4 text-purple-600 animate-spin shrink-0" />
                        <span>{processingStage}</span>
                      </div>
                    )}

                    {warningMessage && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 font-medium flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>{warningMessage}</span>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700 font-medium">{error}</div>
                    )}

                    <Button type="submit" className="w-full mt-2 text-xs font-semibold h-10" size="lg" loading={isSubmitting || Boolean(processingStage)}>
                      {role === 'hr' ? 'Submit Company Registration' : 'Create Account'}
                    </Button>

                    <p className="text-[11px] text-slate-400 text-center">
                      By creating an account, you agree to our{' '}
                      <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                      <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                    </p>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {!hrSuccessSubmitted && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
