/**
 * The browser-side Supabase client. `@supabase/ssr` keeps the session in
 * cookies rather than localStorage so the same session is visible to route
 * handlers and to `src/proxy.ts`; it also memoises the instance, so calling
 * this from every component is free.
 * 
 * Returns null when Supabase is not configured (no .env or placeholder values).
 */

import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  const env = supabaseEnv();
  
  // Not configured — return a stub that won't crash but will return empty data
  if (!env) {
    return createStubClient();
  }

  // Memoise the real client
  if (!cachedClient) {
    cachedClient = createBrowserClient(env.url, env.key);
  }
  
  return cachedClient;
}

/**
 * Stub client that implements the minimal Supabase interface needed by reviewStore and AuthContext.
 * All queries return empty data so the UI shows nothing instead of crashing.
 * 
 * IMPORTANT: onAuthStateChange must fire an event for AuthContext to transition out of "loading" state.
 */
function createStubClient() {
  // Create a no-op subscription that can be unsubscribed
  const createNoopSubscription = () => ({
    unsubscribe: () => {}
  });

  // This mimics what Supabase does: immediately fire "INITIAL_SESSION" with null session
  const fireInitialSession = (callback: (event: string, session: null) => void) => {
    // Small delay to match real behavior
    setTimeout(() => {
      callback("INITIAL_SESSION", null);
    }, 0);
  };

  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: (callback: (event: string, session: null) => void) => {
        // Fire immediately to transition AuthContext out of "loading" state
        fireInitialSession(callback);
        return { data: { subscription: createNoopSubscription() } };
      },
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      signUpWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      signInWithOAuth: () => Promise.resolve({ data: { url: null }, error: { message: "Supabase not configured" } }),
      // Add the missing methods that forms use
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: { message: "Supabase not configured" } }),
      verifyOtp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
    },
  } as any;
}