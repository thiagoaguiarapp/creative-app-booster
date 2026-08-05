import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bike,
  CircleDollarSign,
  Fuel,
  HandCoins,
  ListChecks,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { NovoLancamento, hojeInputDate } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";
import type { Abastecimento, Despesa, Ganho, Repasse } from "@/lib/sheets-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Rota Control" },
      {
        name: "description",
        content: "Resumo do dia, acesso rápido e controle completo dos ganhos e gastos do entregador.",
      },
      { property: "og:title", content: "Início — Rota Control" },
      {
        property: "og:description",
        content: "Resumo do dia, acesso rápido e controle completo dos ganhos e gastos do entregador.",
      },
      { property: "og:url", content: "https://creative-app-booster.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://creative-app-booster.lovable.app/" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(painelQueryOptions());
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
  component: Home,
});

function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ontemIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function useSaudacao() {
  const [texto, setTexto] = useState("Olá");
  useEffect(() => {
    const hora = new Date().getHours();
    setTexto(hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite");
  }, []);
  return texto;
}

type LancamentoHoje =
  | { tipo: "ganho"; data: Ganho }
  | { tipo: "abastecimento"; data: Abastecimento }
  | { tipo: "despesa"; data: Despesa }
  | { tipo: "repasse"; data: Repasse };

const atalhos = [
  { title: "Ganhos diários", url: "/ganhos-diarios", icon: Bike, desc: "Corridas e faturamento" },
  { title: "Abastecimento", url: "/abastecimento", icon: Fuel, desc: "Consumo e km/L" },
  { title: "Despesas", url: "/despesas", icon: Receipt, desc: "Custos operacionais" },
  { title: "Recebimento / Repasse", url: "/repasses", icon: Wallet, desc: "Conciliação por app" },
  { title: "Manutenção", url: "/manutencao", icon: Wrench, desc: "Troca e revisão" },
  { title: "Relatório", url: "/relatorio", icon: BarChart3, desc: "Análise por período" },
  { title: "Todos os lançamentos", url: "/lancamentos", icon: ListChecks, desc: "Consulta e edição" },
];

function Home() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const hoje = hojeIso();
  const ontem = ontemIso();

  const ganhosHoje = useMemo(() => data.ganhos.filter((g) => g.iso === hoje), [data.ganhos, hoje]);
  const ganhosOntem = useMemo(() => data.ganhos.filter((g) => g.iso === ontem), [data.ganhos, ontem]);
  const abastHoje = useMemo(() => data.abastecimentos.filter((a) => a.iso === hoje), [data.abastecimentos, hoje]);
  const despesasHoje = useMemo(() => data.despesas.filter((d) => d.iso === hoje), [data.despesas, hoje]);

  const faturamentoHoje = ganhosHoje.reduce((s, g) => s + g.faturamento, 0);
  const faturamentoOntem = ganhosOntem.reduce((s, g) => s + g.faturamento, 0);
  const corridasHoje = ganhosHoje.reduce((s, g) => s + g.corridas, 0);
  const corridasOntem = ganhosOntem.reduce((s, g) => s + g.corridas, 0);
  const despesasTotal = despesasHoje.reduce((s, d) => s + d.valor, 0);
  const litrosHoje = abastHoje.reduce((s, a) => s + a.litros, 0);
  const abastValorHoje = abastHoje.reduce((s, a) => s + a.valorPago, 0);

  const variacaoFaturamento =
    faturamentoOntem > 0 ? ((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100 : null;
  const variacaoCorridas =
    corridasOntem > 0 ? ((corridasHoje - corridasOntem) / corridasOntem) * 100 : null;

  const recentes = useMemo(() => {
    const todos: LancamentoHoje[] = [
      ...ganhosHoje.map((g) => ({ tipo: "ganho" as const, data: g })),
      ...abastHoje.map((a) => ({ tipo: "abastecimento" as const, data: a })),
      ...despesasHoje.map((d) => ({ tipo: "despesa" as const, data: d })),
      ...data.repasses.filter((r) => r.iso === hoje).map((r) => ({ tipo: "repasse" as const, data: r })),
    ];
    return todos
      .sort((a, b) => b.data.iso.localeCompare(a.data.iso))
      .slice(0, 5);
  }, [ganhosHoje, abastHoje, despesasHoje, data.repasses, hoje]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={`${saudacao()}, entregador!`}
        subtitle="Aqui está o resumo do seu dia de trabalho."
        action={<NovoLancamento tipo="ganho" />}
      />

      <div className="flex flex-wrap gap-2">
        <NovoLancamento tipo="ganho" />
        <NovoLancamento tipo="abastecimento" />
        <NovoLancamento tipo="despesa" />
        <NovoLancamento tipo="repasse" />
      </div>

      <SectionCard title="Hoje" description="Resumo dos lançamentos do dia">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Faturamento"
            value={brl(faturamentoHoje)}
            hint={variacaoFaturamento !== null ? `${variacaoFaturamento >= 0 ? "+" : ""}${variacaoFaturamento.toFixed(0)}% vs ontem` : "Sem dados de ontem"}
            icon={CircleDollarSign}
            tone="success"
          />
          <StatCard
            label="Corridas"
            value={String(corridasHoje)}
            hint={variacaoCorridas !== null ? `${variacaoCorridas >= 0 ? "+" : ""}${variacaoCorridas.toFixed(0)}% vs ontem` : "Sem dados de ontem"}
            icon={Bike}
          />
          <StatCard
            label="Despesas"
            value={brl(despesasTotal)}
            hint={`${despesasHoje.length} lançamento${despesasHoje.length === 1 ? "" : "s"}`}
            icon={TrendingDown}
            tone="warning"
          />
          <StatCard
            label="Abastecimento"
            value={`${litrosHoje.toFixed(2)} L`}
            hint={abastHoje.length ? brl(abastValorHoje) : "Sem abastecimento hoje"}
            icon={Fuel}
          />
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Últimos lançamentos de hoje" description="Atividades registradas hoje">
          {recentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento hoje.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentes.map((item) => (
                  <TableRow key={`${item.tipo}-${item.data.id}`}>
                    <TableCell>
                      <Badge variant="outline">{labelTipo(item.tipo)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{descricaoLancamento(item)}</TableCell>
                    <TableCell className="num text-right font-medium">{valorLancamento(item)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard title="Acesso rápido" description="Navegue entre as áreas do app">
          <div className="grid gap-3 sm:grid-cols-2">
            {atalhos.map((item) => (
              <Card key={item.url} className="group transition-colors hover:bg-accent/40">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <item.icon className="size-4 text-primary" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                  <Button variant="link" size="sm" className="h-auto px-0 py-1 text-xs" asChild>
                    <Link to={item.url}>
                      Acessar <ArrowRight className="ml-1 size-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function labelTipo(tipo: LancamentoHoje["tipo"]) {
  switch (tipo) {
    case "ganho":
      return "Ganho";
    case "abastecimento":
      return "Combustível";
    case "despesa":
      return "Despesa";
    case "repasse":
      return "Repasse";
  }
}

function descricaoLancamento(item: LancamentoHoje) {
  switch (item.tipo) {
    case "ganho":
      return `${item.data.plataforma} • ${item.data.corridas || 0} corridas`;
    case "abastecimento":
      return `${item.data.litros.toFixed(2)} L • ${item.data.odometro.toFixed(0)} km`;
    case "despesa":
      return `${item.data.categoria}${item.data.descricao ? ` — ${item.data.descricao}` : ""}`;
    case "repasse":
      return `${item.data.aplicativo} • ${item.data.forma || "—"}`;
  }
}

function valorLancamento(item: LancamentoHoje) {
  switch (item.tipo) {
    case "ganho":
      return brl(item.data.faturamento);
    case "abastecimento":
      return brl(item.data.valorPago);
    case "despesa":
      return brl(item.data.valor);
    case "repasse":
      return (
        <span className="inline-flex items-center gap-1">
          <HandCoins className="size-3 text-success" />
          {brl(item.data.valor)}
        </span>
      );
  }
}
