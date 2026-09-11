# Smart Web Notes

Web knowledge capture app — save text, images, and links from any website into organized notes.

## Phase 1 ✓

Angular frontend with dashboard layout, sidebar, and note editor.

## Phase 2 (Current)

- Tiptap rich text editor (bold, italic, underline, headings, lists, links, code, tables)
- Screenshot paste: Win+Shift+S → Ctrl+V in editor
- Image paste from websites via ClipboardEvent
- Images stored in IndexedDB locally (Django upload in Phase 3)
- Normal keyboard shortcuts: Ctrl+B/I/U/K/Z/Y/C/V/X/A

## Run

```bash
cd frontend
npm start
```

Open http://localhost:4200

## Roadmap

1. **Phase 1** — Angular UI + basic editor ✓
2. **Phase 2** — Tiptap editor, screenshot/image paste
3. **Phase 3** — Django REST API + PostgreSQL
4. **Phase 4** — Login, folders, tags, search
5. **Phase 5** — Chrome/Edge browser extension
6. **Phase 6** — Multi-device sync, Google login
7. **Phase 7** — Docker, AWS, S3, CI/CD
