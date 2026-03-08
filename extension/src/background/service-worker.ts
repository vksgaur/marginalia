import { signInWithGoogle, signOut, getAuthState } from '../lib/auth';
import { saveArticle } from '../lib/api';

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

// ALL Firebase operations (auth + Firestore) must run in the service worker.
// The popup and service worker each have their own isolated Firebase app instance.
// Sign-in authenticates the SERVICE WORKER's Firebase instance. If the popup
// tried to call Firestore directly, its Firebase instance would be unauthenticated
// and every write would fail with "Missing or insufficient permissions".
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

  if (message.type === 'SAVE_ARTICLE') {
    const { url, tags } = message as { url: string; tags: string[] };
    getAuthState()
      .then((auth) => {
        if (!auth?.userId) throw new Error('Not signed in');
        return saveArticle(auth.userId, url, tags);
      })
      .then((title) => sendResponse({ success: true, title }))
      .catch((err) => sendResponse({ success: false, error: err instanceof Error ? err.message : 'Failed to save' }));
    return true;
  }
});
