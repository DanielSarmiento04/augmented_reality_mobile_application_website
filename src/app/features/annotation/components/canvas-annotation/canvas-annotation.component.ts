import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  signal,
  computed,
  effect,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoundingBox, ImageAnnotation, YoloClass, CanvasInteraction } from '../../../../core/models/annotation.model';
import { CanvasInteractionService } from '../../services/canvas-interaction.service';
import { Subject, takeUntil, fromEvent, merge } from 'rxjs';

@Component({
  selector: 'custom-canvas-annotation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-container"
         [attr.aria-label]="'Annotation canvas for ' + currentImage()?.filename"
         role="img"
         tabindex="0"
         (keydown)="onKeyDown($event)">

      <canvas
        #canvasElement
        class="annotation-canvas"
        [width]="canvasWidth()"
        [height]="canvasHeight()"
        [attr.aria-describedby]="'canvas-instructions'"
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp($event)"
        (contextmenu)="onContextMenu($event)">
      </canvas>

      <!-- Screen reader instructions -->
      <div id="canvas-instructions" class="sr-only">
        Use mouse to draw bounding boxes. Press 1-9 to select class.
        Press Delete to remove selected box. Press Escape to cancel current action.
      </div>

      <!-- Zoom and pan controls -->
      <div class="canvas-controls" role="toolbar" aria-label="Canvas controls">
        <button
          class="control-btn"
          (click)="zoomIn()"
          [attr.aria-label]="'Zoom in, current zoom: ' + zoomLevel() + '%'">
          <span aria-hidden="true">🔍+</span>
        </button>
        <button
          class="control-btn"
          (click)="zoomOut()"
          [attr.aria-label]="'Zoom out, current zoom: ' + zoomLevel() + '%'">
          <span aria-hidden="true">🔍-</span>
        </button>
        <button
          class="control-btn"
          (click)="resetZoom()"
          aria-label="Reset zoom to 100%">
          <span aria-hidden="true">⊙</span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./canvas-annotation.component.scss']
})
export class CanvasAnnotationComponent implements OnInit, OnDestroy {
  @ViewChild('canvasElement', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Component inputs using the new input() function
  currentImage = input<ImageAnnotation | null>(null);
  availableClasses = input<YoloClass[]>([]);
  selectedClassId = input<number>(0);

  @Output() boxCreated = new EventEmitter<BoundingBox>();
  @Output() boxUpdated = new EventEmitter<BoundingBox>();
  @Output() boxDeleted = new EventEmitter<string>();
  @Output() boxSelected = new EventEmitter<string | null>();
  @Output() classSelected = new EventEmitter<number>();

  private canvasInteractionService = inject(CanvasInteractionService);
  private destroy$ = new Subject<void>();

  // Canvas state signals
  canvasWidth = signal(800);
  canvasHeight = signal(600);
  zoomLevel = signal(100);
  panOffset = signal({ x: 0, y: 0 });

  // Interaction state
  private ctx!: CanvasRenderingContext2D;
  private imageElement: HTMLImageElement | null = null;
  private interaction: CanvasInteraction = {
    isDrawing: false,
    isDragging: false,
    isResizing: false
  };

  // Computed values
  scaledImageDimensions = computed(() => {
    const img = this.currentImage();
    if (!img) return { width: 0, height: 0, scale: 1 };

    const canvas = { width: this.canvasWidth(), height: this.canvasHeight() };
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height, 1);

    return {
      width: img.width * scale,
      height: img.height * scale,
      scale
    };
  });

  constructor() {
    // Auto-redraw when image or boxes change
    effect(() => {
      const img = this.currentImage();
      if (img) {
        this.loadImage(img);
      }
    });
  }

  ngOnInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.setupCanvasEventListeners();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.updateCanvasSize();
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -10 : 10;
    this.zoomLevel.update(current => Math.max(25, Math.min(500, current + delta)));
    this.redraw();
  }

  private setupCanvasEventListeners() {
    const canvas = this.canvasRef.nativeElement;

    // Touch events for mobile support
    merge(
      fromEvent<TouchEvent>(canvas, 'touchstart'),
      fromEvent<TouchEvent>(canvas, 'touchmove'),
      fromEvent<TouchEvent>(canvas, 'touchend')
    ).pipe(takeUntil(this.destroy$))
    .subscribe(event => this.handleTouchEvent(event));
  }

  private setupKeyboardShortcuts() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.onKeyDown(event));
  }

  onKeyDown(event: KeyboardEvent) {
    const img = this.currentImage();
    if (!img) return;

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        if (this.interaction.selectedBoxId) {
          this.boxDeleted.emit(this.interaction.selectedBoxId);
          this.interaction.selectedBoxId = undefined;
          this.redraw();
        }
        break;

      case 'Escape':
        this.cancelCurrentInteraction();
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        const classIndex = parseInt(event.key) - 1;
        const classes = this.availableClasses();
        if (classes[classIndex]) {
          this.classSelected.emit(classes[classIndex].id);
        }
        break;

      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Implement undo functionality
        }
        break;
    }
  }

  onMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedBox = this.getBoxAtPosition(x, y);

    if (clickedBox) {
      this.selectBox(clickedBox.id);
      this.startDragOrResize(x, y, clickedBox);
    } else {
      this.startDrawing(x, y);
    }
  }

  onMouseMove(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.interaction.isDrawing) {
      this.updateDrawing(x, y);
    } else if (this.interaction.isDragging) {
      this.updateDrag(x, y);
    } else if (this.interaction.isResizing) {
      this.updateResize(x, y);
    } else {
      this.updateCursor(x, y);
    }
  }

  onMouseUp(event: MouseEvent) {
    if (this.interaction.isDrawing) {
      this.finishDrawing();
    } else if (this.interaction.isDragging || this.interaction.isResizing) {
      this.finishDragOrResize();
    }
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    // Show context menu for box operations
  }

  private loadImage(annotation: ImageAnnotation) {
    this.imageElement = new Image();
    this.imageElement.onload = () => {
      this.updateCanvasSize();
      this.redraw();
    };
    this.imageElement.src = annotation.path;
  }

  private updateCanvasSize() {
    const container = this.canvasRef.nativeElement.parentElement!;
    this.canvasWidth.set(container.clientWidth);
    this.canvasHeight.set(container.clientHeight - 50); // Account for controls
  }

  private redraw() {
    if (!this.ctx || !this.imageElement) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasWidth(), this.canvasHeight());

    // Draw image
    const dimensions = this.scaledImageDimensions();
    const zoom = this.zoomLevel() / 100;
    const pan = this.panOffset();

    this.ctx.save();
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(pan.x, pan.y);

    const offsetX = (this.canvasWidth() / zoom - dimensions.width) / 2;
    const offsetY = (this.canvasHeight() / zoom - dimensions.height) / 2;

    this.ctx.drawImage(
      this.imageElement,
      offsetX,
      offsetY,
      dimensions.width,
      dimensions.height
    );

    // Draw bounding boxes
    const img = this.currentImage();
    if (img) {
      this.drawBoundingBoxes(img.boundingBoxes, dimensions, offsetX, offsetY);
    }

    this.ctx.restore();
  }

  private drawBoundingBoxes(
    boxes: BoundingBox[],
    imageDimensions: any,
    offsetX: number,
    offsetY: number
  ) {
    const classes = this.availableClasses();

    boxes.forEach(box => {
      const classInfo = classes.find(c => c.id === box.classId);
      const color = classInfo?.color || '#ff0000';
      const isSelected = box.id === this.interaction.selectedBoxId;

      // Convert normalized coordinates to canvas coordinates
      const x = offsetX + (box.x * imageDimensions.width);
      const y = offsetY + (box.y * imageDimensions.height);
      const width = box.width * imageDimensions.width;
      const height = box.height * imageDimensions.height;

      // Draw box
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = isSelected ? 3 : 2;
      this.ctx.strokeRect(x, y, width, height);

      // Draw selection handles if selected
      if (isSelected) {
        this.drawSelectionHandles(x, y, width, height);
      }

      // Draw label
      this.drawLabel(classInfo?.name || 'Unknown', x, y, color);
    });
  }

  private drawSelectionHandles(x: number, y: number, width: number, height: number) {
    const handleSize = 8;
    const handles = [
      { x: x - handleSize/2, y: y - handleSize/2 }, // nw
      { x: x + width - handleSize/2, y: y - handleSize/2 }, // ne
      { x: x - handleSize/2, y: y + height - handleSize/2 }, // sw
      { x: x + width - handleSize/2, y: y + height - handleSize/2 }, // se
    ];

    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;

    handles.forEach(handle => {
      this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  }

  private drawLabel(text: string, x: number, y: number, color: string) {
    this.ctx.font = '12px Arial';
    const metrics = this.ctx.measureText(text);
    const padding = 4;

    // Background
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y - 20, metrics.width + padding * 2, 16);

    // Text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(text, x + padding, y - 8);
  }

  // Interaction methods
  private startDrawing(x: number, y: number) {
    this.interaction.isDrawing = true;
    this.interaction.dragStartPosition = { x, y };
  }

  private updateDrawing(x: number, y: number) {
    if (!this.interaction.isDrawing || !this.interaction.dragStartPosition) return;

    // Draw preview box
    this.redraw();

    const startX = Math.min(this.interaction.dragStartPosition.x, x);
    const startY = Math.min(this.interaction.dragStartPosition.y, y);
    const width = Math.abs(x - this.interaction.dragStartPosition.x);
    const height = Math.abs(y - this.interaction.dragStartPosition.y);

    this.ctx.strokeStyle = '#00ff00';
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(startX, startY, width, height);
    this.ctx.setLineDash([]);
  }

  private finishDrawing() {
    if (!this.interaction.isDrawing || !this.interaction.dragStartPosition) return;

    // Convert canvas coordinates to normalized image coordinates
    const box = this.createBoundingBoxFromCanvas(
      this.interaction.dragStartPosition.x,
      this.interaction.dragStartPosition.y
    );

    if (box && box.width > 0.01 && box.height > 0.01) { // Minimum size check
      this.boxCreated.emit(box);
    }

    this.cancelCurrentInteraction();
  }

  private createBoundingBoxFromCanvas(startX: number, startY: number): BoundingBox | null {
    const img = this.currentImage();
    if (!img) return null;

    // Implementation to convert canvas coordinates to normalized coordinates
    // This is a simplified version - you'll need to account for zoom, pan, etc.
    const dimensions = this.scaledImageDimensions();

    return {
      id: crypto.randomUUID(),
      x: startX / dimensions.width,
      y: startY / dimensions.height,
      width: 0.1, // Calculated from mouse position
      height: 0.1,
      classId: this.selectedClassId(),
      className: this.availableClasses().find(c => c.id === this.selectedClassId())?.name || 'Unknown'
    };
  }

  private getBoxAtPosition(x: number, y: number): BoundingBox | null {
    const img = this.currentImage();
    if (!img) return null;

    // Implementation to find box at canvas coordinates
    // Return the box that contains the click position
    return null; // Simplified for brevity
  }

  private selectBox(boxId: string) {
    this.interaction.selectedBoxId = boxId;
    this.boxSelected.emit(boxId);
    this.redraw();
  }

  private startDragOrResize(x: number, y: number, box: BoundingBox) {
    // Determine if clicking on resize handle or box body
    this.interaction.isDragging = true;
    this.interaction.dragStartPosition = { x, y };
  }

  private updateDrag(x: number, y: number) {
    // Update box position during drag
  }

  private updateResize(x: number, y: number) {
    // Update box size during resize
  }

  private finishDragOrResize() {
    if (this.interaction.selectedBoxId) {
      // Emit updated box
      const img = this.currentImage();
      const box = img?.boundingBoxes.find((b: BoundingBox) => b.id === this.interaction.selectedBoxId);
      if (box) {
        this.boxUpdated.emit(box);
      }
    }
    this.cancelCurrentInteraction();
  }

  private updateCursor(x: number, y: number) {
    // Change cursor based on hover state
    const canvas = this.canvasRef.nativeElement;
    const box = this.getBoxAtPosition(x, y);

    if (box) {
      canvas.style.cursor = 'move';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }

  private handleTouchEvent(event: TouchEvent) {
    event.preventDefault();

    if (event.touches.length === 1) {
      // Single touch - treat as mouse
      const touch = event.touches[0];
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      switch (event.type) {
        case 'touchstart':
          this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
          break;
        case 'touchmove':
          this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
          break;
        case 'touchend':
          this.onMouseUp({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
          break;
      }
    } else if (event.touches.length === 2) {
      // Pinch to zoom
      // Implementation for pinch zoom
    }
  }

  private cancelCurrentInteraction() {
    this.interaction = {
      isDrawing: false,
      isDragging: false,
      isResizing: false
    };
    this.redraw();
  }

  // Public methods for toolbar actions
  zoomIn() {
    this.zoomLevel.update(current => Math.min(500, current + 25));
    this.redraw();
  }

  zoomOut() {
    this.zoomLevel.update(current => Math.max(25, current - 25));
    this.redraw();
  }

  resetZoom() {
    this.zoomLevel.set(100);
    this.panOffset.set({ x: 0, y: 0 });
    this.redraw();
  }
}
