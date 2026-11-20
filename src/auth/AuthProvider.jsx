import { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./authContext";

// Tells the whole app who is signed in. Firebase restores the session from the browser on its own (IndexedDB), so a
// reload keeps people logged in; until it has answered, status is "loading" and route guards show a spinner
// instead of flashing the login page.
export default function AuthProvider({ children }) {
  // undefined = Firebase hasn't answered yet | null = signed out | object = signed in
  const [user, setUser] = useState(undefined);
  // The Firebase user object is mutated in place by reload(), so React can't see the change. Bumping this
  // counter re-renders this provider (used after email verification, see refreshUser).
  const [, setReloads] = useState(0);

  useEffect(
    () =>
      onAuthStateChanged(
        auth,
        (next) => setUser(next),
        () => setUser(null)
      ),
    []
  );

  const signIn = useCallback((email, password) => signInWithEmailAndPassword(auth, email.trim(), password), []);
  const logOut = useCallback(() => signOut(auth), []);
  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email.trim()), []);
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setReloads((n) => n + 1);
  }, []);

  // Until the email is verified, re-check (when the tab starts, gets focus, or becomes visible again, at most every 15s),
  // so someone who clicked the link in their inbox and came back sees it recognised without reloading.
  const unverified = Boolean(user) && !user.emailVerified;
  useEffect(() => {
    if (!unverified) return undefined;
    let last = 0;
    const check = () => {
      const now = Date.now();
      if (now - last < 15000) return;
      last = now;
      refreshUser().catch(() => {}); // offline or token trouble: try again next time
    };
    check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [unverified, refreshUser]);

  const status = user === undefined ? "loading" : user ? "signedIn" : "signedOut";
  // Read on every render (not only when `user` changes): reload() flips it on the same user object.
  const emailVerified = Boolean(user?.emailVerified);

  const value = useMemo(
    () => ({ user: user ?? null, status, emailVerified, signIn, logOut, resetPassword, refreshUser }),
    [user, status, emailVerified, signIn, logOut, resetPassword, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
