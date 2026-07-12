import { createClient } from "@/lib/supabase/server";
import { getMyLimits } from "@/lib/supabase/queries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils/format";
import { Sparkles, Mail, Files, HardDrive, Link2, FileUp, AlertTriangle } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, limits] = await Promise.all([
    supabase.from("profiles").select("display_name, email, created_at").eq("id", user!.id).single(),
    getMyLimits(supabase),
  ]);

  const isPro = limits.planId === "pro";
  const storagePct = limits.storageQuotaBytes > 0 ? (limits.usedBytes / limits.storageQuotaBytes) * 100 : 0;
  const filesPct = limits.maxFiles > 0 ? (limits.fileCount / limits.maxFiles) * 100 : 0;
  const sharesPct = limits.maxActiveShares > 0 ? (limits.activeSharesCount / limits.maxActiveShares) * 100 : 0;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-muted-foreground">Tu cuenta y los límites de tu plan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <span>{profile?.email ?? user?.email}</span>
          </div>
          {profile?.created_at && (
            <p className="text-xs text-muted-foreground">
              Cuenta creada el {new Date(profile.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              {isPro && <Sparkles className="size-4 text-amber-500" />}
              Plan {limits.planDisplayName}
            </CardTitle>
            <CardDescription>
              {isPro ? "Gracias por apoyar el proyecto." : "Plan gratuito. Mejora a Pro para ampliar tus límites."}
            </CardDescription>
          </div>
          {!isPro && (
            <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm font-medium text-amber-600">
              Pro — 19€/año
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {limits.isFallback && (
            <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              No pudimos cargar tus límites reales — mostrando valores por defecto de &quot;Registrado&quot; hasta que se resuelva. Si tienes plan Pro, puede tardar en reflejarse; recarga en un momento.
            </p>
          )}

          <LimitRow
            icon={HardDrive}
            label="Almacenamiento"
            used={formatBytes(limits.usedBytes)}
            max={formatBytes(limits.storageQuotaBytes)}
            percentage={storagePct}
          />
          <LimitRow
            icon={Files}
            label="Archivos"
            used={String(limits.fileCount)}
            max={String(limits.maxFiles)}
            percentage={filesPct}
          />
          <LimitRow
            icon={Link2}
            label="Enlaces de compartición activos"
            used={String(limits.activeSharesCount)}
            max={String(limits.maxActiveShares)}
            percentage={sharesPct}
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileUp className="size-4 shrink-0" />
            Tamaño máximo por archivo: <span className="font-medium text-foreground">{formatBytes(limits.maxFileSizeBytes)}</span>
          </div>

          {!isPro && (
            <div className="rounded-md border border-amber-400/30 bg-amber-400/5 p-4 text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-500">¿Necesitas más espacio?</p>
              <p className="mt-1 text-muted-foreground">
                El plan Pro incluye 5 GB de almacenamiento, 5.000 archivos, 500 MB por archivo y 100 enlaces de
                compartición — por 19€/año. Escríbenos para mejorar tu cuenta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LimitRow({
  icon: Icon,
  label,
  used,
  max,
  percentage,
}: {
  icon: typeof HardDrive;
  label: string;
  used: string;
  max: string;
  percentage: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </span>
        <span className="font-medium">
          {used} / {max}
        </span>
      </div>
      <Progress value={Math.min(100, percentage)} indicatorClassName={percentage >= 90 ? "bg-destructive" : undefined} />
    </div>
  );
}
