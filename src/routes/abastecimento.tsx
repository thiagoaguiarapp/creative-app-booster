import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Fuel, Gauge } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { AtalhoPaginas } from "@/components/atalho-paginas";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl, type Abastecimento } from "@/lib/sheets-types";


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

/** Consumo real: km percorrido pelo odômetro ÷ litros dos reabastecimentos. */
function consumo(lista: Abastecimento[]) {
  const validos = lista.filter((a) => a.odometro > 0).sort((a, b) => a.odometro - b.odometro);
  if (validos.length >= 2) {
    const km = validos[validos.length - 1]!.odometro - validos[0]!.odometro;
    const litros = validos.slice(1).reduce((s, a) => s + a.litros, 0);
    if (km > 0 && litros > 0) return { km, litros, media: km / litros };
  }
  const km = lista.reduce((s, a) => s + a.kmRodado, 0);
  const litros = lista.reduce((s, a) => s + a.litros, 0);
  return { km, litros, media: litros ? km / litros : 0 };
}

function AbastecimentoPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("atual");

  const lista = useMemo(() => {
    if (periodo === "total") return data.abastecimentos;
    const p = prefixoMes(periodo === "atual" ? 0 : -1);
    return data.abastecimentos.filter((a) => a.iso.startsWith(p));
  }, [data.abastecimentos, periodo]);

  const recentes = lista.slice(0, 15);

  // km/L por registro: odômetro atual − odômetro do abastecimento anterior ÷ litros
  const mediaPorRegistro = useMemo(() => {
    const ordenados = [...data.abastecimentos]
      .filter((a) => a.odometro > 0)
      .sort((a, b) => a.odometro - b.odometro);
    const mapa = new Map<string, number>();
    for (let i = 1; i < ordenados.length; i++) {
      const atual = ordenados[i]!;
      const km = atual.odometro - ordenados[i - 1]!.odometro;
      if (km > 0 && atual.litros > 0) mapa.set(atual.id, km / atual.litros);
    }
    return mapa;
  }, [data.abastecimentos]);

  const litrosTotais = lista.reduce((s, a) => s + a.litros, 0);
  const gasto = lista.reduce((s, a) => s + a.valorPago, 0);
  const { km, media } = consumo(lista);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Abastecimento"
      />

      <div className="flex flex-col items-center gap-3">
        <AtalhoPaginas />
        <NovoLancamento tipo="abastecimento" />
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Gasto com combustível"
          value={brl(gasto)}
          hint={`${lista.length} abastecimento(s)`}
          icon={Fuel}
          tone="destructive"
        />
        <StatCard
          label="Litros abastecidos"
          value={`${litrosTotais.toFixed(1)} L`}
          icon={Droplets}
        />
        <StatCard
          label="Consumo médio"
          value={`${media ? media.toFixed(1) : "0,0"} km/L`}
          hint={`${Math.round(km).toLocaleString("pt-BR")} km no período`}
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
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="text-right">R$/L</TableHead>
              <TableHead className="text-right">Desconto</TableHead>
              <TableHead className="text-right">Odômetro</TableHead>
              <TableHead className="text-right">km/L</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="num">{a.data}</TableCell>
                <TableCell>{a.posto || "—"}</TableCell>
                <TableCell>{a.pagamento}</TableCell>
                <TableCell className="num text-right">{a.litros.toFixed(2)}</TableCell>
                <TableCell className="num text-right">{brl(a.precoLitro)}</TableCell>
                <TableCell className="num text-right">
                  {a.desconto > 0 ? brl(a.desconto) : "—"}
                </TableCell>
                <TableCell className="num text-right">
                  {a.odometro.toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="num text-right">
                  {mediaPorRegistro.get(a.id)?.toFixed(1) ?? "—"}
                </TableCell>

                <TableCell className="num text-right font-semibold">{brl(a.valorPago)}</TableCell>
                <TableCell>
                  <AcoesLancamento tipo="abastecimento" registro={a} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
