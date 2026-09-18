'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Zap, Mail, Lock, User as UserIcon, ChevronRight,
  GraduationCap, Building2, UserCheck, Shield, FileText, Upload, Sparkles, AlertCircle, Loader2, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp, updateUserProfile } from '@/lib/firebase/auth';
import { analyzeResume } from '@/lib/ai/resumeAnalysis';
import { cn } from '@/lib/utils/formatters';
import type { UserRole, StudentProfile } from '@/lib/types';

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type RegisterForm = z.infer<typeof schema>;

const ROLES: { value: UserRole; label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'student', label: 'Student', description: 'Apply to internships and track your progress', icon: GraduationCap, color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'hr', label: 'HR Manager', description: 'Post internships and manage candidates', icon: Building2, color: 'border-purple-200 bg-purple-50 text-purple-700' },
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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    setStep(2);
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

    try {
      // 1. Create Firebase Auth user & basic profile
      setProcessingStage('Creating user account...');
      const userProfile = await signUp(data.email, data.password, data.displayName, role);

      // 2. If Student with uploaded resume, analyze resume without storing binary file
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
          await new Promise((res) => setTimeout(res, 2200));
        }
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[520px]"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">InternNexus</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.06)] p-8">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={cn('h-2 flex-1 rounded-full transition-colors', step >= 1 ? 'bg-blue-600' : 'bg-slate-200')} />
            <div className={cn('h-2 flex-1 rounded-full transition-colors', step >= 2 ? 'bg-blue-600' : 'bg-slate-200')} />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-xl font-bold text-slate-900 mb-1">Create your account</h1>
                <p className="text-sm text-slate-500 mb-6">Choose your role to get started</p>

                <div className="space-y-3">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        onClick={() => handleRoleSelect(r.value)}
                        className="w-full flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-150 group"
                      >
                        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', r.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{r.label}</p>
                          <p className="text-xs text-slate-500">{r.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </button>
                    );
                  })}
                </div>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">Sign in</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5">
                    ← Back
                  </button>
                  <span className="text-sm text-slate-300">·</span>
                  <span className="text-sm text-slate-500">Registering as <strong className="text-slate-900 capitalize">{role}</strong></span>
                </div>

                <h1 className="text-xl font-bold text-slate-900 mb-1">Your details</h1>
                <p className="text-sm text-slate-500 mb-6">Fill in your information to complete registration</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="displayName" required>Full Name</Label>
                    <div className="mt-1.5">
                      <Input id="displayName" placeholder="Thiru" leftIcon={<UserIcon className="h-4 w-4" />}
                        error={errors.displayName?.message} {...register('displayName')} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-email" required>Email</Label>
                    <div className="mt-1.5">
                      <Input id="reg-email" type="email" placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />}
                        error={errors.email?.message} {...register('email')} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-password" required>Password</Label>
                    <div className="mt-1.5">
                      <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters"
                        leftIcon={<Lock className="h-4 w-4" />}
                        rightIcon={
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-slate-600 transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                        error={errors.password?.message} {...register('password')} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" required>Confirm Password</Label>
                    <div className="mt-1.5">
                      <Input id="confirmPassword" type="password" placeholder="Re-enter password"
                        leftIcon={<Lock className="h-4 w-4" />}
                        error={errors.confirmPassword?.message} {...register('confirmPassword')} />
                    </div>
                  </div>

                  {/* Student Resume Upload Field */}
                  {role === 'student' && (
                    <div className="pt-2 border-t border-slate-100">
                      <Label htmlFor="student-resume" className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        Upload Resume for AI Skill Extraction (Optional)
                      </Label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        PDF or DOCX format (Max 5MB). File is processed in memory for skill analysis and never stored.
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
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>
                  )}

                  <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting || Boolean(processingStage)}>
                    Create Account
                  </Button>

                  <p className="text-xs text-slate-400 text-center">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                    <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
