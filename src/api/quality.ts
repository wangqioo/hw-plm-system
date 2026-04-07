import client from './client';

export interface QualityFeedback {
  id: string;
  material_id: string;
  material_name: string;
  type: 'downgrade' | 'upgrade' | 'ban' | 'observation';
  source: 'test' | 'manufacturer' | 'field' | 'engineer';
  description: string;
  reported_by_id: string;
  reporter_name: string;
  reported_at: string;
  status: 'open' | 'processing' | 'resolved';
  previous_level: 'A' | 'B' | 'C' | 'D';
  proposed_level?: 'A' | 'B' | 'C' | 'D';
}

export const qualityApi = {
  list: (params?: { status?: string; material_id?: string }) =>
    client.get<QualityFeedback[]>('/quality', { params }),

  create: (data: {
    material_id: string; type: string; source: string;
    description: string; proposed_level?: string;
  }) => client.post<QualityFeedback>('/quality', data),

  updateStatus: (id: string, status: 'open' | 'processing' | 'resolved') =>
    client.put<QualityFeedback>(`/quality/${id}/status`, { status }),
};
