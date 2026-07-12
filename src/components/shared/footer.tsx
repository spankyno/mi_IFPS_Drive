import Link from "next/link";
import { HardDrive } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <HardDrive className="size-4 text-primary" />
          mi_IPFS_Drive
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/acerca-de" className="hover:text-foreground hover:underline">
            Acerca de
          </Link>
          <a
            href="https://aitor-blog-contacto.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Contacto
          </a>
          <a
            href="https://aitorsanchez.pages.dev/contacto"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Blog
          </a>
          <a
            href="https://aitorhub.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            Más apps
          </a>
        </nav>
      </div>
      <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
        Aitor Sánchez Gutiérrez © {CURRENT_YEAR} - Reservados todos los derechos
      </div>
    </footer>
  );
}
