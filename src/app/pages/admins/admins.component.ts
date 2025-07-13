import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'custom-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admins.component.html',
  styleUrl: './admins.component.scss'
})
export class AdminsComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  userForm: FormGroup;
  searchTerm = '';
  selectedUser: User | null = null;
  isModalOpen = false;
  isEditMode = false;
  isLoading = false;
  showDeleteConfirm = false;
  userToDelete: User | null = null;
  
  // Available roles for user creation/editing (no admin role)
  availableRoles: UserRole[] = ['user', 'guest'];
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  // Load users from service
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
        // You could show an error message to the user here
      }
    });
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => 
      user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedUser = null;
    this.userForm.reset();
    this.userForm.patchValue({ role: 'user' });
    this.isModalOpen = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.selectedUser = user;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      role: user.role
    });
    // Remove password requirement for edit
    this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedUser = null;
    this.userForm.reset();
    // Restore password requirement
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;
      const formData = this.userForm.value;
      
      if (this.isEditMode && this.selectedUser) {
        this.updateUser(formData);
      } else {
        this.createUser(formData);
      }
    } else {
      this.userForm.markAllAsTouched();
    }
  }

  createUser(formData: any): void {
    // Prevent creating admin users
    if (formData.role === 'admin') {
      console.warn('Cannot create admin users through this interface');
      this.isLoading = false;
      return;
    }
    
    const userData = {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      password: formData.password
    };
    
    this.userService.createUser(userData).subscribe({
      next: (newUser) => {
        this.users.push(newUser);
        this.applyFilters();
        this.isLoading = false;
        this.closeModal();
        console.log('User created:', newUser);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        this.isLoading = false;
        // You could show an error message to the user here
      }
    });
  }

  updateUser(formData: any): void {
    if (this.selectedUser) {
      // Prevent editing admin users to admin role
      if (formData.role === 'admin') {
        console.warn('Cannot assign admin role through this interface');
        this.isLoading = false;
        return;
      }
      
      const userData: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      // Only include password if it was provided
      if (formData.password && formData.password.trim()) {
        userData.password = formData.password;
      }
      
      this.userService.updateUser(this.selectedUser.id, userData).subscribe({
        next: (updatedUser) => {
          const userIndex = this.users.findIndex(u => u.id === this.selectedUser!.id);
          if (userIndex > -1) {
            this.users[userIndex] = updatedUser;
            this.applyFilters();
          }
          this.isLoading = false;
          this.closeModal();
          console.log('User updated:', updatedUser);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.isLoading = false;
          // You could show an error message to the user here
        }
      });
    }
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  deleteUser(): void {
    if (this.userToDelete) {
      this.isLoading = true;
      
      this.userService.deleteUser(this.userToDelete.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
          this.applyFilters();
          this.showDeleteConfirm = false;
          this.userToDelete = null;
          this.isLoading = false;
          console.log('User deleted');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.showDeleteConfirm = false;
          this.userToDelete = null;
          this.isLoading = false;
          // You could show an error message to the user here
        }
      });
    }
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getRoleClass(role: UserRole): string {
    switch (role) {
      case 'admin': return 'badge--primary';
      case 'user': return 'badge--secondary';
      case 'guest': return 'badge--warning';
      default: return 'badge--secondary';
    }
  }

  getRoleIcon(role: UserRole): string {
    switch (role) {
      case 'admin': return '👑';
      case 'user': return '👤';
      case 'guest': return '👥';
      default: return '👤';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
