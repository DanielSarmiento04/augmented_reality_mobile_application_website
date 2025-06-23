import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { LabelsComponent } from "./pages/labels/labels.component";

export const routes: Routes = [
  { path: '', redirectTo: '/labels', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'labels', component: LabelsComponent, title: 'YOLO Annotation Tool' },
  { path: '**', redirectTo: '/labels' }
];
