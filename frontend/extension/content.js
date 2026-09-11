chrome.runtime.onMessage.addListener((message) => {

  if (message.type !== "ADD_TO_MY_NOTES") {
    return;
  }

  window.postMessage(
    {
      source: "smart-web-notes-extension",
      type: "ADD_TO_MY_NOTES",
      capture: message.capture
    },
    "*"
  );

});