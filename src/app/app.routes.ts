import { Routes } from "@angular/router";
// import { RoutinesCreateComponent } from "./components/routines/routines-create/routines-create.component";
import { LoginComponent } from "./pages/login/login.component";

export const routes: Routes = [
  // { path: 'routines/create', component: RoutinesCreateComponent },
  { path: '', component: LoginComponent },
  { path: '', pathMatch: 'full', redirectTo: '' },
  { path: '**', title: 'Not found', redirectTo: '' },
]
