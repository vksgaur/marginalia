import { signInWithGoogle, signOut } from '../lib/auth';

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

// Handle auth messages from the popup.
// Auth MUST run in the service worker, not the popup, because Chrome closes
// the extension popup as soon as it loses focus (e.g. when the Google account
// picker window opens). If sign-in ran in the popup, the JS context would be
// destroyed before signInWithCredential / storage.set could complete, meaning
// auth state would never be saved and the user would have to sign in every time.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SIGN_IN') {
    signInWithGoogle()
      .then((authState) => sendResponse({ success: true, authState }))
      .catch((err) => sendResponse({ success: false, error: err instanceof Error ? err.message : 'Sign in failed' }));
    return true; // Keep the message channel open for the async response
  }

  if (message.type === 'SIGN_OUT') {
    signOut()
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: true })); // Always succeed on sign out
    return true;
  }
});
