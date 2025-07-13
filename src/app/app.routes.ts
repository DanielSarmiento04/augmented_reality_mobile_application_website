import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { LabelsComponent } from "./pages/labels/labels.component";
import { AdminsComponent } from "./pages/admins/admins.component";
import { RoutineComponent } from "./pages/routine/routine.component";
import { LayoutComponent } from "./layout.component";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, title: 'AR App - Login' },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent, title: 'AR App - Dashboard' },
      { path: 'labels', component: LabelsComponent, title: 'YOLO Annotation Tool' },
      { path: 'admins', component: AdminsComponent, title: 'AR App - Gestión de Usuarios' },
      { path: 'routine', component: RoutineComponent, title: 'AR App - Gestión de Rutinas' },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
