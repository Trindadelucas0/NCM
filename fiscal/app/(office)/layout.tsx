import { AppShell } from "@/src/components/shell/app-shell";
import { Suspense } from "react";

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-sm text-ink-muted">Carregando…</p>}>{children}</Suspense>
    </AppShell>
  );
}
