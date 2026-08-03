import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Fuel, Gauge } from "lucide-react";

import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/abastecimento")({
  head: () => ({
    meta: [
      { title: "Abastecimento — Rota Control" },
      {
        name: "description",
        content: "Histórico de abastecimentos, litros, preço por litro e consumo médio da moto.",
      },
      { property: "og:title", content: "Abastecimento — Rota Control" },
      {
        property: "og:description",
        content: "Histórico de abastecimentos, litros, preço por litro e consumo médio.",
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
  component: AbastecimentoPage,
});

function AbastecimentoPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const abastecimentos = data.abastecimentos;
  const recentes = abastecimentos.slice(0, 15);

  const litros = abastecimentos.reduce((s, a) => s + a.litros, 0);
  const gasto = abastecimentos.reduce((s, a) => s + a.valorPago, 0);
  const kmTotal = abastecimentos.reduce((s, a) => s + a.kmRodado, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Abastecimento"
        subtitle="Combustível e consumo do veículo (aba COMBUSTIVE/KM)"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gasto com combustível" value={brl(gasto)} icon={Fuel} tone="destructive" />
        <StatCard label="Litros abastecidos" value={`${litros.toFixed(1)} L`} icon={Droplets} />
        <StatCard
          label="Consumo médio"
          value={`${litros ? (kmTotal / litros).toFixed(1) : "0,0"} km/L`}
          hint={`${kmTotal.toLocaleString("pt-BR")} km no período`}
          icon={Gauge}
          tone="warning"
        />
      </div>

      <SectionCard title="Histórico">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="text-right">R$/L</TableHead>
              <TableHead className="text-right">Odômetro</TableHead>
              <TableHead className="text-right">km/L</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="num">{a.data}</TableCell>
                <TableCell>{a.pagamento}</TableCell>
                <TableCell className="num text-right">{a.litros.toFixed(2)}</TableCell>
                <TableCell className="num text-right">{brl(a.precoLitro)}</TableCell>
                <TableCell className="num text-right">
                  {a.odometro.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="num text-right">{a.kmPorLitro || "—"}</TableCell>
                <TableCell className="num text-right font-semibold">{brl(a.valorPago)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
