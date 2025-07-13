import { User } from './user.model';

export interface Routine {
  id: string;
  name: string;
  description: string;
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
  model_3d: File | string | null;
  model_inference: File | string | null;
  assignedUsers: User[];
  createdBy: User;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'active' | 'completed' | 'archived';
  estimatedDuration: number; // in minutes
  tags: string[];
  department?: string;
  lastExecuted?: Date;
  executionCount: number;
}
