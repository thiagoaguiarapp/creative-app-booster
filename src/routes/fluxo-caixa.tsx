import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  ChevronDown,
  HandCoins,
  Scale,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AtalhoPaginas } from "@/components/atalho-paginas";
import { NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { faltaReceber, montaFluxo } from "@/lib/fluxo-caixa";
import { painelQueryOptions } from "@/lib/painel-query";
import { montaPagamentos, parcelasEmAberto, rotuloMes } from "@/lib/pagamentos";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fluxo-caixa")({
  head: () => ({
    meta: [
      { title: "Fluxo de Caixa — Rota Control" },
      {
        name: "description",
        content:
          "Entradas, saídas, saldo e o que falta pagar e receber em cada mês.",
      },
      { property: "og:title", content: "Fluxo de Caixa — Rota Control" },
      {
        property: "og:description",
        content:
          "Entradas, saídas, saldo e o que falta pagar e receber em cada mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  component: FluxoCaixaPage,
});

type Periodo = "atual" | "passado" | "3m" | "6m" | "total";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "atual", label: "Mês atual" },
  { id: "passado", label: "Mês passado" },
  { id: "3m", label: "3 meses" },
  { id: "6m", label: "6 meses" },
  { id: "total", label: "Total" },
];

function prefixoMes(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function FluxoCaixaPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("6m");
  const [mesAberto, setMesAberto] = useState<string | null>(null);

  const fluxo = useMemo(() => montaFluxo(data), [data]);

  const meses = useMemo(() => {
    if (periodo === "total") return fluxo;
    if (periodo === "3m" || periodo === "6m") {
      const limite = prefixoMes(periodo === "3m" ? -2 : -5);
      return fluxo.filter((m) => m.mes >= limite);
    }
    const p = prefixoMes(periodo === "atual" ? 0 : -1);
    return fluxo.filter((m) => m.mes === p);
  }, [fluxo, periodo]);

  const entradas = meses.reduce((s, m) => s + m.entradas, 0);
  const saidas = meses.reduce((s, m) => s + m.saidas, 0);
  const saldo = entradas - saidas;

  const pagamentos = useMemo(
    () => montaPagamentos(data.despesas, data.abastecimentos),
    [data.despesas, data.abastecimentos],
  );
  const abertas = useMemo(
    () => parcelasEmAberto(pagamentos, hojeIso()),
    [pagamentos],
  );
  const faltaPagar = abertas.reduce((s, p) => s + p.valor, 0);
  const aReceber = useMemo(() => faltaReceber(data), [data]);

  const maiorBarra = Math.max(
    1,
    ...meses.flatMap((m) => [m.entradas, m.saidas]),
  );
  const grafico = [...meses].sort((a, b) => a.mes.localeCompare(b.mes));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Fluxo de caixa"
        subtitle="Entradas, saídas e saldo mês a mês — o crédito entra no vencimento da parcela"
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          label="Entradas"
          value={brl(entradas)}
          hint="Repasses recebidos + extras"
          icon={ArrowUpCircle}
          tone="success"
        />
        <StatCard
          label="Saídas"
          value={brl(saidas)}
          hint="Pela data do pagamento"
          icon={ArrowDownCircle}
          tone="destructive"
        />
        <StatCard
          label="Saldo"
          value={brl(saldo)}
          hint={saldo >= 0 ? "Positivo no período" : "Negativo no período"}
          icon={Scale}
          tone={saldo >= 0 ? "success" : "destructive"}
        />
        <StatCard
          label="Falta pagar"
          value={brl(faltaPagar)}
          hint={`${abertas.length} parcela${abertas.length === 1 ? "" : "s"} de crédito a vencer`}
          icon={CalendarClock}
          tone="warning"
        />
        <StatCard
          label="Falta receber"
          value={brl(aReceber)}
          hint="Repasses pendentes das plataformas"
          icon={HandCoins}
          tone="warning"
        />
      </div>

      <SectionCard
        title="Entradas x saídas por mês"
        description="Barras verdes: entradas · barras vermelhas: saídas"
      >
        {grafico.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum lançamento no período.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {grafico.map((m) => (
              <div key={m.mes} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm text-muted-foreground">
                  {rotuloMes(m.mes)}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${(m.entradas / maiorBarra) * 100}%` }}
                    />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-destructive"
                      style={{ width: `${(m.saidas / maiorBarra) * 100}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "num w-24 shrink-0 text-right text-sm font-medium",
                    m.saldo >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {brl(m.saldo)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Mês a mês"
        description={`${meses.length} ${meses.length === 1 ? "mês" : "meses"} no período · toque para ver detalhes`}
      >
        {meses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum lançamento no período.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {meses.map((m) => {
              const aberto = mesAberto === m.mes;
              return (
                <div key={m.mes}>
                  <button
                    type="button"
                    onClick={() => setMesAberto(aberto ? null : m.mes)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left"
                    aria-expanded={aberto}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">
                        {rotuloMes(m.mes)}
                      </div>
                      <div className="num mt-0.5 text-xs text-muted-foreground">
                        entrou {brl(m.entradas)} · saiu {brl(m.saidas)}
                        {m.credito > 0 && ` · fatura ${brl(m.credito)}`}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "num text-sm font-semibold",
                          m.saldo >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {brl(m.saldo)}
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          aberto && "rotate-180",
                        )}
                      />
                    </div>
                  </button>
                  {aberto && (
                    <div className="grid gap-4 pb-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Entradas recebidas
                        </p>
                        {m.entradasPorPlataforma.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nada recebido no mês.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {m.entradasPorPlataforma.map((p) => (
                              <div
                                key={p.nome}
                                className="flex items-center justify-between gap-2 text-sm"
                              >
                                <span className="truncate">{p.nome}</span>
                                <span className="num shrink-0 font-medium">
                                  {brl(p.total)}
                                </span>
                              </div>
                            ))}
                            {m.faturado > 0 && (
                              <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5 text-sm text-muted-foreground">
                                <span className="truncate">
                                  Faturado no mês (a receber)
                                </span>
                                <span className="num shrink-0">
                                  {brl(m.faturado)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Saídas por forma de pagamento
                        </p>
                        {m.saidasPorForma.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Sem saídas no mês.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {m.saidasPorForma.map((s) => (
                              <div
                                key={s.forma}
                                className="flex items-center justify-between gap-2 text-sm"
                              >
                                <span className="truncate">
                                  {s.forma === "Outros"
                                    ? "Não informado"
                                    : s.forma}
                                </span>
                                <span
                                  className={cn(
                                    "num shrink-0 font-medium",
                                    s.forma === "Crédito" && "text-warning",
                                  )}
                                >
                                  {brl(s.total)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock className="size-3.5" />
        À vista, Pix e débito entram na data do lançamento; crédito entra no mês
        do vencimento de cada parcela.
      </p>
    </div>
  );
}
