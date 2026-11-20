// Turns Firebase error codes into sentences people can act on. Never show err.message to users: it is
// developer-facing ("Firebase: Error (auth/invalid-credential).").
const WRONG_LOGIN = "That email and password don't match. Check both and try again.";

const MESSAGES = {
  // Firebase Auth
  "auth/invalid-credential": WRONG_LOGIN,
  "auth/wrong-password": WRONG_LOGIN,
  "auth/user-not-found": WRONG_LOGIN,
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/missing-email": "Enter your email address.",
  "auth/missing-password": "Enter your password.",
  "auth/user-disabled": "This account has been disabled. Ask your group admin for help.",
  "auth/email-already-in-use": "An account with this email already exists. Try logging in instead.",
  "auth/weak-password": "Use a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes, then try again.",
  "auth/network-request-failed": "Can't reach the server. Check your connection and try again.",
  "auth/operation-not-allowed": "Email and password sign-in isn't switched on for this project yet.",
  "auth/requires-recent-login": "For safety, please log in again, then retry.",
  // Our own (lib/registration.js)
  "ss/nickname-taken": "Someone just took that nickname. Pick another one.",
  "ss/registration-closed": "Registration for this group just closed.",
  "ss/partial": "Your account was created but joining the group didn't finish. Log in, then use \"Join a group\" with the same code.",
  // Firestore
  "permission-denied": "That wasn't allowed. If you think it should be, tell your group admin.",
  unavailable: "Can't reach the server. Check your connection and try again.",
  "deadline-exceeded": "The server took too long to answer. Try again.",
  "resource-exhausted": "The service is busy right now. Try again in a minute.",
};

export function authErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const code = err && typeof err === "object" ? err.code : undefined;
  return (code && MESSAGES[code]) || fallback;
}
