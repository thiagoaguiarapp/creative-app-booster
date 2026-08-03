import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Fuel, Gauge } from "lucide-react";

import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { abastecimentos, brl } from "@/lib/mock-data";

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
  component: AbastecimentoPage,
});

function AbastecimentoPage() {
  const litros = abastecimentos.reduce((s, a) => s + a.litros, 0);
  const gasto = abastecimentos.reduce((s, a) => s + a.litros * a.precoLitro, 0);
  const kmPercorridos =
    (abastecimentos[0]?.odometro ?? 0) -
    (abastecimentos[abastecimentos.length - 1]?.odometro ?? 0);


  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Abastecimento"
        subtitle="Combustível e consumo do veículo"
        action={<Button>Novo abastecimento</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gasto com combustível" value={brl(gasto)} icon={Fuel} tone="destructive" />
        <StatCard label="Litros abastecidos" value={`${litros.toFixed(1)} L`} icon={Droplets} />
        <StatCard
          label="Consumo médio"
          value={`${(kmPercorridos / litros).toFixed(1)} km/L`}
          hint={`${kmPercorridos} km no período`}
          icon={Gauge}
          tone="warning"
        />
      </div>

      <SectionCard title="Histórico">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Posto</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="text-right">R$/L</TableHead>
              <TableHead className="text-right">Odômetro</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abastecimentos.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="num">{a.data}</TableCell>
                <TableCell>{a.posto}</TableCell>
                <TableCell className="num text-right">{a.litros.toFixed(1)}</TableCell>
                <TableCell className="num text-right">{brl(a.precoLitro)}</TableCell>
                <TableCell className="num text-right">{a.odometro.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="num text-right font-semibold">
                  {brl(a.litros * a.precoLitro)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
