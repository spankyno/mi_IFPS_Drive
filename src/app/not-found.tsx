import Link from "next/link";
import { HardDrive, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-2 border-b p-4 font-semibold">
        <Link href="/" className="flex items-center gap-2">
          <HardDrive className="size-5 text-primary" />
          mi_IPFS_Drive
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
        <Compass className="size-12 text-muted-foreground/40" />
        <div>
          <p className="text-lg font-medium">Esta página no existe</p>
          <p className="text-sm text-muted-foreground">Revisa la URL, o vuelve al principio.</p>
        </div>
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      </main>
    </div>
  );
}
