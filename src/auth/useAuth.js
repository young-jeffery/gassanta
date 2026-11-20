import { useContext } from "react";
import { AuthContext } from "./authContext";

// const { user, status, signIn, logOut, resetPassword, refreshUser } = useAuth();
//   status: "loading" (Firebase hasn't answered yet) | "signedOut" | "signedIn"
//   user:   the Firebase user object when signedIn, otherwise null
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
