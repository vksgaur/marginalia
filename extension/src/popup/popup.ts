import { getAuthState } from '../lib/auth';

const $ = (id: string) => document.getElementById(id)!;

const loadingView = $('loadingView');
const signInView = $('signInView');
const saveFormView = $('saveFormView');
const signInBtn = $('signInBtn');
const signOutBtn = $('signOutBtn');
const saveBtn = $('saveBtn') as HTMLButtonElement;
const articleTitle = $('articleTitle');
const articleUrl = $('articleUrl');
const tagsInput = $('tagsInput') as HTMLInputElement;
const status = $('status');

let currentUrl = '';
let currentTitle = '';

function showView(view: 'loading' | 'signIn' | 'saveForm') {
  loadingView.classList.toggle('hidden', view !== 'loading');
  signInView.classList.toggle('hidden', view !== 'signIn');
  saveFormView.classList.toggle('hidden', view !== 'saveForm');

  if (view === 'saveForm') {
    articleTitle.textContent = currentTitle || currentUrl;
    articleUrl.textContent = currentUrl;
  }
}

function showStatus(message: string, type: 'success' | 'error' | 'duplicate') {
  status.textContent = message;
  status.className = `status ${type}`;
}

function hideStatus() {
  status.className = 'status hidden';
}

function setSaving(saving: boolean) {
  saveBtn.disabled = saving;
  if (saving) {
    saveBtn.classList.add('saving');
    saveBtn.textContent = '';
  } else {
    saveBtn.classList.remove('saving');
    saveBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      Save to Marginalia
    `;
  }
}

function isUnsaveablePage(url: string): boolean {
  return (
    !url ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('edge://') ||
    url.startsWith('brave://')
  );
}

async function init() {
  // Clear any badge from a context menu click
  chrome.action.setBadgeText({ text: '' });

  // Check if the service worker stored a pending URL (from right-click → Save link)
  const session = await chrome.storage.session.get('pendingUrl');
  const pendingUrl = session.pendingUrl as string | undefined;

  if (pendingUrl) {
    // Use the pending URL (from right-click on a link or page)
    currentUrl = pendingUrl;
    currentTitle = pendingUrl; // title will be resolved on save
    await chrome.storage.session.remove('pendingUrl');
  } else {
    // Fall back to the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = tab?.url || '';
    currentTitle = tab?.title || '';
  }

  if (isUnsaveablePage(currentUrl)) {
    showView('saveForm');
    saveBtn.disabled = true;
    showStatus('Cannot save this page', 'error');
    return;
  }

  const auth = await getAuthState();
  if (auth?.userId) {
    showView('saveForm');
  } else {
    showView('signIn');
  }
}

// Sign in
// Auth is delegated to the service worker so it survives the popup being closed.
// Chrome closes the extension popup as soon as it loses focus — which happens
// the moment the Google account picker window opens. If we ran signInWithGoogle()
// here, the JS context would be destroyed before signInWithCredential / storage.set
// could complete, so auth state would never be saved.
signInBtn.addEventListener('click', async () => {
  showView('loading');
  try {
    const response = await chrome.runtime.sendMessage({ type: 'SIGN_IN' });
    if (!response?.success) throw new Error(response?.error || 'Sign in failed');
    showView('saveForm');
  } catch (err) {
    // If the popup closed mid-auth the message port error is expected.
    // The service worker will still complete the flow and save authState, so
    // the next time the user opens the popup it will go straight to the save form.
    const msg = err instanceof Error ? err.message : 'Sign in failed';
    if (!msg.includes('message port closed') && !msg.includes('receiving end')) {
      showView('signIn');
      showStatus(`Sign in failed: ${msg}`, 'error');
    }
  }
});

// Sign out
signOutBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
  showView('signIn');
});

// Save article
// Delegated to the service worker because it holds the authenticated Firebase
// instance. A direct Firestore call from the popup would fail with
// "Missing or insufficient permissions" since the popup's Firebase instance
// is a separate, unauthenticated context.
saveBtn.addEventListener('click', async () => {
  if (!currentUrl) return;

  const auth = await getAuthState();
  if (!auth?.userId) {
    showStatus('Please sign in first', 'error');
    return;
  }

  hideStatus();
  setSaving(true);

  try {
    const tags = tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_ARTICLE',
      url: currentUrl,
      tags,
    });

    if (!response?.success) throw new Error(response?.error || 'Failed to save');
    showStatus(`✓ Saved: "${response.title}"`, 'success');
    tagsInput.value = '';
    saveBtn.disabled = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save';
    const type = message === 'Article already saved' ? 'duplicate' : 'error';
    showStatus(message, type);
    setSaving(false);
  }
});

// Allow Enter key in tags field to trigger save
tagsInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    saveBtn.click();
  }
});

init();
