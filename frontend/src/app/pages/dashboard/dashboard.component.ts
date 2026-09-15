import {
  Component,
  computed,
  inject
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  NotesService
} from '../../services/notes.service';

import {
  FolderService
} from '../../services/folder.service';


@Component({
  selector: 'app-dashboard',

  imports: [
    RouterLink,
    DatePipe
  ],

  templateUrl:
    './dashboard.component.html',

  styleUrl:
    './dashboard.component.scss',
})
export class DashboardComponent {

  readonly notesService =
    inject(NotesService);


  readonly folderService =
    inject(FolderService);


  // ==========================================
  // FILTER NOTES BY SELECTED SIDEBAR FOLDER
  // ==========================================

  readonly filteredNotes =
    computed(() => {

      const folder =
        this.folderService
          .selectedFolder();


      // All Notes = show everything
      if (folder === 'All Notes') {

        return this.notesService
          .notes();

      }


      // Other folder = show only that folder
      return this.notesService
        .notes()
        .filter(
          note =>
            note.folder === folder
        );

    });

}