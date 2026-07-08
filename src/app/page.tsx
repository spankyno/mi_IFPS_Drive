import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { HardDrive, Lock, Share2, Sparkles } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b p-4 lg:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <HardDrive className="size-5 text-primary" />
          mi_IPFS_Drive
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
            Tus archivos, en una red que nadie controla
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Almacenamiento descentralizado sobre IPFS. Sube, organiza y comparte —
            sin servidor central, sin punto único de fallo.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link href="/register">Empieza gratis</Link>
        </Button>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Feature icon={<Sparkles className="size-5" />} title="Simple" text="Arrastra y suelta, como en cualquier drive." />
          <Feature icon={<Lock className="size-5" />} title="Privado" text="Enlaces revocables con caducidad, sin exponer tu drive entero." />
          <Feature icon={<Share2 className="size-5" />} title="Compartible" text="Enlaces públicos o privados por CID." />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex max-w-64 flex-col items-center gap-2 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
