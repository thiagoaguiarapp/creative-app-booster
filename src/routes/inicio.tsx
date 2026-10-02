import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bike,
  CalendarClock,
  ChevronRight,
  Fuel,
  Receipt,
  Edit3,
  HandCoins,
  Target,

  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatISO, startOfWeek, endOfWeek, parseISO, addDays, format } from "date-fns";

import { AtalhoPaginas } from "@/components/atalho-paginas";
import { NovoLancamentoRapido } from "@/components/lancamento-form";
import { LancamentoRapidoApp } from "@/components/lancamento-rapido-app";
import { OnboardingBoasVindas } from "@/components/onboarding-boas-vindas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMetaSemanalFn, salvarMetaSemanalFn } from "@/lib/metas.functions";
import { limpaDescricao } from "@/lib/pagamentos";
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

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Início — No Corre" },
      {
        name: "description",
        content: "Resumo do dia, acesso rápido e controle completo dos ganhos e gastos do entregador.",
      },
      { property: "og:title", content: "Início — No Corre" },
      {
        property: "og:description",
        content: "Resumo do dia, acesso rápido e controle completo dos ganhos e gastos do entregador.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(painelQueryOptions());
    context.queryClient.ensureQueryData(metaQueryOptions());
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">
      {(error as Error).message}
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
  const hojeIso = format(new Date(), "yyyy-MM-dd");

  const ganhosSemana = useMemo(
    () => data.ganhos.filter((g) => g.iso >= inicioSemana && g.iso <= fimSemana),
    [data.ganhos, inicioSemana, fimSemana],
  );
  const faturamentoSemana = ganhosSemana.reduce((s, g) => s + g.faturamento, 0);

  const hoje = useMemo(() => {
    const g = data.ganhos.filter((x) => x.iso === hojeIso);
    const fat = g.reduce((s, x) => s + x.faturamento, 0);
    const entregas = g.reduce((s, x) => s + x.corridas, 0);
    const comb = data.abastecimentos
      .filter((x) => x.iso === hojeIso)
      .reduce((s, x) => s + x.valorPago, 0);
    const desp = data.despesas
      .filter((x) => x.iso === hojeIso)
      .reduce((s, x) => s + x.valor, 0);
    const gastos = comb + desp;
    return { fat, entregas, gastos, liquido: fat - gastos };
  }, [data, hojeIso]);

  const recentes = useMemo(() => {
    const todos: LancamentoHoje[] = [
      ...data.ganhos.map((g) => ({ tipo: "ganho" as const, data: g })),
      ...data.abastecimentos.map((a) => ({ tipo: "abastecimento" as const, data: a })),
      ...data.despesas.map((d) => ({ tipo: "despesa" as const, data: d })),
      ...data.repasses.map((r) => ({ tipo: "repasse" as const, data: r })),
    ];
    return todos
      .filter((t) => t.data.iso && t.data.iso <= hojeIso)
      .sort((a, b) => b.data.iso.localeCompare(a.data.iso))
      .slice(0, 8);
  }, [data, hojeIso]);

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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 py-1 sm:gap-5">
      <div className="flex flex-col gap-0.5">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">
          {saudacao}, {primeiroNome || "entregador"}!
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">Seu resumo de hoje</p>
      </div>

      {manutencoesAviso.length > 0 && (
        <Link
          to="/manutencao"
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
            vencidas.length > 0
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-warning/40 bg-warning/10 text-warning",
          )}
        >
          {vencidas.length > 0 ? <AlertTriangle className="size-4 shrink-0" /> : <CalendarClock className="size-4 shrink-0" />}
          <span className="min-w-0 flex-1 truncate">
            {manutencoesAviso[0]!.m.servico}
            {manutencoesAviso.length > 1 ? ` e mais ${manutencoesAviso.length - 1}` : ""} —{" "}
            {vencidas.length > 0 ? "manutenção vencida" : "manutenção próxima"}
          </span>
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      )}

      <div className="panel p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
            Hoje no bolso
          </p>
          <span className="text-[10px] text-muted-foreground sm:text-xs">
            {hoje.entregas} entrega{hoje.entregas === 1 ? "" : "s"}
          </span>
        </div>
        <p className={cn("num mt-1 font-display text-3xl font-semibold", hoje.liquido >= 0 ? "text-success" : "text-destructive")}>
          {brl(hoje.liquido)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Faturado</p>
            <p className="num text-sm font-semibold text-success">{brl(hoje.fat)}</p>
          </div>
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Gastos</p>
            <p className="num text-sm font-semibold text-destructive">{brl(hoje.gastos)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <LancamentoRapidoApp ganhos={data.ganhos} plataformas={usuario?.plataformas ?? []} />
        <OnboardingBoasVindas
          aberto={!!usuario && !usuario.onboardingOk && usuario.veiculos.length === 0}
        />
        <NovoLancamentoRapido className="w-full shadow-lg sm:w-auto sm:flex-none" />
      </div>

      <CardPerformance
        ganhos={ganhosSemana}
        faturamento={faturamentoSemana}
        meta={metaSemanal}
        inicio={inicioSemana}
        hojeIso={hojeIso}
      />

      <div className="panel p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
            Últimos lançamentos
          </p>
          <Link to="/lancamentos" className="text-xs text-primary">Ver todos</Link>
        </div>
        {recentes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentes.map((item) => {
              const { Icone, positivo, titulo, sub, valor } = infoLancamento(item);
              return (
                <li key={`${item.tipo}-${item.data.id}`} className="flex items-center gap-3 py-2.5">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      positivo ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                    )}
                  >
                    <Icone className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{titulo}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.data.data} · {sub}
                    </p>
                  </div>
                  <span className={cn("num shrink-0 text-sm font-semibold", positivo ? "text-success" : "text-destructive")}>
                    {positivo ? "+ " : "- "}
                    {brl(valor)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex justify-center">
        <AtalhoPaginas />
      </div>
    </div>
  );
}

function CardPerformance({
  ganhos,
  faturamento,
  meta,
  inicio,
  hojeIso,
}: {
  ganhos: Ganho[];
  faturamento: number;
  meta: number;
  inicio: string;
  hojeIso: string;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(meta > 0 ? meta : ""));
  const salvar = useServerFn(salvarMetaSemanalFn);
  const queryClient = useQueryClient();

  const metaDefinida = meta > 0;
  const progresso = metaDefinida ? Math.min(100, (faturamento / meta) * 100) : 0;
  const faltante = metaDefinida ? Math.max(0, meta - faturamento) : 0;

  const dias = ["S", "T", "Q", "Q", "S", "S", "D"];
  const valores = useMemo(() => {
    const ini = parseISO(inicio);
    const arr = Array.from({ length: 7 }, (_, i) => {
      const dia = format(addDays(ini, i), "yyyy-MM-dd");
      const total = ganhos.filter((g) => g.iso === dia).reduce((s, g) => s + g.faturamento, 0);
      return { dia, label: dias[i]!, total };
    });
    const max = Math.max(...arr.map((d) => d.total), 1);
    return arr.map((d) => ({ ...d, pct: (d.total / max) * 100 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ganhos, inicio]);

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
    <div className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
            Semana
          </p>
          <p className="num mt-0.5 font-display text-2xl font-semibold text-primary">{brl(faturamento)}</p>
          <p className="text-[11px] text-muted-foreground">
            {metaDefinida
              ? faltante > 0
                ? `Faltam ${brl(faltante)} da meta de ${brl(meta)}`
                : `Meta de ${brl(meta)} batida!`
              : "Sem meta definida"}
          </p>
        </div>
        <div className="flex h-16 items-end gap-1">
          {valores.map((v, i) => (
            <div key={v.dia} className="flex flex-col items-center gap-1">
              <div
                className={cn("w-3 rounded-sm", v.dia === hojeIso ? "bg-primary" : "bg-primary/40")}
                style={{ height: `${Math.max(6, v.pct * 0.48)}px` }}
                title={`${brl(v.total)}`}
              />
              <span className={cn("text-[9px]", v.dia === hojeIso ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {v.label}
                <span className="sr-only">{i}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      {metaDefinida && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
        </div>
      )}
      {editando ? (
        <div className="mt-3 flex items-center gap-2">
          <Input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="R$ 0,00" className="h-8 text-sm" autoFocus />
          <Button size="sm" className="h-8 text-xs" onClick={handleSalvar}>Salvar</Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditando(false)}>Cancelar</Button>
        </div>
      ) : (
        <Button variant="link" size="sm" className="mt-1 h-auto px-0 py-1 text-xs" onClick={() => setEditando(true)}>
          {metaDefinida ? <Edit3 className="mr-1 size-3" /> : <Target className="mr-1 size-3" />}
          {metaDefinida ? "Editar meta" : "Definir meta"}
        </Button>
      )}
    </div>
  );
}

function infoLancamento(item: LancamentoHoje) {
  switch (item.tipo) {
    case "ganho":
      return { Icone: Bike, positivo: true, titulo: item.data.plataforma || "Ganho", sub: `${item.data.corridas || 0} entregas`, valor: item.data.faturamento };
    case "abastecimento":
      return { Icone: Fuel, positivo: false, titulo: "Abastecimento", sub: `${item.data.litros.toFixed(1)} L`, valor: item.data.valorPago };
    case "despesa":
      return { Icone: Receipt, positivo: false, titulo: item.data.categoria || "Despesa", sub: limpaDescricao(item.data.descricao) || item.data.pagamento || "—", valor: item.data.valor };
    case "repasse":
      return { Icone: HandCoins, positivo: true, titulo: `Repasse ${item.data.aplicativo}`, sub: item.data.forma || "—", valor: item.data.valor };
  }
}
