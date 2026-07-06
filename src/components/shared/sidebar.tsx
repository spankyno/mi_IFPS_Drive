"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Files, Share2, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, enabled: true },
  { href: "/dashboard/files", label: "Mis archivos", icon: Files, enabled: true },
  { href: "/dashboard/shared", label: "Compartidos", icon: Share2, enabled: false },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings, enabled: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r bg-background p-3 lg:flex">
      {NAV_ITEMS.map(({ href, label, icon: Icon, enabled }) => {
        const isActive = pathname === href;

        if (!enabled) {
          return (
            <div
              key={href}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50"
              title="Próximamente"
            >
              <Icon className="size-4" />
              {label}
              <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                Pronto
              </span>
            </div>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
              isActive ? "bg-primary/10 text-primary" : "text-foreground/80"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
