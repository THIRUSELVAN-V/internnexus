'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import UserDetailModal from '@/components/admin/UserDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Eye, Ban, UserCheck, Loader2, GraduationCap, Building2, Shield } from 'lucide-react';
import { getDocuments, updateDocument, subscribeToCollection } from '@/lib/firebase/firestore';
import { UserProfile, UserRole } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils/formatters';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  useEffect(() => {
    // Real-time listener for users
    const unsubscribe = subscribeToCollection<UserProfile>('users', [], (data) => {
      setUsers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleSuspend = async (user: UserProfile) => {
    const isSuspended = (user as any).suspended === true;
    try {
      await updateDocument('users', user.uid, {
        suspended: !isSuspended,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating user suspension status:', error);
    }
  };

  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter((u) => u.role === roleFilter);

  const columns: Column<UserProfile>[] = [
    {
      key: 'displayName',
      header: 'User Name',
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-slate-200">
            <AvatarImage src={item.photoURL || ''} alt={item.displayName} />
            <AvatarFallback className="text-xs font-bold text-slate-700">
              {getInitials(item.displayName || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-slate-900">{item.displayName || 'Unnamed User'}</p>
            <p className="text-xs text-slate-500">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Platform Role',
      render: (item) => {
        const variants: Record<UserRole, 'default' | 'purple' | 'success' | 'destructive'> = {
          student: 'default',
          hr: 'purple',
          mentor: 'success',
          admin: 'destructive',
        };
        return <Badge variant={variants[item.role]} className="capitalize text-xs font-semibold">{item.role}</Badge>;
      },
    },
    {
      key: 'affiliation',
      header: 'Affiliation / Org',
      render: (item) => {
        const anyItem = item as any;
        const org = anyItem.companyName || anyItem.university || 'N/A';
        return <span className="text-xs text-slate-700 font-medium truncate max-w-[160px] block">{org}</span>;
      },
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      render: (item) => (
        <span className="text-xs font-mono text-slate-600">
          {item.createdAt ? item.createdAt.slice(0, 10) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (item) => {
        const isSuspended = (item as any).suspended === true;
        return (
          <Badge variant={isSuspended ? 'destructive' : 'success'} className="capitalize text-xs font-semibold">
            {isSuspended ? 'Suspended' : 'Active'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => {
        const isSuspended = (item as any).suspended === true;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedUser(item);
                setIsModalOpen(true);
              }}
              className="text-slate-600 hover:text-slate-900"
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
            </Button>

            {item.role !== 'admin' && (
              <Button
                size="sm"
                variant={isSuspended ? 'default' : 'outline'}
                onClick={() => handleToggleSuspend(item)}
                className={
                  isSuspended
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'border-red-200 text-red-600 hover:bg-red-50'
                }
              >
                {isSuspended ? (
                  <>
                    <UserCheck className="h-3.5 w-3.5 mr-1" /> Activate
                  </>
                ) : (
                  <>
                    <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
                  </>
                )}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Global User Management"
        description="Search, view, and manage permissions across all registered Students, HR Managers, Industrial Mentors, and Administrators."
        icon={Users}
        badgeText="User Directory"
        action={
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1 rounded-xl backdrop-blur">
            {[
              { id: 'all', label: `All (${users.length})` },
              { id: 'student', label: `Students (${users.filter((u) => u.role === 'student').length})` },
              { id: 'hr', label: `HR (${users.filter((u) => u.role === 'hr').length})` },
              { id: 'mentor', label: `Mentors (${users.filter((u) => u.role === 'mentor').length})` },
              { id: 'admin', label: `Admins (${users.filter((u) => u.role === 'admin').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  roleFilter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-200 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Loading user directory...</span>
            </div>
          ) : (
            <DataTable
              data={filteredUsers}
              columns={columns}
              searchKey="displayName"
              searchPlaceholder="Search users by name..."
              emptyMessage="No users matching the selected role filter."
            />
          )}
        </CardContent>
      </Card>

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onToggleSuspend={handleToggleSuspend}
      />
    </div>
  );
}
