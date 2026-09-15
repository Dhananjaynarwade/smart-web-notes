// ==========================================
// SMART WEB NOTES - FLOATING CAPTURE MENU
// ==========================================

let captureMenu = null;
let selectedText = '';
let selectedLines = [];


// ==========================================
// DETECT TEXT SELECTION
// ==========================================

document.addEventListener('mouseup', () => {

  setTimeout(() => {

    const selection = window.getSelection();

    const text =
      selection?.toString().trim() || '';

    if (!text) {
      removeCaptureMenu();
      return;
    }

    if (selection.rangeCount === 0) {
      return;
    }

    // Save ONLY what user selected
    selectedText = text;
    selectedLines =
  text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

    const range =
      selection.getRangeAt(0);
      

    const rect =
      range.getBoundingClientRect();

    showCaptureMenu(rect);

  }, 10);

});


// ==========================================
// SHOW FLOATING MENU
// ==========================================

function showCaptureMenu(rect) {

  removeCaptureMenu();

  captureMenu =
    document.createElement('div');

  captureMenu.style.position = 'absolute';

  captureMenu.style.left =
    `${window.scrollX + rect.right + 8}px`;

  captureMenu.style.top =
    `${window.scrollY + rect.bottom + 8}px`;

  captureMenu.style.zIndex =
    '2147483647';

  captureMenu.style.display =
    'flex';

  captureMenu.style.gap =
    '5px';

  captureMenu.style.padding =
    '5px';

  captureMenu.style.background =
    '#ffffff';

  captureMenu.style.border =
    '1px solid #dbe3ee';

  captureMenu.style.borderRadius =
    '10px';

  captureMenu.style.boxShadow =
    '0 5px 18px rgba(0,0,0,0.18)';


  // ========================================
  // ADD TO NOTE
  // ========================================

  const noteButton =
    document.createElement('button');

  noteButton.textContent =
    '➕ Add to Note';

  stylePrimaryButton(noteButton);

  noteButton.addEventListener(
    'mousedown',
    (event) => {
      event.preventDefault();
    }
  );

  noteButton.addEventListener(
    'click',
    () => {

      sendCapture(
        'body',
        noteButton
        
       
      );
      

    }
  );


  // ========================================
  // ADD AS TITLE
  // ========================================

  const titleButton =
  document.createElement('button');

titleButton.textContent =
  'Title';

styleSecondaryButton(titleButton);

titleButton.addEventListener(
  'mousedown',
  (event) => {
    event.preventDefault();
  }
);

titleButton.addEventListener(
  'click',
  () => {

    sendCapture(
      'title',
      titleButton
    );

  }
);

// ==========================================
// SEND SELECTED TEXT
// ==========================================

function sendCapture(
  target,
  button
) {

  if (!selectedText) {
    return;
  }

  chrome.runtime.sendMessage(
    {

      type:
        'ADD_SELECTION_TO_NOTES',

      capture: {

        text:
          selectedText,

        sourceTitle:
          document.title,

        sourceUrl:
          window.location.href,

        // "body" or "title"
        target:
          target

      }

    },

    (response) => {

      if (response?.ok) {

        button.textContent =
          target === 'title'
            ? '✓ Title Added'
            : '✓ Added';

        setTimeout(
          removeCaptureMenu,
          700
        );

      } else {

        button.textContent =
          'Open Smart Web Notes';

      }

    }
  );

}


// ==========================================
// PRIMARY BUTTON STYLE
// ==========================================

function stylePrimaryButton(button) {

  button.style.border =
    'none';

  button.style.borderRadius =
    '7px';

  button.style.padding =
    '7px 11px';

  button.style.background =
    '#2563eb';

  button.style.color =
    '#ffffff';

  button.style.fontSize =
    '12px';

  button.style.fontWeight =
    '600';

  button.style.cursor =
    'pointer';

}


// ==========================================
// SECONDARY BUTTON STYLE
// ==========================================

function styleSecondaryButton(button) {

  button.style.border =
    '1px solid #d1d5db';

  button.style.borderRadius =
    '7px';

  button.style.padding =
    '7px 10px';

  button.style.background =
    '#ffffff';

  button.style.color =
    '#334155';

  button.style.fontSize =
    '12px';

  button.style.fontWeight =
    '600';

  button.style.cursor =
    'pointer';

}


// ==========================================
// REMOVE FLOATING MENU
// ==========================================

function removeCaptureMenu() {

  if (captureMenu) {

    captureMenu.remove();

    captureMenu = null;

  }

}
}