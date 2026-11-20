import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config comes from .env.local (local) and Netlify environment variables (deployed).
// Vite only exposes variables that start with VITE_. These values are NOT secrets (Firebase web config is
// public by design); what protects the data is firestore.rules.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

// A missing value would otherwise show up later as a confusing "invalid api key" error. Say it plainly instead.
// (We only log; throwing here would blank the whole page, including the landing page.)
const required = { VITE_API_KEY: "apiKey", VITE_AUTH_DOMAIN: "authDomain", VITE_PROJECT_ID: "projectId", VITE_APP_ID: "appId" };
const missing = Object.entries(required)
  .filter(([, key]) => !firebaseConfig[key])
  .map(([envName]) => envName);
if (missing.length) {
  console.error(
    `[firebase] Missing environment variable(s): ${missing.join(", ")}. ` +
      "Locally: add them to .env.local and restart `npm run dev`. On Netlify: add them under Site configuration > Environment variables, then redeploy."
  );
}

const app = initializeApp(firebaseConfig);

// Auth keeps the session in IndexedDB by default, so people stay signed in across reloads and browser restarts.
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
