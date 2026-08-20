import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/src/components/shell/app-shell";
import { getCurrentUser } from "@/src/server/auth";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role === "superadmin") {
    redirect("/escritorio/empresas");
  }
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-ink-muted">Carregando…</p>}>{children}</Suspense>
    </AppShell>
  );
}
