'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Modal, Input, message, Tag, Tooltip } from 'antd';
import { CheckCircle2, XCircle, Clock, ArrowRight, Eye } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/utils/avatar.ts';
import { approvalService } from '@/services/approval.service.ts';
import type { PendingApprovalStep } from '@/services/approval.service.ts';
import dayjs from 'dayjs';

const ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  department_head: 'Department Head',
  hr_manager: 'HR Manager',
  owner: 'Final Approval',
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApprovalStep[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<PendingApprovalStep | null>(null);
  const [actionDecision, setActionDecision] = useState<'approved' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const result = await approvalService.getMyPendingApprovals({ page, pageSize });
      setApprovals(result.data);
      setTotal(result.total);
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const openActionModal = (step: PendingApprovalStep, decision: 'approved' | 'rejected') => {
    setActiveStep(step);
    setActionDecision(decision);
    setComment('');
    setActionModalOpen(true);
  };

  const handleAction = async () => {
    if (!activeStep) return;
    try {
      setActionLoading(true);
      await approvalService.processApprovalAction(activeStep.id, {
        decision: actionDecision,
        comment: comment.trim() || undefined,
      });
      message.success(actionDecision === 'approved' ? 'Request approved' : 'Request rejected');
      setActionModalOpen(false);
      fetchApprovals();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to process action';
      message.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'Request',
      key: 'requestCode',
      width: 160,
      render: (_: any, record: PendingApprovalStep) => (
        <div>
          <span className="font-medium text-[13px]" style={{ color: '#4F46E5' }}>
            {record.borrowRequest.requestCode}
          </span>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Step {record.stepOrder} of {record.borrowRequest.approvalSteps.length}
          </p>
        </div>
      ),
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: PendingApprovalStep) => {
        const emp = record.borrowRequest.employee;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0"
              style={{ backgroundColor: getAvatarColor(emp.fullName) }}
            >
              {getInitials(emp.fullName)}
            </div>
            <span className="text-[13px]" style={{ color: 'var(--color-text-primary)' }}>{emp.fullName}</span>
          </div>
        );
      },
    },
    {
      title: 'Project',
      key: 'project',
      render: (_: any, record: PendingApprovalStep) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {record.borrowRequest.project.name}
        </span>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: PendingApprovalStep) => (
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          {dayjs(record.borrowRequest.startDatetime).format('MMM DD')}
          <ArrowRight className="w-3 h-3 inline mx-1" style={{ verticalAlign: 'middle' }} />
          {dayjs(record.borrowRequest.endDatetime).format('MMM DD')}
        </span>
      ),
    },
    {
      title: 'Your Role',
      key: 'roleRequired',
      width: 150,
      render: (_: any, record: PendingApprovalStep) => (
        <Tag style={{ borderRadius: 6, fontWeight: 500 }}>
          {ROLE_LABELS[record.roleRequired] || record.roleRequired}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 220,
      render: (_: any, record: PendingApprovalStep) => (
        <div className="flex items-center gap-2 justify-end">
          <Link to={`/dashboard/borrow-requests/${record.borrowRequest.id}`}>
            <Tooltip title="View Details">
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </Tooltip>
          </Link>
          <Button
            size="small"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => openActionModal(record, 'approved')}
            style={{ color: '#10B981', borderColor: '#10B981' }}
          >
            Approve
          </Button>
          <Button
            size="small"
            danger
            icon={<XCircle className="w-3.5 h-3.5" />}
            onClick={() => openActionModal(record, 'rejected')}
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Approvals
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Review and process pending borrow request approvals
        </p>
      </div>

      {/* Pending Count Banner */}
      {!loading && total > 0 && (
        <div
          className="bg-white rounded-lg px-5 py-3 mb-6 flex items-center gap-3"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
            <Clock className="w-4 h-4" style={{ color: '#F59E0B' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            You have <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{total}</span> pending approval{total !== 1 ? 's' : ''} waiting for your action.
          </p>
        </div>
      )}

      {/* Data Table */}
      <div
        className="bg-white rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <Table
          columns={columns}
          dataSource={approvals}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showTotal: (t) => `${t} pending approval${t !== 1 ? 's' : ''}`,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <div className="py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#10B981' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>All caught up!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  No pending approvals at the moment
                </p>
              </div>
            ),
          }}
        />
      </div>

      {/* Approve/Reject Modal */}
      <Modal
        title={null}
        open={actionModalOpen}
        onOk={handleAction}
        onCancel={() => setActionModalOpen(false)}
        okText={actionDecision === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
        cancelText="Cancel"
        confirmLoading={actionLoading}
        okButtonProps={
          actionDecision === 'rejected'
            ? { danger: true }
            : { style: { backgroundColor: '#10B981', borderColor: '#10B981' } }
        }
        width={480}
      >
        {activeStep && (
          <div>
            {/* Summary */}
            <div className="mb-4">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {activeStep.borrowRequest.requestCode}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Borrow {activeStep.borrowRequest.employee.fullName} → {activeStep.borrowRequest.project.name}
              </p>
            </div>

            {/* Decision indicator */}
            <div
              className="rounded-lg px-4 py-3 mb-4"
              style={{
                backgroundColor: actionDecision === 'approved' ? '#DCFCE7' : '#FEE2E2',
              }}
            >
              <p className="text-sm font-medium" style={{
                color: actionDecision === 'approved' ? '#10B981' : '#EF4444',
              }}>
                {actionDecision === 'approved'
                  ? `You are approving as ${ROLE_LABELS[activeStep.roleRequired] || activeStep.roleRequired}`
                  : `You are rejecting as ${ROLE_LABELS[activeStep.roleRequired] || activeStep.roleRequired}`
                }
              </p>
            </div>

            {/* Comment */}
            <div className="mb-2">
              <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
                Comment {actionDecision === 'rejected' ? '(recommended)' : '(optional)'}
              </p>
              <Input.TextArea
                rows={3}
                placeholder={
                  actionDecision === 'approved'
                    ? 'Add an optional comment...'
                    : 'Explain why you are rejecting this request...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                showCount
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
