import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { RoutineService } from '../../services/routine.service';

@Component({
  selector: 'custom-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Dashboard Statistics
  totalUsers = 0;
  totalRoutines = 0;
  activeProjects = 0;
  recentRoutines = 0;
  activeUsers = 0;
  totalAnnotations = 0;

  constructor(
    private router: Router,
    private userService: UserService,
    private routineService: RoutineService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  private loadDashboardData(): void {
    // Load users data
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.totalUsers = users.length;
        // For now, assume all users are active since status is not in the User model
        this.activeUsers = users.length;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });

    // Load routines data
    this.routineService.getRoutines().subscribe({
      next: (routines) => {
        this.totalRoutines = routines.length;
        this.recentRoutines = routines.filter(routine => {
          if (!routine.lastExecuted) return false;
          const lastExecuted = new Date(routine.lastExecuted);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastExecuted > weekAgo;
        }).length;
        this.activeProjects = routines.filter(routine => routine.status === 'active').length;
      },
      error: (error) => {
        console.error('Error loading routines:', error);
      }
    });

    // Mock data for annotations (since we don't have a service yet)
    this.totalAnnotations = 247;
  }
}
