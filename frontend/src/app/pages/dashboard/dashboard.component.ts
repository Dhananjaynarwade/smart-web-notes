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


  readonly filteredNotes =
    computed(() => {

      const folder =
        this.folderService
          .selectedFolder();

      if (
        folder === 'All Notes'
      ) {
        return this.notesService
          .notes();
      }

      return this.notesService
        .notes()
        .filter(
          note =>
            note.folder === folder
        );

    });


  // ==========================================
  // DELETE NOTE FROM DASHBOARD
  // ==========================================

  async deleteNote(
    noteId: string,
    event: Event
  ): Promise<void> {

    // Prevent opening the note
    event.preventDefault();

    event.stopPropagation();


    const confirmed =
      window.confirm(
        'Are you sure you want to delete this note?'
      );


    if (!confirmed) {
      return;
    }


    try {

      await this.notesService
        .delete(noteId);

    } catch (error) {

      console.error(
        'Failed to delete note:',
        error
      );

      alert(
        'Could not delete the note.'
      );

    }

  }

}