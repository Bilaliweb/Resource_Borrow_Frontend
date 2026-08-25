'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Input, Select, Popconfirm, message } from 'antd';
import { Plus, Calendar, ClipboardList, Clock, UserCheck, CheckCircle2, Search, Eye, Trash2 } from 'lucide-react';
import api from '@/services/api.ts';
import { borrowRequestService } from '@/services/borrow-request.service.ts';
import type { BorrowRequest } from '@/services/borrow-request.service.ts';
import type { DashboardKpis } from '../../../../backend/src/shared/src/types.ts';
import { getAvatarColor, getInitials } from '@/utils/avatar.ts';

const kpiConfig = [
  { key: 'totalRequests', label: 'Total Borrow Requests', helper: 'This Month', icon: ClipboardList, color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'pendingRequests', label: 'Pending Approvals', helper: 'Awaiting your action', icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'activeRequests', label: 'Active Borrowings', helper: 'Ongoing', icon: UserCheck, color: '#10B981', bg: '#DCFCE7' },
  { key: 'completedRequests', label: 'Completed', helper: 'This Month', icon: CheckCircle2, color: '#3B82F6', bg: '#DBEAFE' },
] as const;

const STATUS_PILL_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FEF3C7', color: '#F59E0B' },
  approved: { bg: '#DCFCE7', color: '#10B981' },
  active: { bg: '#D1FAE5', color: '#10B981' },
  completed: { bg: '#DBEAFE', color: '#3B82F6' },
  rejected: { bg: '#FEE2E2', color: '#EF4444' },
  cancelled: { bg: '#F3F4F6', color: '#9CA3AF' },
};

function PersonCell({ name, jobTitle }: { name: string; jobTitle: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
        style={{ backgroundColor: getAvatarColor(name) }}
      >
        {getInitials(name)}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{name}</p>
        {jobTitle && (
          <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>{jobTitle}</p>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors = STATUS_PILL_COLORS[status] || STATUS_PILL_COLORS.pending;
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ backgroundColor: colors.bg, color: colors.color }}
    >
      {status}
    </span>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Map KPI key to the status filter value for clickable KPI cards
const KPI_STATUS_FILTER: Record<string, string | undefined> = {
  totalRequests: undefined,
  pendingRequests: 'pending',
  activeRequests: 'active',
  completedRequests: 'completed',
};

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);

  // Table state
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);


  // Fetch KPIs
  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const res = await api.get<{ success: boolean; data: DashboardKpis }>('/dashboard/kpis');
        setKpis(res.data.data);
      } catch {
        // KPIs will stay null, cards show 0
      }
    };
    fetchKpis();
  }, []);

  // Fetch borrow requests
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await borrowRequestService.getBorrowRequests(params);
      setRequests(res.data);
      setTotal(res.total);
    } catch {
      // leave data empty
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, search]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCancel = async (id: string) => {
    try {
      await borrowRequestService.cancelBorrowRequest(id);
      message.success('Request cancelled successfully');
      fetchRequests();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to cancel request';
      message.error(msg);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (val: string | undefined) => {
    setStatusFilter(val || undefined);
    setPage(1);
  };

  const columns = [
    {
      title: 'Request Code',
      dataIndex: 'requestCode',
      key: 'requestCode',
      render: (code: string) => (
        <span className="font-medium" style={{ color: '#4F46E5', fontSize: 13 }}>{code}</span>
      ),
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: BorrowRequest) => (
        <PersonCell name={record.employee.fullName} jobTitle={record.employee.jobTitle} />
      ),
    },
    {
      title: 'Project',
      dataIndex: ['project', 'name'],
      key: 'project',
      render: (name: string) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-primary)' }}>{name}</span>
      ),
    },
    {
      title: 'From Manager',
      key: 'fromManager',
      render: (_: any, record: BorrowRequest) => (
        <PersonCell name={record.fromManager.fullName} jobTitle={record.fromManager.jobTitle} />
      ),
    },
    {
      title: 'To Manager',
      key: 'toManager',
      render: (_: any, record: BorrowRequest) => (
        <PersonCell name={record.toManager.fullName} jobTitle={record.toManager.jobTitle} />
      ),
    },
    {
      title: 'Start Date',
      key: 'startDatetime',
      render: (_: any, record: BorrowRequest) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {new Date(record.startDatetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      title: 'End Date',
      key: 'endDatetime',
      render: (_: any, record: BorrowRequest) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {new Date(record.endDatetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: BorrowRequest) => <StatusPill status={record.status} />,
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_: any, record: BorrowRequest) => {
        const canCancel = record.status === 'pending' || record.status === 'approved';
        return (
          <div className="flex items-center gap-1">
            <Link to={`/dashboard/borrow-requests/${record.id}`}>
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="View Details">
                <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </Link>
            {canCancel && (
              <Popconfirm
                title="Cancel this request?"
                description="This action cannot be undone."
                onConfirm={() => handleCancel(record.id)}
                okText="Yes, cancel it"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <button className="p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Cancel Request">
                  <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                </button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Borrow Employee
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Request and manage employee borrowing across teams
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {kpiConfig.map((kpi) => {
          const Icon = kpi.icon;
          const value = kpis ? (kpis[kpi.key] as number) : 0;
          const filterVal = KPI_STATUS_FILTER[kpi.key];
          return (
            <div
              key={kpi.key}
              className="bg-white rounded-lg p-5 relative cursor-pointer hover:shadow-md transition-shadow duration-200"
              style={{ border: '1px solid var(--color-border)' }}
              onClick={() => {
                setStatusFilter(filterVal);
                setPage(1);
              }}
            >
              <div
                className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: kpi.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {kpi.label}
              </p>
              <p className="text-[30px] font-bold leading-tight mt-2" style={{ color: 'var(--color-text-primary)' }}>
                {value}
              </p>
              <p className="text-[13px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
                {kpi.helper}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div
        className="bg-white rounded-lg p-4 mb-6 flex flex-col justify-between gap-4 xl:col-span-1"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Quick Actions
        </p>
        <div className="flex flex-col gap-2">
          <Button
            icon={<Calendar className="w-4 h-4" />}
            className="font-medium"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            disabled
          >
            View Calendar
          </Button>
          <Link to="/dashboard/borrow-requests/new">
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              className="font-medium"
              style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            >
              New Borrow Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Data Table */}
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Borrow Requests
          </h3>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by code or employee..."
              prefix={<Search className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />}
              value={search}
              onChange={handleSearchChange}
              allowClear
              style={{ width: 260 }}
            />
            <Select
              value={statusFilter ?? ''}
              onChange={handleStatusFilterChange}
              options={STATUS_FILTER_OPTIONS}
              style={{ width: 160 }}
            />
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `${t} request${t !== 1 ? 's' : ''}`,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          scroll={{ x: 1100 }}
          locale={{
            emptyText: (
              <div className="py-12">
                <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No requests found</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Create a new borrow request to get started
                </p>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}
