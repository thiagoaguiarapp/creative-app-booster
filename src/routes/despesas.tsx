import { createFileRoute } from "@tanstack/react-router";
import { Receipt, TrendingDown, Wallet } from "lucide-react";

import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, despesas } from "@/lib/mock-data";

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
  component: DespesasPage,
});

function DespesasPage() {
  const total = despesas.reduce((s, d) => s + d.valor, 0);
  const categorias = Array.from(new Set(despesas.map((d) => d.categoria)));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Despesas"
        subtitle="Custos operacionais fora do combustível"
        action={<Button>Nova despesa</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total do período" value={brl(total)} icon={TrendingDown} tone="destructive" />
        <StatCard label="Lançamentos" value={String(despesas.length)} icon={Receipt} />
        <StatCard label="Média por lançamento" value={brl(total / despesas.length)} icon={Wallet} />
      </div>

      <SectionCard title="Por categoria">
        <div className="flex flex-col gap-3">
          {categorias.map((c) => {
            const v = despesas.filter((d) => d.categoria === c).reduce((s, d) => s + d.valor, 0);
            return (
              <div key={c} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-muted-foreground">{c}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(v / total) * 100}%` }} />
                </div>
                <span className="num w-24 text-right text-sm font-medium">{brl(v)}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Lançamentos">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="num">{d.data}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{d.categoria}</Badge>
                </TableCell>
                <TableCell>{d.descricao}</TableCell>
                <TableCell className="num text-right font-semibold text-destructive">
                  {brl(d.valor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
