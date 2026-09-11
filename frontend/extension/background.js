chrome.runtime.onInstalled.addListener(() => {

  chrome.contextMenus.removeAll(() => {

    chrome.contextMenus.create({
      id: "add-to-my-notes",
      title: "📒 Add to My Notes",
      contexts: ["selection"]
    });

  });

});


chrome.contextMenus.onClicked.addListener(
  async (info, sourceTab) => {

    if (info.menuItemId !== "add-to-my-notes") {
      return;
    }

    if (!sourceTab?.id) {
      return;
    }


    // ==========================================
    // GET SELECTED TEXT WITH PARAGRAPH STRUCTURE
    // ==========================================

    const result =
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
            return null;
          }


          const range =
            selection.getRangeAt(0);

          const fragment =
            range.cloneContents();

          const container =
            document.createElement("div");

          container.appendChild(fragment);


          const blockTags = new Set([
            "DIV",
            "P",
            "LI",
            "H1",
            "H2",
            "H3",
            "H4",
            "H5",
            "H6",
            "SECTION",
            "ARTICLE",
            "BLOCKQUOTE",
            "PRE",
            "TR"
          ]);


          let output = "";


          function walk(node) {

            // Text
            if (node.nodeType === Node.TEXT_NODE) {

              output +=
                node.textContent || "";

              return;
            }


            if (node.nodeType !== Node.ELEMENT_NODE) {
              return;
            }


            const element = node;

            const tag =
              element.tagName;


            // <br>
            if (tag === "BR") {

              output += "\n";

              return;
            }


            // Read children
            for (
              const child of
              element.childNodes
            ) {

              walk(child);

            }


            // Block element = new line
            if (
              blockTags.has(tag) &&
              !output.endsWith("\n")
            ) {

              output += "\n";

            }

          }


          walk(container);


          const lines =
            output
              .split(/\n/)
              .map(line =>
                line
                  .replace(/\s+/g, " ")
                  .trim()
              )
              .filter(line =>
                line.length > 0
              );


          return {
            text: lines.join("\n"),
            lines: lines
          };

        }

      });


    const selectedData =
      result?.[0]?.result;


    if (
      !selectedData ||
      !selectedData.text
    ) {

      return;

    }


    // ==========================================
    // FIND OPEN SMART WEB NOTES TAB
    // ==========================================

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

      return;

    }


    // ==========================================
    // DATA SENT TO ANGULAR
    // ==========================================

    const capture = {

      text:
        selectedData.text,

      lines:
        selectedData.lines,

      sourceTitle:
        sourceTab.title || "",

      sourceUrl:
        sourceTab.url || ""

    };


    // ==========================================
    // SEND TO CURRENT OPEN NOTE
    // ==========================================

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

  }
);