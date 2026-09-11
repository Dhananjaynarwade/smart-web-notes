import {
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-note-editor',
  imports: [FormsModule, TiptapEditorDirective],
  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss',
})
export class NoteEditorComponent implements OnDestroy {
  private readonly imageService = inject(ImageService);

  title = input('');
  content = input('');

  titleChange = output<string>();
  contentChange = output<string>();

  readonly uploading = signal(false);

  readonly editor = new Editor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: 'Start writing, or paste text / screenshot (Ctrl+V)...',
      }),
    ],
    editorProps: {
      handlePaste: (_view, event) => this.handlePaste(event),
    },
    onUpdate: ({ editor }) => {
      const html = this.imageService.normalizeHtml(editor.getHTML());
      this.contentChange.emit(html);
    },
  });

  constructor() {
    effect(() => {
      const html = this.content();
      if (this.editor.isDestroyed) {
        return;
      }
      const current = this.imageService.normalizeHtml(this.editor.getHTML());
      if (html !== current) {
        void this.loadContent(html);
      }
    });
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  onTitleInput(value: string): void {
    this.titleChange.emit(value);
  }

  cmd(action: string): void {
    const chain = this.editor.chain().focus();
    switch (action) {
      case 'bold':
        chain.toggleBold().run();
        break;
      case 'italic':
        chain.toggleItalic().run();
        break;
      case 'underline':
        chain.toggleUnderline().run();
        break;
      case 'h1':
        chain.toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        chain.toggleHeading({ level: 2 }).run();
        break;
      case 'bullet':
        chain.toggleBulletList().run();
        break;
      case 'ordered':
        chain.toggleOrderedList().run();
        break;
      case 'code':
        chain.toggleCodeBlock().run();
        break;
      case 'link':
        this.setLink();
        break;
      case 'table':
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'undo':
        chain.undo().run();
        break;
      case 'redo':
        chain.redo().run();
        break;
    }
  }

  isActive(name: string, attrs?: Record<string, unknown>): boolean {
    return this.editor.isActive(name, attrs);
  }

  private async loadContent(html: string): Promise<void> {
    const resolved = await this.imageService.resolveHtml(html);
    this.editor.commands.setContent(resolved, { emitUpdate: false });
  }

  private setLink(): void {
    const previous = this.editor.getAttributes('link')['href'] as string | undefined;
    const url = window.prompt('Enter URL', previous ?? 'https://');
    if (url === null) {
      return;
    }
    if (url === '') {
      this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  private handlePaste(event: ClipboardEvent): boolean {
    const items = event.clipboardData?.items;
    if (!items) {
      return false;
    }

    const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (!imageItem) {
      return false;
    }

    event.preventDefault();
    const file = imageItem.getAsFile();
    if (file) {
      void this.insertImage(file);
    }
    return true;
  }

  private async insertImage(file: File): Promise<void> {
    this.uploading.set(true);
    try {
      const { url } = await this.imageService.upload(file);
      const displayUrl = await this.imageService.resolveUrl(url);
      this.editor
        .chain()
        .focus()
        .setImage({ src: displayUrl, alt: file.name || 'Pasted image' })
        .run();

      const img = this.editor.view.dom.querySelector(`img[src="${displayUrl}"]`);
      const id = this.imageService.extractId(url);
      if (img && id) {
        img.setAttribute('data-image-id', id);
      }

      this.contentChange.emit(this.imageService.normalizeHtml(this.editor.getHTML()));
    } finally {
      this.uploading.set(false);
    }
  }
}
