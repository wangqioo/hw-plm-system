import client from './client';

export interface PDFExtractResult {
  file_url: string;
  file_name: string;
  extracted_text: string;
  suggested_name: string;
  suggested_manufacturer: string;
  suggested_manufacturer_pn: string;
  suggested_category: string;
  suggested_description: string;
  parameters: { key: string; value: string }[];
}

export const uploadApi = {
  uploadPDF: (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post<PDFExtractResult>('/upload/pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (e) => { if (e.total) onProgress(Math.round((e.loaded / e.total) * 100)); }
        : undefined,
    });
  },
};

export const dashboardApi = {
  getStats: () => client.get<{
    total_materials: number;
    pending_approvals: number;
    open_feedbacks: number;
    deprecated_materials: number;
    quality_distribution: Record<string, number>;
    category_distribution: Record<string, number>;
    monthly_entries: { month: string; count: number }[];
  }>('/dashboard/stats'),
};
