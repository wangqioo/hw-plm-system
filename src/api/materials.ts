import client from './client';

export interface Parameter { id?: string; key: string; value: string; sort_order?: number }

export interface Material {
  id: string;
  part_number: string;
  name: string;
  category: string;
  manufacturer: string;
  manufacturer_pn: string;
  description: string;
  status: 'active' | 'pending' | 'deprecated' | 'review';
  quality_level: 'A' | 'B' | 'C' | 'D';
  preferred_rank: number;
  unit_price?: number;
  stock?: number;
  lead_time_days?: number;
  datasheet_url?: string;
  notes: string;
  created_by_id?: string;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  parameters: Parameter[];
}

export interface MaterialListResponse {
  total: number;
  items: Material[];
}

export interface MaterialCreateData {
  part_number: string;
  name: string;
  category: string;
  manufacturer: string;
  manufacturer_pn: string;
  description?: string;
  quality_level?: string;
  preferred_rank?: number;
  unit_price?: number;
  stock?: number;
  lead_time_days?: number;
  notes?: string;
  parameters?: { key: string; value: string }[];
}

export const materialsApi = {
  list: (params?: {
    search?: string; category?: string; quality_level?: string;
    status?: string; sort_by?: string; page?: number; page_size?: number;
  }) => client.get<MaterialListResponse>('/materials', { params }),

  get: (id: string) => client.get<Material>(`/materials/${id}`),

  create: (data: MaterialCreateData) => client.post<Material>('/materials', data),

  update: (id: string, data: Partial<MaterialCreateData> & { status?: string }) =>
    client.put<Material>(`/materials/${id}`, data),

  delete: (id: string) => client.delete(`/materials/${id}`),

  getCategories: () => client.get<Record<string, string>>('/materials/categories'),
};
