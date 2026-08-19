import {
  DESTINO_KEYS,
  DESTINO_SHORT_LABELS,
  cstCellsDiverge,
  displayCst,
  type DestinosCst,
} from "@/src/lib/fiscal";

export type MatrixExtraRow = {
  key: string;
  label: string;
  atual?: string | null;
  ideal?: string | null;
};

export function CstMatrix({
  ideal,
  atual,
  extras = [],
  showAtual,
  showDestinos = true,
}: {
  ideal?: DestinosCst | null;
  atual?: DestinosCst | null;
  extras?: MatrixExtraRow[];
  showAtual?: boolean;
  showDestinos?: boolean;
}) {
  const includeAtual = showAtual ?? Boolean(atual);
  const destinos = showDestinos && (Boolean(atual) || Boolean(ideal) || extras.length === 0);

  return (
    <div className="overflow-auto rounded-lg border border-line">
      <table className="fiscal-grid w-full text-left">
        <caption className="sr-only">Matriz CST por destinatário</caption>
        <thead>
          <tr>
            <th className="sticky-col sticky-col-1">Origem</th>
            {destinos
              ? DESTINO_KEYS.map((key) => (
                  <th key={key}>{DESTINO_SHORT_LABELS[key]}</th>
                ))
              : null}
            {extras.map((extra) => (
              <th key={extra.key}>{extra.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {includeAtual ? (
            <tr>
              <th scope="row" className="sticky-col sticky-col-1 font-medium">
                Importado
              </th>
              {destinos
                ? DESTINO_KEYS.map((key) => {
                    const imported = atual?.[key] ?? null;
                    const correct = ideal?.[key] ?? null;
                    const mismatch = cstCellsDiverge(imported, correct);
                    return (
                      <td
                        key={key}
                        className={`tabular ${mismatch ? "bg-status-bad-bg text-status-bad" : ""}`}
                      >
                        {displayCst(imported)}
                      </td>
                    );
                  })
                : null}
              {extras.map((extra) => {
                const mismatch = cstCellsDiverge(extra.atual, extra.ideal);
                return (
                  <td
                    key={extra.key}
                    className={`tabular ${mismatch ? "bg-status-bad-bg text-status-bad" : ""}`}
                  >
                    {displayCst(extra.atual)}
                  </td>
                );
              })}
            </tr>
          ) : null}
          <tr>
            <th scope="row" className="sticky-col sticky-col-1 font-medium">
              Como deve ficar
            </th>
            {destinos
              ? DESTINO_KEYS.map((key) => {
                  const imported = atual?.[key] ?? null;
                  const correct = ideal?.[key] ?? null;
                  const mismatch = includeAtual && cstCellsDiverge(imported, correct);
                  return (
                    <td
                      key={key}
                      className={`tabular ${mismatch ? "bg-status-ok-bg text-status-ok" : ""}`}
                    >
                      {displayCst(correct)}
                    </td>
                  );
                })
              : null}
            {extras.map((extra) => {
              const mismatch = includeAtual && cstCellsDiverge(extra.atual, extra.ideal);
              return (
                <td
                  key={extra.key}
                  className={`tabular ${mismatch ? "bg-status-ok-bg text-status-ok" : ""}`}
                >
                  {displayCst(extra.ideal)}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
