import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Firestore with an IndexedDB-backed cache.
 *
 * By default the SDK caches in memory only, so every page load starts from
 * nothing and the first paint waits on a network round trip. With persistence,
 * `onSnapshot` serves the cached documents immediately and then delivers the
 * server's version when it arrives — pages paint instantly for anyone who has
 * been here before, and content updates a moment later.
 *
 * `persistentMultipleTabManager` matters: with the default single-tab manager,
 * opening the site in a second tab fails to acquire the IndexedDB lock and
 * persistence silently switches off there.
 */
function createDb() {
  // Next prerenders these client components at build time, where there is no
  // IndexedDB. Fall back to the plain instance on the server.
  if (typeof window === "undefined") return getFirestore(app);

  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err) {
    // Thrown when Firestore was already initialised (React Fast Refresh), or
    // when storage is unavailable — private browsing, or storage disabled.
    // Neither is fatal: fall back to the in-memory cache.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[firebase] persistent cache unavailable:", err?.message);
    }
    return getFirestore(app);
  }
}

export const auth = getAuth(app);
export const db = createDb();