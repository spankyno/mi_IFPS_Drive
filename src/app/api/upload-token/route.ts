import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPinningAdapter } from "@/lib/ipfs/pinning-provider";
import { getStorageUsage } from "@/lib/supabase/queries";
import { z } from "zod";

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().positive().max(5 * 1024 * 1024 * 1024), // 5 GB, límite orientativo de app
});

/**
 * Emite una URL firmada (PUT) de corta duración para que el navegador suba
 * el archivo DIRECTAMENTE al pinning service, sin pasar por nuestro
 * servidor (evita cuellos de botella y límites de body size de Vercel).
 *
 * El archivo no se guarda en ningún sitio nuestro; solo generamos la key
 * y la URL firmada. La confirmación final (leer el CID y guardar
 * metadatos) ocurre en `finalizeUploadAction` una vez el PUT ha terminado.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos de subida inválidos.", details: parsed.error.issues },
      { status: 400 }
    );
  }

  // Antes de emitir la URL, comprobamos que el archivo no vaya a superar
  // la cuota del usuario. Sin esto, cualquiera podía seguir subiendo
  // archivos indefinidamente sin límite real de la aplicación (el único
  // límite habría sido el del propio Filebase, no el nuestro).
  const usage = await getStorageUsage(supabase, user.id);
  if (usage.usedBytes + parsed.data.sizeBytes > usage.quotaBytes) {
    return NextResponse.json(
      {
        error: `Este archivo superaría tu cuota de almacenamiento (${(usage.quotaBytes / 1024 ** 3).toFixed(1)} GB). Borra algo o pide más espacio.`,
      },
      { status: 413 }
    );
  }

  // Namespacing por usuario: evita colisiones entre usuarios y facilita
  // auditar/borrar todo lo de un usuario en el bucket si hace falta.
  const safeName = parsed.data.fileName.replace(/[^\w.\-]/g, "_");
  const key = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  try {
    const adapter = getPinningAdapter();
    const uploadUrl = await adapter.getUploadUrl(key, parsed.data.contentType);
    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    console.error("Error generando URL de subida:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar la URL de subida." },
      { status: 500 }
    );
  }
}
