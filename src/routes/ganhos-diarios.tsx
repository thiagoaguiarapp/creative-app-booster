import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, CircleDollarSign, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Periodo = "atual" | "passado" | "total" | "custom";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "atual", label: "Mês atual" },
  { id: "passado", label: "Mês passado" },
  { id: "total", label: "Total" },
  { id: "custom", label: "Personalizado" },
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function prefixoMes(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Ganhos() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("atual");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const ganhos = useMemo(() => {
    if (periodo === "total") return data.ganhos;
    if (periodo === "custom") {
      return data.ganhos.filter(
        (g) => (!de || g.iso >= de) && (!ate || g.iso <= ate),
      );
    }
    const p = prefixoMes(periodo === "atual" ? 0 : -1);
    return data.ganhos.filter((g) => g.iso.startsWith(p));
  }, [data.ganhos, periodo, de, ate]);

  const recentes = ganhos.slice(0, 12);

  const total = ganhos.reduce((s, g) => s + g.faturamento, 0);
  const corridas = ganhos.reduce((s, g) => s + g.corridas, 0);

  const semana = useMemo(() => {
    const soma: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const g of ganhos) {
      if (!g.iso) continue;
      const [y, m, d] = g.iso.split("-").map(Number);
      if (!y || !m || !d) continue;
      const dia = new Date(y, m - 1, d).getDay();
      soma[dia] = (soma[dia] ?? 0) + g.faturamento;
    }
    // segunda a domingo
    return [1, 2, 3, 4, 5, 6, 0].map((i) => ({
      label: DIAS_SEMANA[i] ?? "",
      valor: soma[i] ?? 0,
    }));
  }, [ganhos]);

  const max = Math.max(1, ...semana.map((d) => d.valor));

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

      {periodo === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label htmlFor="de" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="de"
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="h-9 w-40"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="ate" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="ate"
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="h-9 w-40"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Faturamento" value={brl(total)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Corridas" value={String(corridas)} icon={Bike} />
        <StatCard
          label="Ticket médio"
          value={brl(corridas ? total / corridas : 0)}
          hint="Por corrida concluída"
          icon={TrendingUp}
          tone="warning"
        />
      </div>

      <SectionCard title="Evolução" description="Faturamento por dia da semana no período">
        <div className="flex h-48 items-stretch gap-2 sm:gap-4">
          {semana.map((d) => (
            <div key={d.label} className="flex h-full flex-1 flex-col justify-end gap-2">
              <span className="num text-center text-[10px] text-muted-foreground sm:text-xs">
                {brl(d.valor)}
              </span>
              <div
                className="w-full rounded-t-md bg-primary/80"
                style={{ height: `${Math.max(4, (d.valor / max) * 100)}%` }}
              />
              <span className="text-center text-[10px] text-muted-foreground sm:text-xs">
                {d.label}
              </span>
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
