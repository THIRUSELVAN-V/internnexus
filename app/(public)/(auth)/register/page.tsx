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
  GraduationCap, Building2, UserCheck, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/firebase/auth';
import { cn } from '@/lib/utils/formatters';
import type { UserRole } from '@/lib/types';

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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    setStep(2);
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!role) return;
    setError('');
    try {
      await signUp(data.email, data.password, data.displayName, role);
      router.push(`/${role}/dashboard`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('email-already-in-use')) setError('An account with this email already exists.');
      else setError(msg);
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
                      <Input id="displayName" placeholder="John Doe" leftIcon={<UserIcon className="h-4 w-4" />}
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

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>
                  )}

                  <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting}>
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
