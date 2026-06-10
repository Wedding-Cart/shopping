import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMTqbp6o7Ikz0uQQ8nZmvqE3G-0Xj7ugk",
  authDomain: "wedding-shopping-list.firebaseapp.com",
  projectId: "wedding-shopping-list",
  storageBucket: "wedding-shopping-list.firebasestorage.app",
  messagingSenderId: "37646947680",
  appId: "1:37646947680:web:533f3506200b49ec057a05",
  measurementId: "G-CETPXJTX0N",
};

export const ADMIN_EMAIL = "rahul@work.com";

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

export function getFirebase(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
} {
  if (typeof window === "undefined") {
    return { app: null, auth: null, db: null };
  }
  if (!_app) {
    _app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    _auth = getAuth(_app);
    try {
      _db = initializeFirestore(_app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // initializeFirestore can only be called once; fallback to getFirestore via dynamic
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getFirestore } = require("firebase/firestore");
      _db = getFirestore(_app);
    }
  }
  return { app: _app, auth: _auth, db: _db };
}