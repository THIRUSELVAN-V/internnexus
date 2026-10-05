'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import CompanyDetailModal from '@/components/admin/CompanyDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Eye, Ban, ShieldCheck, Loader2 } from 'lucide-react';
import { getDocuments, updateDocument, subscribeToCollection } from '@/lib/firebase/firestore';
import { Company, Internship } from '@/lib/types';

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'suspended'>('all');

  useEffect(() => {
    // Real-time listener for companies
    const unsubscribeCompanies = subscribeToCollection<Company>('companies', [], (data) => {
      setCompanies(data);
      setLoading(false);
    });

    // Fetch internships to compute active postings count per company
    getDocuments<Internship>('internships').then((data) => setInternships(data)).catch(() => {});

    return () => unsubscribeCompanies();
  }, []);

  const handleToggleSuspend = async (company: Company) => {
    const newStatus = company.status === 'suspended' ? 'approved' : 'suspended';
    try {
      await updateDocument('companies', company.id, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      if (company.hrId) {
        await updateDocument('users', company.hrId, {
          approvalStatus: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating company status:', error);
    }
  };

  const filteredData = companies.filter((c) => {
    if (activeTab === 'approved') return c.status === 'approved';
    if (activeTab === 'suspended') return c.status === 'suspended';
    return c.status !== 'pending'; // Show approved & suspended by default in main directory
  });

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
      render: (item) => <span className="text-xs font-medium text-slate-700">{item.hrName || 'Unassigned'}</span>,
    },
    {
      key: 'internshipsCount',
      header: 'Active Postings',
      render: (item) => {
        const count = internships.filter((i) => i.companyId === item.id).length || item.internshipsCount || 0;
        return <span className="text-xs font-mono text-slate-700">{count} active</span>;
      },
    },
    {
      key: 'size',
      header: 'Company Size',
      render: (item) => <span className="text-xs text-slate-600 capitalize font-medium">{item.size || 'Startup'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          variant={item.status === 'approved' ? 'success' : item.status === 'suspended' ? 'destructive' : 'warning'}
          className="capitalize text-xs font-semibold"
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
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
            <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
          </Button>

          <Button
            size="sm"
            variant={item.status === 'approved' ? 'outline' : 'default'}
            onClick={() => handleToggleSuspend(item)}
            className={
              item.status === 'approved'
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }
          >
            {item.status === 'approved' ? (
              <>
                <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Reactivate
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Company Directory & Management"
        description="Comprehensive directory of verified enterprise partners. Monitor postings, verify activity, or manage access permissions."
        icon={Building2}
        badgeText="Enterprise Registry"
        action={
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl backdrop-blur">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-200 hover:text-white'
              }`}
            >
              Verified ({companies.filter((c) => c.status !== 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'approved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-200 hover:text-white'
              }`}
            >
              Approved ({companies.filter((c) => c.status === 'approved').length})
            </button>
            <button
              onClick={() => setActiveTab('suspended')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'suspended' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-200 hover:text-white'
              }`}
            >
              Suspended ({companies.filter((c) => c.status === 'suspended').length})
            </button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <span className="ml-3 text-xs text-slate-500 font-medium">Loading company directory...</span>
            </div>
          ) : (
            <DataTable
              data={filteredData}
              columns={columns}
              searchKey="name"
              searchPlaceholder="Search companies by name..."
              emptyMessage="No companies matching the selected filter."
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
        onSuspendToggle={handleToggleSuspend}
      />
    </div>
  );
}
