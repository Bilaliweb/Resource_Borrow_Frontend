'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Table, Select } from 'antd';
import { FileText, Eye, ArrowRight } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/utils/avatar.ts';
import { approvalService } from '@/services/approval.service.ts';
import type { BorrowRequest } from '@/services/borrow-request.service.ts';
import dayjs from 'dayjs';

const STATUS_PILL_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FEF3C7', color: '#F59E0B' },
  approved: { bg: '#DCFCE7', color: '#10B981' },
  active: { bg: '#D1FAE5', color: '#10B981' },
  completed: { bg: '#DBEAFE', color: '#3B82F6' },
  rejected: { bg: '#FEE2E2', color: '#EF4444' },
  cancelled: { bg: '#F3F4F6', color: '#9CA3AF' },
};

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

function ApprovalProgressBar({ steps }: { steps: BorrowRequest['approvalSteps'] }) {
  const total = steps.length;
  const approved = steps.filter((s) => s.status === 'approved').length;
  const rejected = steps.some((s) => s.status === 'rejected');
  const percent = rejected ? 0 : Math.round((approved / total) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: '#E5E7EB' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            backgroundColor: rejected ? '#EF4444' : percent === 100 ? '#10B981' : '#4F46E5',
          }}
        />
      </div>
      <span className="text-[11px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>
        {approved}/{total}
      </span>
    </div>
  );
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      const result = await approvalService.getMyRequests(params);
      setRequests(result.data);
      setTotal(result.total);
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusFilterChange = (val: string | undefined) => {
    setStatusFilter(val || undefined);
    setPage(1);
  };

  const columns = [
    {
      title: 'Request Code',
      key: 'requestCode',
      render: (_: any, record: BorrowRequest) => (
        <span className="font-medium text-[13px]" style={{ color: '#4F46E5' }}>
          {record.requestCode}
        </span>
      ),
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: BorrowRequest) => {
        const emp = record.employee;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
              style={{ backgroundColor: getAvatarColor(emp.fullName) }}
            >
              {getInitials(emp.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{emp.fullName}</p>
              {emp.jobTitle && (
                <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>{emp.jobTitle}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Project',
      key: 'project',
      render: (_: any, record: BorrowRequest) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>{record.project.name}</span>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: BorrowRequest) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {dayjs(record.startDatetime).format('MMM DD')}
          <ArrowRight className="w-3 h-3 inline mx-1" style={{ verticalAlign: 'middle' }} />
          {dayjs(record.endDatetime).format('MMM DD')}
        </span>
      ),
    },
    {
      title: 'Approval Progress',
      key: 'progress',
      width: 150,
      render: (_: any, record: BorrowRequest) => (
        <ApprovalProgressBar steps={record.approvalSteps} />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_: any, record: BorrowRequest) => <StatusPill status={record.status} />,
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: any, record: BorrowRequest) => (
        <Link to={`/dashboard/borrow-requests/${record.id}`}>
          <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" title="View Details">
            <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          My Requests
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Track the status of borrow requests you've submitted
        </p>
      </div>

      {/* Data Table */}
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Your Borrow Requests
          </h3>
          <Select
            value={statusFilter ?? ''}
            onChange={handleStatusFilterChange}
            options={STATUS_FILTER_OPTIONS}
            style={{ width: 160 }}
          />
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
          scroll={{ x: 900 }}
          locale={{
            emptyText: (
              <div className="py-12">
                <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No requests yet</p>
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
