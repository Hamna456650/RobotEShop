/**
 * `?next=` says where to go after signing in. Only a same-site path is
 * honoured: "/community" yes, "https://elsewhere" or "//elsewhere" no — an
 * open redirect is how a sign-in page becomes a phishing page.
 */

export function safeNext(candidate: string | null, fallback = "/"): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  return candidate;
}

/** The signed-in home. See docs/superpowers/specs/2026-09-19-dashboard-design.md. */
export const AFTER_SIGN_IN = "/dashboard";

/**
 * Where a successful sign-in lands. A page the person was reading is honoured,
 * so signing in from /community goes back to /community. The landing page is
 * not: it is the pitch to a visitor, and someone who just signed in is past
 * the pitch, so "/" becomes the dashboard.
 */
export function afterSignIn(candidate: string | null): string {
  const path = safeNext(candidate, AFTER_SIGN_IN);
  return path === "/" ? AFTER_SIGN_IN : path;
}
