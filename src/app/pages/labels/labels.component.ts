import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Import our custom components
import { ClassSelectorComponent } from '../../shared/components/class-selector/class-selector.component';
import { ToolbarComponent, ToolbarAction } from '../../shared/components/toolbar/toolbar.component';
import { CanvasAnnotationComponent } from '../../features/annotation/components/canvas-annotation/canvas-annotation.component';

// Import services and models
import { AnnotationStateService } from '../../core/services/annotation-state.service';
import { YoloExportService } from '../../core/services/yolo-export.service';
import {
  BoundingBox,
  YoloClass,
  AnnotationProject,
  ImageAnnotation
} from '../../core/models/annotation.model';

@Component({
  selector: 'custom-labels',
  standalone: true,
  imports: [
    CommonModule,
    ClassSelectorComponent,
    ToolbarComponent,
    CanvasAnnotationComponent
  ],
  templateUrl: './labels.component.html',
  styleUrl: './labels.component.scss'
})
export class LabelsComponent implements OnInit, OnDestroy {
  // Injected services
  private annotationService = inject(AnnotationStateService);
  private exportService = inject(YoloExportService);
  private destroy$ = new Subject<void>();

  // Component state signals
  sidebarOpen = signal(true);
  currentTheme = signal<'light' | 'dark'>('light');
  statusMessage = signal('Ready to annotate');
  statusType = signal<'info' | 'success' | 'warning' | 'error'>('info');

  // Computed values from state service
  currentProject = computed(() => this.annotationService.getCurrentProject());
  currentImage = computed(() => this.annotationService.getCurrentImage());
  selectedBoxId = computed(() => this.annotationService.getSelectedBox()?.id || null);
  availableClasses = computed(() => this.currentProject()?.classes || []);

  // State-based signals
  currentImageIndex = signal(0);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedClassId = signal(0);
  projectProgress = computed(() => this.annotationService.projectProgress());

  // Toolbar actions
  toolbarActions = computed<ToolbarAction[]>(() => [
    ...ToolbarComponent.createDefaultActions(),
    ...ToolbarComponent.createAnnotationActions()
  ]);

  // Class color mapping
  private classColors = new Map<number, string>();

  ngOnInit() {
    // Subscribe to state changes
    this.annotationService.state$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.currentImageIndex.set(state.currentImageIndex);
      this.isLoading.set(state.isLoading);
      this.error.set(state.error);
    });

    this.annotationService.currentProject$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(project => {
      if (project) {
        this.updateClassColors(project.classes);
        // Set default selected class if none selected
        if (project.classes.length > 0 && this.selectedClassId() === 0) {
          this.selectedClassId.set(project.classes[0].id);
        }
        this.statusMessage.set(`Project loaded: ${project.name}`);
        this.statusType.set('success');
      }
    });

    this.annotationService.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      this.statusMessage.set(error);
      this.statusType.set('error');
    });

    // Initialize with sample project if none exists
    this.initializeSampleProject();

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Load theme preference
    this.loadThemePreference();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Theme Management
  toggleTheme() {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('yolo-annotation-theme', newTheme);
  }

  private loadThemePreference() {
    const saved = localStorage.getItem('yolo-annotation-theme') as 'light' | 'dark';
    if (saved) {
      this.currentTheme.set(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme.set('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  // Sidebar Management
  toggleSidebar() {
    this.sidebarOpen.update(current => !current);
  }

  // Toolbar Actions
  onToolbarAction(actionId: string) {
    switch (actionId) {
      case 'new-project':
        this.createNewProject();
        break;
      case 'open-project':
        this.loadProject();
        break;
      case 'upload-images':
        this.uploadImages();
        break;
      case 'save-project':
        this.saveProject();
        break;
      case 'undo':
        this.annotationService.undo();
        break;
      case 'redo':
        this.annotationService.redo();
        break;
      case 'export':
        this.exportProject();
        break;
      case 'prev-image':
        this.annotationService.previousImage();
        break;
      case 'next-image':
        this.annotationService.nextImage();
        break;
      case 'mark-complete':
        this.markCurrentImageComplete();
        break;
      default:
        console.log('Unhandled toolbar action:', actionId);
    }
  }

  // Class Management
  onClassSelected(classId: number) {
    // Update selected class - this would be used by the canvas component
    console.log('Selected class:', classId);
  }

  onClassAdded(classData: { name: string; color: string; shortcut?: string }) {
    const classId = this.annotationService.addClass(
      classData.name,
      classData.color,
      classData.shortcut
    );

    if (classId !== -1) {
      this.statusMessage.set(`Added class: ${classData.name}`);
      this.statusType.set('success');
    }
  }

  onClassUpdated(update: { id: number; updates: Partial<YoloClass> }) {
    this.annotationService.updateClass(update.id, update.updates);
    this.statusMessage.set('Class updated');
    this.statusType.set('info');
  }

  onClassDeleted(classId: number) {
    const className = this.availableClasses().find(c => c.id === classId)?.name;
    this.annotationService.deleteClass(classId);
    this.statusMessage.set(`Deleted class: ${className}`);
    this.statusType.set('warning');
  }

  // Image Management
  selectImage(index: number) {
    this.annotationService.selectImage(index);
  }

  loadImages() {
    // Create file input to load images
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files) {
        await this.processImageFiles(Array.from(files));
      }
    };

    input.click();
  }

  private async processImageFiles(files: File[]) {
    const project = this.currentProject();
    if (!project) {
      this.createNewProject();
      return;
    }

    this.statusMessage.set('Loading images...');
    this.statusType.set('info');

    const imageAnnotations: ImageAnnotation[] = [];

    for (const file of files) {
      try {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        const annotation: ImageAnnotation = {
          id: crypto.randomUUID(),
          filename: file.name,
          path: imageUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
          boundingBoxes: [],
          isCompleted: false,
          lastModified: new Date()
        };

        imageAnnotations.push(annotation);
      } catch (error) {
        console.error(`Failed to load image ${file.name}:`, error);
      }
    }

    // Update project with new images
    const updatedImages = [...(project.images || []), ...imageAnnotations];
    this.annotationService.updateProject({ images: updatedImages });

    this.statusMessage.set(`Loaded ${imageAnnotations.length} images`);
    this.statusType.set('success');
  }

  // Annotation Management
  onBoxCreated(box: BoundingBox) {
    this.annotationService.createBoundingBox(box);
    this.statusMessage.set('Annotation created');
    this.statusType.set('success');
  }

  onBoxUpdated(box: BoundingBox) {
    this.annotationService.updateBoundingBox(box.id, box);
    this.statusMessage.set('Annotation updated');
    this.statusType.set('info');
  }

  onBoxDeleted(boxId: string) {
    this.annotationService.deleteBoundingBox(boxId);
    this.statusMessage.set('Annotation deleted');
    this.statusType.set('warning');
  }

  onBoxSelected(boxId: string | null) {
    this.annotationService.selectBoundingBox(boxId);
  }

  selectBox(boxId: string) {
    this.annotationService.selectBoundingBox(boxId);
  }

  deleteBox(boxId: string) {
    this.annotationService.deleteBoundingBox(boxId);
  }

  // Project Management
  createNewProject() {
    const projectName = prompt('Enter project name:');
    if (!projectName) return;

    const projectId = this.annotationService.createProject({
      name: projectName,
      description: 'YOLO annotation project',
      classes: this.createDefaultClasses(),
      images: [],
      exportSettings: {
        includeImages: true,
        format: 'yolo',
        splitDataset: true,
        trainRatio: 0.7,
        validationRatio: 0.2,
        testRatio: 0.1
      }
    });

    this.statusMessage.set(`Created project: ${projectName}`);
    this.statusType.set('success');
  }

  loadProject() {
    // This would typically open a file dialog or project selector
    this.statusMessage.set('Load project functionality not implemented yet');
    this.statusType.set('info');
  }

  saveProject() {
    const project = this.currentProject();
    if (!project) {
      this.statusMessage.set('No project to save');
      this.statusType.set('warning');
      return;
    }

    // The annotation service automatically saves to localStorage
    this.statusMessage.set('Project saved');
    this.statusType.set('success');
  }

  exportProject() {
    const project = this.currentProject();
    if (!project) {
      this.statusMessage.set('No project to export');
      this.statusType.set('warning');
      return;
    }

    this.statusMessage.set('Exporting project...');
    this.statusType.set('info');

    this.exportService.exportProject(project).subscribe({
      next: (result) => {
        if (result.success) {
          this.statusMessage.set(`Exported: ${result.fileName}`);
          this.statusType.set('success');
        } else {
          this.statusMessage.set(`Export failed: ${result.message}`);
          this.statusType.set('error');
        }
      },
      error: (error) => {
        this.statusMessage.set(`Export error: ${error.message}`);
        this.statusType.set('error');
      }
    });
  }

  markCurrentImageComplete() {
    this.annotationService.markImageAsCompleted();
    this.statusMessage.set('Image marked as completed');
    this.statusType.set('success');
  }

  uploadImages() {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      if (files && files.length > 0) {
        this.handleImageFiles(Array.from(files));
      }
    };

    input.click();
  }

  private handleImageFiles(files: File[]) {
    const project = this.currentProject();
    if (!project) {
      this.statusMessage.set('Please create a project first');
      this.statusType.set('warning');
      return;
    }

    this.statusMessage.set(`Processing ${files.length} image(s)...`);
    this.statusType.set('info');

    const imagePromises = files.map(file => this.processImageFile(file));

    Promise.all(imagePromises).then(images => {
      const validImages = images.filter(img => img !== null);

      if (validImages.length > 0) {
        // Add images to current project
        const updatedImages = [...project.images, ...validImages];
        this.annotationService.updateProject({ images: updatedImages });

        this.statusMessage.set(`Added ${validImages.length} image(s) to project`);
        this.statusType.set('success');
      } else {
        this.statusMessage.set('No valid images were processed');
        this.statusType.set('warning');
      }
    }).catch(error => {
      this.statusMessage.set(`Error processing images: ${error.message}`);
      this.statusType.set('error');
    });
  }

  private processImageFile(file: File): Promise<ImageAnnotation | null> {
    return new Promise((resolve) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        resolve(null);
        return;
      }

      console.log(`Processing image file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

      // Create FileReader to read the image
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) {
          console.warn(`Failed to read file content: ${file.name}`);
          resolve(null);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const imageAnnotation: ImageAnnotation = {
            id: crypto.randomUUID(),
            filename: file.name,
            path: '', // Will be set when saved to server
            url: result, // Base64 data URL for immediate display
            width: img.width,
            height: img.height,
            boundingBoxes: [],
            isCompleted: false,
            lastModified: new Date()
          };
          console.log(`Successfully processed image: ${file.name} (${img.width}x${img.height})`);
          resolve(imageAnnotation);
        };
        img.onerror = (error) => {
          console.error(`Failed to load image: ${file.name}`, error);
          resolve(null);
        };
        img.src = result;
      };
      reader.onerror = (error) => {
        console.error(`Failed to read file: ${file.name}`, error);
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }

  // Helper Methods
  getClassColor(classId: number): string {
    return this.classColors.get(classId) || '#999999';
  }

  trackByImageId(index: number, image: ImageAnnotation): string {
    return image.id;
  }

  trackByBoxId(index: number, box: BoundingBox): string {
    return box.id;
  }

  private updateClassColors(classes: YoloClass[]) {
    this.classColors.clear();
    classes.forEach(cls => {
      this.classColors.set(cls.id, cls.color);
    });
  }

  private createDefaultClasses(): YoloClass[] {
    return [
      { id: 0, name: 'Person', color: '#ef4444', shortcut: '1' },
      { id: 1, name: 'Vehicle', color: '#3b82f6', shortcut: '2' },
      { id: 2, name: 'Animal', color: '#22c55e', shortcut: '3' },
      { id: 3, name: 'Object', color: '#f59e0b', shortcut: '4' }
    ];
  }

  private initializeSampleProject() {
    const existingProject = this.currentProject();
    if (!existingProject) {
      // Create a sample project for demonstration
      this.annotationService.createProject({
        name: 'Sample Project',
        description: 'Demo project for YOLO annotation',
        classes: this.createDefaultClasses(),
        images: [],
        exportSettings: {
          includeImages: true,
          format: 'yolo',
          splitDataset: true,
          trainRatio: 0.7,
          validationRatio: 0.2,
          testRatio: 0.1
        }
      });
    }
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Only handle if not in an input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault();
          const classIndex = parseInt(event.key) - 1;
          const classes = this.availableClasses();
          if (classes[classIndex]) {
            this.onClassSelected(classes[classIndex].id);
          }
          break;

        case 'ArrowLeft':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.annotationService.previousImage();
          }
          break;

        case 'ArrowRight':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.annotationService.nextImage();
          }
          break;

        case ' ':
          event.preventDefault();
          this.markCurrentImageComplete();
          break;

        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              this.annotationService.redo();
            } else {
              this.annotationService.undo();
            }
          }
          break;

        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.saveProject();
          }
          break;

        case 'e':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.exportProject();
          }
          break;
      }
    });
  }
}
