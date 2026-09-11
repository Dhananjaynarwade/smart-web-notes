import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly notesService = inject(NotesService);

  readonly folders = [
    'All Notes',
    'DevOps',
    'AWS',
    'Python',
    'Angular',
    'Django',
    'Cyber Security',
  ];
}
