/**
 * The Supabase client for route handlers and server components. Reads the
 * session from the request cookies and writes refreshed tokens back.
 *
 * `setAll` can throw when called from a server component (they cannot set
 * cookies). That is fine: the proxy refreshes sessions, so a component that
 * only reads never needs to write.
 *
 * When Supabase is not configured (placeholder .env), returns a no-op client.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "./env";

export async function createClient() {
  const env = supabaseEnv();
  const cookieStore = await cookies();

  // Not configured — return a minimal stub so server components do not crash.
  if (!env) {
    return createServerClient("https://placeholder.supabase.co", "placeholder-key", {
      cookies: { getAll: () => [], setAll: () => {} },
    });
  }

  const { url, key } = env;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server component — see above. */
        }
      },
    },
  });
}