import { createFileRoute } from "@tanstack/react-router";
import { Bike, CircleDollarSign, Gauge, TrendingUp } from "lucide-react";

import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, ganhos } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ganhos diários — Rota Control" },
      {
        name: "description",
        content: "Acompanhe corridas, quilometragem e faturamento diário das entregas.",
      },
      { property: "og:title", content: "Ganhos diários — Rota Control" },
      {
        property: "og:description",
        content: "Acompanhe corridas, quilometragem e faturamento diário das entregas.",
      },
    ],
  }),
  component: Ganhos,
});

function Ganhos() {
  const total = ganhos.reduce((s, g) => s + g.bruto + g.gorjeta, 0);
  const corridas = ganhos.reduce((s, g) => s + g.corridas, 0);
  const km = ganhos.reduce((s, g) => s + g.km, 0);
  const max = Math.max(...ganhos.map((g) => g.bruto + g.gorjeta));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Ganhos diários"
        subtitle="Últimos 5 dias de operação"
        action={<Button>Registrar ganho</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento" value={brl(total)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Corridas" value={String(corridas)} icon={Bike} />
        <StatCard label="KM rodados" value={`${km} km`} icon={Gauge} />
        <StatCard
          label="Ganho por KM"
          value={brl(total / km)}
          hint="Média do período"
          icon={TrendingUp}
          tone="warning"
        />
      </div>

      <SectionCard title="Evolução" description="Total recebido por dia">
        <div className="flex h-40 items-end gap-4">
          {[...ganhos].reverse().map((g) => {
            const v = g.bruto + g.gorjeta;
            return (
              <div key={g.id} className="flex flex-1 flex-col items-center gap-2">
                <span className="num text-xs text-muted-foreground">{brl(v)}</span>
                <div
                  className="w-full rounded-t-md bg-primary/80"
                  style={{ height: `${(v / max) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{g.data}</span>
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
              <TableHead>Plataforma</TableHead>
              <TableHead className="text-right">Corridas</TableHead>
              <TableHead className="text-right">KM</TableHead>
              <TableHead className="text-right">Bruto</TableHead>
              <TableHead className="text-right">Gorjeta</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ganhos.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="num">{g.data}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{g.plataforma}</Badge>
                </TableCell>
                <TableCell className="num text-right">{g.corridas}</TableCell>
                <TableCell className="num text-right">{g.km}</TableCell>
                <TableCell className="num text-right">{brl(g.bruto)}</TableCell>
                <TableCell className="num text-right">{brl(g.gorjeta)}</TableCell>
                <TableCell className="num text-right font-semibold text-success">
                  {brl(g.bruto + g.gorjeta)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
