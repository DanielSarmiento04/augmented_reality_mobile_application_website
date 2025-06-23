export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  classId: number;
  className: string;
  confidence?: number;
  isSelected?: boolean;
  isVisible?: boolean;
}

export interface YoloClass {
  id: number;
  name: string;
  color: string;
  shortcut?: string;
}

export interface ImageAnnotation {
  id: string;
  filename: string;
  path: string;
  url?: string; // Base64 data URL for in-memory images
  width: number;
  height: number;
  boundingBoxes: BoundingBox[];
  isCompleted: boolean;
  lastModified: Date;
}

export interface AnnotationProject {
  id: string;
  name: string;
  description?: string;
  classes: YoloClass[];
  images: ImageAnnotation[];
  exportSettings: ExportSettings;
  createdAt: Date;
  lastModified: Date;
}

export interface ExportSettings {
  includeImages: boolean;
  format: 'yolo' | 'coco' | 'pascal-voc';
  splitDataset: boolean;
  trainRatio?: number;
  validationRatio?: number;
  testRatio?: number;
}

export interface CanvasInteraction {
  isDrawing: boolean;
  isDragging: boolean;
  isResizing: boolean;
  selectedBoxId?: string;
  dragStartPosition?: { x: number; y: number };
  resizeHandle?: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
}
