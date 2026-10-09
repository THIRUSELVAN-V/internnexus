"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Zap, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, getUserProfile } from "@/lib/firebase/auth";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError("");

    try {
      const user = await signIn(data.email, data.password);
      const profile = await getUserProfile(user.uid);

      if (!profile) throw new Error("Profile not found");

      router.push(`/${profile.role}/dashboard`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Invalid email or password";

      if (
        msg.includes("user-not-found") ||
        msg.includes("wrong-password") ||
        msg.includes("invalid-credential")
      ) {
        setError("Invalid email or password");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-white lg:h-dvh lg:min-h-0">
      {/* Left panel */}
      <aside className="relative hidden min-h-0 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-100 px-6 py-6 lg:flex lg:w-1/2 xl:w-[55%]">
        <div className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full bg-blue-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-sky-300/25 blur-3xl" />

        {/* Logo stays visible above the image */}
        <Link
          href="/"
          className="absolute left-7 top-5 z-20 flex items-center gap-2 xl:left-9"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/20">
            <Zap className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Intern<span className="text-blue-600">Nexus</span>
          </span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex w-full max-w-[440px] flex-col items-center pt-12"
        >
          {/* Smaller responsive image */}
          <div className="w-full max-w-[360px] xl:max-w-[410px]">
            <Image
              src="/images/internnexus-hero.jpg"
              alt="Discover internship opportunities with InternNexus"
              width={1024}
              height={683}
              priority
              sizes="(max-width: 1280px) 360px, 410px"
              className="h-auto max-h-[38dvh] w-full object-contain"
            />
          </div>

          <div className="mt-3 max-w-md text-center">
            <h2 className="bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500 bg-clip-text text-2xl font-extrabold leading-tight tracking-tight text-transparent xl:text-3xl">
              Your Career. Your Opportunity.
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-slate-600 xl:text-base">
              Connect with industry mentors, build real-world skills, and turn
              your internship journey into success.
            </p>

            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-sky-400" />
          </div>
        </motion.div>

        <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-slate-400">
          © 2026 InternNexus · Empowering future professionals
        </p>
      </aside>

      {/* Right panel: scrolls only if content needs more room */}
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-5 py-8 sm:px-8 lg:h-dvh lg:min-h-0 lg:py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="my-auto w-full max-w-[400px] py-2"
        >
          {/* Mobile logo */}
          <Link href="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Zap className="h-4 w-4 text-white" />
            </span>
            <span className="text-base font-bold text-slate-900">
              Intern<span className="text-blue-600">Nexus</span>
            </span>
          </Link>

          {/* Mobile tagline */}
          <div className="mb-6 text-center lg:hidden">
            <h2 className="text-xl font-extrabold tracking-tight text-blue-700">
              Your Career. Your Opportunity.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Connect with mentors. Build real-world skills. Make your next move
              count.
            </p>
          </div>

          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">
              Sign in
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              Welcome back! Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" required>
                Email address
              </Label>
              <div className="mt-1.5">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                {...register("password")}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Create account
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
            © 2026 InternNexus
          </p>
        </motion.div>
      </main>
    </div>
  );
}
