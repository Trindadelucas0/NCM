import type { StatusFiscal } from "@/src/lib/fiscal";

const MAP: Record<
  StatusFiscal,
  { label: string; className: string }
> = {
  CORRETO: { label: "Correto", className: "bg-status-ok-bg text-status-ok" },
  DIVERGENTE: { label: "Divergente", className: "bg-status-bad-bg text-status-bad" },
  NECESSITA_ANALISE: {
    label: "Necessita análise",
    className: "bg-status-warn-bg text-status-warn",
  },
};

export function StatusBadge({ status }: { status: StatusFiscal }) {
  const item = MAP[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}
    >
      {item.label}
    </span>
  );
}
