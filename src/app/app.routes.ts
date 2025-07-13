import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { LabelsComponent } from "./pages/labels/labels.component";
import { AdminsComponent } from "./pages/admins/admins.component";

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'labels', component: LabelsComponent, title: 'YOLO Annotation Tool' },
  { path: 'login', component: LoginComponent, title: 'AR App - Login' },
  { path: 'dashboard', component: DashboardComponent, title: 'AR App - Dashboard' },
  { path: 'admins', component: AdminsComponent, title: 'AR App - Gestión de Usuarios' },
  { path: '**', redirectTo: '/labels' }
];
