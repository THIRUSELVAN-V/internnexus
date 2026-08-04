'use client';

import React from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/lib/types';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const mockUsers: UserRow[] = [
  { id: '1', name: 'John Doe', email: 'student@demo.com', role: 'student', createdAt: '2026-07-01' },
  { id: '2', name: 'Priya Sharma', email: 'hr@demo.com', role: 'hr', createdAt: '2026-06-15' },
  { id: '3', name: 'Dr. Rajesh Kumar', email: 'mentor@demo.com', role: 'mentor', createdAt: '2026-06-10' },
  { id: '4', name: 'Admin User', email: 'admin@demo.com', role: 'admin', createdAt: '2026-05-01' },
];

export default function AdminUsersPage() {
  const columns: Column<UserRow>[] = [
    {
      key: 'name',
      header: 'User Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.email}</p>
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
      key: 'createdAt',
      header: 'Joined Date',
      render: (item) => <span className="text-xs font-mono text-slate-600">{item.createdAt}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">User Management</h1>
        <p className="text-xs text-slate-500">Global user directory across Students, HR Managers, Industrial Mentors, and Administrators</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable data={mockUsers} columns={columns} searchKey="name" searchPlaceholder="Search users by name..." />
        </CardContent>
      </Card>
    </div>
  );
}
