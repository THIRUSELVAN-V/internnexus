'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import CompanyDetailModal from '@/components/admin/CompanyDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldCheck, Eye, Loader2, RefreshCw } from 'lucide-react';
import { getDocuments, updateDocument, subscribeToCollection, where } from '@/lib/firebase/firestore';
import { Company } from '@/lib/types';

export default function AdminApproveCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all'>('pending');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getDocuments<Company>('companies');
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Real-time listener for companies
    const unsubscribe = subscribeToCollection<Company>('companies', [], (data) => {
      setCompanies(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (company: Company) => {
    try {
      await updateDocument('companies', company.id, {
        status: 'approved',
        approvedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error approving company:', error);
    }
  };

  const handleReject = async (company: Company, reason: string) => {
    try {
      await updateDocument('companies', company.id, {
        status: 'rejected',
        rejectionReason: reason,
      });
    } catch (error) {
      console.error('Error rejecting company:', error);
    }
  };

  const displayData = filterStatus === 'pending'
    ? companies.filter((c) => c.status === 'pending')
    : companies;

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.industry} · {item.location || 'Location N/A'}</p>
        </div>
      ),
    },
    {
      key: 'hrName',
      header: 'HR Manager',
      render: (item) => (
        <div>
          <span className="text-xs text-slate-800 font-semibold block">{item.hrName || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted Date',
      render: (item) => (
        <span className="text-xs font-mono text-slate-600">
          {item.createdAt ? item.createdAt.slice(0, 10) : 'Recently'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={
            item.status === 'approved'
              ? 'success'
              : item.status === 'rejected' || item.status === 'suspended'
              ? 'destructive'
              : 'warning'
          }
          className="capitalize text-xs font-semibold"
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Approval Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedCompany(item);
              setIsModalOpen(true);
            }}
            className="text-slate-600 hover:text-slate-900"
          >
            <Eye className="h-3.5 w-3.5 mr-1" /> View Details
          </Button>

          {item.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedCompany(item);
                  setIsModalOpen(true);
                }}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(item)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Approve Company Registrations"
        description="Verify company registration requests and grant system credentials to HR managers to allow job postings."
        icon={ShieldCheck}
        badgeText="Verification Portal"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterStatus === 'pending' ? 'secondary' : 'ghost'}
              onClick={() => setFilterStatus('pending')}
              className={filterStatus === 'pending' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:bg-white/10'}
            >
              Pending ({companies.filter((c) => c.status === 'pending').length})
            </Button>
            <Button
              size="sm"
              variant={filterStatus === 'all' ? 'secondary' : 'ghost'}
              onClick={() => setFilterStatus('all')}
              className={filterStatus === 'all' ? 'bg-white text-slate-900 font-bold' : 'text-white hover:bg-white/10'}
            >
              All Submissions ({companies.length})
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Fetching company submissions...</span>
            </div>
          ) : (
            <DataTable
              data={displayData}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search pending companies..."
              emptyMessage={
                filterStatus === 'pending'
                  ? 'No pending company approvals at this time.'
                  : 'No companies found in database.'
              }
            />
          )}
        </CardContent>
      </Card>

      <CompanyDetailModal
        company={selectedCompany}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCompany(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
