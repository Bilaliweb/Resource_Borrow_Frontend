import api from './api.ts';

export interface Project {
  id: string;
  orgId: string;
  name: string;
  ownerUserId: string;
  status: string;
  owner?: {
    id: string;
    fullName: string;
    jobTitle: string | null;
  } | null;
  _count?: {
    borrowRequests: number;
  };
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetProjectsParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface CreateProjectData {
  name: string;
  status?: string;
}

export interface UpdateProjectData {
  name?: string;
  status?: string;
}

export const projectService = {
  async getProjects(params: GetProjectsParams = {}): Promise<ProjectsResponse> {
    const res = await api.get<{ success: boolean; data: ProjectsResponse }>('/projects', { params });
    return res.data.data;
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const res = await api.post<{ success: boolean; data: Project }>('/projects', data);
    return res.data.data;
  },

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const res = await api.put<{ success: boolean; data: Project }>(`/projects/${id}`, data);
    return res.data.data;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};
