import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard } from "@/components/shell";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/entregas")({
  head: () => ({
    meta: [
      { title: "Entregas — No Corre" },
      { name: "description", content: "Suas corridas e entregas por app: faturamento, quantidade e ticket médio." },
      { property: "og:title", content: "Entregas — No Corre" },
      { property: "og:description", content: "Suas corridas e entregas por app: faturamento, quantidade e ticket médio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(painelQueryOptions());
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">{(error as Error).message}</div>
  ),
  component: EntregasPage,
});

type Periodo = "hoje" | "semana" | "mes" | "tudo";

function isoLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function inicioPeriodo(p: Periodo): string {
  const d = new Date();
  if (p === "hoje") return isoLocal(d);
  if (p === "semana") {
    const dia = (d.getDay() + 6) % 7; // segunda = 0
    d.setDate(d.getDate() - dia);
    return isoLocal(d);
  }
  if (p === "mes") return isoLocal(new Date(d.getFullYear(), d.getMonth(), 1));
  return "";
}

function EntregasPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [app, setApp] = useState("todos");

  const apps = useMemo(
    () => Array.from(new Set(data.ganhos.map((g) => g.plataforma).filter(Boolean))).sort(),
    [data.ganhos],
  );

  const lista = useMemo(() => {
    const ini = inicioPeriodo(periodo);
    return data.ganhos
      .filter((g) => (!ini || (g.iso ?? "") >= ini) && (app === "todos" || g.plataforma === app))
      .sort((a, b) => (b.iso ?? "").localeCompare(a.iso ?? ""));
  }, [data.ganhos, periodo, app]);

  const total = lista.reduce((s, g) => s + (g.faturamento || 0), 0);
  const qtd = lista.reduce((s, g) => s + (Number(g.corridas) || 0), 0);
  const ticket = qtd > 0 ? total / qtd : 0;

  const chip = (ativo: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
      ativo ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
    );

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-4">
      <PageHeader title="Entregas" subtitle="Suas corridas e entregas por app." />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.7fr_1fr_1fr]">
        <div className="col-span-2 min-w-0 rounded-xl border border-border bg-primary/10 p-3 sm:col-span-1">
          <p className="text-[11px] text-muted-foreground">Faturado</p>
          <p className="whitespace-nowrap text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            {brl(total)}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Entregas</p>
          <p className="truncate text-lg font-semibold">{qtd}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Ticket médio</p>
          <p className="truncate text-lg font-semibold">{qtd > 0 ? brl(ticket) : "—"}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["hoje", "Hoje"],
            ["semana", "Semana"],
            ["mes", "Mês"],
            ["tudo", "Tudo"],
          ] as [Periodo, string][]
        ).map(([p, r]) => (
          <button key={p} type="button" className={chip(periodo === p)} onClick={() => setPeriodo(p)}>
            {r}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" className={chip(app === "todos")} onClick={() => setApp("todos")}>
          Todos os apps
        </button>
        {apps.map((a) => (
          <button key={a} type="button" className={chip(app === a)} onClick={() => setApp(a)}>
            {a}
          </button>
        ))}
      </div>

      <SectionCard title={`${lista.length} registro(s)`}>
        <div className="mb-3">
          <NovoLancamento tipo="ganho" />
        </div>
        {lista.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma entrega neste período.</p>
        ) : (
          <ul className="divide-y divide-border">
            {lista.map((g) => {
              const n = Number(g.corridas) || 0;
              return (
                <li key={g.row} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{g.plataforma || "Sem app"}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.data} · {n} entrega(s)
                      {n > 0 ? ` · ${brl(g.faturamento / n)}/entrega` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-primary">{brl(g.faturamento)}</p>
                  <AcoesLancamento
                    tipo="ganho"
                    registro={g as unknown as Record<string, unknown> & { row: string }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
