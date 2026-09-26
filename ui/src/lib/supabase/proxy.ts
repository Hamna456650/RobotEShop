/**
 * Refreshes the auth session on every request that reaches the proxy.
 *
 * Access tokens expire hourly. Without this, a browser that sat on a page for
 * an hour would send an expired token on its next write and be told to sign
 * in again. The `getClaims()` call is what triggers the refresh; the cookie
 * dance around it is how the refreshed token gets back to the browser —
 * the request cookies for this render, the response cookies for the next.
 *
 * Deliberately no redirects: nothing on this site is behind a login wall.
 * Pages gate their own write controls with `useAuth()`.
 * 
 * When Supabase is not configured (no .env), this is a no-op pass-through.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";

export async function updateSession(request: NextRequest) {
  const env = supabaseEnv();
  
  // Supabase not configured — skip auth entirely, pass through
  if (!env) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, key } = env;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not put anything between the client creation and this call: the
  // refresh happens here, and code that runs before it sees a stale session.
  await supabase.auth.getClaims();

  return response;
}