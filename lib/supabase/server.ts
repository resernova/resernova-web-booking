/**
 * Supabase SERVER client — service-role.
 * Used in Server Components, Route Handlers, and Server Actions.
 * NEVER import this in a Client Component.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op — service-role is stateless
        },
      },
    },
  );
}

/**
 * Supabase ANON client (server-side) — uses cookies for SSR auth if ever needed.
 * RLS applies. Public web routes don't need auth, so prefer service-role above.
 */
export async function createServerAnonClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );
}