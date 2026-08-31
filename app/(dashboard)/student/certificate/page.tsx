'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export default function StudentCertificatePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Certificate of Completion</h1>
        <p className="text-xs text-slate-500">Official verified internship certificate issued by TechCorp & InternNexus</p>
      </div>

      <Card className="border-amber-200 bg-gradient-to-b from-white to-amber-50/20">
        <CardContent className="p-8 text-center space-y-6">
          {/* Certificate Frame Preview */}
          <div className="mx-auto max-w-2xl rounded-2xl border-4 border-double border-amber-300 bg-white p-8 shadow-md relative">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-900">InternNexus</span>
              </div>
              <Badge variant="success" className="text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified Certificate
              </Badge>
            </div>

            <div className="space-y-4 my-6">
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">Certificate of Internship</span>
              <h2 className="text-2xl font-bold text-slate-900 font-serif">This is presented to</h2>
              <p className="text-3xl font-bold text-blue-600 font-serif underline decoration-amber-400 decoration-2">
                Thiru
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                for successfully completing the 12-week <strong className="text-slate-900">Frontend Web Development Internship</strong> at <strong className="text-slate-900">TechCorp India</strong> under the mentorship of <strong className="text-slate-900">Mr. Vijay</strong> with an overall rating of 5.0 / 5.0.
              </p>
            </div>

            <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
              <div className="text-left">
                <p className="font-bold text-slate-900">Mr. Vijay</p>
                <p className="text-[11px]">Industrial Mentor · TechCorp</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[11px] text-slate-400">ID: CERT-2026-NEX-8842</p>
                <p className="text-[11px]">Issued: Aug 04, 2026</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
              <Download className="h-4 w-4 mr-2" /> Download PDF Certificate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
