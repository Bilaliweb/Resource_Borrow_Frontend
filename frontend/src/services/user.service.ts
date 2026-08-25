import api from './api.ts'

export interface Role {
  id: string;
  name: string;
}

export interface User {
  id: string;
  orgId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  isActive: boolean;
  createdAt: string;
  roles: Role[];
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  jobTitle?: string;
  roleIds?: string[];
}

export interface UpdateUserData {
  fullName?: string;
  jobTitle?: string;
  isActive?: boolean;
}

export const userService = {
  async getUsers(params: GetUsersParams = {}): Promise<UsersResponse> {
    const res = await api.get<{ success: boolean; data: UsersResponse }>('/users', { params });
    return res.data.data;
  },

  async getUser(id: string): Promise<User> {
    const res = await api.get<{ success: boolean; data: User }>(`/users/${id}`);
    return res.data.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const res = await api.post<{ success: boolean; data: User }>('/users', data);
    return res.data.data;
  },

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const res = await api.put<{ success: boolean; data: User }>(`/users/${id}`, data);
    return res.data.data;
  },

  async assignRoles(userId: string, roleIds: string[]): Promise<User> {
    const res = await api.put<{ success: boolean; data: User }>(`/users/${userId}/roles`, { roleIds });
    return res.data.data;
  },

  async getMe(): Promise<{ user: User; roles: { id: string; name: string }[]; permissions: { id: string; name: string }[] }> {
    const res = await api.get<{ success: boolean; data: { user: User; roles: { id: string; name: string }[]; permissions: { id: string; name: string }[] } }>('/users/me');
    return res.data.data;
  },
};
