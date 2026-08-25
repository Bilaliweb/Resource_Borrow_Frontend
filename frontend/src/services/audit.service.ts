import api from './api';

export interface AuditLogEntry {
  id: string;
  orgId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    jobTitle: string | null;
  } | null;
}

export interface AuditLogsResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetAuditLogsParams {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: string;
  page?: number;
  pageSize?: number;
}

export const auditService = {
  async getAuditLogs(params: GetAuditLogsParams = {}): Promise<AuditLogsResponse> {
    const res = await api.get<{ success: boolean; data: AuditLogsResponse }>('/audit', { params });
    return res.data.data;
  },
};
