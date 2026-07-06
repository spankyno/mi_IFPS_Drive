import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Lee/escribe las cookies de sesión a través de `next/headers`.
 *
 * En Server Components (renderizado, no mutación) `set` puede fallar
 * silenciosamente por diseño de Next.js — por eso el try/catch. La sesión
 * se refresca de todos modos en el middleware (ver middleware.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se llama desde un Server Component durante el render.
            // Ignorable: el middleware se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}

/**
 * Cliente con Service Role Key — SOLO para operaciones de servidor que
 * requieren saltarse RLS (ej: emitir tokens de subida firmados tras
 * validar la sesión manualmente). Nunca importar en un Client Component.
 */
export function createServiceRoleClient() {
  return createSupabaseJsClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
