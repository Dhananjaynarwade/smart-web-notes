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
  firstValueFrom,
  map,
  tap
} from 'rxjs';


// ==========================================
// ANGULAR NOTE
// ==========================================

export interface Note {

  id: string;

  title: string;

  slug?: string;

  content: string;

  folder: string;

  createdAt?: string;

  updatedAt: string;

}


// ==========================================
// DJANGO NOTE RESPONSE
// ==========================================

interface ApiNote {

  id: string;

  title: string;

  slug: string | null;

  content: string;

  folder: string;

  created_at: string;

  updated_at: string;

}


// ==========================================
// NOTES SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  constructor() {
  this.loadNotes();
}

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    // 'http://127.0.0.1:8000/api/notes/';
    // private readonly apiUrl =
  'https://smart-web-notes-backend.onrender.com/api/notes/';


  // ==========================================
  // NOTES STATE
  // ==========================================

  readonly notes =
    signal<Note[]>([]);


  readonly loaded =
    signal(false);


  // ==========================================
  // LOAD NOTES FROM DJANGO DATABASE
  // ==========================================

  loadNotes(): void {

    this.loaded.set(false);


    this.http
      .get<ApiNote[]>(
        this.apiUrl
      )
      .pipe(

        map(
          apiNotes =>
            apiNotes.map(
              note =>
                this.fromApi(note)
            )
        )

      )
      .subscribe({

        next: notes => {

          this.notes.set(
            notes
          );

          this.loaded.set(
            true
          );

          console.log(
            'Notes loaded from Django:',
            notes
          );

        },


        error: error => {

          console.error(
            'Could not load notes from Django:',
            error
          );

          this.loaded.set(
            true
          );

        }

      });

  }


  // ==========================================
  // FIND NOTE
  // ==========================================

  getById(
    id: string
  ): Note | undefined {

    return this.notes()
      .find(
        note =>
          note.id === id ||
          note.slug === id
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
        .find(
          item =>
            item.id === note.id
        );


    // ========================================
    // EXISTING NOTE → PATCH
    // ========================================

    if (existing) {

      const payload = {

        title:
          note.title,

        content:
          note.content,

        folder:
          note.folder

      };


      return this.http
        .patch<ApiNote>(

          `${this.apiUrl}${note.id}/`,

          payload

        )
        .pipe(

          map(
            response =>
              this.fromApi(
                response
              )
          ),

          tap(
            savedNote => {

              this.notes.update(
                notes =>
                  notes.map(
                    current =>
                      current.id ===
                      savedNote.id

                        ? savedNote

                        : current
                  )
              );

            }
          )

        );

    }


    // ========================================
    // NEW NOTE → POST
    // ========================================

    const payload = {

      title:
        note.title,

      content:
        note.content,

      folder:
        note.folder

    };


    return this.http
      .post<ApiNote>(

        this.apiUrl,

        payload

      )
      .pipe(

        map(
          response =>
            this.fromApi(
              response
            )
        ),

        tap(
          savedNote => {

            this.notes.update(
              notes => [
                savedNote,
                ...notes
              ]
            );

          }
        )

      );

  }


  // ==========================================
  // DELETE NOTE
  // ==========================================

  async delete(
    id: string
  ): Promise<void> {

    await firstValueFrom(

      this.http.delete<void>(

        `${this.apiUrl}${id}/`

      )

    );


    this.notes.update(
      notes =>
        notes.filter(
          note =>
            note.id !== id
        )
    );

  }


  // ==========================================
  // DJANGO RESPONSE → ANGULAR NOTE
  // ==========================================

  private fromApi(
    note: ApiNote
  ): Note {

    return {

      id:
        note.id,

      title:
        note.title,

      slug:
        note.slug ?? undefined,

      content:
        note.content,

      folder:
        note.folder,

      createdAt:
        note.created_at,

      updatedAt:
        note.updated_at

    };

  }

}