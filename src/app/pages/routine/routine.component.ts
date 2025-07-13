import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Routine } from '../../models/routines.model';
import { User } from '../../models/user.model';
import { RoutineService } from '../../services/routine.service';

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
  availableUsers: User[] = [];
  routineForm: FormGroup;
  searchTerm = '';
  selectedRoutine: Routine | null = null;
  isModalOpen = false;
  isEditMode = false;
  isLoading = false;
  showDeleteConfirm = false;
  routineToDelete: Routine | null = null;
  
  // Filters
  selectedStatus: Routine['status'] | '' = '';
  selectedPriority: Routine['priority'] | '' = '';
  selectedDepartment = '';
  selectedAssignedUser = '';
  
  // Analytics
  analytics: any = null;
  showAnalytics = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 0;

  // Available options
  statusOptions: { value: Routine['status']; label: string; color: string }[] = [
    { value: 'draft', label: 'Borrador', color: 'secondary' },
    { value: 'active', label: 'Activa', color: 'success' },
    { value: 'completed', label: 'Completada', color: 'primary' },
    { value: 'archived', label: 'Archivada', color: 'warning' }
  ];

  priorityOptions: { value: Routine['priority']; label: string; color: string }[] = [
    { value: 'low', label: 'Baja', color: 'secondary' },
    { value: 'medium', label: 'Media', color: 'primary' },
    { value: 'high', label: 'Alta', color: 'warning' },
    { value: 'urgent', label: 'Urgente', color: 'danger' }
  ];

  departments = [
    'Control de Calidad',
    'Producción',
    'Mantenimiento',
    'Ensamblaje',
    'Investigación y Desarrollo',
    'Logística'
  ];

  constructor(
    private fb: FormBuilder,
    private routineService: RoutineService
  ) {
    this.routineForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      steps: this.fb.array([]),
      model_3d: [''],
      model_inference: [''],
      assignedUsers: [[]],
      priority: ['medium', Validators.required],
      estimatedDuration: [60, [Validators.required, Validators.min(1)]],
      tags: [[]],
      department: ['']
    });
  }

  ngOnInit(): void {
    this.loadRoutines();
    this.loadAvailableUsers();
    this.loadAnalytics();
  }

  get stepsArray(): FormArray {
    return this.routineForm.get('steps') as FormArray;
  }

  // Load routines from service
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

  // Load available users for assignment
  loadAvailableUsers(): void {
    this.routineService.getAvailableUsers().subscribe({
      next: (users) => {
        this.availableUsers = users.filter(user => user.role !== 'admin');
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  // Load analytics data
  loadAnalytics(): void {
    this.routineService.getRoutineAnalytics().subscribe({
      next: (analytics) => {
        this.analytics = analytics;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = this.routines.filter(routine => 
      routine.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      routine.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      routine.steps.some(step => step.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      routine.tags.some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(routine => routine.status === this.selectedStatus);
    }

    // Apply priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(routine => routine.priority === this.selectedPriority);
    }

    // Apply department filter
    if (this.selectedDepartment) {
      filtered = filtered.filter(routine => routine.department === this.selectedDepartment);
    }

    // Apply assigned user filter
    if (this.selectedAssignedUser) {
      filtered = filtered.filter(routine => 
        routine.assignedUsers.some(user => user.id === this.selectedAssignedUser)
      );
    }

    this.filteredRoutines = filtered;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredRoutines.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedRoutines(): Routine[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredRoutines.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedRoutine = null;
    this.routineForm.reset();
    this.clearStepsArray();
    this.addStep(); // Start with one step
    this.isModalOpen = true;
  }

  openEditModal(routine: Routine): void {
    this.isEditMode = true;
    this.selectedRoutine = routine;
    this.routineForm.patchValue({
      name: routine.name,
      description: routine.description,
      model_3d: routine.model_3d || '',
      model_inference: routine.model_inference || ''
    });
    
    // Populate steps
    this.clearStepsArray();
    routine.steps.forEach(step => {
      this.stepsArray.push(this.fb.control(step, [Validators.required]));
    });
    
    this.isModalOpen = true;
  }

  openDuplicateModal(routine: Routine): void {
    this.isEditMode = false;
    this.selectedRoutine = null;
    this.routineForm.patchValue({
      name: `${routine.name} (Copia)`,
      description: routine.description,
      model_3d: routine.model_3d || '',
      model_inference: routine.model_inference || ''
    });
    
    // Populate steps
    this.clearStepsArray();
    routine.steps.forEach(step => {
      this.stepsArray.push(this.fb.control(step, [Validators.required]));
    });
    
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRoutine = null;
    this.routineForm.reset();
    this.clearStepsArray();
  }

  clearStepsArray(): void {
    while (this.stepsArray.length !== 0) {
      this.stepsArray.removeAt(0);
    }
  }

  addStep(): void {
    this.stepsArray.push(this.fb.control('', [Validators.required]));
  }

  removeStep(index: number): void {
    if (this.stepsArray.length > 1) {
      this.stepsArray.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.routineForm.valid) {
      this.isLoading = true;
      const formData = this.routineForm.value;
      
      if (this.isEditMode && this.selectedRoutine) {
        this.updateRoutine(formData);
      } else {
        this.createRoutine(formData);
      }
    } else {
      this.routineForm.markAllAsTouched();
      this.stepsArray.controls.forEach(control => control.markAsTouched());
    }
  }

  createRoutine(formData: any): void {
    const routineData = {
      name: formData.name,
      description: formData.description,
      steps: formData.steps.filter((step: string) => step.trim()),
      model_3d: formData.model_3d || null,
      model_inference: formData.model_inference || null
    };
    
    this.routineService.createRoutine(routineData).subscribe({
      next: (newRoutine) => {
        this.routines.push(newRoutine);
        this.applyFilters();
        this.isLoading = false;
        this.closeModal();
        console.log('Routine created:', newRoutine);
      },
      error: (error) => {
        console.error('Error creating routine:', error);
        this.isLoading = false;
      }
    });
  }

  updateRoutine(formData: any): void {
    if (this.selectedRoutine) {
      const routineData = {
        name: formData.name,
        description: formData.description,
        steps: formData.steps.filter((step: string) => step.trim()),
        model_3d: formData.model_3d || null,
        model_inference: formData.model_inference || null
      };
      
      this.routineService.updateRoutine(this.selectedRoutine.id, routineData).subscribe({
        next: (updatedRoutine) => {
          const routineIndex = this.routines.findIndex(r => r.id === this.selectedRoutine!.id);
          if (routineIndex > -1) {
            this.routines[routineIndex] = updatedRoutine;
            this.applyFilters();
          }
          this.isLoading = false;
          this.closeModal();
          console.log('Routine updated:', updatedRoutine);
        },
        error: (error) => {
          console.error('Error updating routine:', error);
          this.isLoading = false;
        }
      });
    }
  }

  confirmDelete(routine: Routine): void {
    this.routineToDelete = routine;
    this.showDeleteConfirm = true;
  }

  deleteRoutine(): void {
    if (this.routineToDelete) {
      this.isLoading = true;
      
      this.routineService.deleteRoutine(this.routineToDelete.id).subscribe({
        next: () => {
          this.routines = this.routines.filter(r => r.id !== this.routineToDelete!.id);
          this.applyFilters();
          this.showDeleteConfirm = false;
          this.routineToDelete = null;
          this.isLoading = false;
          console.log('Routine deleted');
        },
        error: (error) => {
          console.error('Error deleting routine:', error);
          this.showDeleteConfirm = false;
          this.routineToDelete = null;
          this.isLoading = false;
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.routineToDelete = null;
  }

  duplicateRoutine(routine: Routine): void {
    this.isLoading = true;
    this.routineService.duplicateRoutine(routine.id).subscribe({
      next: (duplicatedRoutine) => {
        this.routines.push(duplicatedRoutine);
        this.applyFilters();
        this.isLoading = false;
        console.log('Routine duplicated:', duplicatedRoutine);
      },
      error: (error) => {
        console.error('Error duplicating routine:', error);
        this.isLoading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStepCount(routine: Routine): string {
    const count = routine.steps.length;
    return count === 1 ? '1 paso' : `${count} pasos`;
  }

  getModelStatus(routine: Routine): string {
    const has3D = !!routine.model_3d;
    const hasInference = !!routine.model_inference;
    
    if (has3D && hasInference) return 'Completo';
    if (has3D || hasInference) return 'Parcial';
    return 'Sin modelos';
  }

  getModelStatusClass(routine: Routine): string {
    const has3D = !!routine.model_3d;
    const hasInference = !!routine.model_inference;
    
    if (has3D && hasInference) return 'badge--success';
    if (has3D || hasInference) return 'badge--warning';
    return 'badge--secondary';
  }

  // Clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.selectedDepartment = '';
    this.selectedAssignedUser = '';
    this.applyFilters();
  }

  // Toggle analytics view
  toggleAnalytics(): void {
    this.showAnalytics = !this.showAnalytics;
    if (this.showAnalytics && !this.analytics) {
      this.loadAnalytics();
    }
  }

  // Execute routine
  executeRoutine(routine: Routine): void {
    this.isLoading = true;
    this.routineService.executeRoutine(routine.id).subscribe({
      next: (updatedRoutine) => {
        const index = this.routines.findIndex(r => r.id === routine.id);
        if (index > -1) {
          this.routines[index] = updatedRoutine;
          this.applyFilters();
        }
        this.loadAnalytics(); // Refresh analytics
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error executing routine:', error);
        this.isLoading = false;
      }
    });
  }

  // Change routine status
  changeRoutineStatus(routine: Routine, newStatus: Routine['status']): void {
    this.isLoading = true;
    this.routineService.updateRoutineStatus(routine.id, newStatus).subscribe({
      next: (updatedRoutine) => {
        const index = this.routines.findIndex(r => r.id === routine.id);
        if (index > -1) {
          this.routines[index] = updatedRoutine;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating routine status:', error);
        this.isLoading = false;
      }
    });
  }

  // Get status label and color
  getStatusInfo(status: Routine['status']): { label: string; color: string } {
    const statusOption = this.statusOptions.find(opt => opt.value === status);
    return statusOption || { label: status, color: 'secondary' };
  }

  // Get priority label and color
  getPriorityInfo(priority: Routine['priority']): { label: string; color: string } {
    const priorityOption = this.priorityOptions.find(opt => opt.value === priority);
    return priorityOption || { label: priority, color: 'secondary' };
  }

  // Get assigned users names
  getAssignedUsersNames(users: User[]): string {
    if (users.length === 0) return 'Sin asignar';
    if (users.length === 1) return users[0].username;
    if (users.length === 2) return `${users[0].username} y ${users[1].username}`;
    return `${users[0].username} y ${users.length - 1} más`;
  }

  // Format duration
  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  // Check if routine can be executed
  canExecuteRoutine(routine: Routine): boolean {
    return routine.status === 'active' && routine.assignedUsers.length > 0;
  }

  // Get unique departments for filter
  getUniqueDepartments(): string[] {
    const departments = new Set(
      this.routines
        .map(r => r.department)
        .filter((dept): dept is string => dept !== undefined && dept.trim() !== '')
    );
    return Array.from(departments).sort();
  }

  trackByRoutineId(index: number, routine: Routine): string {
    return routine.id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
