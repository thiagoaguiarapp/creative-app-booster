import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  Edit3,
  HandCoins,
  Target,

  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatISO, startOfWeek, endOfWeek } from "date-fns";

import { AdBanner } from "@/components/ad-banner";
import { NovoLancamentoRapido } from "@/components/lancamento-form";
import { PageHeader, SectionCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function Home() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const { data: metaSemanal } = useSuspenseQuery(metaQueryOptions());
  const { usuario } = Route.useRouteContext();
  const saudacao = useSaudacao();
  const primeiroNome = (usuario?.nome ?? "").trim().split(/\s+/)[0] ?? "";

  const [inicioSemana, fimSemana] = semanaAtualIso();
  const ganhosSemana = useMemo(
    () => data.ganhos.filter((g) => g.iso >= inicioSemana && g.iso <= fimSemana),
    [data.ganhos, inicioSemana, fimSemana],
  );
  const faturamentoSemana = ganhosSemana.reduce((s, g) => s + g.faturamento, 0);
  const metaDefinida = metaSemanal && metaSemanal > 0;
  const progressoMeta = metaDefinida ? Math.min(100, (faturamentoSemana / metaSemanal) * 100) : 0;
  const faltanteMeta = metaDefinida ? Math.max(0, metaSemanal - faturamentoSemana) : 0;


  const recentes = useMemo(() => {
    const todos: LancamentoHoje[] = [
      ...ganhosSemana.map((g) => ({ tipo: "ganho" as const, data: g })),
      ...data.abastecimentos.filter((a) => a.iso >= inicioSemana && a.iso <= fimSemana).map((a) => ({ tipo: "abastecimento" as const, data: a })),
      ...data.despesas.filter((d) => d.iso >= inicioSemana && d.iso <= fimSemana).map((d) => ({ tipo: "despesa" as const, data: d })),
      ...data.repasses.filter((r) => r.iso >= inicioSemana && r.iso <= fimSemana).map((r) => ({ tipo: "repasse" as const, data: r })),
    ];
    return todos
      .sort((a, b) => b.data.iso.localeCompare(a.data.iso))
      .slice(0, 5);
  }, [ganhosSemana, data.abastecimentos, data.despesas, data.repasses, inicioSemana, fimSemana]);

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
    <div className="mx-auto flex max-w-5xl flex-col gap-8 py-2">
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
      <div className="flex justify-center sm:justify-start">
        <NovoLancamentoRapido className="w-full shadow-lg sm:w-auto" />
      </div>

      <div className="grid gap-5">
        <CardMetaSemanal
          faturamento={faturamentoSemana}
          meta={metaSemanal}
          inicio={inicioSemana}
          fim={fimSemana}
        />
      </div>

      <SectionCard title="Últimos lançamentos da semana" description="Atividades registradas nesta semana">
        {recentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento nesta semana.</p>
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


      <AdBanner />
    </div>
  );
}

function CardMetaSemanal({
  faturamento,
  meta,
  inicio,
  fim,
}: {
  faturamento: number;
  meta: number;
  inicio: string;
  fim: string;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(meta > 0 ? meta : ""));
  const salvar = useServerFn(salvarMetaSemanalFn);
  const queryClient = useQueryClient();

  const metaDefinida = meta > 0;
  const progresso = metaDefinida ? Math.min(100, (faturamento / meta) * 100) : 0;
  const faltante = metaDefinida ? Math.max(0, meta - faturamento) : 0;

  async function handleSalvar() {
    const num = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(num) || num < 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    try {
      await salvar({ data: { valor: num } });
      await queryClient.invalidateQueries({ queryKey: ["meta-semanal"] });
      toast.success("Meta semanal salva.");
      setEditando(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar meta.");
    }
  }

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Meta semanal
        </p>
        <Target className="size-4 text-primary" />
      </div>
      <p className={cn("num mt-3 font-display text-3xl font-semibold", metaDefinida ? "text-primary" : "text-muted-foreground")}>
        {brl(faturamento)}
      </p>
      {metaDefinida && (
        <div className="mt-3">
          <Progress value={progresso} />
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Meta: {brl(meta)}</span>
            <span>{faltante > 0 ? `${brl(faltante)} restantes` : "Meta atingida!"}</span>
          </div>
        </div>
      )}
      {!metaDefinida && !editando && (
        <p className="mt-1 text-xs text-muted-foreground">
          Sem meta para {inicio.slice(8, 10)}/{inicio.slice(5, 7)} a {fim.slice(8, 10)}/{fim.slice(5, 7)}.
        </p>
      )}
      {editando ? (
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="R$ 0,00"
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" className="h-8 text-xs" onClick={handleSalvar}>
            Salvar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setEditando(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          variant="link"
          size="sm"
          className="mt-2 h-auto px-0 py-1 text-xs"
          onClick={() => setEditando(true)}
        >
          <Edit3 className="mr-1 size-3" />
          {metaDefinida ? "Editar meta" : "Definir meta"}
        </Button>
      )}
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
