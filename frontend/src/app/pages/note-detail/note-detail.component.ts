import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NoteEditorComponent } from '../../components/note-editor/note-editor.component';
import { Note, NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-note-detail',
  imports: [NoteEditorComponent, RouterLink],
  templateUrl: './note-detail.component.html',
  styleUrl: './note-detail.component.scss',
})
export class NoteDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notesService = inject(NotesService);

  readonly note = signal<Note>({
    id: crypto.randomUUID(),
    title: '',
    content: '',
    folder: 'All Notes',
    updatedAt: new Date().toISOString(),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      const existing = this.notesService.getById(id);
      if (existing) {
        this.note.set({ ...existing });
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  updateTitle(title: string): void {
    this.note.update((n) => ({ ...n, title }));
  }

  updateContent(content: string): void {
    this.note.update((n) => ({ ...n, content }));
  }

  save(): void {
    const current = this.note();
    this.notesService.save({
      ...current,
      updatedAt: new Date().toISOString(),
    });
    if (this.route.snapshot.paramMap.get('id') === 'new') {
      this.router.navigate(['/notes', current.id]);
    }
  }

  deleteNote(): void {
    const id = this.note().id;
    this.notesService.delete(id);
    this.router.navigate(['/dashboard']);
  }
}
