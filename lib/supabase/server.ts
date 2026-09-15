/**
 * Supabase SERVER clients — three flavors.
 *
 *  - createServiceRoleClient(): bypasses RLS. Use in trusted server-only
 *    contexts (Route Handlers, Server Actions, Edge Functions via service key).
 *
 *  - createServerAnonClient(): anon key + cookie-aware session. For RSC
 *    pages where a user session may exist (not currently used).
 *
 *  - createPublicAnonClient(): anon key, NO cookies. Safe to call inside
 *    `unstable_cache()` and other cached scopes. Use for fully-anonymous
 *    public view queries (e.g., service_providers_public, services.status='published').
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createServiceRoleClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op — service-role is stateless
      },
    },
  });
}

/**
 * Anon client (server-side) — reads cookies for SSR session if a logged-in
 * user exists. Cannot be called inside `unstable_cache()`.
 */
export async function createServerAnonClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll called from a Server Component — ignore
        }
      },
    },
  });
}

/**
 * Public anon client (server-side, no cookies) — for fully-anonymous queries.
 * Safe inside `unstable_cache()` and any other cached scope.
 *
 * Use for queries against:
 *   - service_providers_public       (anon SELECT, Migration 015 view)
 *   - provider_locations_public      (anon SELECT, Migration 015 view)
 *   - services                       (existing anon RLS: status='published' rows)
 *
 * Don't use for queries that need a user's auth context.
 */
export function createPublicAnonClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op — public queries don't need to set cookies
      },
    },
  });
}
