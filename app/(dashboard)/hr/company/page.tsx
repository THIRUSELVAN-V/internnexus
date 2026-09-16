'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, MapPin, CheckCircle2, Save, Loader2, Check } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, setDocument, updateDocument } from '@/lib/firebase/firestore';
import { Company, HRProfile } from '@/lib/types';

export default function HRCompanyPage() {
  const { profile } = useAuthContext();
  const hr = profile as HRProfile;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [companyId, setCompanyId] = useState<string>('comp-techcorp');
  const [name, setName] = useState('TechCorp India');
  const [industry, setIndustry] = useState('Software & IT Services');
  const [website, setWebsite] = useState('https://techcorp.example.com');
  const [location, setLocation] = useState('Bangalore, Karnataka, India');
  const [size, setSize] = useState<Company['size']>('medium');
  const [description, setDescription] = useState('TechCorp India is a leading enterprise cloud software vendor providing scalable SaaS solutions to global Fortune 500 clients.');
  const [status, setStatus] = useState<Company['status']>('approved');

  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      try {
        const companies = await getDocuments<Company>('companies');
        const myComp = companies.find((c) => c.hrId === profile?.uid || c.name.toLowerCase().includes('techcorp')) || companies[0];

        if (myComp) {
          setCompanyId(myComp.id);
          setName(myComp.name);
          setIndustry(myComp.industry);
          setWebsite(myComp.website || 'https://techcorp.example.com');
          setLocation(myComp.location || 'Bangalore, India');
          setSize(myComp.size || 'medium');
          setDescription(myComp.description || '');
          setStatus(myComp.status || 'approved');
        }
      } catch (err) {
        console.error('Error fetching company details:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const companyData: Partial<Company> = {
        name,
        industry,
        website,
        location,
        size,
        description,
        hrId: profile?.uid || 'hr-1',
        hrName: profile?.displayName || 'HR Manager',
        updatedAt: new Date().toISOString(),
      };

      await setDocument('companies', companyId, companyData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating company profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Company Profile Management</h1>
          <p className="text-xs text-slate-500">Manage registered enterprise details, industry sector, headquarters, and description</p>
        </div>
        <Badge
          variant={status === 'approved' ? 'success' : status === 'suspended' ? 'destructive' : 'warning'}
          className="text-xs font-semibold px-3 py-1 capitalize"
        >
          {status === 'approved' ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approved Enterprise</> : status}
        </Badge>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="h-4 w-4 text-green-600 shrink-0" /> Company profile saved successfully in Firestore.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-sm text-slate-500 font-medium">Loading company details...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">{name} Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cname">Company Name</Label>
                <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="industry">Industry Sector</Label>
                <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  leftIcon={<Globe className="h-4 w-4" />}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="location">Headquarters Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  leftIcon={<MapPin className="h-4 w-4" />}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cdesc">Company Overview & Mission</Label>
              <Textarea
                id="cdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" /> Save Company Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
