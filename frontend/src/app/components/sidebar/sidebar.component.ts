import {
  Component,
  inject
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import {
  NotesService
} from '../../services/notes.service';

import {
  FolderService
} from '../../services/folder.service';


@Component({
  selector: 'app-sidebar',

  imports: [
    RouterLink,
    RouterLinkActive
  ],

  templateUrl:
    './sidebar.component.html',

  styleUrl:
    './sidebar.component.scss',
})
export class SidebarComponent {

  readonly notesService =
    inject(NotesService);


  readonly folderService =
    inject(FolderService);


  // ==========================================
  // SELECT FOLDER
  // ==========================================

  selectFolder(
    folder: string
  ): void {

    this.folderService.selectFolder(
      folder
    );

  }


  // ==========================================
  // CREATE FOLDER
  // ==========================================

  async createFolder(): Promise<void> {

    const folderName =
      window.prompt(
        'Enter new folder name'
      );


    if (!folderName) {
      return;
    }


    const created =
      await this.folderService.addFolder(
        folderName
      );


    if (!created) {

      window.alert(
        'Folder could not be created.'
      );

      return;

    }


    this.folderService.selectFolder(
      created
    );

  }


  // ==========================================
  // RENAME FOLDER
  // ==========================================

  async renameFolder(
    folder: string
  ): Promise<void> {

    if (
      this.folderService
        .isDefaultFolder(folder)
    ) {
      return;
    }


    const newName =
      window.prompt(
        'Rename folder',
        folder
      );


    if (!newName) {
      return;
    }


    const cleanName =
      newName.trim();


    if (!cleanName) {
      return;
    }


    const renamed =
      await this.folderService
        .renameFolder(
          folder,
          cleanName
        );


    if (!renamed) {

      window.alert(
        'Folder could not be renamed. The name may already exist.'
      );

      return;

    }


    this.notesService.loadNotes();

  }


  // ==========================================
  // DELETE FOLDER
  // ==========================================

  async deleteFolder(
    folder: string
  ): Promise<void> {

    if (
      this.folderService
        .isDefaultFolder(folder)
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `Delete folder "${folder}"?\n\nNotes inside it will move to All Notes.`
      );


    if (!confirmed) {
      return;
    }


    const deleted =
      await this.folderService
        .deleteFolder(folder);


    if (!deleted) {

      window.alert(
        'Folder could not be deleted.'
      );

      return;

    }


    this.notesService.loadNotes();

  }


  // ==========================================
  // DELETE RECENT NOTE
  // ==========================================

  async deleteRecentNote(
    event: MouseEvent,
    noteId: string,
    noteTitle: string
  ): Promise<void> {

    event.preventDefault();

    event.stopPropagation();


    const confirmed =
      window.confirm(
        `Delete note "${noteTitle}"?\n\nThis action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    try {

      await this.notesService.delete(
        noteId
      );


      this.notesService.loadNotes();


    } catch (error) {

      console.error(
        'Note delete failed:',
        error
      );


      window.alert(
        'Note could not be deleted.'
      );

    }

  }

}