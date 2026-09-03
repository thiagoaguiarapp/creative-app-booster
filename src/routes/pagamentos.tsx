import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CalendarClock, CreditCard, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { AtalhoPaginas } from "@/components/atalho-paginas";
import { NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { painelQueryOptions } from "@/lib/painel-query";
import {
  faturaPorMes,
  montaPagamentos,
  parcelasEmAberto,
  rotuloMes,
  totaisPorForma,
  type Forma,
} from "@/lib/pagamentos";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/pagamentos")({
  head: () => ({
    meta: [
      { title: "Pagamentos — Rota Control" },
      {
        name: "description",
        content:
          "Controle quanto você paga em dinheiro, Pix, débito e crédito, com a fatura do cartão e as parcelas em aberto.",
      },
      { property: "og:title", content: "Pagamentos — Rota Control" },
      {
        property: "og:description",
        content:
          "Controle quanto você paga em dinheiro, Pix, débito e crédito, com a fatura do cartão e as parcelas em aberto.",
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
  component: PagamentosPage,
});

type Periodo = "atual" | "passado" | "total";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "atual", label: "Mês atual" },
  { id: "passado", label: "Mês passado" },
  { id: "total", label: "Total" },
];

const ICONES: Record<Forma, LucideIcon> = {
  Dinheiro: Banknote,
  Pix: Smartphone,
  Débito: Wallet,
  Crédito: CreditCard,
  Outros: Wallet,
};

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

function PagamentosPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("atual");

  const todos = useMemo(
    () => montaPagamentos(data.despesas, data.abastecimentos),
    [data.despesas, data.abastecimentos],
  );

  const doPeriodo = useMemo(() => {
    if (periodo === "total") return todos;
    const p = prefixoMes(periodo === "atual" ? 0 : -1);
    return todos.filter((p2) => p2.isoPagamento.startsWith(p));
  }, [todos, periodo]);

  const totais = totaisPorForma(doPeriodo).filter((t) => t.quantidade > 0 || t.forma !== "Outros");
  const totalPeriodo = doPeriodo.reduce((s, p) => s + p.valor, 0);

  const mesAtual = prefixoMes(0);
  const hoje = hojeIso();
  const saiuNoMes = useMemo(
    () =>
      todos
        .filter((p) => p.isoPagamento.startsWith(mesAtual))
        .reduce((s, p) => s + p.valor, 0),
    [todos, mesAtual],
  );
  const vaiSairDepois = useMemo(
    () => todos.filter((p) => p.isoPagamento > hoje).reduce((s, p) => s + p.valor, 0),
    [todos, hoje],
  );
  const faturas = useMemo(() => faturaPorMes(todos), [todos]);

  const abertas = useMemo(() => parcelasEmAberto(todos, hoje), [todos, hoje]);
  const totalAberto = abertas.reduce((s, p) => s + p.valor, 0);
  const maiorFatura = Math.max(1, ...faturas.map((f) => f.total));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Pagamentos"
        subtitle="Pelo caixa: o crédito entra no mês em que a fatura vence"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Sai neste mês"
          value={brl(saiuNoMes)}
          hint="À vista, Pix, débito e faturas que vencem no mês"
          icon={Wallet}
        />
        <StatCard
          label="Vai sair depois"
          value={brl(vaiSairDepois)}
          hint="Parcelas de crédito que ainda vão vencer"
          icon={CalendarClock}
          tone="warning"
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <AtalhoPaginas />
        <NovoLancamento tipo="despesa" />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {totais
          .filter((t) => t.forma !== "Outros")
          .map((t) => (
            <StatCard
              key={t.forma}
              label={t.forma === "Dinheiro" ? "Dinheiro (à vista)" : t.forma}
              value={brl(t.total)}
              hint={`${t.quantidade} lançamento${t.quantidade === 1 ? "" : "s"}`}
              icon={ICONES[t.forma]}
              tone={t.forma === "Crédito" ? "warning" : "default"}
            />
          ))}
      </div>

      <SectionCard
        title="Participação por forma"
        description={`Total do período: ${brl(totalPeriodo)}`}
      >
        <div className="flex flex-col gap-3">
          {totais.map((t) => (
            <div key={t.forma} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">
                {t.forma === "Outros" ? "Não informado" : t.forma}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${totalPeriodo ? (t.total / totalPeriodo) * 100 : 0}%` }}
                />
              </div>
              <span className="num w-24 text-right text-sm font-medium">{brl(t.total)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Fatura do crédito por mês"
        description="Inclui parcelas que ainda vão vencer"
      >
        {faturas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma compra no crédito.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {faturas.map((f) => (
              <div key={f.mes} className="flex items-center gap-3">
                <span
                  className={`w-24 shrink-0 text-sm ${
                    f.mes === mesAtual ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {rotuloMes(f.mes)}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: `${(f.total / maiorFatura) * 100}%` }}
                  />
                </div>
                <span className="num w-24 text-right text-sm font-medium">{brl(f.total)}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Parcelas em aberto"
        description={`${abertas.length} parcela${abertas.length === 1 ? "" : "s"} · ${brl(totalAberto)} a pagar`}
      >
        {abertas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma parcela futura.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {abertas.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.descricao}</div>
                  <div className="num text-xs text-muted-foreground">
                    vence {p.dataPagamento} · compra {p.data}
                  </div>
                </div>
                <span className="num shrink-0 text-sm font-semibold text-warning">
                  {brl(p.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Lançamentos do período"
        description={`${doPeriodo.length} registros`}
      >
        <div className="flex flex-col divide-y divide-border">
          {doPeriodo.slice(0, 40).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{p.descricao}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="num text-xs text-muted-foreground">
                    {p.forma === "Crédito" ? `compra ${p.data} · vence ${p.dataPagamento}` : p.data}
                  </span>
                  <Badge variant="secondary">{p.origem}</Badge>
                  <Badge variant="outline">
                    {p.forma === "Outros" ? "Não informado" : p.forma}
                  </Badge>
                </div>
              </div>
              <span className="num shrink-0 text-sm font-semibold text-destructive">
                {brl(p.valor)}
              </span>
            </div>
          ))}
          {doPeriodo.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Nenhum pagamento no período.</p>
          )}
        </div>
      </SectionCard>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock className="size-3.5" />
        Compras no crédito vencem no mês seguinte; cada parcela cai um mês depois da anterior.
      </p>
    </div>
  );
}
