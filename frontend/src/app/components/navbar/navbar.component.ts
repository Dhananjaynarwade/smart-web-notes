import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  NotesService
} from '../../services/notes.service';


@Component({
  selector: 'app-navbar',

  imports: [
    RouterLink
  ],

  templateUrl:
    './navbar.component.html',

  styleUrl:
    './navbar.component.scss',
})
export class NavbarComponent {

  readonly notesService =
    inject(NotesService);

  private readonly router =
    inject(Router);


  readonly searchTerm =
    signal('');


  readonly searchFocused =
    signal(false);


  /* =========================================
     CREATE NEW NOTE
  ========================================= */

  createNewNote(): void {

    this.searchTerm.set('');

    this.searchFocused.set(false);


    void this.router.navigate([
      '/notes/new'
    ]);

  }


  /* =========================================
     SEARCH RESULTS
  ========================================= */

  readonly searchResults =
    computed(() => {

      const query =
        this.searchTerm()
          .trim()
          .toLowerCase();


      if (!query) {
        return [];
      }


      return this.notesService
        .notes()
        .filter(note => {

          const title =
            (
              note.title ||
              'Untitled'
            )
              .toLowerCase();


          return title.includes(
            query
          );

        })
        .slice(0, 8);

    });


  /* =========================================
     SEARCH INPUT
  ========================================= */

  onSearchInput(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.searchTerm.set(
      input.value
    );

  }


  /* =========================================
     ENTER / SEARCH BUTTON
  ========================================= */

  onSearchSubmit(
    event: Event
  ): void {

    event.preventDefault();


    const firstResult =
      this.searchResults()[0];


    if (!firstResult) {
      return;
    }


    this.openNote(
      firstResult.slug ??
      firstResult.id
    );

  }


  /* =========================================
     OPEN NOTE
  ========================================= */

  openNote(
    identifier: string
  ): void {

    this.searchTerm.set('');

    this.searchFocused.set(false);


    void this.router.navigate([
      '/notes',
      identifier
    ]);

  }


  /* =========================================
     TITLE HIGHLIGHT
  ========================================= */

  titleParts(
    title: string
  ): {
    text: string;
    match: boolean;
  }[] {

    const query =
      this.searchTerm()
        .trim();


    if (!query) {

      return [
        {
          text:
            title ||
            'Untitled',

          match:
            false
        }
      ];

    }


    const value =
      title ||
      'Untitled';


    const lowerValue =
      value.toLowerCase();


    const lowerQuery =
      query.toLowerCase();


    const index =
      lowerValue.indexOf(
        lowerQuery
      );


    if (index === -1) {

      return [
        {
          text: value,

          match: false
        }
      ];

    }


    const parts: {
      text: string;
      match: boolean;
    }[] = [];


    if (index > 0) {

      parts.push({

        text:
          value.substring(
            0,
            index
          ),

        match:
          false

      });

    }


    parts.push({

      text:
        value.substring(
          index,
          index + query.length
        ),

      match:
        true

    });


    const endIndex =
      index +
      query.length;


    if (
      endIndex <
      value.length
    ) {

      parts.push({

        text:
          value.substring(
            endIndex
          ),

        match:
          false

      });

    }


    return parts;

  }


  /* =========================================
     CONTENT PREVIEW
  ========================================= */

  notePreview(
    content: string
  ): string {

    const text =
      this.stripHtml(
        content
      )
        .trim();


    if (!text) {
      return 'No text content';
    }


    if (text.length <= 80) {
      return text;
    }


    return (
      text.substring(
        0,
        80
      ) +
      '...'
    );

  }


  /* =========================================
     REMOVE HTML
  ========================================= */

  private stripHtml(
    html: string
  ): string {

    const container =
      document.createElement(
        'div'
      );


    container.innerHTML =
      html || '';


    return (
      container.textContent ||
      ''
    );

  }

}