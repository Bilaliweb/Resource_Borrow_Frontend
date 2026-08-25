import api from './api.ts';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../../../../backend/src/shared/src/types.ts';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', data);
    console.log('Res for login: ', res);
    
    return res.data.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const res = await api.post<{ success: boolean; data: RegisterResponse }>('/auth/register', data);
    return res.data.data;
  },
};
