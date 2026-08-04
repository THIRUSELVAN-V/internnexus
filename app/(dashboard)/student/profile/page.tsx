'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, GraduationCap, MapPin, Globe, Code, Save, Link as LinkIcon } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

export default function StudentProfilePage() {
  const { profile } = useAuthContext();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Student Profile</h1>
        <p className="text-xs text-slate-500">Manage your educational background, skills, and personal details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <Card className="md:col-span-1 text-center">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-4 border-slate-100 shadow-sm">
                <AvatarImage src={profile?.photoURL} />
                <AvatarFallback className="text-xl font-bold">
                  {profile?.displayName?.slice(0, 2).toUpperCase() || 'ST'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{profile?.displayName || 'Student User'}</h2>
              <p className="text-xs text-slate-500">{profile?.email}</p>
              <Badge variant="default" className="mt-2 text-xs">Computer Science & Eng.</Badge>
            </div>
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 text-left">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-400" /> IIT Madras (Class of 2026)
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-400" /> Chennai, India
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Editable Profile Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Edit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={profile?.displayName || ''} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={profile?.email || ''} disabled className="mt-1 bg-slate-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="university">University / Institute</Label>
                <Input id="university" defaultValue="Indian Institute of Technology, Madras" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="degree">Degree & Major</Label>
                <Input id="degree" defaultValue="B.Tech Computer Science & Engineering" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gpa">GPA / CGPA</Label>
                <Input id="gpa" defaultValue="8.9 / 10.0" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="gradYear">Graduation Year</Label>
                <Input id="gradYear" defaultValue="2026" className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea id="bio" defaultValue="Passionate Computer Science undergraduate interested in full-stack web development, AI integration, and scalable distributed systems." className="mt-1 min-h-[80px]" />
            </div>

            <div className="space-y-3 pt-2">
              <Label>Social & Portfolio Links</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input leftIcon={<LinkIcon className="h-4 w-4" />} defaultValue="https://linkedin.com/in/student" />
                <Input leftIcon={<Code className="h-4 w-4" />} defaultValue="https://github.com/student" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-1.5" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
