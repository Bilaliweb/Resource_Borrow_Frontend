import api from './api.ts';

export interface Department {
  id: string;
  orgId: string;
  name: string;
  headUserId: string | null;
  head?: {
    id: string;
    fullName: string;
    jobTitle: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface CreateDepartmentData {
  name: string;
  headUserId?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  headUserId?: string;
}

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const res = await api.get<{ success: boolean; data: Department[] }>('/departments');
    return res.data.data;
  },

  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const res = await api.post<{ success: boolean; data: Department }>('/departments', data);
    return res.data.data;
  },

  async updateDepartment(id: string, data: UpdateDepartmentData): Promise<Department> {
    const res = await api.put<{ success: boolean; data: Department }>(`/departments/${id}`, data);
    return res.data.data;
  },

  async deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },
};
