import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bike,
  CalendarClock,
  CircleDollarSign,
  Edit3,
  Fuel,
  HandCoins,
  ListChecks,
  Receipt,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatISO, startOfWeek, endOfWeek } from "date-fns";

import { AcoesLancamento, NovoLancamento, hojeInputDate } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMetaSemanalFn, salvarMetaSemanalFn } from "@/lib/metas.functions";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl, statusManutencao } from "@/lib/sheets-types";
import type { Abastecimento, Despesa, Ganho, Manutencao, Repasse } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

export const metaQueryOptions = () =>
  queryOptions({
    queryKey: ["meta-semanal"],
    queryFn: () => getMetaSemanalFn(),
    staleTime: 60_000,
  });

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
    context.queryClient.ensureQueryData(metaQueryOptions());
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

function semanaAtualIso(): [string, string] {
  const hoje = new Date();
  const inicio = startOfWeek(hoje, { weekStartsOn: 1 });
  const fim = endOfWeek(hoje, { weekStartsOn: 1 });
  return [formatISO(inicio, { representation: "date" }), formatISO(fim, { representation: "date" })];
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
  const { data: metaSemanal } = useSuspenseQuery(metaQueryOptions());
  const { usuario } = Route.useRouteContext();
  const saudacao = useSaudacao();
  const primeiroNome = (usuario?.nome ?? "").trim().split(/\s+/)[0] ?? "";
  const hoje = hojeIso();
  const ontem = ontemIso();

  const ganhosHoje = useMemo(() => data.ganhos.filter((g) => g.iso === hoje), [data.ganhos, hoje]);
  const ganhosOntem = useMemo(() => data.ganhos.filter((g) => g.iso === ontem), [data.ganhos, ontem]);
  const abastHoje = useMemo(() => data.abastecimentos.filter((a) => a.iso === hoje), [data.abastecimentos, hoje]);
  const despesasHoje = useMemo(() => data.despesas.filter((d) => d.iso === hoje), [data.despesas, hoje]);

  const [inicioSemana, fimSemana] = semanaAtualIso();
  const ganhosSemana = useMemo(
    () => data.ganhos.filter((g) => g.iso >= inicioSemana && g.iso <= fimSemana),
    [data.ganhos, inicioSemana, fimSemana],
  );
  const faturamentoSemana = ganhosSemana.reduce((s, g) => s + g.faturamento, 0);
  const metaDefinida = metaSemanal && metaSemanal > 0;
  const progressoMeta = metaDefinida ? Math.min(100, (faturamentoSemana / metaSemanal) * 100) : 0;
  const faltanteMeta = metaDefinida ? Math.max(0, metaSemanal - faturamentoSemana) : 0;

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

  const manutencoesAviso = useMemo(() => {
    const ultimos = new Map<string, Manutencao>();
    for (const m of data.manutencoes) {
      const chave = `${m.veiculo}|${m.servico}`.toUpperCase();
      if (!ultimos.has(chave)) ultimos.set(chave, m);
    }
    return [...ultimos.values()]
      .map((m) => ({ m, s: statusManutencao(m, data.odometroAtual) }))
      .filter((i) => i.s.nivel !== "ok")
      .sort((a, b) => a.s.restante - b.s.restante);
  }, [data.manutencoes, data.odometroAtual]);

  const vencidas = manutencoesAviso.filter((i) => i.s.nivel === "vencido");
  const proximas = manutencoesAviso.filter((i) => i.s.nivel === "atencao");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={`${saudacao}, ${(primeiroNome || "entregador").toUpperCase()}!`}
        subtitle="Aqui está o resumo do seu dia de trabalho."
      />

      {manutencoesAviso.length > 0 && (
        <SectionCard
          title="Manutenção"
          description={
            vencidas.length > 0
              ? `${vencidas.length} item${vencidas.length === 1 ? "" : "s"} vencido${vencidas.length === 1 ? "" : "s"} e ${proximas.length} próximo${proximas.length === 1 ? "" : "s"}`
              : `${proximas.length} manutenção${proximas.length === 1 ? "" : "s"} próxima${proximas.length === 1 ? "" : "s"} de vencer`
          }
          className="border-warning/30 bg-warning/5"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {manutencoesAviso.map(({ m, s }) => {
              const vencido = s.nivel === "vencido";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3",
                    vencido
                      ? "border-destructive/40 bg-destructive/10"
                      : "border-warning/40 bg-warning/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full",
                        vencido ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                      )}
                    >
                      {vencido ? <AlertTriangle className="size-4" /> : <CalendarClock className="size-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{m.servico}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.veiculo} · Troca em {m.kmTroca.toLocaleString("pt-BR")} km
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold num">
                      {vencido ? "Vencido" : "A vencer"}
                    </p>
                    <p className="text-xs text-muted-foreground num">
                      {Math.abs(s.restante).toLocaleString("pt-BR")} km
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Odômetro atual: <span className="num font-medium text-foreground">{data.odometroAtual.toLocaleString("pt-BR")} km</span>
            </p>
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <Link to="/manutencao">
                Ver manutenção <Wrench className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        </SectionCard>
      )}



      <div className="flex flex-wrap gap-2">
        <NovoLancamento tipo="ganho" rotulo="Lançar ganho diário" />
        <NovoLancamento tipo="abastecimento" />
        <NovoLancamento tipo="despesa" />
        <NovoLancamento tipo="repasse" />
        <NovoLancamento
          tipo="repasse"
          rotulo="Recebi na entrega"
          variant="outline"
          icone={HandCoins}
          titulo="Recebi na entrega (dinheiro / Pix)"
          iniciais={{ data: hojeInputDate(), forma: "Dinheiro" }}
        />
      </div>


      <SectionCard title="Hoje" description="Resumo dos lançamentos do dia">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardMetaSemanal
            faturamento={faturamentoSemana}
            meta={metaSemanal}
            inicio={inicioSemana}
            fim={fimSemana}
          />
          <StatCard
            label="Faturamento hoje"
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
