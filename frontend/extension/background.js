// ==========================================
// SMART WEB NOTES - BACKGROUND
// ==========================================

const SMART_NOTES_PRODUCTION =
  "https://smart-web-notes.onrender.com";

const SMART_NOTES_LOCAL =
  "http://localhost:4200";


// ==========================================
// CREATE RIGHT-CLICK MENU
// ==========================================

chrome.runtime.onInstalled.addListener(() => {

  chrome.contextMenus.removeAll(() => {

    // Parent
    chrome.contextMenus.create({
      id: "smart-web-notes",
      title: "📒 Smart Web Notes",
      contexts: ["selection"]
    });


    // Title
    chrome.contextMenus.create({
      id: "add-as-title",
      parentId: "smart-web-notes",
      title: "🏷 Add as Title",
      contexts: ["selection"]
    });


    // Heading
    chrome.contextMenus.create({
      id: "add-as-heading",
      parentId: "smart-web-notes",
      title: "H Add as Heading",
      contexts: ["selection"]
    });


    // Normal text
    chrome.contextMenus.create({
      id: "paste-normal-text",
      parentId: "smart-web-notes",
      title: "📄 Paste as Normal Text",
      contexts: ["selection"]
    });

  });

});


// ==========================================
// FIND SMART WEB NOTES TAB
// ==========================================

async function findSmartNotesTab() {

  const tabs =
    await chrome.tabs.query({});


  // First prefer production
  let noteTab =
    tabs.find(tab =>
      tab.url?.startsWith(
        SMART_NOTES_PRODUCTION
      )
    );


  // Local development fallback
  if (!noteTab) {

    noteTab =
      tabs.find(tab =>
        tab.url?.startsWith(
          SMART_NOTES_LOCAL
        )
      );

  }


  return noteTab;
}


// ==========================================
// STORE CAPTURE SAFELY
// ==========================================

async function storePendingCapture(
  capture
) {

  await chrome.storage.local.set({

    pendingCapture: {
      ...capture,

      captureId:
        crypto.randomUUID(),

      createdAt:
        Date.now()
    }

  });

}


// ==========================================
// OPEN / FOCUS SMART WEB NOTES
// ==========================================

async function openSmartNotes() {

  let noteTab =
    await findSmartNotesTab();


  if (noteTab?.id) {

    await chrome.tabs.update(
      noteTab.id,
      {
        active: true
      }
    );


    if (noteTab.windowId) {

      await chrome.windows.update(
        noteTab.windowId,
        {
          focused: true
        }
      );

    }


    return noteTab;

  }


  // No Smart Web Notes tab open.
  // Open production automatically.

  noteTab =
    await chrome.tabs.create({

      url:
        `${SMART_NOTES_PRODUCTION}/notes/new`

    });


  return noteTab;
}


// ==========================================
// SEND CAPTURE TO ANGULAR
// ==========================================

async function sendCaptureToTab(
  tabId,
  capture
) {

  try {

    await chrome.scripting.executeScript({

      target: {
        tabId
      },

      world: "MAIN",

      func: (data) => {

        window.postMessage(
          {
            source:
              "smart-web-notes-extension",

            type:
              "ADD_TO_MY_NOTES",

            capture:
              data
          },

          window.location.origin
        );

      },

      args: [
        capture
      ]

    });


    return true;

  } catch (error) {

    console.log(
      "Smart Web Notes is not ready yet:",
      error
    );


    return false;

  }

}


// ==========================================
// SAVE + OPEN + SEND
// ==========================================

async function sendToSmartNotes(
  capture
) {

  // IMPORTANT:
  // Save capture first.
  // It will survive while Render wakes.

  await storePendingCapture(
    capture
  );


  const noteTab =
    await openSmartNotes();


  if (!noteTab?.id) {

    return false;

  }


  // Give Angular/Render time to load.
  setTimeout(
    async () => {

      const result =
        await chrome.storage.local.get(
          "pendingCapture"
        );


      const pending =
        result.pendingCapture;


      if (!pending) {
        return;
      }


      await sendCaptureToTab(
        noteTab.id,
        pending
      );

    },

    2000
  );


  return true;
}


// ==========================================
// RIGHT-CLICK ACTION
// ==========================================

chrome.contextMenus.onClicked.addListener(
  async (
    info,
    sourceTab
  ) => {

    const acceptedMenus = [

      "add-as-title",

      "add-as-heading",

      "paste-normal-text"

    ];


    if (
      !acceptedMenus.includes(
        info.menuItemId
      )
    ) {

      return;

    }


//  this for entrile text as paste as as iot is 
let selectedText = '';

if (sourceTab?.id) {

  try {

    const results =
      await chrome.scripting.executeScript({

        target: {
          tabId: sourceTab.id
        },

        func: () => {

          const selection =
            window.getSelection();

          if (
            !selection ||
            selection.rangeCount === 0
          ) {
            return '';
          }

          const range =
            selection.getRangeAt(0);

          const fragment =
            range.cloneContents();

          const container =
            document.createElement('div');

          container.appendChild(
            fragment
          );


          // Preserve real webpage line breaks
          container
            .querySelectorAll(
              'br'
            )
            .forEach(br => {
              br.replaceWith('\n');
            });


          // Preserve block elements
          container
            .querySelectorAll(
              'p, div, li, h1, h2, h3, h4, h5, h6, pre, blockquote'
            )
            .forEach(element => {

              element.insertAdjacentText(
                'afterend',
                '\n'
              );

            });


          return (
            container.innerText ||
            container.textContent ||
            ''
          )
            .replace(
              /\n{3,}/g,
              '\n\n'
            )
            .trim();

        }

      });


    selectedText =
      results?.[0]?.result?.trim() ||
      '';

  } catch (error) {

    console.error(
      'Could not read selected text:',
      error
    );

  }

}


// Fallback
if (!selectedText) {

  selectedText =
    info.selectionText?.trim() ||
    '';

}


if (!selectedText) {
  return;
}

    let target =
      "plain";


    if (
      info.menuItemId ===
      "add-as-title"
    ) {

      target =
        "title";

    }


    if (
      info.menuItemId ===
      "add-as-heading"
    ) {

      target =
        "heading";

    }


    const capture = {

      text:
        selectedText,

      sourceTitle:
        sourceTab?.title ||
        "",

      sourceUrl:
        sourceTab?.url ||
        "",

      target

    };


    console.log(
      "Smart Web Notes capture:",
      capture
    );


    await sendToSmartNotes(
      capture
    );

  }
);


// ==========================================
// FLOATING BUTTON MESSAGE
// ==========================================

chrome.runtime.onMessage.addListener(
  (
    message,
    _sender,
    sendResponse
  ) => {

    if (
      message?.type !==
      "ADD_SELECTION_TO_NOTES"
    ) {

      return;

    }


    void (
      async () => {

        const success =
          await sendToSmartNotes(
            message.capture
          );


        sendResponse({
          ok:
            success
        });

      }
    )();


    return true;

  }
);