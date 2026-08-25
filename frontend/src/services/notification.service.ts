import api from './api.ts';

export interface Notification {
  id: string;
  orgId: string;
  userId: string;
  type: string;
  payload: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const notificationService = {
  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count');
    return res.data.data.count;
  },

  async getNotifications(params: { page?: number; pageSize?: number } = {}): Promise<NotificationsResponse> {
    const res = await api.get<{ success: boolean; data: NotificationsResponse }>('/notifications', { params });
    return res.data.data;
  },

  async markRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};
