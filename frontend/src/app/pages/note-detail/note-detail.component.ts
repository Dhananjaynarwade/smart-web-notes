import {
  Component,
  effect,
  inject,
  OnDestroy,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  firstValueFrom
} from 'rxjs';

import Swal from 'sweetalert2';

import {
  NoteEditorComponent
} from '../../components/note-editor/note-editor.component';

import {
  Note,
  NotesService
} from '../../services/notes.service';
import {
  toSignal
} from '@angular/core/rxjs-interop';
import {
  FolderService
} from '../../services/folder.service';

@Component({
  selector: 'app-note-detail',

  imports: [
    NoteEditorComponent,
    RouterLink
  ],

  templateUrl:
    './note-detail.component.html',

  styleUrl:
    './note-detail.component.scss',
})
export class NoteDetailComponent implements OnDestroy {
private readonly folderService =
  inject(FolderService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly notesService =
    inject(NotesService);

private readonly routeParams =
  toSignal(
    this.route.paramMap,
    {
      initialValue:
        this.route.snapshot.paramMap
    }
  );
  // // ==========================================
  // // FOLDERS
  // // ==========================================

  // readonly folders = [
  //   'All Notes',
  //   'DevOps',
  //   'AWS',
  //   'Angular',
  //   'Django',
  //   'Projects',
  //   'Personal'
  // ];
  readonly folders =
  this.folderService.folders;

  // ==========================================
  // NOTE
  // ==========================================

readonly note =
  signal<Note>({
    id: crypto.randomUUID(),
    title: '',
    content: '',
    folder:
      this.folderService.selectedFolder(),
    updatedAt:
      new Date().toISOString(),
  });


  // ==========================================
  // AUTO SAVE STATUS
  // ==========================================

  readonly autoSaveStatus =
    signal<
      'idle' |
      'saving' |
      'saved' |
      'error'
    >('idle');


  // ==========================================
  // INLINE SAVE ALERT
  // ==========================================

  readonly saveAlert =
    signal<{
      type:
        'success' |
        'warning' |
        'danger';
      title: string;
      message: string;
      footer: string;
    } | null>(null);


  private autoSaveTimer:
    ReturnType<typeof setTimeout> | null =
      null;

  private alertTimer:
    ReturnType<typeof setTimeout> | null =
      null;

  private autoSaveInProgress =
    false;

  private autoSavePending =
    false;


// ==========================================
// LOAD NOTE WHEN URL ID CHANGES
// ==========================================

private readonly loadNoteEffect =
  effect(() => {

    if (!this.notesService.loaded()) {
      return;
    }


    const params =
      this.routeParams();


    const id =
      params.get('id');


    // /notes/new
    if (!id) {
      return;
    }


    const existing =
      this.notesService.getById(id);


    if (existing) {

      this.note.set({
        ...existing
      });

      return;
    }


    this.router.navigate([
      '/dashboard'
    ]);

  });


  // ==========================================
  // UPDATE TITLE
  // ==========================================

  updateTitle(
    title: string
  ): void {

    this.note.update(
      note => ({
        ...note,
        title
      })
    );

    this.scheduleAutoSave();

  }


  // ==========================================
  // UPDATE CONTENT
  // ==========================================

  updateContent(
    content: string
  ): void {

    this.note.update(
      note => ({
        ...note,
        content
      })
    );
    

    this.scheduleAutoSave();

  }
  


  // ==========================================
  // CHECK IF NOTE IS EMPTY
  // ==========================================

  private isNoteEmpty(): boolean {

    const current =
      this.note();

    const hasTitle =
      current.title
        .trim()
        .length > 0;

    const html =
      current.content || '';

    // Screenshot-only note is not empty.
    const hasImage =
      /<img\b[^>]*>/i.test(html);

    // Convert editor HTML into plain text.
    const plainText =
      html
        .replace(
          /<[^>]*>/g,
          ''
        )
        .replace(
          /&nbsp;/gi,
          ' '
        )
        .replace(
          /&#160;/gi,
          ' '
        )
        .replace(
          /\u00a0/g,
          ' '
        )
        .trim();

    const hasText =
      plainText.length > 0;

    return (
      !hasTitle &&
      !hasText &&
      !hasImage
    );

  }


  // ==========================================
  // SHOW INLINE ALERT
  // ==========================================

  private showSaveAlert(
    type:
      'success' |
      'warning' |
      'danger',
    title: string,
    message: string,
    footer: string
  ): void {

    this.saveAlert.set({
      type,
      title,
      message,
      footer
    });

    if (this.alertTimer) {
      clearTimeout(
        this.alertTimer
      );
    }

    this.alertTimer =
      setTimeout(
        () => {
          this.saveAlert.set(
            null
          );
        },
        5000
      );

  }
  updateFolder(
  folder: string
): void {

  this.note.update(
    note => ({
      ...note,
      folder
    })
  );

  this.scheduleAutoSave();

}


  // ==========================================
  // SCHEDULE AUTO SAVE
  // ==========================================

  private scheduleAutoSave(): void {

    if (this.autoSaveTimer) {
      clearTimeout(
        this.autoSaveTimer
      );
    }

    this.autoSaveStatus.set(
      'idle'
    );

    this.autoSaveTimer =
      setTimeout(
        () => {
          this.autoSaveTimer = null;
          void this.autoSave();
        },
        1500
      );

  }


  // ==========================================
  // AUTO SAVE
  // ==========================================

  private async autoSave(): Promise<void> {

    // Never auto-save a completely empty note.
    if (this.isNoteEmpty()) {
      return;
    }

    if (this.autoSaveInProgress) {
      this.autoSavePending = true;
      return;
    }

    const current =
      this.note();

    this.autoSaveInProgress =
      true;

    this.autoSaveStatus.set(
      'saving'
    );

    try {

      const savedNote =
        await firstValueFrom(
          this.notesService.save({
            ...current,
            updatedAt:
              new Date()
                .toISOString(),
          })
        );

      // Keep anything the user typed while the request was running.
      this.note.update(
        note => ({
          ...note,
          id: savedNote.id,
          updatedAt: savedNote.updatedAt
        })
      );

      this.autoSaveStatus.set(
        'saved'
      );

      // First auto-save: /notes/new -> /notes/UUID
      const id =
        this.route
          .snapshot
          .paramMap
          .get('id');

      if (!id) {
        await this.router.navigate(
          [
            '/notes',
            savedNote.slug ?? savedNote.id
          ],
          {
            replaceUrl: true
          }
        );
      }

    } catch (error) {

      console.error(
        'Auto save failed:',
        error
      );

      this.autoSaveStatus.set(
        'error'
      );

    } finally {

      this.autoSaveInProgress =
        false;

      if (this.autoSavePending) {
        this.autoSavePending = false;
        this.scheduleAutoSave();
      }

    }

  }


  // ==========================================
  // MANUAL SAVE BUTTON
  // ==========================================

  async save(): Promise<void> {

    // Do not save a completely empty note.
    if (this.isNoteEmpty()) {

      this.showSaveAlert(
        'warning',
        'Nothing to save!',
        'Please add a title, some text, or a screenshot before saving.',
        'Empty notes are not saved.'
      );

      return;
    }

    // Cancel a waiting auto-save because the user clicked Save now.
    if (this.autoSaveTimer) {
      clearTimeout(
        this.autoSaveTimer
      );
      this.autoSaveTimer = null;
    }

    const current =
      this.note();

    try {

      this.autoSaveStatus.set(
        'saving'
      );

      const savedNote =
        await firstValueFrom(
          this.notesService.save({
            ...current,
            updatedAt:
              new Date()
                .toISOString(),
          })
        );

      this.note.set(
        savedNote
      );

      this.autoSaveStatus.set(
        'saved'
      );

      await this.router.navigate([
        '/notes',
        savedNote.id
      ]);

      this.showSaveAlert(
        'success',
        'Well done!',
        'Your note has been saved successfully.',
        'Your text and screenshots are stored permanently.'
      );

    } catch (error) {

      console.error(
        'Save failed:',
        error
      );

      this.autoSaveStatus.set(
        'error'
      );

      this.showSaveAlert(
        'danger',
        'Save failed!',
        'Your note could not be saved.',
        'Make sure the Django server is running.'
      );

    }

  }


  // ==========================================
  // DELETE
  // ==========================================

  async deleteNote(): Promise<void> {

    const result =
      await Swal.fire({
        icon: 'warning',
        title: 'Delete this note?',
        text: 'This action cannot be undone.',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      });

    if (!result.isConfirmed) {
      return;
    }

    if (this.autoSaveTimer) {
      clearTimeout(
        this.autoSaveTimer
      );
      this.autoSaveTimer = null;
    }

    this.notesService.delete(
      this.note().id
    );

    await this.router.navigate([
      '/dashboard'
    ]);

  }


  // ==========================================
  // DESTROY
  // ==========================================

  ngOnDestroy(): void {

    if (this.autoSaveTimer) {
      clearTimeout(
        this.autoSaveTimer
      );
    }

    if (this.alertTimer) {
      clearTimeout(
        this.alertTimer
      );
    }

  }

}
