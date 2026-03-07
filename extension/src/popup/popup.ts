import { getAuthState, signInWithGoogle, signOut } from '../lib/auth';
import { saveArticle } from '../lib/api';

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
signInBtn.addEventListener('click', async () => {
  showView('loading');
  try {
    await signInWithGoogle();
    showView('saveForm');
  } catch (err) {
    showView('signIn');
    const msg = err instanceof Error ? err.message : 'Sign in failed';
    showStatus(`Sign in failed: ${msg}`, 'error');
  }
});

// Sign out
signOutBtn.addEventListener('click', async () => {
  await signOut();
  showView('signIn');
});

// Save article
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

    const title = await saveArticle(auth.userId, currentUrl, tags);
    showStatus(`✓ Saved: "${title}"`, 'success');
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
