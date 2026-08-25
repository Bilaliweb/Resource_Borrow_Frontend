import api from './api.ts';
import type { BorrowRequest, ApprovalStep } from './borrow-request.service.ts';

export interface PendingApprovalStep {
  id: string;
  borrowRequestId: string;
  stepOrder: number;
  approverUserId: string | null;
  roleRequired: string;
  status: string;
  comment: string | null;
  resolvedAt: string | null;
  approver: any;
  borrowRequest: BorrowRequest;
}

export interface PendingApprovalsResponse {
  data: PendingApprovalStep[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApprovalActionData {
  decision: 'approved' | 'rejected';
  comment?: string;
}

export const approvalService = {
  async getMyPendingApprovals(params: { page?: number; pageSize?: number } = {}): Promise<PendingApprovalsResponse> {
    const res = await api.get<{ success: boolean; data: PendingApprovalsResponse }>('/approvals/my-pending', { params });
    return res.data.data;
  },

   async processApprovalAction(stepId: string, data: ApprovalActionData): Promise<BorrowRequest> {
    const res = await api.post<{ success: boolean; data: BorrowRequest }>(`/approvals/${stepId}/action`, data);
    return res.data.data;
  },

   async getMyRequests(params: { page?: number; pageSize?: number; status?: string } = {}): Promise<{ data: BorrowRequest[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const res = await api.get<{ success: boolean; data: { data: BorrowRequest[]; total: number; page: number; pageSize: number; totalPages: number } }>('/approvals/my-requests', { params });
    return res.data.data;
  },
};
