export interface Routine {
  id: string;
  name: string;
  description: string;
  steps : string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  model_3d: File | string | null;
  model_inference: File | string | null;
}
