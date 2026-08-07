import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Copy, HandCoins } from "lucide-react";
import { useMemo } from "react";

import { AcoesLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ehExtra } from "@/lib/extras";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/limpeza")({
  head: () => ({
    meta: [
      { title: "Limpar duplicados — Rota Control" },
      {
        name: "description",
        content:
          "Revise gorjetas e sobras de troco lançadas na aba de repasse e remova as duplicidades.",
      },
      { property: "og:title", content: "Limpar duplicados — Rota Control" },
      {
        property: "og:description",
        content: "Revise gorjetas e sobras de troco lançadas no lugar errado e remova duplicidades.",
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
  component: LimpezaPage,
});

const cent = (v: number) => Math.round(v * 100);

function LimpezaPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());

  const linhas = useMemo(() => {
    const extrasGanho = data.ganhos.filter((g) => ehExtra(g.plataforma));
    return data.repasses
      .filter((r) => ehExtra(r.aplicativo))
      .map((r) => ({
        registro: r,
        duplicado: extrasGanho.some(
          (g) => g.iso === r.iso && cent(g.faturamento) === cent(r.valor),
        ),
      }))
      .sort((a, b) => b.registro.iso.localeCompare(a.registro.iso));
  }, [data.ganhos, data.repasses]);

  const total = linhas.reduce((s, l) => s + l.registro.valor, 0);
  const duplicados = linhas.filter((l) => l.duplicado).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="Limpar duplicados"
        subtitle="Gorjeta e sobra de troco lançadas na aba REPASSE — o certo agora é Ganhos diários"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registros na aba errada" value={String(linhas.length)} icon={HandCoins} />
        <StatCard label="Valor somado" value={brl(total)} icon={AlertTriangle} tone="warning" />
        <StatCard
          label="Prováveis duplicados"
          value={String(duplicados)}
          icon={Copy}
          tone="warning"
          hint="Mesma data e mesmo valor em Ganhos diários"
        />
      </div>

      <SectionCard
        title="Lançamentos para revisar"
        description="Edite para corrigir data/valor ou exclua para remover a duplicidade"
      >
        {linhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tudo certo: nenhuma gorjeta ou sobra de troco lançada na aba de repasse.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Lançado como</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map(({ registro, duplicado }) => (
                <TableRow key={registro.id}>
                  <TableCell className="num">{registro.data}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{registro.aplicativo}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{registro.forma}</TableCell>
                  <TableCell className="num text-right font-semibold">{brl(registro.valor)}</TableCell>
                  <TableCell>
                    <Badge variant={duplicado ? "destructive" : "outline"}>
                      {duplicado ? "Duplicado" : "Só nesta aba"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AcoesLancamento tipo="repasse" registro={registro} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
