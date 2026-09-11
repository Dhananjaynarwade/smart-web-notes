import { Injectable, signal } from '@angular/core';

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly storageKey = 'smart-web-notes';
  readonly notes = signal<Note[]>(this.load());

  getAll(): Note[] {
    return this.notes();
  }

  getById(id: string): Note | undefined {
    return this.notes().find((n) => n.id === id);
  }

  save(note: Note): void {
    const list = [...this.notes()];
    const index = list.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      list[index] = note;
    } else {
      list.unshift(note);
    }
    this.persist(list);
  }

  delete(id: string): void {
    this.persist(this.notes().filter((n) => n.id !== id));
  }

  private load(): Note[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as Note[]) : [];
    } catch {
      return [];
    }
  }

  private persist(list: Note[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
    this.notes.set(list);
  }
}
