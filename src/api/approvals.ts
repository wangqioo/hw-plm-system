import client from './client';

export interface ApprovalRecord {
  id: string;
  material_id: string;
  material_name: string;
  part_number: string;
  type: 'new_entry' | 'quality_change' | 'bom_confirm' | 'deprecate';
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  submitted_by_id: string;
  submitter_name: string;
  submitted_at: string;
  reviewed_by_id?: string;
  reviewer_name?: string;
  reviewed_at?: string;
  comment: string;
  project_ref: string;
}

export const approvalsApi = {
  list: (params?: { status?: string; type?: string }) =>
    client.get<ApprovalRecord[]>('/approvals', { params }),

  create: (data: {
    material_id: string; type: string; priority?: string;
    comment?: string; project_ref?: string;
  }) => client.post<ApprovalRecord>('/approvals', data),

  action: (id: string, action: 'approve' | 'reject' | 'review', comment?: string) =>
    client.put<ApprovalRecord>(`/approvals/${id}/action`, { action, comment: comment || '' }),
};
