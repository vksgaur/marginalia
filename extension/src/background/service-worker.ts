// Create context menu items on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'savePageToMarginalia',
    title: 'Save page to Marginalia',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'saveLinkToMarginalia',
    title: 'Save link to Marginalia',
    contexts: ['link'],
  });
});

// Handle right-click context menu saves.
// We can't reliably call chrome.action.openPopup() from a service worker,
// so instead we store the URL in session storage and badge the icon.
// When the user opens the popup it reads the pending URL automatically.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const urlToSave =
    info.menuItemId === 'saveLinkToMarginalia'
      ? info.linkUrl
      : info.pageUrl || tab?.url;

  if (!urlToSave) return;

  chrome.storage.session.set({ pendingUrl: urlToSave }, () => {
    // Badge the icon so the user knows to click it
    chrome.action.setBadgeText({ text: '1' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  });
});
