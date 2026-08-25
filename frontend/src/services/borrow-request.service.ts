import api from './api.ts';

export interface ApprovalStepApprover {
  id: string;
  fullName: string;
  jobTitle: string | null;
  avatarUrl: string | null;
}

export interface ApprovalStep {
  id: string;
  stepOrder: number;
  roleRequired: string;
  status: string;
  approverUserId: string | null;
  comment: string | null;
  resolvedAt: string | null;
  approver: ApprovalStepApprover | null;
}

export interface PersonInfo {
  id: string;
  fullName: string;
  jobTitle: string | null;
  avatarUrl: string | null;
}

export interface BorrowRequest {
  id: string;
  orgId: string;
  requestCode: string;
  employeeId: string;
  fromManagerId: string;
  toManagerId: string;
  projectId: string;
  startDatetime: string;
  endDatetime: string;
  reason: string;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  employee: PersonInfo;
  fromManager: PersonInfo;
  toManager: PersonInfo;
  project: {
    id: string;
    name: string;
  };
  approvalSteps: ApprovalStep[];
}

export interface BorrowRequestsResponse {
  data: BorrowRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetBorrowRequestsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface CreateBorrowRequestData {
  employeeId: string;
  fromManagerId: string;
  projectId: string;
  startDatetime: string;
  endDatetime: string;
  reason: string;
}

export const borrowRequestService = {
  async getBorrowRequests(params: GetBorrowRequestsParams = {}): Promise<BorrowRequestsResponse> {
    const res = await api.get<{ success: boolean; data: BorrowRequestsResponse }>('/borrow-requests', { params });
    return res.data.data;
  },

  async getBorrowRequest(id: string): Promise<BorrowRequest> {
    const res = await api.get<{ success: boolean; data: BorrowRequest }>(`/borrow-requests/${id}`);
    return res.data.data;
  },

  async createBorrowRequest(data: CreateBorrowRequestData): Promise<BorrowRequest> {
    const res = await api.post<{ success: boolean; data: BorrowRequest }>('/borrow-requests', data);
    return res.data.data;
  },

  async cancelBorrowRequest(id: string): Promise<BorrowRequest> {
    const res = await api.post<{ success: boolean; data: BorrowRequest }>(`/borrow-requests/${id}/cancel`);
    return res.data.data;
  },

  async generateRequestCode(): Promise<string> {
    const res = await api.get<{ success: boolean; data: { requestCode: string } }>('/borrow-requests/request-code');
    return res.data.data.requestCode;
  },

  async activateBorrowRequest(id: string): Promise<BorrowRequest> {
    const res = await api.post<{ success: boolean; data: BorrowRequest }>(`/borrow-requests/${id}/activate`);
    return res.data.data;
  },

  async completeBorrowRequest(id: string): Promise<BorrowRequest> {
    const res = await api.post<{ success: boolean; data: BorrowRequest }>(`/borrow-requests/${id}/complete`);
    return res.data.data;
  },
};
