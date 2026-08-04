import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, CircleDollarSign, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/ganhos-diarios")({
  head: () => ({
    meta: [
      { title: "Ganhos diários — Rota Control" },
      {
        name: "description",
        content: "Acompanhe corridas, faturamento e valores recebidos das entregas em tempo real.",
      },
      { property: "og:title", content: "Ganhos diários — Rota Control" },
      {
        property: "og:description",
        content: "Acompanhe corridas, faturamento e valores recebidos das entregas em tempo real.",
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
  component: Ganhos,
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

function Ganhos() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("atual");

  const ganhos = useMemo(() => {
    if (periodo === "total") return data.ganhos;
    const p = prefixoMes(periodo === "atual" ? 0 : -1);
    return data.ganhos.filter((g) => g.iso.startsWith(p));
  }, [data.ganhos, periodo]);

  const recentes = ganhos.slice(0, 12);

  const total = ganhos.reduce((s, g) => s + g.faturamento, 0);
  const corridas = ganhos.reduce((s, g) => s + g.corridas, 0);
  const recebido = ganhos.reduce((s, g) => s + g.recebido, 0);

  const porDia = new Map<string, { label: string; valor: number }>();
  for (const g of recentes) {
    const atual = porDia.get(g.data) ?? { label: g.data, valor: 0 };
    atual.valor += g.faturamento;
    porDia.set(g.data, atual);
  }
  const dias = [...porDia.values()].slice(0, 7).reverse();
  const max = Math.max(1, ...dias.map((d) => d.valor));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Ganhos diários"
        subtitle={`${ganhos.length} lançamentos no período`}
        action={<NovoLancamento tipo="ganho" />}
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
        <StatCard label="Faturamento" value={brl(total)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Corridas" value={String(corridas)} icon={Bike} />
        <StatCard label="Valor recebido" value={brl(recebido)} icon={Wallet} />
        <StatCard
          label="Ticket médio"
          value={brl(corridas ? total / corridas : 0)}
          hint="Por corrida concluída"
          icon={TrendingUp}
          tone="warning"
        />
      </div>

      <SectionCard title="Evolução" description="Faturamento por dia (últimos dias)">
        <div className="flex h-48 items-stretch gap-4">
          {dias.map((d) => (
            <div key={d.label} className="flex h-full flex-1 flex-col justify-end gap-2">
              <span className="num text-center text-xs text-muted-foreground">{brl(d.valor)}</span>
              <div
                className="w-full rounded-t-md bg-primary/80"
                style={{ height: `${Math.max(4, (d.valor / max) * 100)}%` }}
              />
              <span className="text-center text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Lançamentos" description="Últimos registros da aba DIA A DIA">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>App</TableHead>
              <TableHead className="text-right">Rotas</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="num">{g.data}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{g.plataforma}</Badge>
                </TableCell>
                <TableCell className="num text-right">{g.corridas || "—"}</TableCell>
                <TableCell className="num text-right font-semibold text-success">
                  {brl(g.faturamento)}
                </TableCell>
                <TableCell className="num text-right">{brl(g.recebido)}</TableCell>
                <TableCell>
                  <AcoesLancamento tipo="ganho" registro={g} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
