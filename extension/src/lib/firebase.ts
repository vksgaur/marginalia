import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDKMl_nF-M_S9YSIr7KHEyRkC-KRKm4FjI',
  authDomain: 'marginalia-3a44b.firebaseapp.com',
  projectId: 'marginalia-3a44b',
  storageBucket: 'marginalia-3a44b.firebasestorage.app',
  messagingSenderId: '128257432070',
  appId: '1:128257432070:web:7853c9f06e15b3d1370187',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getApp());
  }
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
}
