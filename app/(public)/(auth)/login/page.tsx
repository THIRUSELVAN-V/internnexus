'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Zap, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn, getUserProfile } from '@/lib/firebase/auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      const user = await signIn(data.email, data.password);
      const profile = await getUserProfile(user.uid);
      if (!profile) throw new Error('Profile not found');
      router.push(`/${profile.role}/dashboard`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password');
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:flex-col lg:w-[480px] xl:w-[540px] bg-blue-600 px-12 py-10">
        <Link href="/" className="flex items-center gap-2.5 mb-auto">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">InternNexus</span>
        </Link>

        <div className="my-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Welcome back to<br />your portal
            </h2>
            <p className="text-blue-200 text-base leading-relaxed mb-8">
              Sign in to access your dashboard, track applications, manage tasks, and stay connected with your team.
            </p>
            <div className="space-y-3">
              {[
                'AI-powered internship matching',
                'Real-time task management',
                'Smart mentor recommendations',
                'Certificate generation',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-blue-100 text-sm">
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-white" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <p className="text-blue-300 text-xs mt-auto">© 2026 InternNexus</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">InternNexus</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-8">Enter your credentials to access your dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="email" required>Email address</Label>
              <div className="mt-1.5">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" required>Password</Label>
                <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Demo Accounts</p>
            <div className="space-y-1.5">
              {[
                { role: 'Student', email: 'student@demo.com' },
                { role: 'HR', email: 'hr@demo.com' },
                { role: 'Mentor', email: 'mentor@demo.com' },
                { role: 'Admin', email: 'admin@demo.com' },
              ].map((d) => (
                <div key={d.role} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{d.role}</span>
                  <span className="text-slate-400 font-mono">{d.email} · demo123</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
