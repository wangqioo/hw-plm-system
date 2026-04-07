import client from './client';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'engineer' | 'reviewer' | 'admin' | 'procurement';
  department: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  login: (username: string, password: string) =>
    client.post<LoginResponse>('/auth/login', { username, password }),

  me: () => client.get<User>('/auth/me'),

  listUsers: () => client.get<User[]>('/auth/users'),

  createUser: (data: {
    username: string; password: string; full_name: string;
    role: string; department: string;
  }) => client.post<User>('/auth/users', data),

  changePassword: (old_password: string, new_password: string) =>
    client.put('/auth/me/password', { old_password, new_password }),
};
