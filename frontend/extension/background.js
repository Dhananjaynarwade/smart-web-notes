// ==========================================
// SMART WEB NOTES - BACKGROUND
// ==========================================


// ==========================================
// CREATE RIGHT-CLICK MENU
// ==========================================

chrome.runtime.onInstalled.addListener(() => {

  chrome.contextMenus.removeAll(() => {

    // Parent menu
    chrome.contextMenus.create({
      id: "smart-web-notes",
      title: "📒 Smart Web Notes",
      contexts: ["selection"]
    });

    // Add to note title
    chrome.contextMenus.create({
      id: "add-as-title",
      parentId: "smart-web-notes",
      title: "🏷 Add as Title",
      contexts: ["selection"]
    });
    // Add to note body
    chrome.contextMenus.create({
      id: "add-to-note",
      parentId: "smart-web-notes",
      title: "➕ Add to Note",
      contexts: ["selection"]
    });
    // Paste as normal text
chrome.contextMenus.create({
  id: "paste-normal-text",
  parentId: "smart-web-notes",
  title: "📄 Paste as Normal Text",
  contexts: ["selection"]
});




  });

});


// ==========================================
// SEND DATA TO OPEN SMART WEB NOTES TAB
// ==========================================

async function sendToOpenNote(capture) {

  const tabs =
    await chrome.tabs.query({
      url: "http://localhost:4200/*"
    });


  const noteTab =
    tabs.find(tab =>
      tab.url?.includes("/notes/new") ||
      tab.url?.includes("/notes/")
    );


  if (!noteTab?.id) {

    console.log(
      "Open Smart Web Notes first."
    );

    return false;
  }


  await chrome.scripting.executeScript({

    target: {
      tabId: noteTab.id
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

    args: [capture]

  });


  return true;
}


// ==========================================
// RIGHT CLICK MENU ACTIONS
// ==========================================
chrome.contextMenus.create({
  id: "add-as-heading",
  parentId: "smart-web-notes",
  title: "H  Add as Heading",
  contexts: ["selection"]
});
chrome.contextMenus.create({
  id: "paste-normal-text",
  parentId: "smart-web-notes",
  title: "📄 Paste as Normal Text",
  contexts: ["selection"]
});
chrome.contextMenus.onClicked.addListener(
  async (info, sourceTab) => {

    // Accept all 3 menu options
    if (
      info.menuItemId !== "add-to-note" &&
      info.menuItemId !== "add-as-title" &&
      info.menuItemId !== "paste-normal-text"
    ) {
      return;
    }


    const selectedText =
      info.selectionText?.trim();


    if (!selectedText) {
      return;
    }


    let target = "body";


    // Title
    if (
      info.menuItemId === "add-as-title"
    ) {
      target = "title";
    }


    // Plain normal text
    if (
      info.menuItemId === "paste-normal-text"
    ) {
      target = "plain";
    }


    const capture = {

      text:
        selectedText,

      sourceTitle:
        sourceTab?.title || "",

      sourceUrl:
        sourceTab?.url || "",

      target:
        target

    };


    console.log(
      "Sending capture:",
      capture
    );


    await sendToOpenNote(
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


    (async () => {

      const success =
        await sendToOpenNote(
          message.capture
        );


      sendResponse({
        ok: success
      });

    })();


    return true;
  }
);