import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Receipt, Search, TrendingDown, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { AtalhoPaginas } from "@/components/atalho-paginas";
import { Detalhe, LinhaDetalhavel } from "@/components/linha-detalhe";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { painelQueryOptions } from "@/lib/painel-query";
import {
  isoCompra,
  limpaDescricao,
  normalizaForma,
  numeroParcela,
  semMarcaParcela,
  totalParcelas,
} from "@/lib/pagamentos";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

function paraBr(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}


export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Rota Control" },
      {
        name: "description",
        content: "Controle de despesas operacionais do entregador por categoria e período.",
      },
      { property: "og:title", content: "Despesas — Rota Control" },
      {
        property: "og:description",
        content: "Controle de despesas operacionais do entregador por categoria e período.",
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
  component: DespesasPage,
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

function normaliza(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function DespesasPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("atual");
  const [busca, setBusca] = useState("");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const todas = useMemo(
    () =>
      data.despesas.map((d) => ({
        ...d,
        compraIso: isoCompra(d.descricao, d.iso),
        descricao: limpaDescricao(d.descricao),
      })),
    [data.despesas],
  );

  const despesas = useMemo(() => {
    let lista = todas;
    if (periodo !== "total") {
      const p = prefixoMes(periodo === "atual" ? 0 : -1);
      lista = lista.filter((d) => d.iso.startsWith(p));
    }
    if (!busca.trim()) return lista;
    const termo = normaliza(busca);
    return lista.filter((d) => {
      const campos = [
        d.descricao,
        d.categoria,
        d.pagamento,
        d.data,
        paraBr(d.compraIso),
        brl(d.valor),
      ];
      return campos.some((c) => normaliza(c).includes(termo));
    });
  }, [todas, periodo, busca]);

  const recentes = despesas.slice(0, 15);

  const total = despesas.reduce((s, d) => s + d.valor, 0);

  const { pagoNoMes, aPagarDepois } = useMemo(() => {
    let pago = 0;
    let depois = 0;
    for (const d of despesas) {
      if (d.iso.slice(0, 7) === d.compraIso.slice(0, 7)) pago += d.valor;
      else depois += d.valor;
    }
    return { pagoNoMes: pago, aPagarDepois: depois };
  }, [despesas]);

  const categorias = Array.from(new Set(despesas.map((d) => d.categoria)))
    .map((c) => ({
      nome: c,
      valor: despesas.filter((d) => d.categoria === c).reduce((s, d) => s + d.valor, 0),
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Despesas"
        subtitle="Custos operacionais fora do combustível "
      />

      <div className="flex flex-col items-center gap-3">
        <AtalhoPaginas />
        <NovoLancamento tipo="despesa" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Procurar despesa..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={cn("h-9 pl-9 pr-8", busca && "pr-8")}
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total do período" value={brl(total)} icon={TrendingDown} tone="destructive" />
        <StatCard label="Lançamentos" value={String(despesas.length)} icon={Receipt} />
        <StatCard
          label="Média por lançamento"
          value={brl(despesas.length ? total / despesas.length : 0)}
          icon={Wallet}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">Pago no mês da despesa</span>
          <span className="num font-semibold">{brl(pagoNoMes)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">A pagar em meses seguintes (crédito)</span>
          <span className="num font-semibold text-warning">{brl(aPagarDepois)}</span>
        </div>
      </div>

      <SectionCard title="Por categoria">
        <div className="flex flex-col gap-3">
          {categorias.map((c) => (
            <div key={c.nome} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-sm text-muted-foreground">{c.nome}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${total ? (c.valor / total) * 100 : 0}%` }}
                />
              </div>
              <span className="num w-24 text-right text-sm font-medium">{brl(c.valor)}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Lançamentos" description="Toque na linha para ver os detalhes">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((d) => {
              const aberto = abertoId === d.id;
              const total = totalParcelas(d.descricao);
              const credito = normalizaForma(d.pagamento) === "Crédito";
              return (
                <LinhaDetalhavel
                  key={d.id}
                  aberto={aberto}
                  onToggle={() => setAbertoId(aberto ? null : d.id)}
                  colunas={4}
                  celulas={
                    <>
                      <TableCell className="num">
                        {d.data}
                        {credito && (
                          <span className="block text-xs text-muted-foreground">
                            compra {paraBr(d.compraIso)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{d.categoria}</Badge>
                      </TableCell>
                      <TableCell className="num text-right font-semibold text-destructive">
                        {brl(d.valor)}
                      </TableCell>
                    </>
                  }
                  detalhes={
                    <>
                      <Detalhe
                        rotulo="Descrição"
                        valor={semMarcaParcela(d.descricao)}
                      />
                      <Detalhe rotulo="Categoria" valor={d.categoria} />
                      <Detalhe rotulo="Pagamento" valor={d.pagamento} />
                      <Detalhe rotulo="Data da compra" valor={paraBr(d.compraIso)} />
                      <Detalhe rotulo="Vencimento" valor={d.data} />
                      <Detalhe
                        rotulo="Parcela"
                        valor={total > 1 ? `${numeroParcela(d.descricao)}/${total}` : "Única"}
                      />
                      <Detalhe rotulo="Valor" valor={brl(d.valor)} />
                    </>
                  }
                  acoes={<AcoesLancamento tipo="despesa" registro={d} />}
                />
              );
            })}
            {recentes.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                  {busca ? "Nenhuma despesa encontrada para a busca." : "Nenhuma despesa no período."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
