import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Coins, HandCoins, Landmark, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/repasses")({
  head: () => ({
    meta: [
      { title: "Recebimento e repasse — Rota Control" },
      {
        name: "description",
        content: "Acompanhe os repasses das plataformas por aplicativo, forma de recebimento e data.",
      },
      { property: "og:title", content: "Recebimento e repasse — Rota Control" },
      {
        property: "og:description",
        content: "Repasses das plataformas por aplicativo, forma de recebimento e data.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(painelQueryOptions());
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-6">Nada encontrado.</div>,
  component: RepassesPage,
});

type Periodo = "atual" | "passado" | "total";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "atual", label: "Mês atual" },
  { id: "passado", label: "Mês passado" },
  { id: "total", label: "Total" },
];

function prefixoMes(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function RepassesPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("atual");

  const prefixo = periodo === "total" ? null : prefixoMes(periodo === "atual" ? 0 : -1);

  const repasses = useMemo(
    () => (prefixo ? data.repasses.filter((r) => r.iso.startsWith(prefixo)) : data.repasses),
    [data.repasses, prefixo],
  );
  const ganhos = useMemo(
    () => (prefixo ? data.ganhos.filter((g) => g.iso.startsWith(prefixo)) : data.ganhos),
    [data.ganhos, prefixo],
  );

  const recentes = [...repasses].sort((a, b) => b.iso.localeCompare(a.iso)).slice(0, 15);

  const ehExtra = (app: string) => {
    const n = app.trim().toUpperCase();
    return n.startsWith("GORJETA") || n.startsWith("SOBRA");
  };

  const gorjetas = repasses
    .filter((r) => r.aplicativo.trim().toUpperCase().startsWith("GORJETA"))
    .reduce((s, r) => s + r.valor, 0);
  const sobraTroco = repasses
    .filter((r) => r.aplicativo.trim().toUpperCase().startsWith("SOBRA"))
    .reduce((s, r) => s + r.valor, 0);

  const recebidoPlataformas = repasses
    .filter((r) => !ehExtra(r.aplicativo))
    .reduce((s, r) => s + r.valor, 0);
  const recebido = recebidoPlataformas + gorjetas + sobraTroco;
  const faturado = ganhos.reduce((s, g) => s + g.faturamento, 0);
  const pendente = Math.max(0, faturado - recebidoPlataformas);

  const porApp = Array.from(
    new Set(repasses.filter((r) => !ehExtra(r.aplicativo)).map((r) => r.aplicativo)),
  )
    .map((app) => ({
      app,
      valor: repasses.filter((r) => r.aplicativo === app).reduce((s, r) => s + r.valor, 0),
    }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Recebimento / Repasse"
        subtitle="Conciliação dos repasses das plataformas (aba REPASSE)"
        action={<NovoLancamento tipo="repasse" />}
      />

      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={periodo === p.id ? "default" : "outline"}
            onClick={() => setPeriodo(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturado" value={brl(faturado)} icon={Wallet} />
        <StatCard
          label="Recebido"
          value={brl(recebido)}
          icon={CheckCircle2}
          tone="success"
          hint={`Plataformas ${brl(recebidoPlataformas)}`}
        />
        <StatCard label="A receber" value={brl(pendente)} icon={Clock} tone="warning" />
        <StatCard label="Repasses" value={String(repasses.length)} icon={Landmark} />
        <StatCard label="Gorjetas" value={brl(gorjetas)} icon={HandCoins} tone="success" />
        <StatCard label="Sobra de troco" value={brl(sobraTroco)} icon={Coins} tone="success" />
      </div>

      <SectionCard title="Por aplicativo" description="Total recebido em cada plataforma">


        <div className="flex flex-col gap-3">
          {porApp.map((a) => (
            <div key={a.app} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-sm text-muted-foreground">{a.app}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${recebido ? (a.valor / recebido) * 100 : 0}%` }}
                />
              </div>
              <span className="num w-28 text-right text-sm font-medium">{brl(a.valor)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Últimos repasses">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Aplicativo</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead className="text-right">Valor recebido</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num">{r.data}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.aplicativo}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.forma}</TableCell>
                <TableCell className="num text-right font-semibold text-success">
                  {brl(r.valor)}
                </TableCell>
                <TableCell>
                  <AcoesLancamento tipo="repasse" registro={r} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
