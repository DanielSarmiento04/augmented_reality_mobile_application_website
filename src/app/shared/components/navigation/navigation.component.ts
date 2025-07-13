import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {
  currentRoute = '';
  isMenuOpen = false;

  navigationItems = [
    {
      route: '/dashboard',
      label: 'Dashboard',
      icon: 'icon-grid',
      description: 'Panel principal'
    },
    {
      route: '/labels',
      label: 'Anotaciones',
      icon: 'icon-target',
      description: 'Herramienta YOLO'
    },
    {
      route: '/admins',
      label: 'Usuarios',
      icon: 'icon-users',
      description: 'Gestión de usuarios'
    },
    {
      route: '/routine',
      label: 'Rutinas',
      icon: 'icon-settings',
      description: 'Gestión de rutinas'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });

    // Set initial route
    this.currentRoute = this.router.url;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.isMenuOpen = false;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  isActive(route: string): boolean {
    return this.currentRoute === route;
  }

  logout(): void {
    // In a real app, you would clear authentication tokens here
    this.router.navigate(['/login']);
  }
}
