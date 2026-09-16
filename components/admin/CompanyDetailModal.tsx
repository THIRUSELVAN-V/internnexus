'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Company } from '@/lib/types';
import { Building2, MapPin, Globe, User, Check, X, Ban, ShieldCheck, Mail } from 'lucide-react';

interface CompanyDetailModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (company: Company) => Promise<void> | void;
  onReject?: (company: Company, reason: string) => Promise<void> | void;
  onSuspendToggle?: (company: Company) => Promise<void> | void;
}

export default function CompanyDetailModal({
  company,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onSuspendToggle,
}: CompanyDetailModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!company) return null;

  const handleApprove = async () => {
    if (!onApprove) return;
    setLoading(true);
    try {
      await onApprove(company);
      onClose();
    } catch (e) {
      console.error('Error approving company:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!onReject || !rejectionReason.trim()) return;
    setLoading(true);
    try {
      await onReject(company, rejectionReason.trim());
      setRejecting(false);
      setRejectionReason('');
      onClose();
    } catch (e) {
      console.error('Error rejecting company:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!onSuspendToggle) return;
    setLoading(true);
    try {
      await onSuspendToggle(company);
      onClose();
    } catch (e) {
      console.error('Error toggling company status:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg border border-blue-100">
              {company.logoURL ? (
                <img src={company.logoURL} alt={company.name} className="h-full w-full object-cover rounded-xl" />
              ) : (
                company.name.charAt(0)
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">{company.name}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {company.industry} · Registered {company.createdAt?.slice(0, 10) || 'Recently'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Badge */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-600">Verification Status</span>
            <Badge
              variant={
                company.status === 'approved'
                  ? 'success'
                  : company.status === 'rejected' || company.status === 'suspended'
                  ? 'destructive'
                  : 'warning'
              }
              className="capitalize text-xs font-semibold"
            >
              {company.status}
            </Badge>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-slate-500" /> Location
              </span>
              <p className="font-semibold text-slate-900">{company.location || 'Not specified'}</p>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Building2 className="h-3.5 w-3.5 text-slate-500" /> Size
              </span>
              <p className="font-semibold text-slate-900 capitalize">{company.size || 'Startup'}</p>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5 text-slate-500" /> HR Manager
              </span>
              <p className="font-semibold text-slate-900">{company.hrName || 'N/A'}</p>
            </div>
            <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Globe className="h-3.5 w-3.5 text-slate-500" /> Website
              </span>
              {company.website ? (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 hover:underline truncate block"
                >
                  {company.website}
                </a>
              ) : (
                <p className="font-semibold text-slate-400">N/A</p>
              )}
            </div>
          </div>

          {/* Description */}
          {company.description && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Company Overview</Label>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {company.description}
              </p>
            </div>
          )}

          {/* Rejection Form */}
          {rejecting && (
            <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Label htmlFor="rejection-reason" className="text-xs font-bold text-red-800">
                Specify Reason for Rejection
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="E.g. Invalid registration documents, incomplete contact info..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs bg-white"
                rows={2}
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setRejecting(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!rejectionReason.trim() || loading}
                  onClick={handleConfirmReject}
                  className="text-xs"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Close
          </Button>

          {company.status === 'pending' && !rejecting && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setRejecting(true)} className="border-red-200 text-red-600 hover:bg-red-50">
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
              <Button size="sm" onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="h-3.5 w-3.5 mr-1" /> Approve Company
              </Button>
            </div>
          )}

          {(company.status === 'approved' || company.status === 'suspended') && onSuspendToggle && (
            <Button
              size="sm"
              variant={company.status === 'approved' ? 'destructive' : 'default'}
              onClick={handleSuspendToggle}
              disabled={loading}
              className={company.status === 'suspended' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
            >
              {company.status === 'approved' ? (
                <>
                  <Ban className="h-3.5 w-3.5 mr-1" /> Suspend Company
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Reactivate Company
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
