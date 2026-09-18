import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { Droplets, Fuel, Gauge } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { AtalhoPaginas } from "@/components/atalho-paginas";
import { Detalhe, LinhaDetalhavel } from "@/components/linha-detalhe";
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
  const context = useRouteContext({ from: "__root__" });
  const [periodo, setPeriodo] = useState<Periodo>("atual");
  const [veiculo, setVeiculo] = useState<string>("todos");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  // veículos cadastrados em Configurações + os já usados nos abastecimentos
  const veiculos = useMemo(() => {
    const nomes = new Set<string>();
    for (const v of context.usuario?.veiculos ?? []) if (v.nome.trim()) nomes.add(v.nome.trim());
    for (const a of data.abastecimentos) if (a.veiculo) nomes.add(a.veiculo);
    return Array.from(nomes).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [context.usuario?.veiculos, data.abastecimentos]);

  const porVeiculo = useMemo(() => {
    if (veiculo === "todos") return data.abastecimentos;
    const alvo = veiculo.toLocaleLowerCase("pt-BR");
    return data.abastecimentos.filter((a) => a.veiculo.toLocaleLowerCase("pt-BR") === alvo);
  }, [data.abastecimentos, veiculo]);

  const lista = useMemo(() => {
    if (periodo === "total") return porVeiculo;
    const p = prefixoMes(periodo === "atual" ? 0 : -1);
    return porVeiculo.filter((a) => a.iso.startsWith(p));
  }, [porVeiculo, periodo]);

  const recentes = lista.slice(0, 15);

  // km rodado e km/L por registro, calculados dentro de cada veículo
  const { mediaPorRegistro, kmRodadoPorRegistro } = useMemo(() => {
    const media = new Map<string, number>();
    const rodado = new Map<string, number>();
    const grupos = new Map<string, typeof data.abastecimentos>();
    for (const a of data.abastecimentos) {
      if (a.odometro <= 0) continue;
      const chave = a.veiculo.toLocaleLowerCase("pt-BR");
      const atual = grupos.get(chave) ?? [];
      atual.push(a);
      grupos.set(chave, atual);
    }
    for (const grupo of grupos.values()) {
      const ordenados = [...grupo].sort((a, b) => a.odometro - b.odometro);
      for (let i = 1; i < ordenados.length; i++) {
        const atual = ordenados[i]!;
        const km = atual.odometro - ordenados[i - 1]!.odometro;
        if (km > 0) rodado.set(atual.id, km);
        if (km > 0 && atual.litros > 0) media.set(atual.id, km / atual.litros);
      }
    }
    return { mediaPorRegistro: media, kmRodadoPorRegistro: rodado };
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


      <SectionCard title="Histórico" description="Toque na linha para ver os detalhes">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="text-right">km/L</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((a) => {
              const aberto = abertoId === a.id;
              const km = kmRodadoPorRegistro.get(a.id);
              return (
                <LinhaDetalhavel
                  key={a.id}
                  aberto={aberto}
                  onToggle={() => setAbertoId(aberto ? null : a.id)}
                  colunas={5}
                  celulas={
                    <>
                      <TableCell className="num">{a.data}</TableCell>
                      <TableCell className="num text-right">{a.litros.toFixed(2)}</TableCell>
                      <TableCell className="num text-right">
                        {mediaPorRegistro.get(a.id)?.toFixed(1) ?? "—"}
                      </TableCell>
                      <TableCell className="num text-right font-semibold">
                        {brl(a.valorPago)}
                      </TableCell>
                    </>
                  }
                  detalhes={
                    <>
                      <Detalhe rotulo="Combustível" valor={a.combustivel} />
                      <Detalhe rotulo="Posto" valor={a.posto} />
                      <Detalhe rotulo="Pagamento" valor={a.pagamento} />
                      <Detalhe rotulo="R$/L" valor={brl(a.precoLitro)} />
                      <Detalhe rotulo="Desconto" valor={a.desconto > 0 ? brl(a.desconto) : "—"} />
                      <Detalhe rotulo="Odômetro" valor={a.odometro.toLocaleString("pt-BR")} />
                      <Detalhe
                        rotulo="Km rodado"
                        valor={km && km > 0 ? `${km.toLocaleString("pt-BR")} km` : "—"}
                      />
                    </>
                  }
                  acoes={<AcoesLancamento tipo="abastecimento" registro={a} />}
                />
              );
            })}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
