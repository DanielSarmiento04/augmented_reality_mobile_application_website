import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BoundingBox, CanvasInteraction } from '../../../core/models/annotation.model';

@Injectable({
  providedIn: 'root'
})
export class CanvasInteractionService {
  private interactionState = signal<CanvasInteraction>({
    isDrawing: false,
    isDragging: false,
    isResizing: false
  });

  private selectedBoxSubject = new BehaviorSubject<string | null>(null);
  selectedBox$ = this.selectedBoxSubject.asObservable();

  private hoveredBoxSubject = new BehaviorSubject<string | null>(null);
  hoveredBox$ = this.hoveredBoxSubject.asObservable();

  getInteractionState() {
    return this.interactionState();
  }

  updateInteractionState(update: Partial<CanvasInteraction>) {
    this.interactionState.update(current => ({ ...current, ...update }));
  }

  selectBox(boxId: string | null) {
    this.selectedBoxSubject.next(boxId);
    this.updateInteractionState({ selectedBoxId: boxId || undefined });
  }

  setHoveredBox(boxId: string | null) {
    this.hoveredBoxSubject.next(boxId);
  }

  resetInteraction() {
    this.interactionState.set({
      isDrawing: false,
      isDragging: false,
      isResizing: false
    });
    this.selectedBoxSubject.next(null);
    this.hoveredBoxSubject.next(null);
  }

  // Coordinate transformation utilities
  canvasToImageCoords(
    canvasX: number, 
    canvasY: number, 
    imageWidth: number, 
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    zoom: number = 1,
    panX: number = 0,
    panY: number = 0
  ): { x: number; y: number } {
    // Calculate the scale to fit image in canvas
    const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
    
    // Account for centering offset
    const offsetX = (canvasWidth - imageWidth * scale) / 2;
    const offsetY = (canvasHeight - imageHeight * scale) / 2;
    
    // Convert canvas coordinates to image coordinates
    const imageX = ((canvasX / zoom) - panX - offsetX) / scale;
    const imageY = ((canvasY / zoom) - panY - offsetY) / scale;
    
    return {
      x: Math.max(0, Math.min(1, imageX / imageWidth)),
      y: Math.max(0, Math.min(1, imageY / imageHeight))
    };
  }

  imageToCanvasCoords(
    normalizedX: number,
    normalizedY: number,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    zoom: number = 1,
    panX: number = 0,
    panY: number = 0
  ): { x: number; y: number } {
    // Calculate the scale to fit image in canvas
    const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
    
    // Account for centering offset
    const offsetX = (canvasWidth - imageWidth * scale) / 2;
    const offsetY = (canvasHeight - imageHeight * scale) / 2;
    
    // Convert normalized coordinates to canvas coordinates
    const canvasX = (normalizedX * imageWidth * scale + offsetX + panX) * zoom;
    const canvasY = (normalizedY * imageHeight * scale + offsetY + panY) * zoom;
    
    return { x: canvasX, y: canvasY };
  }

  isPointInBox(
    x: number, 
    y: number, 
    box: BoundingBox,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    zoom: number = 1,
    panX: number = 0,
    panY: number = 0
  ): boolean {
    const topLeft = this.imageToCanvasCoords(
      box.x, box.y, imageWidth, imageHeight, canvasWidth, canvasHeight, zoom, panX, panY
    );
    const bottomRight = this.imageToCanvasCoords(
      box.x + box.width, box.y + box.height, 
      imageWidth, imageHeight, canvasWidth, canvasHeight, zoom, panX, panY
    );
    
    return x >= topLeft.x && x <= bottomRight.x && y >= topLeft.y && y <= bottomRight.y;
  }

  getResizeHandle(
    x: number,
    y: number,
    box: BoundingBox,
    imageWidth: number,
    imageHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    zoom: number = 1,
    panX: number = 0,
    panY: number = 0
  ): 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null {
    const handleSize = 8;
    const topLeft = this.imageToCanvasCoords(
      box.x, box.y, imageWidth, imageHeight, canvasWidth, canvasHeight, zoom, panX, panY
    );
    const bottomRight = this.imageToCanvasCoords(
      box.x + box.width, box.y + box.height, 
      imageWidth, imageHeight, canvasWidth, canvasHeight, zoom, panX, panY
    );
    
    const handles = {
      nw: { x: topLeft.x, y: topLeft.y },
      ne: { x: bottomRight.x, y: topLeft.y },
      sw: { x: topLeft.x, y: bottomRight.y },
      se: { x: bottomRight.x, y: bottomRight.y },
      n: { x: (topLeft.x + bottomRight.x) / 2, y: topLeft.y },
      s: { x: (topLeft.x + bottomRight.x) / 2, y: bottomRight.y },
      e: { x: bottomRight.x, y: (topLeft.y + bottomRight.y) / 2 },
      w: { x: topLeft.x, y: (topLeft.y + bottomRight.y) / 2 }
    };
    
    for (const [handle, pos] of Object.entries(handles)) {
      if (Math.abs(x - pos.x) <= handleSize/2 && Math.abs(y - pos.y) <= handleSize/2) {
        return handle as 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
      }
    }
    
    return null;
  }
}
