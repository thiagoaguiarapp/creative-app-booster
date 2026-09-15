import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Fuel, Receipt, Search, TrendingDown, Wallet, Wrench, X } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FORMAS, numeroParcela, semMarcaParcela, totalParcelas } from "@/lib/pagamentos";
import { montaDespesasUnificadas, ORIGENS, type ItemDespesa, type Origem } from "@/lib/despesas-unificadas";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

function paraBr(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** linha da tabela de gastos com submenu de detalhes */
function LinhaDespesa({
  d,
  aberto,
  onToggle,
}: {
  d: ItemDespesa;
  aberto: boolean;
  onToggle: () => void;
}) {
  const parcelas = totalParcelas(d.descricao);
  const credito = d.forma === "Crédito";
  return (
    <LinhaDetalhavel
      aberto={aberto}
      onToggle={onToggle}
      colunas={5}
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
            <Badge
              variant={
                d.origem === "Combustível"
                  ? "default"
                  : d.origem === "Manutenção"
                    ? "outline"
                    : "secondary"
              }
            >
              {d.origem}
            </Badge>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{d.categoria}</TableCell>
          <TableCell className="num text-right font-semibold text-destructive">
            {brl(d.valor)}
          </TableCell>
        </>
      }
      detalhes={
        <>
          <Detalhe rotulo="Origem" valor={d.origem} />
          <Detalhe rotulo="Categoria" valor={d.categoria} />
          {d.descricao && <Detalhe rotulo="Descrição" valor={semMarcaParcela(d.descricao)} />}
          {d.extras.map((e) => (
            <Detalhe key={e.rotulo} rotulo={e.rotulo} valor={e.valor} />
          ))}
          {d.pagamento && <Detalhe rotulo="Pagamento" valor={d.pagamento} />}
          <Detalhe rotulo="Data da compra" valor={paraBr(d.compraIso)} />
          <Detalhe rotulo="Vencimento" valor={d.data} />
          {parcelas > 1 && (
            <Detalhe rotulo="Parcela" valor={`${numeroParcela(d.descricao)}/${parcelas}`} />
          )}
          <Detalhe rotulo="Valor" valor={brl(d.valor)} />
          {credito && <Detalhe rotulo="Baixa" valor={d.pagoEm || "Em aberto"} />}
        </>
      }
      acoes={<AcoesLancamento tipo={d.tipo} registro={d.bruto} />}
    />
  );
}


export const Route = createFileRoute("/despesas")({
  head: () => ({
    meta: [
      { title: "Despesas — Rota Control" },
      {
        name: "description",
        content:
          "Todos os gastos do entregador em um lugar: combustível, manutenção e despesas por período.",
      },
      { property: "og:title", content: "Despesas — Rota Control" },
      {
        property: "og:description",
        content:
          "Todos os gastos do entregador em um lugar: combustível, manutenção e despesas por período.",
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

type Periodo = "atual" | "passado" | "total" | "personalizado";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "atual", label: "Mês atual" },
  { id: "passado", label: "Mês passado" },
  { id: "total", label: "Total" },
  { id: "personalizado", label: "Personalizado" },
];

const FILTROS_ORIGEM: { id: Origem | "todas"; label: string }[] = [
  { id: "todas", label: "Tudo" },
  { id: "Combustível", label: "Combustível" },
  { id: "Manutenção", label: "Manutenção" },
  { id: "Despesa", label: "Outras despesas" },
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
  const [origem, setOrigem] = useState<Origem | "todas">("todas");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [busca, setBusca] = useState("");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const todas = useMemo(() => montaDespesasUnificadas(data), [data]);

  /** filtrado apenas por período — base dos cards por origem */
  const doPeriodo = useMemo(() => {
    let lista = todas;
    if (periodo === "atual" || periodo === "passado") {
      const p = prefixoMes(periodo === "atual" ? 0 : -1);
      lista = lista.filter((d) => d.iso.startsWith(p));
    }
    if (periodo === "personalizado") {
      if (de) lista = lista.filter((d) => d.iso >= de);
      if (ate) lista = lista.filter((d) => d.iso <= ate);
    }
    if (!busca.trim()) return lista;
    const termo = normaliza(busca);
    return lista.filter((d) => {
      const campos = [
        d.descricao,
        d.categoria,
        d.origem,
        d.pagamento,
        d.data,
        paraBr(d.compraIso),
        brl(d.valor),
      ];
      return campos.some((c) => normaliza(c).includes(termo));
    });
  }, [todas, periodo, de, ate, busca]);

  const despesas = useMemo(
    () => (origem === "todas" ? doPeriodo : doPeriodo.filter((d) => d.origem === origem)),
    [doPeriodo, origem],
  );

  const recentes = despesas.slice(0, 15);

  const total = despesas.reduce((s, d) => s + d.valor, 0);
  const totalPeriodo = doPeriodo.reduce((s, d) => s + d.valor, 0);

  const porOrigem = useMemo(
    () =>
      ORIGENS.map((o) => {
        const itens = doPeriodo.filter((d) => d.origem === o);
        return { origem: o, itens, valor: itens.reduce((s, d) => s + d.valor, 0) };
      }),
    [doPeriodo],
  );

  const porForma = useMemo(
    () =>
      FORMAS.map((f) => {
        const itens = despesas.filter((d) => d.forma === f);
        const valor = itens.reduce((s, d) => s + d.valor, 0);
        return { forma: f, itens, valor };
      }).filter((g) => g.itens.length > 0),
    [despesas],
  );

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
        subtitle="Todos os gastos: combustível, manutenção e outras despesas"
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
            placeholder="Procurar gasto..."
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

      {periodo === "personalizado" && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            De
            <Input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="h-9 w-40"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Até
            <Input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="h-9 w-40"
            />
          </label>
          {(de || ate) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDe("");
                setAte("");
              }}
            >
              Limpar datas
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total do período"
          value={brl(totalPeriodo)}
          icon={TrendingDown}
          tone="destructive"
        />
        <StatCard label="Lançamentos" value={String(doPeriodo.length)} icon={Receipt} />
        <StatCard
          label="Média por lançamento"
          value={brl(doPeriodo.length ? totalPeriodo / doPeriodo.length : 0)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {porOrigem.map((o) => (
          <StatCard
            key={o.origem}
            label={o.origem === "Despesa" ? "Outras despesas" : o.origem}
            value={brl(o.valor)}
            hint={`${o.itens.length} lançamento${o.itens.length === 1 ? "" : "s"}`}
            icon={o.origem === "Combustível" ? Fuel : o.origem === "Manutenção" ? Wrench : Receipt}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS_ORIGEM.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={origem === f.id ? "default" : "outline"}
            onClick={() => setOrigem(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="lancamentos" className="flex flex-col gap-6">
        <TabsList className="self-start">
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="formas">Formas de pagamento</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamentos" className="flex flex-col gap-6">
          <SectionCard title="Por categoria">
            <div className="flex flex-col gap-3">
              {categorias.map((c) => (
                <div key={c.nome} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-sm text-muted-foreground">
                    {c.nome}
                  </span>
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
                  <TableHead>Origem</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentes.map((d) => (
                  <LinhaDespesa
                    key={d.id}
                    d={d}
                    aberto={abertoId === d.id}
                    onToggle={() => setAbertoId(abertoId === d.id ? null : d.id)}
                  />
                ))}
                {recentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      {busca
                        ? "Nenhum gasto encontrado para a busca."
                        : "Nenhum gasto no período."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        <TabsContent value="formas" className="flex flex-col gap-6">
          <SectionCard title="Resumo por forma de pagamento">
            <div className="grid gap-3 sm:grid-cols-2">
              {porForma.map((g) => (
                <div key={g.forma} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{g.forma}</span>
                    <span className="num font-semibold">{brl(g.valor)}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${total ? (g.valor / total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {g.itens.length} lançamento{g.itens.length === 1 ? "" : "s"} ·{" "}
                    {total ? Math.round((g.valor / total) * 100) : 0}% do período
                  </p>
                </div>
              ))}
              {porForma.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum gasto no período.</p>
              )}
            </div>
          </SectionCard>

          {porForma.map((g) => (
            <SectionCard
              key={g.forma}
              title={g.forma}
              description={`${g.itens.length} lançamento${g.itens.length === 1 ? "" : "s"} · ${brl(g.valor)}`}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.itens.map((d) => (
                    <LinhaDespesa
                      key={`${g.forma}-${d.id}`}
                      d={d}
                      aberto={abertoId === `${g.forma}-${d.id}`}
                      onToggle={() =>
                        setAbertoId(abertoId === `${g.forma}-${d.id}` ? null : `${g.forma}-${d.id}`)
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
