import type { ReactNode } from "react";

export function SheetToolbar({ children }: { children: ReactNode }) {
  return (
    <section className="sticky top-16 z-20 grid gap-4 rounded-lg border border-line bg-paper-raised/95 p-4 shadow-panel backdrop-blur">
      {children}
    </section>
  );
}
