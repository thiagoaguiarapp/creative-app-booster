import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListChecks, Search, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tipo } from "@/lib/entry-schema";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({
    meta: [
      { title: "Todos os lançamentos — Rota Control" },
      {
        name: "description",
        content:
          "Consulte, edite ou exclua qualquer lançamento: ganhos, abastecimentos, despesas, repasses e manutenções.",
      },
      { property: "og:title", content: "Todos os lançamentos — Rota Control" },
      {
        property: "og:description",
        content:
          "Consulte, edite ou exclua qualquer lançamento: ganhos, abastecimentos, despesas, repasses e manutenções.",
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
  component: LancamentosPage,
});

type Linha = {
  key: string;
  tipo: Tipo;
  rotulo: string;
  data: string;
  iso: string;
  titulo: string;
  detalhe: string;
  valor: number;
  positivo: boolean;
  registro: Record<string, unknown> & { row: number };
};

const TIPOS: { tipo: Tipo | "todos"; rotulo: string }[] = [
  { tipo: "todos", rotulo: "Todos" },
  { tipo: "ganho", rotulo: "Faturamento" },
  { tipo: "abastecimento", rotulo: "Abastecimento" },
  { tipo: "despesa", rotulo: "Despesas" },
  { tipo: "repasse", rotulo: "Repasses" },
  { tipo: "manutencao", rotulo: "Manutenção" },
];

function LancamentosPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [filtro, setFiltro] = useState<Tipo | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [limite, setLimite] = useState(50);

  const todas = useMemo<Linha[]>(() => {
    const linhas: Linha[] = [
      ...data.ganhos.map((g) => ({
        key: `ganho-${g.row}`,
        tipo: "ganho" as Tipo,
        rotulo: "Faturamento",
        data: g.data,
        iso: g.iso,
        titulo: g.plataforma,
        detalhe: `${g.corridas || 0} rotas · recebido ${brl(g.recebido)}`,
        valor: g.faturamento,
        positivo: true,
        registro: g as unknown as Record<string, unknown> & { row: number },
      })),
      ...data.abastecimentos.map((a) => ({
        key: `abastecimento-${a.row}`,
        tipo: "abastecimento" as Tipo,
        rotulo: "Abastecimento",
        data: a.data,
        iso: a.iso,
        titulo: `${a.litros} L`,
        detalhe: `Odômetro ${a.odometro} km · ${a.pagamento}`,
        valor: a.valorPago,
        positivo: false,
        registro: a as unknown as Record<string, unknown> & { row: number },
      })),
      ...data.despesas.map((d) => ({
        key: `despesa-${d.row}`,
        tipo: "despesa" as Tipo,
        rotulo: "Despesa",
        data: d.data,
        iso: d.iso,
        titulo: d.categoria,
        detalhe: [d.descricao, d.pagamento].filter(Boolean).join(" · "),
        valor: d.valor,
        positivo: false,
        registro: d as unknown as Record<string, unknown> & { row: number },
      })),
      ...data.repasses.map((r) => ({
        key: `repasse-${r.row}`,
        tipo: "repasse" as Tipo,
        rotulo: "Repasse",
        data: r.data,
        iso: r.iso,
        titulo: r.aplicativo,
        detalhe: r.forma,
        valor: r.valor,
        positivo: true,
        registro: r as unknown as Record<string, unknown> & { row: number },
      })),
      ...data.manutencoes.map((m) => ({
        key: `manutencao-${m.row}`,
        tipo: "manutencao" as Tipo,
        rotulo: "Manutenção",
        data: m.data,
        iso: m.iso,
        titulo: m.servico,
        detalhe: `${m.veiculo} · ${m.kmTroca} km`,
        valor: m.valor,
        positivo: false,
        registro: m as unknown as Record<string, unknown> & { row: number },
      })),
    ];
    return linhas.sort((a, b) => b.iso.localeCompare(a.iso));
  }, [data]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return todas.filter((l) => {
      if (filtro !== "todos" && l.tipo !== filtro) return false;
      if (de && l.iso && l.iso < de) return false;
      if (ate && l.iso && l.iso > ate) return false;
      if (
        termo &&
        !`${l.rotulo} ${l.titulo} ${l.detalhe} ${l.data}`.toLowerCase().includes(termo)
      )
        return false;
      return true;
    });
  }, [todas, filtro, busca, de, ate]);

  const entradas = filtradas.filter((l) => l.positivo).reduce((s, l) => s + l.valor, 0);
  const saidas = filtradas.filter((l) => !l.positivo).reduce((s, l) => s + l.valor, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Todos os lançamentos"
        subtitle="Consulte, corrija ou exclua qualquer registro da planilha"
        action={filtro !== "todos" ? <NovoLancamento tipo={filtro} /> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registros" value={String(filtradas.length)} icon={ListChecks} />
        <StatCard label="Entradas" value={brl(entradas)} icon={TrendingUp} tone="success" />
        <StatCard label="Saídas" value={brl(saidas)} icon={TrendingDown} tone="destructive" />
      </div>

      <SectionCard title="Filtros">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <Button
                key={t.tipo}
                size="sm"
                variant={filtro === t.tipo ? "default" : "outline"}
                onClick={() => {
                  setFiltro(t.tipo);
                  setLimite(50);
                }}
              >
                {t.rotulo}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por app, categoria, serviço…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lançamentos" description={`${filtradas.length} registros encontrados`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.slice(0, limite).map((l) => (
              <TableRow key={l.key}>
                <TableCell className="num whitespace-nowrap">{l.data}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{l.rotulo}</Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{l.titulo}</div>
                  {l.detalhe && (
                    <div className="text-xs text-muted-foreground">{l.detalhe}</div>
                  )}
                </TableCell>
                <TableCell
                  className={`num text-right font-semibold ${
                    l.positivo ? "text-success" : "text-destructive"
                  }`}
                >
                  {brl(l.valor)}
                </TableCell>
                <TableCell>
                  <AcoesLancamento tipo={l.tipo} registro={l.registro} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtradas.length > limite && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => setLimite((n) => n + 50)}>
              Carregar mais
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
