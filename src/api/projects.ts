import client from './client';
import type { Material } from './materials';

export interface BOMItem {
  id: string;
  project_id: string;
  material_id: string;
  designator: string;
  quantity: number;
  dnp: boolean;
  confirmed_by_id?: string;
  confirmed_by_name?: string;
  confirmed_at?: string;
  notes: string;
  material: Material;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  stage: 'schematic' | 'layout' | 'prototype' | 'pilot' | 'mass_production';
  manager_id?: string;
  manager_name?: string;
  description: string;
  created_at: string;
  updated_at: string;
  bom_count: number;
  unconfirmed_count: number;
}

export interface ProjectDetail extends Project {
  bom_items: BOMItem[];
}

export const projectsApi = {
  list: () => client.get<Project[]>('/projects'),

  get: (id: string) => client.get<ProjectDetail>(`/projects/${id}`),

  create: (data: { name: string; code: string; stage?: string; description?: string }) =>
    client.post<Project>('/projects', data),

  update: (id: string, data: { name?: string; stage?: string; description?: string }) =>
    client.put<Project>(`/projects/${id}`, data),

  addBOMItem: (projectId: string, data: {
    material_id: string; designator: string; quantity?: number; dnp?: boolean; notes?: string;
  }) => client.post<BOMItem>(`/projects/${projectId}/bom`, data),

  confirmBOMItem: (itemId: string) =>
    client.put<BOMItem>(`/projects/bom/${itemId}/confirm`),

  confirmAllBOM: (projectId: string) =>
    client.put<BOMItem[]>(`/projects/${projectId}/bom/confirm-all`),

  deleteBOMItem: (itemId: string) =>
    client.delete(`/projects/bom/${itemId}`),
};
