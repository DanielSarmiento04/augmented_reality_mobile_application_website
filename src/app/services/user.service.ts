import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [
    {
      id: '1',
      username: 'john_doe',
      email: 'john@example.com',
      role: 'user',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      username: 'jane_smith',
      email: 'jane@example.com',
      role: 'user',
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: '3',
      username: 'mike_admin',
      email: 'mike@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '4',
      username: 'sarah_user',
      email: 'sarah@example.com',
      role: 'user',
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-03-05')
    },
    {
      id: '5',
      username: 'guest_user',
      email: 'guest@example.com',
      role: 'guest',
      createdAt: new Date('2024-03-20'),
      updatedAt: new Date('2024-03-20')
    }
  ];

  constructor() { }

  /**
   * Get all users
   */
  getUsers(): Observable<User[]> {
    return of([...this.users]).pipe(delay(1000));
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User | null> {
    const user = this.users.find(u => u.id === id);
    return of(user || null).pipe(delay(500));
  }

  /**
   * Create new user
   */
  createUser(userData: Partial<User>): Observable<User> {
    // Validate required fields
    if (!userData.username || !userData.email || !userData.password) {
      return throwError(() => new Error('Missing required fields'));
    }

    // Check if email already exists
    if (this.users.some(u => u.email === userData.email)) {
      return throwError(() => new Error('Email already exists'));
    }

    // Check if username already exists
    if (this.users.some(u => u.username === userData.username)) {
      return throwError(() => new Error('Username already exists'));
    }

    const newUser: User = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      role: userData.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(newUser);
    
    return of(newUser).pipe(delay(1000));
  }

  /**
   * Update user
   */
  updateUser(id: string, userData: Partial<User>): Observable<User> {
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return throwError(() => new Error('User not found'));
    }

    // Check if email already exists (excluding current user)
    if (userData.email && this.users.some(u => u.email === userData.email && u.id !== id)) {
      return throwError(() => new Error('Email already exists'));
    }

    // Check if username already exists (excluding current user)
    if (userData.username && this.users.some(u => u.username === userData.username && u.id !== id)) {
      return throwError(() => new Error('Username already exists'));
    }

    const updatedUser: User = {
      ...this.users[userIndex],
      ...userData,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };

    this.users[userIndex] = updatedUser;
    
    return of(updatedUser).pipe(delay(1000));
  }

  /**
   * Delete user
   */
  deleteUser(id: string): Observable<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return throwError(() => new Error('User not found'));
    }

    // Prevent deleting admin users
    if (this.users[userIndex].role === 'admin') {
      return throwError(() => new Error('Cannot delete admin users'));
    }

    this.users.splice(userIndex, 1);
    
    return of(true).pipe(delay(500));
  }

  /**
   * Search users
   */
  searchUsers(searchTerm: string): Observable<User[]> {
    const filteredUsers = this.users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return of(filteredUsers).pipe(delay(500));
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: UserRole): Observable<User[]> {
    const filteredUsers = this.users.filter(user => user.role === role);
    return of(filteredUsers).pipe(delay(500));
  }

  /**
   * Get user statistics
   */
  getUserStats(): Observable<{ total: number; admins: number; users: number; guests: number }> {
    const stats = {
      total: this.users.length,
      admins: this.users.filter(u => u.role === 'admin').length,
      users: this.users.filter(u => u.role === 'user').length,
      guests: this.users.filter(u => u.role === 'guest').length
    };
    
    return of(stats).pipe(delay(300));
  }

  /**
   * Validate user credentials (for login)
   */
  validateCredentials(email: string, password: string): Observable<User | null> {
    // In a real app, you would hash the password and compare
    // This is just for demo purposes
    const user = this.users.find(u => u.email === email);
    
    if (user) {
      // Simulate password validation
      return of(user).pipe(delay(1000));
    }
    
    return of(null).pipe(delay(1000));
  }
}
