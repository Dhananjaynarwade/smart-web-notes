import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  map,
  tap
} from 'rxjs';


// ==========================================
// ANGULAR NOTE MODEL
// ==========================================

export interface Note {

  id: string;

  title: string;

  content: string;

  folder: string;

  updatedAt: string;

}


// ==========================================
// DJANGO API NOTE MODEL
// ==========================================

interface ApiNote {

  id: string;

  title: string;

  content: string;

  folder: string;

  created_at: string;

  updated_at: string;

}


@Injectable({
  providedIn: 'root'
})
export class NotesService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    'http://127.0.0.1:8000/api/notes/';


  // All notes from Django
  readonly notes =
    signal<Note[]>([]);


  // Tells Angular when Django loading is finished
  readonly loaded =
    signal(false);


  constructor() {

    this.loadNotes();

  }


  // ==========================================
  // LOAD NOTES FROM DJANGO
  // ==========================================

  loadNotes(): void {

    this.loaded.set(false);


    this.http
      .get<ApiNote[]>(
        this.apiUrl
      )
      .subscribe({

        next: (data) => {

          const list =
            data.map(
              note =>
                this.fromApi(note)
            );


          this.notes.set(
            list
          );


          this.loaded.set(
            true
          );

        },


        error: (error) => {

          console.error(
            'Failed to load notes:',
            error
          );


          this.loaded.set(
            true
          );

        }

      });

  }


  // ==========================================
  // GET ALL NOTES
  // ==========================================

  getAll(): Note[] {

    return this.notes();

  }


  // ==========================================
  // GET NOTE BY ID
  // ==========================================

  getById(
    id: string
  ): Note | undefined {

    return this
      .notes()
      .find(
        note =>
          note.id === id
      );

  }


  // ==========================================
  // SAVE NOTE
  // ==========================================

  save(
    note: Note
  ): Observable<Note> {

    const existing =
      this.notes()
        .some(
          item =>
            item.id === note.id
        );


    const payload = {

      id:
        note.id,

      title:
        note.title,

      content:
        note.content,

      folder:
        note.folder

    };


    // ========================================
    // UPDATE EXISTING NOTE
    // ========================================

    if (existing) {

      return this.http
        .patch<ApiNote>(
          `${this.apiUrl}${note.id}/`,
          payload
        )
        .pipe(

          map(
            savedNote =>
              this.fromApi(
                savedNote
              )
          ),

          tap(
            savedNote => {

              this.updateSignal(
                savedNote
              );

            }
          )

        );

    }


    // ========================================
    // CREATE NEW NOTE
    // ========================================

    return this.http
      .post<ApiNote>(
        this.apiUrl,
        payload
      )
      .pipe(

        map(
          savedNote =>
            this.fromApi(
              savedNote
            )
        ),

        tap(
          savedNote => {

            this.notes.update(
              list => [
                savedNote,
                ...list
              ]
            );

          }
        )

      );

  }


  // ==========================================
  // DELETE NOTE
  // ==========================================

  delete(
    id: string
  ): void {

    this.http
      .delete(
        `${this.apiUrl}${id}/`
      )
      .subscribe({

        next: () => {

          this.notes.update(
            list =>
              list.filter(
                note =>
                  note.id !== id
              )
          );

        },


        error: (error) => {

          console.error(
            'Failed to delete note:',
            error
          );

        }

      });

  }


  // ==========================================
  // UPDATE NOTE INSIDE SIGNAL
  // ==========================================

  private updateSignal(
    savedNote: Note
  ): void {

    this.notes.update(
      list =>
        list.map(
          note =>
            note.id === savedNote.id
              ? savedNote
              : note
        )
    );

  }


  // ==========================================
  // DJANGO FORMAT → ANGULAR FORMAT
  // ==========================================

  private fromApi(
    note: ApiNote
  ): Note {

    return {

      id:
        note.id,

      title:
        note.title,

      content:
        note.content,

      folder:
        note.folder,

      updatedAt:
        note.updated_at

    };

  }

}