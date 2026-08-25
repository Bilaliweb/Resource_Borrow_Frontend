'use client';

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Spin, Button, Popconfirm, message, Tag, Divider, Modal, Input } from 'antd';
import { ArrowLeft, Calendar, User, FolderKanban, Clock, FileText, CheckCircle2, XCircle, MinusCircle, Play, SquareCheckBig, Activity, ShieldCheck, Zap, Ban, SkipForward, CheckCircle } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/utils/avatar.ts';
import { borrowRequestService } from '@/services/borrow-request.service.ts';
import { approvalService } from '@/services/approval.service.ts';
import { auditService } from '@/services/audit.service.ts';
import type { BorrowRequest, ApprovalStep } from '@/services/borrow-request.service.ts';
import type { AuditLogEntry } from '@/services/audit.service.ts';
import { useAppSelector } from '@/store/hooks.ts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const STATUS_PILL_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FEF3C7', color: '#F59E0B' },
  approved: { bg: '#DCFCE7', color: '#10B981' },
  active: { bg: '#D1FAE5', color: '#10B981' },
  completed: { bg: '#DBEAFE', color: '#3B82F6' },
  rejected: { bg: '#FEE2E2', color: '#EF4444' },
  cancelled: { bg: '#F3F4F6', color: '#9CA3AF' },
};

function PersonCard({ name, jobTitle, label }: { name: string; jobTitle: string | null; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0"
        style={{ backgroundColor: getAvatarColor(name) }}
      >
        {getInitials(name)}
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{name}</p>
        {jobTitle && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{jobTitle}</p>
        )}
      </div>
    </div>
  );
}

function ApprovalStepCard({ step, isCurrent }: { step: ApprovalStep; isCurrent: boolean }) {
  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
    pending: { icon: Clock, color: '#F59E0B', bg: '#FEF3C7', label: 'Pending' },
    approved: { icon: CheckCircle2, color: '#10B981', bg: '#DCFCE7', label: 'Approved' },
    rejected: { icon: XCircle, color: '#EF4444', bg: '#FEE2E2', label: 'Rejected' },
    skipped: { icon: MinusCircle, color: '#9CA3AF', bg: '#F3F4F6', label: 'Skipped' },
  };
  const cfg = statusConfig[step.status] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-lg p-4 transition-all ${isCurrent ? 'ring-2' : ''}`}
      style={{
        backgroundColor: cfg.bg,
        ringColor: isCurrent ? '#4F46E5' : undefined,
        borderColor: isCurrent ? '#4F46E5' : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
          >
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Step {step.stepOrder}: {step.roleRequired.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            {step.approver && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                by {step.approver.fullName}
              </p>
            )}
            {step.comment && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                "{step.comment}"
              </p>
            )}
            {step.resolvedAt && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {dayjs(step.resolvedAt).format('MMM DD, YYYY hh:mm A')}
              </p>
            )}
          </div>
        </div>
        <Tag
          style={{
            backgroundColor: 'rgba(255,255,255,0.8)',
            color: cfg.color,
            border: 'none',
            fontWeight: 500,
          }}
        >
          {cfg.label}
        </Tag>
      </div>
    </div>
  );
}

// Role-to-step mapping: which roles can act on which step roleRequired
const ROLE_STEP_MAP: Record<string, string[]> = {
  manager: ['manager'],
  department_head: ['department_head', 'dept_head'],
  hr_manager: ['hr_manager'],
  owner: ['owner'],
};

// Audit log action display config
const AUDIT_ACTION_CONFIG: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  'borrow_request.created':  { icon: FileText, color: '#3B82F6', label: 'Request Created' },
  'borrow_request.approved': { icon: ShieldCheck, color: '#10B981', label: 'Fully Approved' },
  'borrow_request.rejected': { icon: XCircle, color: '#EF4444', label: 'Request Rejected' },
  'borrow_request.cancelled':{ icon: Ban, color: '#9CA3AF', label: 'Request Cancelled' },
  'borrow_request.activated': { icon: Zap, color: '#10B981', label: 'Request Activated' },
  'borrow_request.completed':{ icon: SquareCheckBig, color: '#3B82F6', label: 'Request Completed' },
  'approval_step.approved': { icon: CheckCircle, color: '#10B981', label: 'Step Approved' },
  'approval_step.skipped':  { icon: SkipForward, color: '#9CA3AF', label: 'Step Skipped' },
};

function AuditTimeline({ logs }: { logs: AuditLogEntry[] }) {
  if (logs.length === 0) return null;
  return (
    <div className="mt-6 lg:col-span-3">
      <div
        className="bg-white rounded-lg p-5"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Activity Log</h3>
        </div>
        <div className="flex flex-col gap-0">
          {logs.map((log, idx) => {
            const cfg = AUDIT_ACTION_CONFIG[log.action] || { icon: Activity, color: '#6B7280', label: log.action };
            const Icon = cfg.icon;
            const isSystem = log.actorUserId === 'system';
            return (
              <div key={log.id} className="flex gap-3 relative">
                {/* Connector line */}
                {idx < logs.length - 1 && (
                  <div
                    className="absolute left-[15px] top-[32px] w-0.5"
                    style={{
                      height: 'calc(100% - 12px)',
                      backgroundColor: '#E5E7EB',
                    }}
                  />
                )}
                <div
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${cfg.color}15` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {cfg.label}
                    </p>
                    {isSystem && (
                      <Tag
                        style={{
                          backgroundColor: '#F3F4F6',
                          color: '#6B7280',
                          border: 'none',
                          fontSize: '10px',
                          lineHeight: '18px',
                          padding: '0 6px',
                          margin: 0,
                        }}
                      >
                        Auto
                      </Tag>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    by {log.actor?.fullName || 'Unknown'}
                  </p>
                  {log.metadata?.comment && (
                    <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-muted)' }}>
                      "{log.metadata.comment}"
                    </p>
                  )}
                  <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {dayjs(log.createdAt).format('MMM DD, YYYY hh:mm A')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BorrowRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAppSelector((state) => state.auth.user);
  const userRoles = currentUser?.roles || [];

  const [request, setRequest] = useState<BorrowRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [activating, setActivating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Approval action state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionDecision, setActionDecision] = useState<'approved' | 'rejected'>('approved');
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await borrowRequestService.getBorrowRequest(id);
      setRequest(data);
    } catch {
      message.error('Failed to load borrow request');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!id || !request?.orgId) return;
    try {
      const result = await auditService.getAuditLogs({
        entityType: 'borrow_request',
        entityId: id,
        pageSize: 50,
      });
      setAuditLogs(result.data);
    } catch {
      // silent — audit log is supplementary
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  // Fetch audit logs after request loads
  useEffect(() => {
    if (request) fetchAuditLogs();
  }, [request]);

  const handleCancel = async () => {
    if (!request) return;
    try {
      setCancelling(true);
      const updated = await borrowRequestService.cancelBorrowRequest(request.id);
      setRequest(updated);
      message.success('Request cancelled successfully');
      fetchAuditLogs();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to cancel request';
      message.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleActivate = async () => {
    if (!request) return;
    try {
      setActivating(true);
      const updated = await borrowRequestService.activateBorrowRequest(request.id);
      setRequest(updated);
      message.success('Request activated successfully');
      fetchAuditLogs();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to activate request';
      message.error(msg);
    } finally {
      setActivating(false);
    }
  };

  const handleComplete = async () => {
    if (!request) return;
    try {
      setCompleting(true);
      const updated = await borrowRequestService.completeBorrowRequest(request.id);
      setRequest(updated);
      message.success('Request completed successfully');
      fetchAuditLogs();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to complete request';
      message.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  // Determine if the current user can act on the current pending step
  const currentPendingStep = request?.approvalSteps.find((s) => s.status === 'pending');
  const canActOnStep = (() => {
    if (!currentPendingStep || !request || request.status !== 'pending') return false;
    const stepRole = currentPendingStep.roleRequired;
    return userRoles.some((role) => {
      const matchableRoles = ROLE_STEP_MAP[role];
      return matchableRoles?.includes(stepRole);
    });
  })();

  const openActionModal = (decision: 'approved' | 'rejected') => {
    setActionDecision(decision);
    setComment('');
    setActionModalOpen(true);
  };

  const handleApprovalAction = async () => {
    if (!currentPendingStep) return;
    try {
      setActionLoading(true);
      const updated = await approvalService.processApprovalAction(currentPendingStep.id, {
        decision: actionDecision,
        comment: comment.trim() || undefined,
      });
      setRequest(updated);
      message.success(actionDecision === 'approved' ? 'Step approved successfully' : 'Request rejected');
      setActionModalOpen(false);
      fetchAuditLogs();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to process action';
      message.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spin size="large" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Request not found.</p>
        <Link to="/dashboard" className="mt-2 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const statusColors = STATUS_PILL_COLORS[request.status] || STATUS_PILL_COLORS.pending;
  const canCancel = request.status === 'pending' || request.status === 'approved';
  const canActivate = request.status === 'approved';
  const canComplete = request.status === 'active';
  const currentStepIdx = request.approvalSteps.findIndex((s) => s.status === 'pending');

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-primary)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requests
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {request.requestCode}
            </h1>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{ backgroundColor: statusColors.bg, color: statusColors.color }}
            >
              {request.status}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Created {dayjs(request.createdAt).format('MMM DD, YYYY hh:mm A')} ({dayjs(request.createdAt).fromNow()})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canActOnStep && (
            <>
              <Button
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => openActionModal('approved')}
                style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#fff' }}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<XCircle className="w-4 h-4" />}
                onClick={() => openActionModal('rejected')}
              >
                Reject
              </Button>
            </>
          )}
          {canActivate && !canActOnStep && (
            <Popconfirm
              title="Activate this request?"
              description="The borrow period will begin and the employee will be assigned to the project."
              onConfirm={handleActivate}
              okText="Yes, activate it"
              cancelText="No"
              okButtonProps={{ style: { backgroundColor: '#10B981', borderColor: '#10B981' } }}
            >
              <Button
                icon={<Play className="w-4 h-4" />}
                loading={activating}
                style={{ backgroundColor: '#10B981', borderColor: '#10B981', color: '#fff' }}
              >
                Activate
              </Button>
            </Popconfirm>
          )}
          {canComplete && (
            <Popconfirm
              title="Complete this request?"
              description="The borrow period will be marked as completed and the employee will be released."
              onConfirm={handleComplete}
              okText="Yes, complete it"
              cancelText="No"
              okButtonProps={{ style: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' } }}
            >
              <Button
                icon={<SquareCheckBig className="w-4 h-4" />}
                loading={completing}
                style={{ backgroundColor: '#3B82F6', borderColor: '#3B82F6', color: '#fff' }}
              >
                Complete
              </Button>
            </Popconfirm>
          )}
          {canCancel && !canActOnStep && !canActivate && !canComplete && (
            <Popconfirm
              title="Cancel this request?"
              description="This action cannot be undone."
              onConfirm={handleCancel}
              okText="Yes, cancel it"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button danger loading={cancelling}>
                Cancel Request
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Main details (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* People involved */}
          <div
            className="bg-white rounded-lg p-5"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>People Involved</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PersonCard name={request.employee.fullName} jobTitle={request.employee.jobTitle} label="Employee" />
              <PersonCard name={request.fromManager.fullName} jobTitle={request.fromManager.jobTitle} label="From Manager" />
              <PersonCard name={request.toManager.fullName} jobTitle={request.toManager.jobTitle} label="To Manager (Requester)" />
            </div>
          </div>

          {/* Request details */}
          <div
            className="bg-white rounded-lg p-5"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Request Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-start gap-2.5">
                <FolderKanban className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Project</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{request.project.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Start</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {dayjs(request.startDatetime).format('MMM DD, YYYY hh:mm A')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>End</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {dayjs(request.endDatetime).format('MMM DD, YYYY hh:mm A')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Duration</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {dayjs(request.endDatetime).diff(dayjs(request.startDatetime), 'day')} day(s)
                  </p>
                </div>
              </div>
            </div>
            <Divider style={{ borderColor: 'var(--color-border)', margin: '16px 0' }} />
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Reason</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{request.reason}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Approval timeline (1/3) */}
        <div className="lg:col-span-1">
          <div
            className="bg-white rounded-lg p-5 sticky top-6"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Approval Progress</h3>
            <div className="flex flex-col gap-3">
              {request.approvalSteps.map((step, idx) => (
                <div key={step.id} className="relative">
                  {/* Connector line */}
                  {idx < request.approvalSteps.length - 1 && (
                    <div
                      className="absolute left-4 top-full w-0.5 h-3"
                      style={{
                        backgroundColor:
                          step.status === 'approved'
                            ? '#10B981'
                            : step.status === 'rejected'
                            ? '#EF4444'
                            : '#E5E7EB',
                      }}
                    />
                  )}
                  <ApprovalStepCard step={step} isCurrent={idx === currentStepIdx} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <AuditTimeline logs={auditLogs} />

      {/* Approve/Reject Modal */}
      <Modal
        title={null}
        open={actionModalOpen}
        onOk={handleApprovalAction}
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
        {currentPendingStep && (
          <div>
            <div className="mb-4">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {request.requestCode} — Step {currentPendingStep.stepOrder}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {currentPendingStep.roleRequired.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
            </div>

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
                  ? 'You are approving this step. The workflow will advance to the next approver.'
                  : 'You are rejecting this request. All remaining approval steps will be skipped.'
                }
              </p>
            </div>

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
