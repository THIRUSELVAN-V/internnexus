'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscribeToCollection, updateDocument, setDocument, getDocuments } from '@/lib/firebase/firestore';
import { Company, HRProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock, ShieldAlert, CheckCircle2, RefreshCw, LogOut, Building2,
  MapPin, Globe, AlertTriangle, Loader2, ArrowRight, ShieldCheck, Mail, User, Send, Phone, Hash
} from 'lucide-react';

export default function HRApprovalLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading: authLoading, signOut, refreshProfile } = useAuthContext();
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Re-submission form state for rejected companies
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('India');
  const [editPincode, setEditPincode] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editOfficialEmail, setEditOfficialEmail] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editRegistrationNumber, setEditRegistrationNumber] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const hr = profile as HRProfile;

  useEffect(() => {
    if (!profile?.uid || profile.role !== 'hr') {
      setLoadingCompany(false);
      return;
    }

    setLoadingCompany(true);

    // Subscribe to companies collection in real time
    const unsubscribe = subscribeToCollection<Company>('companies', [], (allCompanies) => {
      const myComp = allCompanies.find(
        (c) => c.hrId === profile.uid || (c.hrIds && c.hrIds.includes(profile.uid)) || (hr?.companyId && c.id === hr.companyId)
      );

      if (myComp) {
        setCompany(myComp);
        setEditName(myComp.name || '');
        setEditIndustry(myComp.industry || '');
        setEditLocation(myComp.location || '');
        setEditAddress(myComp.companyAddress || '');
        setEditCity(myComp.city || '');
        setEditState(myComp.state || '');
        setEditCountry(myComp.country || 'India');
        setEditPincode(myComp.pincode || '');
        setEditWebsite(myComp.website || '');
        setEditOfficialEmail(myComp.officialEmail || '');
        setEditContactNumber(myComp.contactNumber || '');
        setEditRegistrationNumber(myComp.registrationNumber || '');
        setEditDescription(myComp.description || '');
      } else {
        setCompany(null);
      }
      setLoadingCompany(false);
    });

    return () => unsubscribe();
  }, [profile?.uid, hr?.companyId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (refreshProfile) {
        await refreshProfile();
      }
      const allCompanies = await getDocuments<Company>('companies');
      const myComp = allCompanies.find(
        (c) => c.hrId === profile?.uid || (hr?.companyId && c.id === hr.companyId)
      );
      if (myComp) {
        setCompany(myComp);
        setEditName(myComp.name || '');
        setEditIndustry(myComp.industry || '');
        setEditLocation(myComp.location || '');
        setEditAddress(myComp.companyAddress || '');
        setEditCity(myComp.city || '');
        setEditState(myComp.state || '');
        setEditCountry(myComp.country || 'India');
        setEditPincode(myComp.pincode || '');
        setEditWebsite(myComp.website || '');
        setEditOfficialEmail(myComp.officialEmail || '');
        setEditContactNumber(myComp.contactNumber || '');
        setEditRegistrationNumber(myComp.registrationNumber || '');
        setEditDescription(myComp.description || '');
      }
    } catch (e) {
      console.error('Error refreshing verification status:', e);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleResubmit = async () => {
    if (!company || !profile?.uid) return;
    setSubmitting(true);
    try {
      const fullLoc = editCity && editState ? `${editCity.trim()}, ${editState.trim()}` : editLocation.trim();
      await updateDocument('companies', company.id, {
        name: editName.trim() || company.name,
        industry: editIndustry.trim() || company.industry,
        location: fullLoc || company.location,
        companyAddress: editAddress.trim() || company.companyAddress || '',
        city: editCity.trim() || company.city || '',
        state: editState.trim() || company.state || '',
        country: editCountry.trim() || company.country || 'India',
        pincode: editPincode.trim() || company.pincode || '',
        officialEmail: editOfficialEmail.trim() || company.officialEmail || '',
        contactNumber: editContactNumber.trim() || company.contactNumber || '',
        registrationNumber: editRegistrationNumber.trim() ? editRegistrationNumber.trim().toUpperCase() : (company.registrationNumber || ''),
        website: editWebsite.trim() || company.website || '',
        description: editDescription.trim() || company.description || '',
        status: 'pending',
        rejectionReason: '',
        updatedAt: new Date().toISOString(),
      });

      await updateDocument('users', profile.uid, {
        companyName: editName.trim() || company.name,
        approvalStatus: 'pending',
        rejectionReason: '',
        updatedAt: new Date().toISOString(),
      });

      setResubmitSuccess(true);
      setTimeout(() => setResubmitSuccess(false), 3000);
    } catch (e) {
      console.error('Error resubmitting company profile:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingCompany) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-xs text-slate-500 font-medium">Checking HR verification status...</span>
      </div>
    );
  }

  // Non-HR accounts bypass this guard
  if (profile?.role !== 'hr') {
    return <>{children}</>;
  }

  // Determine verification status
  // 1. Check company document status first
  // 2. Check user profile approvalStatus
  // 3. For existing legacy HR accounts without status, treat as approved
  const rawStatus = company?.status || hr?.approvalStatus;
  const isPending = rawStatus === 'pending';
  const isRejected = rawStatus === 'rejected';
  const isSuspended = rawStatus === 'suspended';
  const isApproved = rawStatus === 'approved' || (!rawStatus && Boolean(company));

  // If approved, render children normally
  if (isApproved && !isSuspended) {
    return <>{children}</>;
  }

  // Suspended state
  if (isSuspended) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <Badge variant="destructive" className="text-xs px-3 py-1 font-semibold mb-2">
                Account Suspended
              </Badge>
              <h2 className="text-xl font-bold text-slate-900">Company Account Suspended</h2>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">
                Your company profile has been suspended by the platform administrator. Access to internship postings, applicant reviews, and mentor recommendations has been temporarily revoked.
              </p>
            </div>
            <div className="pt-4 flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected state
  if (isRejected) {
    const reason = company?.rejectionReason || hr?.rejectionReason || 'Submitted details could not be verified.';

    return (
      <div className="max-w-3xl mx-auto py-10 space-y-6">
        <Card className="border-rose-200 bg-rose-50/30">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="destructive" className="text-xs font-semibold mb-1">
                    Registration Rejected
                  </Badge>
                  <h1 className="text-lg font-bold text-slate-900">Company Verification Not Approved</h1>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="text-xs self-start">
                <LogOut className="h-3.5 w-3.5 mr-1" /> Sign Out
              </Button>
            </div>

            <div className="rounded-xl bg-rose-100/70 border border-rose-200 p-4 space-y-1.5 text-xs text-rose-900">
              <span className="font-bold flex items-center gap-1.5 text-rose-800">
                <ShieldAlert className="h-4 w-4" /> Reason for Rejection from Admin:
              </span>
              <p className="leading-relaxed pl-5 font-medium">{reason}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You may update your enterprise details below and resubmit your company profile for administrative verification.
            </p>

            {resubmitSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                Company profile resubmitted successfully. It is now pending Admin review.
              </div>
            )}

            {/* Resubmission Form */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-name">Company Name</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label htmlFor="edit-industry">Industry Sector</Label>
                  <Input id="edit-industry" value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} className="mt-1 text-xs" />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-address">Full Company Address</Label>
                <Input id="edit-address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="mt-1 text-xs" placeholder="Street Address, Building, Suite No." />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <Label htmlFor="edit-city">City</Label>
                  <Input id="edit-city" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label htmlFor="edit-state">State</Label>
                  <Input id="edit-state" value={editState} onChange={(e) => setEditState(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label htmlFor="edit-country">Country</Label>
                  <Input id="edit-country" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label htmlFor="edit-pincode">Pincode</Label>
                  <Input id="edit-pincode" value={editPincode} onChange={(e) => setEditPincode(e.target.value)} className="mt-1 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-official-email">Official Company Email</Label>
                  <Input id="edit-official-email" type="email" value={editOfficialEmail} onChange={(e) => setEditOfficialEmail(e.target.value)} className="mt-1 text-xs" />
                </div>
                <div>
                  <Label htmlFor="edit-contact-number">Company Contact Number</Label>
                  <Input id="edit-contact-number" value={editContactNumber} onChange={(e) => setEditContactNumber(e.target.value)} className="mt-1 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-website">Company Website</Label>
                  <Input id="edit-website" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className="mt-1 text-xs" placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="edit-reg-no">Registration / GST / Udyam Number</Label>
                  <Input id="edit-reg-no" value={editRegistrationNumber} onChange={(e) => setEditRegistrationNumber(e.target.value)} className="mt-1 text-xs font-mono" />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-desc">Company Overview</Label>
                <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1 min-h-[60px] text-xs" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={handleResubmit} disabled={submitting || !editName.trim()} className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                  Update &amp; Resubmit for Admin Verification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending verification state (Default for newly registered HR)
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <Card className="border-amber-200 bg-gradient-to-b from-amber-50/50 to-white shadow-sm">
        <CardContent className="p-6 sm:p-8 space-y-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-amber-200/80">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="warning" className="text-xs font-semibold px-2.5 py-0.5 mb-1 bg-amber-100 text-amber-800 border-amber-300">
                  Verification Pending
                </Badge>
                <h1 className="text-lg font-bold text-slate-900">Your company registration is pending Admin verification.</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs border-amber-200 text-amber-800 hover:bg-amber-100"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                Check Status
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="text-xs text-slate-500 hover:text-slate-800">
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sign Out
              </Button>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              Thank you for registering your organization on <strong>InternNexus</strong>. As part of our enterprise trust and compliance framework, all employer accounts must be verified by an Administrator before gaining access to internship publishing, candidate reviewing, and mentor assignment.
            </p>
            <p className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-amber-900">
              <strong>What happens next:</strong> An administrator will review your organization details. Once approved, all HR management features will unlock automatically in this dashboard.
            </p>
          </div>

          {/* Submitted Company Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Submitted Registration Details</h3>
              <Badge variant="secondary" className="text-[11px] capitalize font-medium">
                {company?.size || 'Startup'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Company Name</span>
                  <span className="font-semibold text-slate-800">{company?.name || hr?.companyName || 'Not specified'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">HR Representative</span>
                  <span className="font-semibold text-slate-800">
                    {profile?.displayName || 'HR User'} ({hr?.designation || 'HR Manager'})
                  </span>
                  {(company?.hrPhone || profile?.phone) && (
                    <span className="text-[11px] text-slate-500 block">Phone: {company?.hrPhone || profile?.phone}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Official Company Email</span>
                  <span className="font-semibold text-slate-800">{company?.officialEmail || profile?.email || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Company Contact Number</span>
                  <span className="font-semibold text-slate-800">{company?.contactNumber || company?.hrPhone || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Headquarters Address</span>
                  <span className="font-semibold text-slate-800">
                    {company?.companyAddress || company?.location || 'Not specified'}
                  </span>
                  {(company?.city || company?.state) && (
                    <span className="text-[11px] text-slate-500 block">
                      {[company.city, company.state, company.country, company.pincode].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Website</span>
                  {company?.website ? (
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold truncate block">
                      {company.website}
                    </a>
                  ) : (
                    <span className="text-slate-500">Not provided</span>
                  )}
                </div>
              </div>
            </div>

            {company?.registrationNumber && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Registration / GST / Udyam:</span>
                <span className="font-mono font-semibold text-slate-800">{company.registrationNumber}</span>
              </div>
            )}

            {company?.description && (
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Overview:</span> {company.description}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Need urgent verification? Please contact platform support at <strong>admin@internnexus.com</strong>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
