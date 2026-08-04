import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'InternNexus – AI Powered Internship Management Portal',
    template: '%s | InternNexus',
  },
  description:
    'InternNexus is an AI-powered internship management system connecting students, HR managers, industrial mentors and administrators for a seamless internship experience.',
  keywords: ['internship', 'AI', 'student', 'mentor', 'HR', 'management', 'portal'],
  authors: [{ name: 'InternNexus' }],
  openGraph: {
    title: 'InternNexus – AI Powered Internship Management Portal',
    description: 'Connecting students, HR, and mentors through AI-assisted internship management.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
