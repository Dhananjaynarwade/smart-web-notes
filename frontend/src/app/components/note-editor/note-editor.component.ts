import {
  Component,
  effect,
  HostListener,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  Editor,
  Extension,
  Mark,
  mergeAttributes
} from '@tiptap/core';

import { ResizableImage } from './resizable-image.extension';

import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';

import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';

import { TiptapEditorDirective } from 'ngx-tiptap';

import { ImageService } from '../../services/image.service';
import {
  inject
} from '@angular/core';

/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

const EditorShortcuts = Extension.create({

  name: 'editorShortcuts',

  addKeyboardShortcuts() {
    return {

      // Ctrl + Z
      'Mod-z': () => {
        return this.editor.commands.undo();
      },

      // Ctrl + Y
      'Mod-y': () => {
        return this.editor.commands.redo();
      },

      // Ctrl + Shift + Z
      'Mod-Shift-z': () => {
        return this.editor.commands.redo();
      },

      // Ctrl + U
      'Mod-u': () => {
        return this.editor.commands.toggleUnderline();
      },

      // Delete selected image
      'Delete': () => {

        if (!this.editor.isActive('image')) {
          return false;
        }

        return this.editor.commands.deleteSelection();
      },

      // Backspace selected image
      'Backspace': () => {

        if (!this.editor.isActive('image')) {
          return false;
        }

        return this.editor.commands.deleteSelection();
      }

    };
  }

});


/* =========================================================
   SOURCE LINK MARK
========================================================= */

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

          'data-source-ref': 'true',

          'data-source-title':
            sourceTitle,

          title:
            sourceTitle
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

  templateUrl:
    './note-editor.component.html',

  styleUrl:
    './note-editor.component.scss',

})
export class NoteEditorComponent
  implements OnDestroy {

  /* =========================================================
     UPLOAD IMAGE FROM LAPTOP / PHONE
  ========================================================= */

  uploadImage(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];


    if (!file) {
      return;
    }


    if (
      !file.type.startsWith('image/')
    ) {

      alert(
        'Please select an image.'
      );

      input.value = '';

      return;
    }


    const position =
      this.lastCursorPosition ??
      this.editor.state.selection.from;


    void (async () => {

      try {

        this.uploading.set(
          true
        );


        const uploaded =
          await this
            .imageService
            .upload(
              file
            );


        const maxPosition =
          this.editor
            .state
            .doc
            .content
            .size;


        const insertPosition =
          Math.min(
            position,
            maxPosition
          );


        this.editor
          .chain()
          .insertContentAt(

            insertPosition,

            [
              {
                type:
                  'image',

                attrs: {
                  src:
                    uploaded.url
                }
              },

              {
                type:
                  'paragraph',

                content:
                  []
              }
            ],

            {
              updateSelection:
                true
            }

          )
          .focus()
          .run();


        this.lastCursorPosition =
          this.editor
            .state
            .selection
            .from;


        console.log(
          'Image uploaded:',
          uploaded.url
        );


      } catch (error) {

        console.error(
          'Image upload failed:',
          error
        );

        alert(
          'Image upload failed.'
        );


      } finally {

        this.uploading.set(
          false
        );

        input.value = '';

      }

    })();

  }


  /* =========================================================
     CURSOR + IMAGE SELECTION
  ========================================================= */

  private lastCursorPosition:
    number | null = null;

  private selectedImagePosition:
    number | null = null;

  readonly imageSelected =
    signal(false);


  /* =========================================================
     SERVICES
  ========================================================= */

  private readonly imageService =
    inject(ImageService);

  private readonly route =
    inject(ActivatedRoute);


  /* =========================================================
     INPUT / OUTPUT
  ========================================================= */

  title =
    input('');

  content =
    input('');

  titleChange =
    output<string>();

  contentChange =
    output<string>();


  readonly uploading =
    signal(false);


  /* =========================================================
     EXTENSION MESSAGE
  ========================================================= */

  @HostListener(
    'window:message',
    ['$event']
  )

  onExtensionMessage(
    event: MessageEvent
  ): void {

    // Accept messages only
    // from our Angular page
    if (
      event.origin !==
      window.location.origin
    ) {
      return;
    }

    const data =
      event.data;

    if (
      data?.source !==
        'smart-web-notes-extension' ||

      data?.type !==
        'ADD_TO_MY_NOTES'
    ) {
      return;
    }


    const selectedText =
      data.capture?.text?.trim() || '';

    const sourceTitle =
      data.capture?.sourceTitle?.trim()
      || '';

    const sourceUrl =
      data.capture?.sourceUrl?.trim()
      || '';

    const target =
      data.capture?.target ||
      'body';


    if (!selectedText) {
      return;
    }


    /* =====================================================
       PASTE AS NORMAL TEXT
    ===================================================== */

    if (target === 'plain') {

      const normalLines =
        selectedText
          .split(/\r?\n| {2,}/)
          .map(
            (line: string) =>
              line.trim()
          )
          .filter(
            (line: string) =>
              line.length > 0
          );


      const normalParagraphs:
        any[] =
        normalLines.map(
          (
            line: string,
            index: number
          ) => ({

            type:
              'paragraph',

            content: [

              {
                type:
                  'text',

                text:
                  line
              },

              ...(index === 0 &&
              sourceUrl

                ? [

                    {
                      type:
                        'text',

                      text:
                        '  '
                    },

                    {
                      type:
                        'text',

                      text:
                        '↗ source',

                      marks: [
                        {
                          type:
                            'sourceRef',

                          attrs: {

                            url:
                              sourceUrl,

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


      // Blank paragraph after
      normalParagraphs.push({
        type:
          'paragraph',

        content:
          []
      });


      const maxPosition =
        this.editor
          .state
          .doc
          .content
          .size;


      const position =
        this.lastCursorPosition !== null

          ? Math.min(
              this.lastCursorPosition,
              maxPosition
            )

          : maxPosition;


      this.editor
        .chain()
        .insertContentAt(
          position,
          normalParagraphs
        )
        .focus()
        .unsetAllMarks()
        .run();


      this.lastCursorPosition =
        this.editor
          .state
          .selection
          .from;


      return;
    }


    /* =====================================================
       ADD AS NOTE TITLE
    ===================================================== */

    if (target === 'title') {

      this.titleChange.emit(
        selectedText
      );

      console.log(
        '✅ Added to Note Title:',
        selectedText
      );

      return;
    }


    /* =====================================================
       ADD TO NOTE
    ===================================================== */

    const cleanLines =
      selectedText
        .split(/\r?\n/)
        .map(
          (line: string) =>
            line.trim()
        )
        .filter(
          (line: string) =>
            line.length > 0
        );


    if (
      cleanLines.length === 0
    ) {
      return;
    }


    const paragraphs:
      any[] =
      cleanLines.map(
        (
          line: string,
          index: number
        ) => ({

          type:
            'paragraph',

          content: [

            {
              type:
                'text',

              text:
                line,

              marks:
                index === 0

                  ? [
                      {
                        type:
                          'bold'
                      }
                    ]

                  : []
            },


            ...(index === 0 &&
            sourceUrl

              ? [

                  {
                    type:
                      'text',

                    text:
                      '  ↗ source',

                    marks: [
                      {
                        type:
                          'sourceRef',

                        attrs: {

                          url:
                            sourceUrl,

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


    // Blank paragraph after
    paragraphs.push({

      type:
        'paragraph',

      content:
        []

    });


    const maxPosition =
      this.editor
        .state
        .doc
        .content
        .size;


    const position =
      this.lastCursorPosition !== null

        ? Math.min(
            this.lastCursorPosition,
            maxPosition
          )

        : maxPosition;


    this.editor
      .chain()
      .insertContentAt(
        position,
        paragraphs
      )
      .focus()
      .run();


    this.lastCursorPosition =
      this.editor
        .state
        .selection
        .from;


    console.log(
      '✅ Added captured text:',
      selectedText
    );

    console.log(
      '🔗 Source URL:',
      sourceUrl
    );

  }


  /* =========================================================
     TIPTAP EDITOR
  ========================================================= */

  readonly editor =
    new Editor({

      extensions: [

        StarterKit.configure({

          heading: {
            levels: [
              1,
              2,
              3
            ]
          },

          link:
            false,

          underline:
            false

        }),


        Underline,

        EditorShortcuts,

        SourceRef,


        Link.configure({

          openOnClick:
            false,

          autolink:
            true,

          linkOnPaste:
            true,

        }),


        ResizableImage.configure({

          inline:
            false,

          allowBase64:
            false

        }),


        Table.configure({

          resizable:
            true

        }),


        TableRow,

        TableHeader,

        TableCell,


        Placeholder.configure({

          placeholder:
            'Start writing, or paste text / screenshot (Ctrl+V)...',

        }),

      ],


      /* =====================================================
         PASTE IMAGE
      ===================================================== */

      editorProps: {

        handlePaste:
          (_view, event) => {

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
                  item.type.startsWith(
                    'image/'
                  )
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


            event.preventDefault();


            const file =
              new File(

                [
                  pastedFile
                ],

                `screenshot-${Date.now()}.png`,

                {
                  type:
                    pastedFile.type ||
                    'image/png'
                }

              );


            // Save exact cursor
            // before async upload
            const imageInsertPosition =
              _view
                .state
                .selection
                .from;


            void (async () => {

              try {

                this.uploading.set(
                  true
                );


                const uploaded =
                  await this
                    .imageService
                    .upload(
                      file
                    );


                this.editor
                  .chain()
                  .insertContentAt(

                    imageInsertPosition,

                    [

                      {
                        type:
                          'image',

                        attrs: {
                          src:
                            uploaded.url
                        }
                      },

                      {
                        type:
                          'paragraph',

                        content:
                          []
                      }

                    ],

                    {
                      updateSelection:
                        true
                    }

                  )
                  .focus()
                  .run();


                this.lastCursorPosition =
                  this.editor
                    .state
                    .selection
                    .from;


                console.log(
                  'Screenshot uploaded:',
                  uploaded.url
                );

              } catch (error) {

                console.error(
                  'Screenshot upload failed:',
                  error
                );

              } finally {

                this.uploading.set(
                  false
                );

              }

            })();


            return true;
          }

      },


      /* =====================================================
         REMEMBER CURSOR + SELECTED IMAGE
      ===================================================== */

      onSelectionUpdate:
        ({ editor }) => {

          this.lastCursorPosition =
            editor
              .state
              .selection
              .from;


          const position =
            editor
              .state
              .selection
              .from;


          const node =
            editor
              .state
              .doc
              .nodeAt(
                position
              );


          if (
            node &&
            node.type.name ===
              'image'
          ) {

            this.selectedImagePosition =
              position;

            this.imageSelected.set(
              true
            );

          } else {

            this.selectedImagePosition =
              null;

            this.imageSelected.set(
              false
            );

          }

        },


      /* =====================================================
         CONTENT UPDATE
      ===================================================== */

      onUpdate:
        ({ editor }) => {

          const html =
            editor.getHTML();

          this.contentChange.emit(
            html
          );

        },

    });


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor() {

    effect(() => {

      const html =
        this.content();


      if (
        this.editor.isDestroyed
      ) {
        return;
      }


      this.loadContent(
        html
      );

    });

  }


  /* =========================================================
     TITLE
  ========================================================= */

  onTitleInput(
    value: string
  ): void {

    this.titleChange.emit(
      value
    );

  }


  /* =========================================================
     IMAGE ALIGNMENT
  ========================================================= */

  setImageAlign(
    align:
      'left' |
      'center' |
      'right'
  ): void {

    const position =
      this.selectedImagePosition;


    if (
      position === null
    ) {
      return;
    }


    const node =
      this.editor
        .state
        .doc
        .nodeAt(
          position
        );


    if (
      !node ||
      node.type.name !==
        'image'
    ) {
      return;
    }


    const transaction =
      this.editor
        .state
        .tr
        .setNodeMarkup(

          position,

          undefined,

          {
            ...node.attrs,
            align
          }

        );


    this.editor
      .view
      .dispatch(
        transaction
      );


    // Keep image selected
    this.editor
      .commands
      .setNodeSelection(
        position
      );


    this.selectedImagePosition =
      position;

    this.imageSelected.set(
      true
    );

  }


  isImageAlign(
    align: string
  ): boolean {

    const position =
      this.selectedImagePosition;


    if (
      position === null
    ) {
      return false;
    }


    const node =
      this.editor
        .state
        .doc
        .nodeAt(
          position
        );


    if (
      !node ||
      node.type.name !==
        'image'
    ) {
      return false;
    }


    return (
      node.attrs['align'] ||
      'left'
    ) === align;

  }


  /* =========================================================
     PICTURE STYLES
  ========================================================= */

  setPictureStyle(
    style:
      | 'normal'
      | 'border'
      | 'shadow'
      | 'rounded'
      | 'frame'
  ): void {

    const position =
      this.selectedImagePosition;


    if (
      position === null
    ) {
      return;
    }


    const node =
      this.editor
        .state
        .doc
        .nodeAt(
          position
        );


    if (
      !node ||
      node.type.name !==
        'image'
    ) {
      return;
    }


    const transaction =
      this.editor
        .state
        .tr
        .setNodeMarkup(

          position,

          undefined,

          {
            ...node.attrs,

            pictureStyle:
              style
          }

        );


    this.editor
      .view
      .dispatch(
        transaction
      );


    // Keep image selected
    this.editor
      .commands
      .setNodeSelection(
        position
      );


    this.selectedImagePosition =
      position;

    this.imageSelected.set(
      true
    );

  }


  isPictureStyle(
    style: string
  ): boolean {

    const position =
      this.selectedImagePosition;


    if (
      position === null
    ) {
      return false;
    }


    const node =
      this.editor
        .state
        .doc
        .nodeAt(
          position
        );


    if (
      !node ||
      node.type.name !==
        'image'
    ) {
      return false;
    }


    return (
      node.attrs['pictureStyle'] ||
      'normal'
    ) === style;

  }


  /* =========================================================
     TOOLBAR COMMANDS
  ========================================================= */

  cmd(
    action: string
  ): void {

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
            level:
              1
          })
          .run();

        break;


      case 'h2':

        chain
          .toggleHeading({
            level:
              2
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

            rows:
              3,

            cols:
              3,

            withHeaderRow:
              true

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


  /* =========================================================
     ACTIVE TOOLBAR STATE
  ========================================================= */

  isActive(
    name: string,
    attrs?: Record<
      string,
      unknown
    >
  ): boolean {

    return this.editor
      .isActive(
        name,
        attrs
      );

  }


  /* =========================================================
     LOAD EXISTING NOTE
  ========================================================= */

  private loadContent(
    html: string
  ): void {

    if (
      this.editor.isDestroyed
    ) {
      return;
    }


    const incoming =
      html || '';


    const current =
      this.editor
        .getHTML();


    if (
      current === incoming
    ) {
      return;
    }


    this.editor
      .commands
      .setContent(
        incoming,
        {
          emitUpdate:
            false
        }
      );

  }


  /* =========================================================
     LOAD CAPTURED WEB CONTENT
     Existing route-based support
  ========================================================= */

  private loadCapturedContent():
    void {

    const params =
      this.route
        .snapshot
        .queryParamMap;


    const selectedText =
      params
        .get('text')
        ?.trim() || '';


    const sourceTitle =
      params
        .get('title')
        ?.trim() || '';


    const sourceUrl =
      params
        .get('url')
        ?.trim() || '';


    if (!selectedText) {
      return;
    }


    if (sourceTitle) {

      this.titleChange.emit(
        sourceTitle
      );

    }


    const paragraphs:
      any[] =
      selectedText
        .split(/\r?\n/)
        .map(
          (line: string) =>
            line.trim()
        )
        .filter(
          (line: string) =>
            line.length > 0
        )
        .map(
          (
            line: string,
            index: number
          ) => ({

            type:
              'paragraph',

            content: [

              {
                type:
                  'text',

                text:
                  line
              },

              ...(index === 0 &&
              sourceUrl

                ? [

                    {
                      type:
                        'text',

                      text:
                        '  ↗ source',

                      marks: [

                        {
                          type:
                            'sourceRef',

                          attrs: {

                            url:
                              sourceUrl,

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


    if (sourceTitle) {

      paragraphs.push({

        type:
          'paragraph',

        content: [

          {
            type:
              'text',

            text:
              `Source: ${sourceTitle}`
          }

        ]

      });

    }


    if (sourceUrl) {

      paragraphs.push({

        type:
          'paragraph',

        content: [

          {
            type:
              'text',

            text:
              'Original page: '
          },

          {
            type:
              'text',

            text:
              sourceUrl,

            marks: [

              {
                type:
                  'link',

                attrs: {

                  href:
                    sourceUrl,

                  target:
                    '_blank',

                  rel:
                    'noopener noreferrer'

                }

              }

            ]

          }

        ]

      });

    }


    this.editor
      .commands
      .setContent(

        {
          type:
            'doc',

          content:
            paragraphs
        },

        {
          emitUpdate:
            false
        }

      );


    const html =
      this.imageService
        .normalizeHtml(
          this.editor.getHTML()
        );


    this.contentChange.emit(
      html
    );

  }


  /* =========================================================
     LINK
  ========================================================= */

  private setLink():
    void {

    const attributes =
      this.editor
        .getAttributes(
          'link'
        );


    const previous =
      typeof attributes['href']
        === 'string'

        ? attributes['href']

        : 'https://';


    const url =
      window.prompt(
        'Enter URL',
        previous
      );


    // Cancel
    if (
      url === null
    ) {
      return;
    }


    // Empty = remove link
    if (
      url.trim() === ''
    ) {

      this.editor
        .chain()
        .focus()
        .extendMarkRange(
          'link'
        )
        .unsetLink()
        .run();

      return;
    }


    this.editor
      .chain()
      .focus()
      .extendMarkRange(
        'link'
      )
      .setLink({
        href:
          url.trim()
      })
      .run();

  }


  /* =========================================================
     DESTROY
  ========================================================= */

  ngOnDestroy():
    void {

    this.editor.destroy();

  }

}