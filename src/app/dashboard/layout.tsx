import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HardDrive } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  // Redundante con el middleware (defensa en profundidad): si por lo que
  // sea llega aquí sin sesión, no renderizamos nada del dashboard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
        <div className="flex items-center gap-2 font-semibold">
          <HardDrive className="size-5 text-primary" />
          mi_IPFS_Drive
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu
            email={profile?.email ?? user.email ?? ""}
            displayName={profile?.display_name ?? null}
            avatarUrl={profile?.avatar_url ?? null}
          />
        </div>
      </header>
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-muted/30 pb-16 lg:pb-0">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
