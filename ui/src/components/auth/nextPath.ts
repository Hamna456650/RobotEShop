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
