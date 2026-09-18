'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, MapPin, CheckCircle2, Save, Loader2, Check, Mail, Phone, Hash } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getDocuments, setDocument, updateDocument } from '@/lib/firebase/firestore';
import { updateUserProfile } from '@/lib/firebase/auth';
import { Company, HRProfile } from '@/lib/types';
import { COMPANY_SIZES } from '@/lib/utils/constants';

export default function HRCompanyPage() {
  const { profile, refreshProfile } = useAuthContext();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Clean empty state for new HR
  const [companyId, setCompanyId] = useState<string>('');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [size, setSize] = useState<Company['size']>('startup');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Company['status']>('approved');

  useEffect(() => {
    async function fetchCompany() {
      if (!profile?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const hr = profile as HRProfile;
        const companies = await getDocuments<Company>('companies');
        const myComp = companies.find((c) => c.hrId === profile.uid || (c.hrIds && c.hrIds.includes(profile.uid)) || (hr?.companyId && c.id === hr.companyId));

        if (myComp) {
          setCompanyId(myComp.id);
          setName(myComp.name || '');
          setIndustry(myComp.industry || '');
          setWebsite(myComp.website || '');
          setLocation(myComp.location || '');
          setCompanyAddress(myComp.companyAddress || '');
          setCity(myComp.city || '');
          setState(myComp.state || '');
          setCountry(myComp.country || 'India');
          setPincode(myComp.pincode || '');
          setOfficialEmail(myComp.officialEmail || '');
          setContactNumber(myComp.contactNumber || '');
          setRegistrationNumber(myComp.registrationNumber || '');
          setSize(myComp.size || 'startup');
          setDescription(myComp.description || '');
          setStatus(myComp.status || 'pending');
        } else {
          // Brand new HR: clean empty state, status strictly pending
          const generatedId = hr?.companyId || `comp-${profile.uid.slice(0, 8)}`;
          setCompanyId(generatedId);
          setName(hr?.companyName || '');
          setIndustry('');
          setWebsite('');
          setLocation('');
          setCompanyAddress('');
          setCity('');
          setState('');
          setCountry('India');
          setPincode('');
          setOfficialEmail(profile.email || '');
          setContactNumber('');
          setRegistrationNumber('');
          setSize('startup');
          setDescription('');
          setStatus(hr?.approvalStatus || 'pending');
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
    if (!profile?.uid) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const targetCompId = companyId || `comp-${profile.uid.slice(0, 8)}`;

      // Security check: an HR cannot self-promote to 'approved'
      const secureStatus: Company['status'] =
        status === 'approved' ? 'approved' : status === 'suspended' ? 'suspended' : 'pending';

      const fullLoc = city && state ? `${city.trim()}, ${state.trim()}` : location.trim();

      const companyData: Partial<Company> = {
        name: name.trim(),
        industry: industry.trim() || 'Software & IT Services',
        website: website.trim(),
        location: fullLoc,
        companyAddress: companyAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        pincode: pincode.trim(),
        officialEmail: officialEmail.trim(),
        contactNumber: contactNumber.trim(),
        registrationNumber: registrationNumber.trim() ? registrationNumber.trim().toUpperCase() : '',
        size,
        description: description.trim(),
        hrId: profile.uid,
        hrName: profile.displayName || 'HR Manager',
        status: secureStatus,
        updatedAt: new Date().toISOString(),
      };

      await setDocument('companies', targetCompId, companyData);

      // Update HR user profile with company information
      await updateUserProfile(profile.uid, {
        companyId: targetCompId,
        companyName: name.trim(),
        approvalStatus: secureStatus,
      } as Partial<HRProfile>);

      if (refreshProfile) {
        await refreshProfile();
      }

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
            <CardTitle className="text-base font-bold text-slate-900">
              {name ? `${name} Details` : 'Register Enterprise Details'}
            </CardTitle>
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

            {/* Address Details */}
            <div>
              <Label htmlFor="companyAddress">Full Company Address</Label>
              <Input
                id="companyAddress"
                placeholder="Street Address, Tech Park, Suite No."
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                leftIcon={<MapPin className="h-4 w-4" />}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 text-xs" />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} className="mt-1 text-xs" />
              </div>
            </div>

            {/* Official Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="officialEmail">Official Company Email</Label>
                <Input
                  id="officialEmail"
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber">Company Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4" />}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Website & Registration Number */}
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
                <Label htmlFor="regNo">Registration / GST / Udyam Number</Label>
                <Input
                  id="regNo"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  leftIcon={<Hash className="h-4 w-4" />}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="csize">Company Size</Label>
              <select
                id="csize"
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                className="mt-1 w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
              >
                {COMPANY_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="cdesc">Company Overview &amp; Mission</Label>
              <Textarea
                id="cdesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[80px]"
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
