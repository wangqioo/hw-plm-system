export type MaterialStatus = 'active' | 'pending' | 'deprecated' | 'review';
export type QualityLevel = 'A' | 'B' | 'C' | 'D';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'reviewing';
export type UserRole = 'engineer' | 'reviewer' | 'admin' | 'procurement';

export interface Material {
  id: string;
  partNumber: string;
  name: string;
  category: MaterialCategory;
  manufacturer: string;
  manufacturerPN: string;
  description: string;
  status: MaterialStatus;
  qualityLevel: QualityLevel;
  preferredRank: number;
  parameters: Record<string, string>;
  datasheet?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  stock?: number;
  unitPrice?: number;
  leadTime?: number; // days
  alternates?: string[]; // IDs of alternate materials
  notes?: string;
}

export type MaterialCategory =
  | 'resistor' | 'capacitor' | 'inductor' | 'diode' | 'transistor'
  | 'ic_mcu' | 'ic_power' | 'ic_analog' | 'ic_memory' | 'ic_logic'
  | 'connector' | 'crystal' | 'transformer' | 'relay' | 'sensor' | 'other';

export interface ApprovalRecord {
  id: string;
  materialId: string;
  materialName: string;
  partNumber: string;
  type: 'new_entry' | 'quality_change' | 'bom_confirm' | 'deprecate';
  status: ApprovalStatus;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
  priority: 'high' | 'medium' | 'low';
  projectRef?: string;
}

export interface BOMItem {
  id: string;
  projectId: string;
  materialId: string;
  material: Material;
  designator: string;
  quantity: number;
  dnp: boolean; // Do Not Place
  confirmedBy?: string;
  confirmedAt?: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  stage: 'schematic' | 'layout' | 'prototype' | 'pilot' | 'mass_production';
  manager: string;
  createdAt: string;
  bomItems: BOMItem[];
}

export interface QualityFeedback {
  id: string;
  materialId: string;
  materialName: string;
  type: 'downgrade' | 'upgrade' | 'ban' | 'observation';
  source: 'test' | 'manufacturer' | 'field' | 'engineer';
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: 'open' | 'processing' | 'resolved';
  previousLevel: QualityLevel;
  proposedLevel?: QualityLevel;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
}
