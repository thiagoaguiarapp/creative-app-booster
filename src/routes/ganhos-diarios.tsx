import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, CircleDollarSign, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { AtalhoPaginas } from "@/components/atalho-paginas";
import { Detalhe, LinhaDetalhavel } from "@/components/linha-detalhe";
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

type Periodo = "hoje" | "ontem" | "semana" | "custom";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "ontem", label: "Ontem" },
  { id: "semana", label: "Esta semana" },
  { id: "custom", label: "Personalizado" },
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function isoHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function offsetDia(iso: string, dias: number) {
  const parts = iso.split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const d = parts[2] ?? 0;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Ganhos() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

  const ganhos = useMemo(() => {
    if (periodo === "custom") {
      return data.ganhos.filter(
        (g) => (!de || g.iso >= de) && (!ate || g.iso <= ate),
      );
    }
    if (periodo === "hoje") {
      const hoje = isoHoje();
      return data.ganhos.filter((g) => g.iso === hoje);
    }
    if (periodo === "ontem") {
      const ontem = offsetDia(isoHoje(), -1);
      return data.ganhos.filter((g) => g.iso === ontem);
    }
    const d = new Date();
    const diaSemana = d.getDay();
    const inicioSemana = offsetDia(isoHoje(), -((diaSemana + 6) % 7));
    const fimSemana = offsetDia(inicioSemana, 6);
    return data.ganhos.filter((g) => g.iso >= inicioSemana && g.iso <= fimSemana);
  }, [data.ganhos, periodo, de, ate]);

  const recentes = ganhos.slice(0, 12);

  const total = ganhos.reduce((s, g) => s + g.faturamento, 0);
  const corridas = ganhos.reduce((s, g) => s + g.corridas, 0);

  const periodoLabel = PERIODOS.find((p) => p.id === periodo)?.label ?? "";

  const { serie, tituloGrafico, descricaoGrafico } = useMemo(() => {
    const todos = data.ganhos;

    const somaDia = (iso: string) =>
      todos.filter((g) => g.iso === iso).reduce((s, g) => s + g.faturamento, 0);

    const labelDia = (iso: string) => {
      const parts = iso.split("-").map(Number);
      const y = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      const d = parts[2] ?? 0;
      const date = new Date(y, m - 1, d);
      return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} ${DIAS_SEMANA[date.getDay()]}`;
    };

    const intervaloDias = (inicio: string, fim: string) => {
      const out: { key: string; label: string; valor: number }[] = [];
      let cursor = inicio;
      let guard = 0;
      while (cursor <= fim && guard < 400) {
        out.push({ key: cursor, label: labelDia(cursor), valor: somaDia(cursor) });
        cursor = offsetDia(cursor, 1);
        guard++;
      }
      return out.slice(-31);
    };

    if (periodo === "hoje" || periodo === "ontem") {
      const iso = periodo === "hoje" ? isoHoje() : offsetDia(isoHoje(), -1);
      const mapa = new Map<string, number>();
      for (const g of todos) {
        if (g.iso !== iso) continue;
        const app = g.plataforma || "Sem app";
        mapa.set(app, (mapa.get(app) ?? 0) + g.faturamento);
      }
      const serieApps = [...mapa.entries()]
        .map(([label, valor]) => ({ key: label, label, valor }))
        .sort((a, b) => b.valor - a.valor);
      return {
        serie: serieApps,
        tituloGrafico: periodo === "hoje" ? "Ganhos de hoje por app" : "Ganhos de ontem por app",
        descricaoGrafico: labelDia(iso),
      };
    }

    if (periodo === "custom") {
      const fim = ate || isoHoje();
      const inicio = de || offsetDia(fim, -6);
      return {
        serie: intervaloDias(inicio, fim),
        tituloGrafico: "Ganhos por dia",
        descricaoGrafico: "Período personalizado",
      };
    }

    const diaSemana = new Date().getDay();
    const inicioSemana = offsetDia(isoHoje(), -((diaSemana + 6) % 7));
    const fimSemana = offsetDia(inicioSemana, 6);
    return {
      serie: intervaloDias(inicioSemana, fimSemana),
      tituloGrafico: "Ganhos da semana por dia",
      descricaoGrafico: "De segunda a domingo",
    };
  }, [data.ganhos, periodo, de, ate]);

  const max = Math.max(1, ...serie.map((d) => d.valor));


  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Ganhos diários"
        subtitle={`${ganhos.length} lançamentos no período`}
      />

      <div className="flex flex-col items-center gap-3">
        <AtalhoPaginas />
        <NovoLancamento tipo="ganho" />
      </div>

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
        <StatCard
          label={`Faturamento — ${periodoLabel}`}
          value={brl(total)}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard label={`Corridas — ${periodoLabel}`} value={String(corridas)} icon={Bike} />
        <StatCard
          label="Ticket médio"
          value={brl(corridas ? total / corridas : 0)}
          hint="Por corrida concluída"
          icon={TrendingUp}
          tone="warning"
        />
      </div>

      <SectionCard title={tituloGrafico} description={descricaoGrafico}>
        {serie.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum ganho lançado neste dia.
          </p>
        ) : (
          <div className="flex h-48 items-stretch gap-2 sm:gap-4">
            {serie.map((d) => (
              <div key={d.key} className="flex h-full flex-1 flex-col justify-end gap-2">
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
        )}
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
