'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/firebase/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ForgotPasswordForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError('');
    try {
      await resetPassword(data.email);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px]"
      >
        <Link href="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">InternNexus</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_20px_rgb(0,0,0,0.06)] p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                We have sent a password reset link to your email address. Please check your inbox and follow the instructions.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Return to Sign In</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Reset password</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
