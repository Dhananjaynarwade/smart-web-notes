import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NoteDetailComponent } from './pages/note-detail/note-detail.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'notes/new', component: NoteDetailComponent },
      { path: 'notes/:id', component: NoteDetailComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
