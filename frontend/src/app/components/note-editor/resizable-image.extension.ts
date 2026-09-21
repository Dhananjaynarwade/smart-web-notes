import Image from '@tiptap/extension-image';

export const ResizableImage = Image.extend({

  addAttributes() {
    return {
      ...this.parent?.(),

      // =========================
      // WIDTH
      // =========================
      width: {
        default: null,

        parseHTML: element =>
          element.getAttribute('width'),

        renderHTML: attributes => {
          if (!attributes['width']) {
            return {};
          }

          return {
            width: attributes['width']
          };
        }
      },

      // =========================
      // PICTURE STYLE
      // =========================
      pictureStyle: {
        default: 'normal',

        parseHTML: element =>
          element.getAttribute(
            'data-picture-style'
          ) || 'normal',

        renderHTML: attributes => ({
          'data-picture-style':
            attributes['pictureStyle']
        })
      },

      // =========================
      // ALIGNMENT
      // =========================
      align: {
        default: 'left',

        parseHTML: element =>
          element.getAttribute(
            'data-align'
          ) || 'left',

        renderHTML: attributes => ({
          'data-align':
            attributes['align']
        })
      },

      // =========================
      // MANUAL HORIZONTAL POSITION
      // =========================
      x: {
        default: 0,

        parseHTML: element =>
          Number(
            element.getAttribute(
              'data-x'
            ) || 0
          ),

        renderHTML: attributes => ({
          'data-x':
            attributes['x']
        })
      }
    };
  },


  addNodeView() {

    return ({
      node,
      editor,
      getPos
    }) => {

      let currentNode =
        node;

      let currentX =
        Number(
          currentNode.attrs['x'] || 0
        );


      /* =========================
         WRAPPER
      ========================== */

      const wrapper =
        document.createElement('div');

      wrapper.classList.add(
        'resizable-image-wrapper'
      );

      wrapper.contentEditable =
        'false';


      /* =========================
         IMAGE
      ========================== */

      const img =
        document.createElement('img');

      img.draggable =
        false;

      img.style.cursor =
        'grab';


      /* =========================
         RESIZE HANDLE
      ========================== */

      const handle =
        document.createElement('div');

      handle.classList.add(
        'image-resize-handle'
      );


      wrapper.appendChild(img);
      wrapper.appendChild(handle);


      /* =========================
         APPLY SAVED VALUES
      ========================== */

      const applyNodeValues =
        () => {

          img.src =
            currentNode.attrs['src'] || '';

          img.alt =
            currentNode.attrs['alt'] || '';

          img.title =
            currentNode.attrs['title'] || '';


          // WIDTH
          if (
            currentNode.attrs['width']
          ) {

            img.style.width =
              `${currentNode.attrs['width']}px`;

          } else {

            img.style.width =
              '';

          }


          // =========================
          // PICTURE STYLE
          // =========================

          img.classList.remove(
            'picture-normal',
            'picture-border',
            'picture-shadow',
            'picture-rounded',
            'picture-frame'
          );


          const pictureStyle =
            currentNode.attrs[
              'pictureStyle'
            ] || 'normal';


          switch (pictureStyle) {

            case 'border':

              img.classList.add(
                'picture-border'
              );

              break;


            case 'shadow':

              img.classList.add(
                'picture-shadow'
              );

              break;


            case 'rounded':

              img.classList.add(
                'picture-rounded'
              );

              break;


            case 'frame':

              img.classList.add(
                'picture-frame'
              );

              break;


            default:

              img.classList.add(
                'picture-normal'
              );
          }


          // =========================
          // POSITION
          // =========================

          const align =
            currentNode.attrs['align']
            || 'left';


          currentX =
            Number(
              currentNode.attrs['x']
              || 0
            );


          wrapper.style.display =
            'block';

          wrapper.style.width =
            'fit-content';

          wrapper.style.maxWidth =
            '100%';


          if (
            align === 'free'
          ) {

            wrapper.style.marginLeft =
              `${currentX}px`;

            wrapper.style.marginRight =
              '0';

          }

          else if (
            align === 'center'
          ) {

            wrapper.style.marginLeft =
              'auto';

            wrapper.style.marginRight =
              'auto';

          }

          else if (
            align === 'right'
          ) {

            wrapper.style.marginLeft =
              'auto';

            wrapper.style.marginRight =
              '0';

          }

          else {

            wrapper.style.marginLeft =
              '0';

            wrapper.style.marginRight =
              'auto';

          }

        };


      applyNodeValues();


      /* =========================
         SAVE ATTRIBUTES
      ========================== */

      const saveAttributes =
        (
          attributes:
            Record<string, any>
        ) => {

          const position =
            typeof getPos ===
              'function'
              ? getPos()
              : undefined;


          if (
            typeof position !==
            'number'
          ) {
            return;
          }


          editor.view.dispatch(

            editor.state.tr
              .setNodeMarkup(
                position,
                undefined,
                {
                  ...currentNode.attrs,
                  ...attributes
                }
              )

          );

        };


      /* =====================================================
         MOUSE MOVE
         LEFT / RIGHT + UP / DOWN
      ===================================================== */

      let moving =
        false;

      let moveStartMouseX =
        0;

      let moveStartMouseY =
        0;

      let moveStartImageX =
        0;

      let verticalChange =
        0;


      const onImageMove =
        (
          event:
            MouseEvent
        ) => {

          if (!moving) {
            return;
          }


          /* -------------------------
             LEFT / RIGHT
          -------------------------- */

          const changeX =
            event.clientX -
            moveStartMouseX;


          let newX =
            moveStartImageX +
            changeX;


          const editorRect =
            editor.view.dom
              .getBoundingClientRect();


          const imageRect =
            img
              .getBoundingClientRect();


          newX =
            Math.max(
              0,
              newX
            );


          const maxX =
            Math.max(
              0,
              editorRect.width -
              imageRect.width
            );


          newX =
            Math.min(
              newX,
              maxX
            );


          currentX =
            newX;


          wrapper.style.marginLeft =
            `${currentX}px`;

          wrapper.style.marginRight =
            '0';


          /* -------------------------
             UP / DOWN PREVIEW
          -------------------------- */

          verticalChange =
            event.clientY -
            moveStartMouseY;


          wrapper.style.transform =
            `translateY(${verticalChange}px)`;

        };


      const onImageMoveEnd =
        (
          event:
            MouseEvent
        ) => {

          if (!moving) {
            return;
          }


          moving =
            false;


          img.style.cursor =
            'grab';


          document.removeEventListener(
            'mousemove',
            onImageMove
          );


          document.removeEventListener(
            'mouseup',
            onImageMoveEnd
          );


          // Temporary preview must disappear
          wrapper.style.transform =
            '';


          const oldPosition =
            typeof getPos ===
              'function'
              ? getPos()
              : undefined;


          if (
            typeof oldPosition !==
            'number'
          ) {
            return;
          }


          // =========================
          // ONLY HORIZONTAL MOVEMENT
          // =========================

          if (
            Math.abs(
              verticalChange
            ) < 20
          ) {

            saveAttributes({

              align:
                'free',

              x:
                Math.round(
                  currentX
                )

            });

            return;
          }


          // =========================
          // FIND DROP POSITION
          // =========================

          const drop =
            editor.view.posAtCoords({

              left:
                event.clientX,

              top:
                event.clientY

            });


          if (!drop) {

            saveAttributes({
              align:
                'free',

              x:
                Math.round(
                  currentX
                )
            });

            return;
          }


          const state =
            editor.state;


          const imageNode =
            state.doc.nodeAt(
              oldPosition
            );


          if (
            !imageNode ||
            imageNode.type.name !==
              'image'
          ) {
            return;
          }


          const resolved =
            state.doc.resolve(
              drop.pos
            );


          let targetPosition =
            drop.pos;


          // =================================
          // FIND TOP-LEVEL BLOCK
          // =================================

          if (
            resolved.depth >= 1
          ) {

            const blockStart =
              resolved.before(1);

            const blockEnd =
              resolved.after(1);


            targetPosition =
              blockStart;


            const blockDom =
              editor.view.nodeDOM(
                blockStart
              );


            if (
              blockDom instanceof
              HTMLElement
            ) {

              const rect =
                blockDom
                  .getBoundingClientRect();


              const middle =
                rect.top +
                rect.height / 2;


              if (
                event.clientY >
                middle
              ) {

                targetPosition =
                  blockEnd;

              }

            }

          }


          const nodeSize =
            imageNode.nodeSize;


          // Same position
          if (
            targetPosition >=
              oldPosition &&

            targetPosition <=
              oldPosition +
              nodeSize
          ) {

            saveAttributes({
              align:
                'free',

              x:
                Math.round(
                  currentX
                )
            });

            return;
          }


          // Create same image
          // with updated horizontal position
          const movedImage =
            imageNode.type.create(

              {
                ...imageNode.attrs,

                align:
                  'free',

                x:
                  Math.round(
                    currentX
                  )
              },

              imageNode.content,

              imageNode.marks

            );


          let tr =
            state.tr;


          // Remove old image
          tr =
            tr.delete(
              oldPosition,
              oldPosition +
              nodeSize
            );


          // Adjust position because
          // document became shorter
          if (
            targetPosition >
            oldPosition
          ) {

            targetPosition -=
              nodeSize;

          }


          targetPosition =
            Math.max(

              0,

              Math.min(

                targetPosition,

                tr.doc.content.size

              )

            );


          try {

            tr =
              tr.insert(
                targetPosition,
                movedImage
              );


            editor.view.dispatch(
              tr
            );


            editor.commands
              .setNodeSelection(
                targetPosition
              );


            editor.commands
              .focus();

          }

          catch {

            // Invalid drop location:
            // keep original position
            saveAttributes({

              align:
                'free',

              x:
                Math.round(
                  currentX
                )

            });

          }

        };


      /* =========================
         START MOVING
      ========================== */

      img.addEventListener(
        'mousedown',

        event => {

          if (
            event.button !== 0
          ) {
            return;
          }


          event.preventDefault();
          event.stopPropagation();


          const position =
            typeof getPos ===
              'function'
              ? getPos()
              : undefined;


          if (
            typeof position ===
              'number'
          ) {

            editor.commands
              .setNodeSelection(
                position
              );

          }


          moving =
            true;


          verticalChange =
            0;


          img.style.cursor =
            'grabbing';


          moveStartMouseX =
            event.clientX;


          moveStartMouseY =
            event.clientY;


          const editorRect =
            editor.view.dom
              .getBoundingClientRect();


          const imageRect =
            wrapper
              .getBoundingClientRect();


          // Start from actual
          // current visual position
          moveStartImageX =
            imageRect.left -
            editorRect.left;


          currentX =
            moveStartImageX;


          document.addEventListener(
            'mousemove',
            onImageMove
          );


          document.addEventListener(
            'mouseup',
            onImageMoveEnd
          );

        }
      );


      /* =====================================================
         IMAGE RESIZE
      ===================================================== */

      let resizing =
        false;

      let resizeStartX =
        0;

      let resizeStartWidth =
        0;


      const onResizeMove =
        (
          event:
            MouseEvent
        ) => {

          if (!resizing) {
            return;
          }


          const difference =
            event.clientX -
            resizeStartX;


          const newWidth =
            Math.max(
              200,
              resizeStartWidth +
              difference
            );


          img.style.width =
            `${newWidth}px`;

        };


      const onResizeEnd =
        () => {

          if (!resizing) {
            return;
          }


          resizing =
            false;


          document.removeEventListener(
            'mousemove',
            onResizeMove
          );


          document.removeEventListener(
            'mouseup',
            onResizeEnd
          );


          const width =
            Math.round(

              img
                .getBoundingClientRect()
                .width

            );


          saveAttributes({
            width
          });

        };


      handle.addEventListener(
        'mousedown',

        event => {

          if (
            event.button !== 0
          ) {
            return;
          }


          event.preventDefault();
          event.stopPropagation();


          resizing =
            true;


          resizeStartX =
            event.clientX;


          resizeStartWidth =
            img
              .getBoundingClientRect()
              .width;


          document.addEventListener(
            'mousemove',
            onResizeMove
          );


          document.addEventListener(
            'mouseup',
            onResizeEnd
          );

        }
      );


      /* =====================================================
         NODE VIEW
      ===================================================== */

      return {

        dom:
          wrapper,


        selectNode() {

          wrapper.classList.add(
            'image-selected'
          );

        },


        deselectNode() {

          wrapper.classList.remove(
            'image-selected'
          );

        },


        update(
          updatedNode
        ) {

          if (
            updatedNode.type !==
            currentNode.type
          ) {
            return false;
          }


          currentNode =
            updatedNode;


          applyNodeValues();


          return true;
        },


        destroy() {

          document.removeEventListener(
            'mousemove',
            onImageMove
          );


          document.removeEventListener(
            'mouseup',
            onImageMoveEnd
          );


          document.removeEventListener(
            'mousemove',
            onResizeMove
          );


          document.removeEventListener(
            'mouseup',
            onResizeEnd
          );

        }

      };

    };

  }

});