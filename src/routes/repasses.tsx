import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, Wallet } from "lucide-react";

import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, repasses } from "@/lib/mock-data";

export const Route = createFileRoute("/repasses")({
  head: () => ({
    meta: [
      { title: "Recebimento e repasse — Rota Control" },
      {
        name: "description",
        content: "Acompanhe repasses das plataformas: previsto, recebido, pendente e atrasado.",
      },
      { property: "og:title", content: "Recebimento e repasse — Rota Control" },
      {
        property: "og:description",
        content: "Acompanhe repasses das plataformas: previsto, recebido, pendente e atrasado.",
      },
    ],
  }),
  component: RepassesPage,
});

const statusStyle = {
  Recebido: "border-success/40 bg-success/15 text-success",
  Pendente: "border-warning/40 bg-warning/15 text-warning",
  Atrasado: "border-destructive/40 bg-destructive/15 text-destructive",
} as const;

function RepassesPage() {
  const previsto = repasses.reduce((s, r) => s + r.previsto, 0);
  const recebido = repasses.reduce((s, r) => s + r.recebido, 0);
  const atrasado = repasses
    .filter((r) => r.status === "Atrasado")
    .reduce((s, r) => s + r.previsto, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Recebimento / Repasse"
        subtitle="Conciliação dos repasses das plataformas"
        action={<Button>Conciliar repasse</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Previsto" value={brl(previsto)} icon={Wallet} />
        <StatCard label="Recebido" value={brl(recebido)} icon={CheckCircle2} tone="success" />
        <StatCard label="A receber" value={brl(previsto - recebido)} icon={Clock} tone="warning" />
        <StatCard label="Atrasado" value={brl(atrasado)} icon={AlertTriangle} tone="destructive" />
      </div>

      <SectionCard title="Repasses" description="Por período e plataforma">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Previsto</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repasses.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num">{r.periodo}</TableCell>
                <TableCell>{r.origem}</TableCell>
                <TableCell className="num text-right">{brl(r.previsto)}</TableCell>
                <TableCell className="num text-right">{brl(r.recebido)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className={statusStyle[r.status]}>
                    {r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
