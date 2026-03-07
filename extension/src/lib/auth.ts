import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import type { AuthState } from './types';

const WEB_CLIENT_ID = '128257432070-gs2gq29coe6n7m1gsu8153tj35bap99r.apps.googleusercontent.com';

export async function signInWithGoogle(): Promise<AuthState> {
  const redirectUrl = chrome.identity.getRedirectURL();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', WEB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUrl);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', 'openid email profile');

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  if (!responseUrl) {
    throw new Error('Auth flow was cancelled');
  }

  const hash = new URL(responseUrl).hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');

  if (!accessToken) {
    throw new Error('No access token in response');
  }

  const credential = GoogleAuthProvider.credential(null, accessToken);
  const auth = getFirebaseAuth();
  const result = await signInWithCredential(auth, credential);

  const authState: AuthState = {
    userId: result.user.uid,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
  };

  await chrome.storage.local.set({ authState });
  return authState;
}

export async function signOut(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    await auth.signOut();
  } catch {
    // Ignore sign out errors
  }
  await chrome.storage.local.remove('authState');
}

export async function getAuthState(): Promise<AuthState | null> {
  const result = await chrome.storage.local.get('authState');
  return result.authState || null;
}
