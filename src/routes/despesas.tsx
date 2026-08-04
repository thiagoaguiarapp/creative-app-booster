import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Receipt, TrendingDown, Wallet } from "lucide-react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

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

function DespesasPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const despesas = data.despesas;
  const recentes = despesas.slice(0, 15);

  const total = despesas.reduce((s, d) => s + d.valor, 0);
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
        subtitle="Custos operacionais fora do combustível (aba DESPESA)"
        action={<NovoLancamento tipo="despesa" />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total do período" value={brl(total)} icon={TrendingDown} tone="destructive" />
        <StatCard label="Lançamentos" value={String(despesas.length)} icon={Receipt} />
        <StatCard
          label="Média por lançamento"
          value={brl(despesas.length ? total / despesas.length : 0)}
          icon={Wallet}
        />
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

      <SectionCard title="Lançamentos">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="num">{d.data}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{d.categoria}</Badge>
                </TableCell>
                <TableCell>{d.descricao || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{d.pagamento}</TableCell>
                <TableCell className="num text-right font-semibold text-destructive">
                  {brl(d.valor)}
                </TableCell>
                <TableCell>
                  <AcoesLancamento tipo="despesa" registro={d} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
