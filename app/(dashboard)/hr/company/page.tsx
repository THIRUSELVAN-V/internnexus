'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, MapPin, CheckCircle2, Save } from 'lucide-react';

export default function HRCompanyPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Company Profile</h1>
          <p className="text-xs text-slate-500">Manage registered company details, size, and admin approval status</p>
        </div>
        <Badge variant="success" className="text-xs font-semibold px-3 py-1">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approved by Admin
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">TechCorp India Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cname">Company Name</Label>
              <Input id="cname" defaultValue="TechCorp India Pvt Ltd" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="industry">Industry Sector</Label>
              <Input id="industry" defaultValue="Software & IT Services" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website URL</Label>
              <Input id="website" defaultValue="https://techcorp.example.com" leftIcon={<Globe className="h-4 w-4" />} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="location">Headquarters Location</Label>
              <Input id="location" defaultValue="Bangalore, Karnataka, India" leftIcon={<MapPin className="h-4 w-4" />} className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="cdesc">Company Overview</Label>
            <Textarea id="cdesc" defaultValue="TechCorp India is a leading enterprise cloud software vendor providing scalable SaaS solutions to global Fortune 500 clients." className="mt-1 min-h-[90px]" />
          </div>

          <div className="pt-2 flex justify-end">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Save className="h-4 w-4 mr-1.5" /> Save Company Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
