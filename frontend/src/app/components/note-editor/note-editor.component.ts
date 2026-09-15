import {
  Component,
  effect,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Editor,
  Mark,
  mergeAttributes
} from '@tiptap/core';


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

/* ADD THIS HERE */
const SourceRef = Mark.create({

  name: 'sourceRef',

  addAttributes() {
    return {
      url: {
        default: null
      },

      title: {
        default: ''
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-source-ref]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {

    const sourceUrl =
      HTMLAttributes['url'] || '';

    const sourceTitle =
      HTMLAttributes['title'] ||
      sourceUrl ||
      'Original source';

    return [
      'a',

      mergeAttributes(
        HTMLAttributes,
        {
          href: sourceUrl,

          target: '_blank',

          rel: 'noopener noreferrer',

          // identifies captured text
          'data-source-ref': 'true',

          // used by our CSS
          'data-source-title': sourceTitle,

          // IMPORTANT:
          // browser's normal hover tooltip
          title: sourceTitle
        }
      ),

      0
    ];
  }

});
@Component({
  selector: 'app-note-editor',

  imports: [
    FormsModule,
    TiptapEditorDirective
  ],

  templateUrl: './note-editor.component.html',
  styleUrl: './note-editor.component.scss',
})
export class NoteEditorComponent implements OnDestroy {
 @HostListener('window:message', ['$event'])
onExtensionMessage(event: MessageEvent): void {
  

  // Accept messages only from our Angular page
  if (event.origin !== window.location.origin) {
    return;
  }

  const data = event.data;

  if (
    data?.source !== 'smart-web-notes-extension' ||
    data?.type !== 'ADD_TO_MY_NOTES'
  ) {
    return;
  }

  const selectedText =
    data.capture?.text?.trim() || '';

  const sourceTitle =
    data.capture?.sourceTitle?.trim() || '';

  const sourceUrl =
    data.capture?.sourceUrl?.trim() || '';

    const target =
  data.capture?.target || 'body';
  
  if (!selectedText) {
  return;
}

// ==========================================
// PASTE AS NORMAL TEXT
// ==========================================




  if (target === 'plain') {

  const normalLines =
    selectedText
      .split(/\r?\n| {2,}/)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);


  const normalParagraphs: any[] =
    normalLines.map(
      (line: string, index: number) => ({

        type: 'paragraph',

        content: [

          // Normal text
          {
            type: 'text',
            text: line
          },

          // Add source ONLY beside first line
          ...(index === 0 && sourceUrl
            ? [
                {
                  type: 'text',
                  text: '  '
                },

                {
                  type: 'text',
                  text: '↗ source',

                  marks: [
                    {
                      type: 'sourceRef',

                      attrs: {
                        url: sourceUrl,

                        title:
                          sourceTitle ||
                          sourceUrl
                      }
                    }
                  ]
                }
              ]
            : [])

        ]

      })
    );


  // Space after whole captured section
  normalParagraphs.push({
    type: 'paragraph',
    content: []
  });


  this.editor
    .chain()
    .focus('end')
    .unsetAllMarks()
    .insertContent(normalParagraphs)
    .run();


  return;
}


// ==========================================
// ADD SELECTED TEXT TO NOTE TITLE
// ==========================================

if (target === 'title') {

  this.titleChange.emit(
    selectedText
  );

  console.log(
    '✅ Added to note title:',
    selectedText
  );

  return;
}


  // Convert every selected line into a paragraph

const lines: string[] =
// Day-1 | Fundamentals of DevOps | Free DevOps Course | 45 days add on;y not the full content

 selectedText.split(/\r?\n/).map((line:string)=>line.trim())
 .filter((line:string)=> line.length >0);
const cleanLines =
  lines
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);

if (cleanLines.length === 0) {
  return;
}

const firstLine = cleanLines[0];
const remainingLines = cleanLines.slice(1);


const paragraphs: any[] =
  cleanLines.map(
    (line: string, index: number) => ({

      // IMPORTANT: normal paragraph, NOT heading
      type: 'paragraph',

      content: [
        {
          // IMPORTANT: normal text, NO bold mark
          type: 'text',
          text: line,
          marks:
          index ===0
          ? [{type: 'bold'}]:[]
          
        },
        
        

        // Source link only beside first line
        ...(index === 0 && sourceUrl
          ? [
              {
                type: 'text',
                text: '  ↗ source',

                marks: [
                  {
                    type: 'sourceRef',

                    attrs: {
                      url: sourceUrl,
                      title:
                        sourceTitle ||
                        sourceUrl
                    }
                  }
                ]
              }
            ]
          : [])
      ]

    })
  );


  // SPACE AFTER THIS CAPTURE
paragraphs.push({
  type: 'paragraph',
  content: []
});



  // Add to END of current note
  this.editor
    .chain()
    .focus('end')
    .insertContent(paragraphs)
    .run();


  console.log(
    '✅ Added captured text:',
    selectedText
  );

  console.log(
    '🔗 Source URL:',
    sourceUrl
  );

}

  private readonly imageService =
    inject(ImageService);

  private readonly route =
    inject(ActivatedRoute);


  title = input('');

  content = input('');


  titleChange = output<string>();

  contentChange = output<string>();


  readonly uploading =
    signal(false);


  readonly editor = new Editor({

    extensions: [

      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
          link: false,

  underline: false
      }),

      Underline,
      SourceRef,

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),

      Image.configure({
        inline: false,
        allowBase64: false
      }),

      Table.configure({
        resizable: true
      }),

      TableRow,

      TableHeader,

      TableCell,

      Placeholder.configure({
        placeholder:
          'Start writing, or paste text / screenshot (Ctrl+V)...',
      }),

    ],


    editorProps: {
handlePaste: (_view, event) => {

  const clipboardData =
    event.clipboardData;

  if (!clipboardData) {
    return false;
  }


  const items =
    Array.from(
      clipboardData.items
    );


  const imageItem =
    items.find(
      item =>
        item.type.startsWith('image/')
    );


  // Normal text paste
  if (!imageItem) {
    return false;
  }


  const pastedFile =
    imageItem.getAsFile();


  if (!pastedFile) {
    return false;
  }


  // Stop browser's normal image paste
  event.preventDefault();


  const file =
    new File(
      [pastedFile],

      `screenshot-${Date.now()}.png`,

      {
        type:
          pastedFile.type ||
          'image/png'
      }
    );


  // Upload screenshot to Django
  void (async () => {

    try {

      const uploaded =
        await this.imageService.upload(
          file
        );


      // Insert permanent Django image URL
      this.editor
        .chain()
        .focus()
        .setImage({
          src: uploaded.url
        })
        .run();


      console.log(
        'Screenshot uploaded:',
        uploaded.url
      );

    } catch (error) {

      console.error(
        'Screenshot upload failed:',
        error
      );

    }

  })();


  return true;
}

},


onUpdate: ({ editor }) => {

  const html =
    editor.getHTML();

  this.contentChange.emit(
    html
  );

},

});

constructor() {

  effect(() => {

    const html =
      this.content();


    if (this.editor.isDestroyed) {
      return;
    }


    this.loadContent(
      html
    );

  });

}
  /* =========================================
     LOAD CAPTURED WEB CONTENT
  ========================================= */

  private loadCapturedContent(): void {

    const params =
      this.route.snapshot.queryParamMap;


    const selectedText =
      params.get('text')?.trim() || '';


    const sourceTitle =
      params.get('title')?.trim() || '';


    const sourceUrl =
      params.get('url')?.trim() || '';



    /*
      No extension capture?
      Do nothing.
    */

    if (!selectedText) {
      return;
    }
    


    /*
      Set note title.

      For now we use the webpage title.
    */

    if (sourceTitle) {

      this.titleChange.emit(sourceTitle);

    }


    /*
      Convert selected text into
      Tiptap paragraphs.

      This keeps text safe and avoids
      treating things like <repo>
      as HTML.
    */

  const paragraphs =
  selectedText
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .map((line: string, index: number) => ({

      type: 'paragraph',

      content: [
        {
          type: 'text',
          text: line
        },

        // Source link only beside first line
        ...(index === 0 && sourceUrl
          ? [
              {
                type: 'text',
                text: '  ↗ source',

                marks: [
                  {
                    type: 'sourceRef',

                    attrs: {
                      url: sourceUrl,

                      title:
                        sourceTitle ||
                        sourceUrl
                    }
                  }
                ]
              }
            ]
          : [])

      ]

    }));
    /*
      Add Source information
    */

    if (sourceTitle) {

      paragraphs.push({

        type: 'paragraph',

        content: [
          {
            type: 'text',
            text: `Source: ${sourceTitle}`
          }
        ]

      });

    }


    /*
      Add clickable URL
    */

    if (sourceUrl) {

      paragraphs.push({

        type: 'paragraph',

        content: [
          {
            type: 'text',
            text: 'Original page: '
          },

          {
            type: 'text',

            text: sourceUrl,

            marks: [
              {
                type: 'link',

                attrs: {
                  href: sourceUrl,
                  target: '_blank',
                  rel: 'noopener noreferrer'
                }
              }
            ]
          }
        ]

      } as any);

    }
// paragraphs.push({
//   type: 'paragraph',
//   content: []
// });

    /*
      Put captured content into editor
    */

    this.editor.commands.setContent(
      {
        type: 'doc',
        content: paragraphs
      },
      {
        emitUpdate: false
      }
    );


    /*
      Send new HTML back to parent
      so it can be saved.
    */
    const html =
      this.imageService.normalizeHtml(
        this.editor.getHTML()
      );


    this.contentChange.emit(html);


    console.log(
      '✅ Captured text:',
      selectedText
    );


    console.log(
      '✅ Source:',
      sourceTitle
    );


    console.log(
      '✅ URL:',
      sourceUrl
    );

  }


  /* =========================================
     DESTROY EDITOR
  ========================================= */

  ngOnDestroy(): void {

    this.editor.destroy();

  }


  /* =========================================
     TITLE
  ========================================= */

  onTitleInput(value: string): void {

    this.titleChange.emit(value);

  }


  /* =========================================
     TOOLBAR COMMANDS
  ========================================= */

  cmd(action: string): void {

    const chain =
      this.editor
        .chain()
        .focus();


    switch (action) {

      case 'bold':

        chain
          .toggleBold()
          .run();

        break;


      case 'italic':

        chain
          .toggleItalic()
          .run();

        break;


      case 'underline':

        chain
          .toggleUnderline()
          .run();

        break;


      case 'h1':

        chain
          .toggleHeading({
            level: 1
          })
          .run();

        break;


      case 'h2':

        chain
          .toggleHeading({
            level: 2
          })
          .run();

        break;


      case 'bullet':

        chain
          .toggleBulletList()
          .run();

        break;


      case 'ordered':

        chain
          .toggleOrderedList()
          .run();

        break;


      case 'code':

        chain
          .toggleCodeBlock()
          .run();

        break;


      case 'link':

        this.setLink();

        break;


      case 'table':

        chain
          .insertTable({
            rows: 3,
            cols: 3,
            withHeaderRow: true
          })
          .run();

        break;


      case 'undo':

        chain
          .undo()
          .run();

        break;


      case 'redo':

        chain
          .redo()
          .run();

        break;

    }

  }


  /* =========================================
     ACTIVE TOOLBAR STATE
  ========================================= */

  isActive(
    name: string,
    attrs?: Record<string, unknown>
  ): boolean {

    return this.editor.isActive(
      name,
      attrs
    );

  }


  /* =========================================
     LOAD EXISTING NOTE
  ========================================= */

private loadContent(
  html: string
): void {

  if (this.editor.isDestroyed) {
    return;
  }


  const incoming =
    html || '';


  const current =
    this.editor.getHTML();


  if (current === incoming) {
    return;
  }


  this.editor.commands.setContent(
    incoming,
    {
      emitUpdate: false
    }
  );

}


private setLink(): void {

  const attributes = this.editor.getAttributes('link');

  const previous =
    typeof attributes['href'] === 'string'
      ? attributes['href']
      : 'https://';

  const url = window.prompt(
    'Enter URL',
    previous
  );

  // User clicked Cancel
  if (url === null) {
    return;
  }

  // Empty value = remove link
  if (url.trim() === '') {

    this.editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .run();

    return;
  }

  // Add / update link
  this.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({
      href: url.trim()
    })
    .run();
}


}