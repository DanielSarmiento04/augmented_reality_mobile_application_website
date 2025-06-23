import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Subject, Observable, combineLatest } from 'rxjs';
import { map, filter, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import {
  AnnotationProject,
  ImageAnnotation,
  BoundingBox,
  YoloClass,
  ExportSettings
} from '../models/annotation.model';

export interface AnnotationState {
  currentProject: AnnotationProject | null;
  currentImageIndex: number;
  selectedBoxId: string | null;
  isLoading: boolean;
  error: string | null;
  undoStack: AnnotationAction[];
  redoStack: AnnotationAction[];
}

export interface AnnotationAction {
  type: 'CREATE_BOX' | 'UPDATE_BOX' | 'DELETE_BOX' | 'BATCH_UPDATE';
  payload: any;
  timestamp: Date;
  imageId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnnotationStateService {
  private readonly STORAGE_KEY = 'yolo-annotation-projects';
  private readonly MAX_UNDO_STACK = 50;

  // Private state subjects
  private stateSubject = new BehaviorSubject<AnnotationState>({
    currentProject: null,
    currentImageIndex: 0,
    selectedBoxId: null,
    isLoading: false,
    error: null,
    undoStack: [],
    redoStack: []
  });

  private actionSubject = new Subject<AnnotationAction>();

  // Public observables
  state$ = this.stateSubject.asObservable().pipe(shareReplay(1));

  currentProject$ = this.state$.pipe(
    map(state => state.currentProject),
    distinctUntilChanged(),
    shareReplay(1)
  );

  currentImage$ = combineLatest([
    this.currentProject$,
    this.state$.pipe(map(state => state.currentImageIndex))
  ]).pipe(
    map(([project, index]) =>
      project?.images[index] || null
    ),
    distinctUntilChanged((a, b) => a?.id === b?.id),
    shareReplay(1)
  );

  selectedBox$ = combineLatest([
    this.currentImage$,
    this.state$.pipe(map(state => state.selectedBoxId))
  ]).pipe(
    map(([image, selectedId]) =>
      selectedId ? image?.boundingBoxes.find(box => box.id === selectedId) || null : null
    ),
    distinctUntilChanged((a, b) => a?.id === b?.id),
    shareReplay(1)
  );

  availableClasses$ = this.currentProject$.pipe(
    map(project => project?.classes || []),
    shareReplay(1)
  );

  isLoading$ = this.state$.pipe(
    map(state => state.isLoading),
    distinctUntilChanged()
  );

  error$ = this.state$.pipe(
    map(state => state.error),
    filter(error => error !== null)
  );

  // Computed signals for reactive UI
  private currentState = signal(this.stateSubject.value);

  canUndo = computed(() => this.currentState().undoStack.length > 0);
  canRedo = computed(() => this.currentState().redoStack.length > 0);

  projectProgress = computed(() => {
    const project = this.currentState().currentProject;
    if (!project) return { completed: 0, total: 0, percentage: 0 };

    const completed = project.images.filter(img => img.isCompleted).length;
    const total = project.images.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  });

  constructor() {
    // Update signal when state changes
    this.state$.subscribe(state => this.currentState.set(state));

    // Load saved projects on initialization
    this.loadProjectsFromStorage();
  }

  // Project Management
  createProject(project: Omit<AnnotationProject, 'id' | 'createdAt' | 'lastModified'>): string {
    const newProject: AnnotationProject = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.updateState({
      currentProject: newProject,
      currentImageIndex: 0,
      selectedBoxId: null,
      undoStack: [],
      redoStack: []
    });

    this.saveProjectsToStorage();
    return newProject.id;
  }

  loadProject(projectId: string): Observable<AnnotationProject | null> {
    const projects = this.getStoredProjects();
    const project = projects.find(p => p.id === projectId);

    if (project) {
      this.updateState({
        currentProject: project,
        currentImageIndex: 0,
        selectedBoxId: null,
        undoStack: [],
        redoStack: []
      });
    }

    return this.currentProject$;
  }

  updateProject(updates: Partial<AnnotationProject>) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const updatedProject: AnnotationProject = {
      ...currentState.currentProject,
      ...updates,
      lastModified: new Date()
    };

    this.updateState({ currentProject: updatedProject });
    this.saveProjectsToStorage();
  }

  deleteProject(projectId: string) {
    const projects = this.getStoredProjects().filter(p => p.id !== projectId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));

    const currentState = this.stateSubject.value;
    if (currentState.currentProject?.id === projectId) {
      this.updateState({
        currentProject: null,
        currentImageIndex: 0,
        selectedBoxId: null,
        undoStack: [],
        redoStack: []
      });
    }
  }

  // Image Navigation
  selectImage(index: number) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const maxIndex = currentState.currentProject.images.length - 1;
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));

    this.updateState({
      currentImageIndex: clampedIndex,
      selectedBoxId: null
    });
  }

  nextImage() {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const nextIndex = currentState.currentImageIndex + 1;
    if (nextIndex < currentState.currentProject.images.length) {
      this.selectImage(nextIndex);
    }
  }

  previousImage() {
    const currentState = this.stateSubject.value;
    this.selectImage(currentState.currentImageIndex - 1);
  }

  // Bounding Box Operations
  createBoundingBox(box: Omit<BoundingBox, 'id'>): string {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return '';

    const newBox: BoundingBox = {
      ...box,
      id: crypto.randomUUID()
    };

    const action: AnnotationAction = {
      type: 'CREATE_BOX',
      payload: newBox,
      timestamp: new Date(),
      imageId: currentState.currentProject.images[currentState.currentImageIndex].id
    };

    this.executeAction(action);
    return newBox.id;
  }

  updateBoundingBox(boxId: string, updates: Partial<BoundingBox>) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const currentImage = currentState.currentProject.images[currentState.currentImageIndex];
    const existingBox = currentImage.boundingBoxes.find(b => b.id === boxId);

    if (!existingBox) return;

    const action: AnnotationAction = {
      type: 'UPDATE_BOX',
      payload: { boxId, updates, previousState: { ...existingBox } },
      timestamp: new Date(),
      imageId: currentImage.id
    };

    this.executeAction(action);
  }

  deleteBoundingBox(boxId: string) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const currentImage = currentState.currentProject.images[currentState.currentImageIndex];
    const boxToDelete = currentImage.boundingBoxes.find(b => b.id === boxId);

    if (!boxToDelete) return;

    const action: AnnotationAction = {
      type: 'DELETE_BOX',
      payload: { boxId, deletedBox: { ...boxToDelete } },
      timestamp: new Date(),
      imageId: currentImage.id
    };

    this.executeAction(action);

    // Clear selection if deleted box was selected
    if (currentState.selectedBoxId === boxId) {
      this.updateState({ selectedBoxId: null });
    }
  }

  selectBoundingBox(boxId: string | null) {
    this.updateState({ selectedBoxId: boxId });
  }

  // Class Management
  addClass(className: string, color: string, shortcut?: string): number {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return -1;

    const maxId = Math.max(...currentState.currentProject.classes.map(c => c.id), -1);
    const newClass: YoloClass = {
      id: maxId + 1,
      name: className,
      color,
      shortcut
    };

    const updatedClasses = [...currentState.currentProject.classes, newClass];

    this.updateProject({ classes: updatedClasses });
    return newClass.id;
  }

  updateClass(classId: number, updates: Partial<YoloClass>) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const updatedClasses = currentState.currentProject.classes.map(c =>
      c.id === classId ? { ...c, ...updates } : c
    );

    this.updateProject({ classes: updatedClasses });
  }

  deleteClass(classId: number) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    // Remove class
    const updatedClasses = currentState.currentProject.classes.filter(c => c.id !== classId);

    // Remove all bounding boxes with this class
    const updatedImages = currentState.currentProject.images.map(image => ({
      ...image,
      boundingBoxes: image.boundingBoxes.filter(box => box.classId !== classId)
    }));

    this.updateProject({
      classes: updatedClasses,
      images: updatedImages
    });
  }

  // Undo/Redo Operations
  undo() {
    const currentState = this.stateSubject.value;
    if (currentState.undoStack.length === 0) return;

    const actionToUndo = currentState.undoStack[currentState.undoStack.length - 1];
    this.revertAction(actionToUndo);

    this.updateState({
      undoStack: currentState.undoStack.slice(0, -1),
      redoStack: [...currentState.redoStack, actionToUndo]
    });
  }

  redo() {
    const currentState = this.stateSubject.value;
    if (currentState.redoStack.length === 0) return;

    const actionToRedo = currentState.redoStack[currentState.redoStack.length - 1];
    this.executeAction(actionToRedo, false); // Don't add to undo stack

    this.updateState({
      redoStack: currentState.redoStack.slice(0, -1)
    });
  }

  // Image Completion Status
  markImageAsCompleted(imageId?: string) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const targetId = imageId || currentState.currentProject.images[currentState.currentImageIndex].id;
    const updatedImages = currentState.currentProject.images.map(img =>
      img.id === targetId ? { ...img, isCompleted: true } : img
    );

    this.updateProject({ images: updatedImages });
  }

  // Batch Operations
  importAnnotations(imageId: string, boxes: BoundingBox[]) {
    const action: AnnotationAction = {
      type: 'BATCH_UPDATE',
      payload: { imageId, boxes },
      timestamp: new Date(),
      imageId
    };

    this.executeAction(action);
  }

  // Private Methods
  private executeAction(action: AnnotationAction, addToUndoStack: boolean = true) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    let updatedProject = { ...currentState.currentProject };

    switch (action.type) {
      case 'CREATE_BOX':
        updatedProject = this.applyCreateBoxAction(updatedProject, action);
        break;
      case 'UPDATE_BOX':
        updatedProject = this.applyUpdateBoxAction(updatedProject, action);
        break;
      case 'DELETE_BOX':
        updatedProject = this.applyDeleteBoxAction(updatedProject, action);
        break;
      case 'BATCH_UPDATE':
        updatedProject = this.applyBatchUpdateAction(updatedProject, action);
        break;
    }

    const newUndoStack = addToUndoStack
      ? [...currentState.undoStack, action].slice(-this.MAX_UNDO_STACK)
      : currentState.undoStack;

    this.updateState({
      currentProject: updatedProject,
      undoStack: newUndoStack,
      redoStack: addToUndoStack ? [] : currentState.redoStack // Clear redo stack on new action
    });

    this.saveProjectsToStorage();
    this.actionSubject.next(action);
  }

  private revertAction(action: AnnotationAction) {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    let updatedProject = { ...currentState.currentProject };

    switch (action.type) {
      case 'CREATE_BOX':
        updatedProject = this.revertCreateBoxAction(updatedProject, action);
        break;
      case 'UPDATE_BOX':
        updatedProject = this.revertUpdateBoxAction(updatedProject, action);
        break;
      case 'DELETE_BOX':
        updatedProject = this.revertDeleteBoxAction(updatedProject, action);
        break;
      case 'BATCH_UPDATE':
        updatedProject = this.revertBatchUpdateAction(updatedProject, action);
        break;
    }

    this.updateState({ currentProject: updatedProject });
    this.saveProjectsToStorage();
  }

  private applyCreateBoxAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    const updatedImages = project.images.map(img =>
      img.id === action.imageId
        ? { ...img, boundingBoxes: [...img.boundingBoxes, action.payload] }
        : img
    );
    return { ...project, images: updatedImages, lastModified: new Date() };
  }

  private applyUpdateBoxAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    const { boxId, updates } = action.payload;
    const updatedImages = project.images.map(img =>
      img.id === action.imageId
        ? {
            ...img,
            boundingBoxes: img.boundingBoxes.map(box =>
              box.id === boxId ? { ...box, ...updates } : box
            )
          }
        : img
    );
    return { ...project, images: updatedImages, lastModified: new Date() };
  }

  private applyDeleteBoxAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    const { boxId } = action.payload;
    const updatedImages = project.images.map(img =>
      img.id === action.imageId
        ? { ...img, boundingBoxes: img.boundingBoxes.filter(box => box.id !== boxId) }
        : img
    );
    return { ...project, images: updatedImages, lastModified: new Date() };
  }

  private applyBatchUpdateAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    const { imageId, boxes } = action.payload;
    const updatedImages = project.images.map(img =>
      img.id === imageId
        ? { ...img, boundingBoxes: boxes }
        : img
    );
    return { ...project, images: updatedImages, lastModified: new Date() };
  }

  private revertCreateBoxAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    const boxId = action.payload.id;
    const updatedImages = project.images.map(img =>
      img.id === action.imageId
        ? { ...img, boundingBoxes: img.boundingBoxes.filter(box => box.id !== boxId) }
        : img
    );
    return { ...project, images: updatedImages, lastModified: new Date() };
  }

  private revertUpdateBoxAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    const { boxId, previousState } = action.payload;
    const updatedImages = project.images.map(img =>
      img.id === action.imageId
        ? {
            ...img,
            boundingBoxes: img.boundingBoxes.map(box =>
              box.id === boxId ? previousState : box
            )
          }
        : img
    );
    return { ...project, images: updatedImages, lastModified: new Date() };
  }

  private revertDeleteBoxAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    const { deletedBox } = action.payload;
    const updatedImages = project.images.map(img =>
      img.id === action.imageId
        ? { ...img, boundingBoxes: [...img.boundingBoxes, deletedBox] }
        : img
    );
    return { ...project, images: updatedImages, lastModified: new Date() };
  }

  private revertBatchUpdateAction(project: AnnotationProject, action: AnnotationAction): AnnotationProject {
    // For batch updates, we'd need to store the previous state
    // This is a simplified implementation
    return project;
  }

  private updateState(updates: Partial<AnnotationState>) {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...updates });
  }

  private saveProjectsToStorage() {
    const currentState = this.stateSubject.value;
    if (!currentState.currentProject) return;

    const existingProjects = this.getStoredProjects();
    const updatedProjects = existingProjects.filter(p => p.id !== currentState.currentProject!.id);
    updatedProjects.push(currentState.currentProject);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProjects));
  }

  private loadProjectsFromStorage() {
    // Load projects list for project selector - implementation depends on requirements
  }

  private getStoredProjects(): AnnotationProject[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Public getters for immediate access
  getCurrentProject(): AnnotationProject | null {
    return this.stateSubject.value.currentProject;
  }

  getCurrentImage(): ImageAnnotation | null {
    const state = this.stateSubject.value;
    return state.currentProject?.images[state.currentImageIndex] || null;
  }

  getSelectedBox(): BoundingBox | null {
    const state = this.stateSubject.value;
    const currentImage = this.getCurrentImage();
    return state.selectedBoxId && currentImage
      ? currentImage.boundingBoxes.find(box => box.id === state.selectedBoxId) || null
      : null;
  }
}
