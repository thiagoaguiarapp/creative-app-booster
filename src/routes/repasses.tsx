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
  

  const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

  const porApp = useMemo(() => {
    const mapa = new Map<string, { app: string; faturado: number; recebido: number }>();
    const pegar = (nome: string) => {
      const chave = norm(nome);
      let item = mapa.get(chave);
      if (!item) {
        item = { app: nome.trim() || "—", faturado: 0, recebido: 0 };
        mapa.set(chave, item);
      }
      return item;
    };
    for (const g of ganhos) pegar(g.plataforma).faturado += g.faturamento;
    for (const r of repasses) {
      if (ehExtra(r.aplicativo)) continue;
      pegar(r.aplicativo).recebido += r.valor;
    }
    return Array.from(mapa.values())
      .map((i) => ({ ...i, pendente: i.faturado - i.recebido }))
      .filter((i) => i.faturado !== 0 || i.recebido !== 0)
      .sort((a, b) => b.faturado - a.faturado || b.recebido - a.recebido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ganhos, repasses]);

  const pendenteTotal = porApp.reduce((s, a) => s + Math.max(0, a.pendente), 0);

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
        <StatCard
          label="A receber"
          value={brl(pendenteTotal)}
          icon={Clock}
          tone="warning"
          hint="Soma das pendências por plataforma"
        />
        <StatCard label="Repasses" value={String(repasses.length)} icon={Landmark} />
        <StatCard label="Gorjetas" value={brl(gorjetas)} icon={HandCoins} tone="success" />
        <StatCard label="Sobra de troco" value={brl(sobraTroco)} icon={Coins} tone="success" />
      </div>

      <SectionCard
        title="Conciliação por aplicativo"
        description="Faturado no período x repasses recebidos"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aplicativo</TableHead>
              <TableHead className="text-right">Faturado</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              <TableHead className="text-right">Falta receber</TableHead>
              <TableHead className="w-24 text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {porApp.map((a) => {
              const pct = a.faturado > 0 ? Math.round((a.recebido / a.faturado) * 100) : 100;
              return (
                <TableRow key={a.app}>
                  <TableCell className="font-medium">{a.app}</TableCell>
                  <TableCell className="num text-right">{brl(a.faturado)}</TableCell>
                  <TableCell className="num text-right text-success">{brl(a.recebido)}</TableCell>
                  <TableCell
                    className={`num text-right ${a.pendente > 0.009 ? "text-warning" : a.pendente < -0.009 ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {brl(a.pendente)}
                  </TableCell>
                  <TableCell className="num text-right text-muted-foreground">{pct}%</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="num text-right font-semibold">{brl(faturado)}</TableCell>
              <TableCell className="num text-right font-semibold text-success">
                {brl(recebidoPlataformas)}
              </TableCell>
              <TableCell className="num text-right font-semibold text-warning">
                {brl(pendenteTotal)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
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
