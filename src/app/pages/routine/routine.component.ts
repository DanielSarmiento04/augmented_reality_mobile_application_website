import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Routine } from '../../models/routines.model';
import { User } from '../../models/user.model';
import { RoutineService } from '../../services/routine.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'custom-routine',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './routine.component.html',
  styleUrl: './routine.component.scss'
})
export class RoutineComponent implements OnInit {
  routines: Routine[] = [];
  filteredRoutines: Routine[] = [];
  users: User[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatusFilter = 'all';
  selectedPriorityFilter = 'all';

  // Modal and form states
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  selectedRoutine: Routine | null = null;
  routineForm: FormGroup;

  // File upload states
  uploadedModel3D: File | null = null;
  uploadedModelInference: File | null = null;
  model3DPreview = '';
  modelInferencePreview = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  constructor(
    private routineService: RoutineService,
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {
    this.routineForm = this.createRoutineForm();
  }

  ngOnInit(): void {
    this.loadRoutines();
    this.loadUsers();
  }

  private createRoutineForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      steps: this.formBuilder.array([this.createStepControl()]),
      priority: ['medium', Validators.required],
      status: ['draft', Validators.required],
      estimatedDuration: [30, [Validators.required, Validators.min(1)]],
      tags: [''],
      department: [''],
      assignedUsers: [[]]
    });
  }

  private createStepControl(): FormGroup {
    return this.formBuilder.group({
      step: ['', Validators.required]
    });
  }

  get stepsArray(): FormArray {
    return this.routineForm.get('steps') as FormArray;
  }

  addStep(): void {
    this.stepsArray.push(this.createStepControl());
  }

  removeStep(index: number): void {
    if (this.stepsArray.length > 1) {
      this.stepsArray.removeAt(index);
    }
  }

  loadRoutines(): void {
    this.isLoading = true;
    this.routineService.getRoutines().subscribe({
      next: (routines) => {
        this.routines = routines;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading routines:', error);
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.routines];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(routine =>
        routine.name.toLowerCase().includes(term) ||
        routine.description.toLowerCase().includes(term) ||
        routine.department?.toLowerCase().includes(term) ||
        routine.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (this.selectedStatusFilter !== 'all') {
      filtered = filtered.filter(routine => routine.status === this.selectedStatusFilter);
    }

    // Priority filter
    if (this.selectedPriorityFilter !== 'all') {
      filtered = filtered.filter(routine => routine.priority === this.selectedPriorityFilter);
    }

    this.filteredRoutines = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRoutines.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedRoutines(): Routine[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredRoutines.slice(start, end);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPriorityFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  openCreateModal(): void {
    this.selectedRoutine = null;
    this.routineForm.reset();
    this.resetFileUploads();
    this.isCreateModalOpen = true;
  }

  openEditModal(routine: Routine): void {
    this.selectedRoutine = routine;
    this.populateForm(routine);
    this.isEditModalOpen = true;
  }

  openDeleteModal(routine: Routine): void {
    this.selectedRoutine = routine;
    this.isDeleteModalOpen = true;
  }

  closeModals(): void {
    this.isCreateModalOpen = false;
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.selectedRoutine = null;
    this.resetFileUploads();
  }

  private populateForm(routine: Routine): void {
    // Clear existing steps
    while (this.stepsArray.length > 0) {
      this.stepsArray.removeAt(0);
    }

    // Add steps from routine
    routine.steps.forEach(step => {
      this.stepsArray.push(this.formBuilder.group({ step: [step, Validators.required] }));
    });

    this.routineForm.patchValue({
      name: routine.name,
      description: routine.description,
      priority: routine.priority,
      status: routine.status,
      estimatedDuration: routine.estimatedDuration,
      tags: routine.tags.join(', '),
      department: routine.department || '',
      assignedUsers: routine.assignedUsers.map(user => user.id)
    });

    // Handle file previews for existing files
    if (typeof routine.model_3d === 'string' && routine.model_3d) {
      this.model3DPreview = routine.model_3d;
    }
    if (typeof routine.model_inference === 'string' && routine.model_inference) {
      this.modelInferencePreview = routine.model_inference;
    }
  }

  onModel3DFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.glb')) {
      this.uploadedModel3D = file;
      this.model3DPreview = file.name;
    } else {
      alert('Por favor selecciona un archivo GLB válido');
      event.target.value = '';
    }
  }

  onModelInferenceFileChange(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.tflite')) {
      this.uploadedModelInference = file;
      this.modelInferencePreview = file.name;
    } else {
      alert('Por favor selecciona un archivo TFLite válido');
      event.target.value = '';
    }
  }

  private resetFileUploads(): void {
    this.uploadedModel3D = null;
    this.uploadedModelInference = null;
    this.model3DPreview = '';
    this.modelInferencePreview = '';
  }

  createRoutine(): void {
    if (this.routineForm.valid) {
      this.isLoading = true;
      const formValue = this.routineForm.value;

      const newRoutine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'executionCount' | 'lastExecuted'> = {
        name: formValue.name,
        description: formValue.description,
        steps: formValue.steps.map((s: any) => s.step),
        priority: formValue.priority,
        status: formValue.status,
        estimatedDuration: formValue.estimatedDuration,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [],
        department: formValue.department,
        model_3d: this.uploadedModel3D,
        model_inference: this.uploadedModelInference,
        assignedUsers: this.users.filter(user => formValue.assignedUsers.includes(user.id))
      };

      this.routineService.createRoutine(newRoutine).subscribe({
        next: () => {
          this.loadRoutines();
          this.closeModals();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating routine:', error);
          this.isLoading = false;
        }
      });
    }
  }

  updateRoutine(): void {
    if (this.routineForm.valid && this.selectedRoutine) {
      this.isLoading = true;
      const formValue = this.routineForm.value;

      const updatedRoutine: Partial<Routine> = {
        name: formValue.name,
        description: formValue.description,
        steps: formValue.steps.map((s: any) => s.step),
        priority: formValue.priority,
        status: formValue.status,
        estimatedDuration: formValue.estimatedDuration,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [],
        department: formValue.department,
        model_3d: this.uploadedModel3D || this.selectedRoutine.model_3d,
        model_inference: this.uploadedModelInference || this.selectedRoutine.model_inference,
        assignedUsers: this.users.filter(user => formValue.assignedUsers.includes(user.id))
      };

      this.routineService.updateRoutine(this.selectedRoutine.id, updatedRoutine).subscribe({
        next: () => {
          this.loadRoutines();
          this.closeModals();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating routine:', error);
          this.isLoading = false;
        }
      });
    }
  }

  deleteRoutine(): void {
    if (this.selectedRoutine) {
      this.isLoading = true;
      this.routineService.deleteRoutine(this.selectedRoutine.id).subscribe({
        next: () => {
          this.loadRoutines();
          this.closeModals();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting routine:', error);
          this.isLoading = false;
        }
      });
    }
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  getPriorityClass(priority: string): string {
    const classes = {
      'low': 'priority-low',
      'medium': 'priority-medium',
      'high': 'priority-high',
      'urgent': 'priority-urgent'
    };
    return classes[priority as keyof typeof classes] || 'priority-medium';
  }

  getStatusClass(status: string): string {
    const classes = {
      'draft': 'status-draft',
      'active': 'status-active',
      'completed': 'status-completed',
      'archived': 'status-archived'
    };
    return classes[status as keyof typeof classes] || 'status-draft';
  }

  getUserNames(users: User[]): string {
    return users.map(user => user.username).join(', ');
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  onUserSelectionChange(event: any, userId: string): void {
    const currentUsers = this.routineForm.get('assignedUsers')?.value || [];
    let updatedUsers: string[];

    if (event.target.checked) {
      updatedUsers = [...currentUsers, userId];
    } else {
      updatedUsers = currentUsers.filter((id: string) => id !== userId);
    }

    this.routineForm.patchValue({ assignedUsers: updatedUsers });
  }

  // Modal scroll handling
  onModalScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;
    const modalForm = target.closest('.modal-form');

    if (modalForm) {
      if (scrollTop > 10) {
        modalForm.classList.add('scrolled');
      } else {
        modalForm.classList.remove('scrolled');
      }
    }
  }
}
