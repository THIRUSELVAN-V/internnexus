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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile, StudentProfile, HRProfile, MentorProfile, UserRole } from '@/lib/types';
import { getInitials } from '@/lib/utils/formatters';
import { Mail, Calendar, ShieldAlert, CheckCircle2, UserCheck, Ban } from 'lucide-react';

interface UserDetailModalProps {
  user: (UserProfile | StudentProfile | HRProfile | MentorProfile) | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSuspend?: (user: UserProfile) => Promise<void> | void;
}

export default function UserDetailModal({
  user,
  isOpen,
  onClose,
  onToggleSuspend,
}: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const isSuspended = (user as any).suspended === true;

  const handleSuspendToggle = async () => {
    if (!onToggleSuspend) return;
    setLoading(true);
    try {
      await onToggleSuspend(user);
      onClose();
    } catch (e) {
      console.error('Error toggling user suspension:', e);
    } finally {
      setLoading(false);
    }
  };

  const roleVariants: Record<UserRole, 'default' | 'purple' | 'success' | 'destructive'> = {
    student: 'default',
    hr: 'purple',
    mentor: 'success',
    admin: 'destructive',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-slate-200">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName} />
              <AvatarFallback className="font-bold text-slate-700">
                {getInitials(user.displayName || 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                {user.displayName || 'Unnamed User'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3" /> {user.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {/* Status & Role Badges */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Badge variant={roleVariants[user.role]} className="capitalize font-semibold">
              {user.role} Account
            </Badge>
            <Badge variant={isSuspended ? 'destructive' : 'success'} className="capitalize font-semibold">
              {isSuspended ? 'Suspended' : 'Active'}
            </Badge>
          </div>

          {/* User Details according to Role */}
          <div className="space-y-2">
            <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium">Joined Date</span>
              <p className="font-semibold text-slate-900">{user.createdAt?.slice(0, 10) || 'N/A'}</p>
            </div>

            {user.role === 'student' && (
              <>
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium">University / College</span>
                  <p className="font-semibold text-slate-900">
                    {(user as StudentProfile).university || 'Not provided'}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium">Degree & Skills</span>
                  <p className="font-semibold text-slate-900">
                    {(user as StudentProfile).degree || 'N/A'} — {((user as StudentProfile).skills || []).join(', ') || 'No skills listed'}
                  </p>
                </div>
              </>
            )}

            {(user.role === 'hr' || user.role === 'mentor') && (
              <>
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium">Company Name</span>
                  <p className="font-semibold text-slate-900">
                    {(user as HRProfile | MentorProfile).companyName || 'Unassigned'}
                  </p>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium">Designation</span>
                  <p className="font-semibold text-slate-900">
                    {(user as HRProfile | MentorProfile).designation || 'Not specified'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Close
          </Button>

          {onToggleSuspend && user.role !== 'admin' && (
            <Button
              size="sm"
              variant={isSuspended ? 'default' : 'destructive'}
              onClick={handleSuspendToggle}
              disabled={loading}
              className={isSuspended ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
            >
              {isSuspended ? (
                <>
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Activate User
                </>
              ) : (
                <>
                  <Ban className="h-3.5 w-3.5 mr-1" /> Suspend User
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
