/**
 * The two values every Supabase client needs, read once and checked once.
 *
 * `NEXT_PUBLIC_` is what lets Next inline them into the browser bundle. They
 * are read as literal `process.env.X` expressions on purpose — Next replaces
 * those at build time, and a dynamic lookup like `process.env[name]` would
 * come back undefined in the browser.
 * 
 * Returns null values when not configured so the app can run in demo mode
 * without Supabase.
 */

export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Real publishable keys start with "sb_publishable_", so only the exact
  // placeholder from .env.example counts as unconfigured.
  if (!url || !key || url.includes("your-project-ref") || key === "sb_publishable_...") {
    return null;
  }

  return { url, key };
}