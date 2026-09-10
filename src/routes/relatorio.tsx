import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bike,
  CircleDollarSign,
  Download,
  Fuel,
  Gauge,
  Printer,
  Receipt,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AtalhoPaginas } from "@/components/atalho-paginas";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paresDuplicados } from "@/lib/fechamento";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/relatorio")({
  head: () => ({
    meta: [
      { title: "Relatório por período — Rota Control" },
      {
        name: "description",
        content:
          "Relatório completo por período: faturamento, combustível, despesas, manutenção e lucro líquido do entregador.",
      },
      { property: "og:title", content: "Relatório por período — Rota Control" },
      {
        property: "og:description",
        content:
          "Faturamento, custos, km rodado e lucro líquido consolidados no período escolhido.",
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
  component: RelatorioPage,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);
const hoje = () => new Date();

function inicioMes(offset = 0) {
  const d = hoje();
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}
function fimMes(offset = 0) {
  const d = hoje();
  return new Date(d.getFullYear(), d.getMonth() + offset + 1, 0);
}

const PRESETS = [
  { label: "Mês atual", de: () => iso(inicioMes()), ate: () => iso(fimMes()) },
  { label: "Mês passado", de: () => iso(inicioMes(-1)), ate: () => iso(fimMes(-1)) },
  {
    label: "Últimos 30 dias",
    de: () => iso(new Date(Date.now() - 29 * 86400000)),
    ate: () => iso(hoje()),
  },
  {
    label: "Ano atual",
    de: () => `${hoje().getFullYear()}-01-01`,
    ate: () => iso(hoje()),
  },
  { label: "Tudo", de: () => "", ate: () => "" },
];

const MESES = [
  "jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez",
];

function rotuloMes(isoMes: string) {
  const [y, m] = isoMes.split("-");
  return `${MESES[Number(m) - 1]}/${y}`;
}

/** KM do período: diferença de odômetro quando disponível, senão soma de KM RODADO. */
function kmPeriodo(abast: { odometro: number; kmRodado: number }[]) {
  const validos = abast.filter((a) => a.odometro > 0).sort((a, b) => a.odometro - b.odometro);
  if (validos.length >= 2) {
    const diff = validos[validos.length - 1]!.odometro - validos[0]!.odometro;
    if (diff > 0) return diff;
  }
  return abast.reduce((s, a) => s + a.kmRodado, 0);
}


function RelatorioPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [de, setDe] = useState(() => iso(inicioMes()));
  const [ate, setAte] = useState(() => iso(fimMes()));

  const dentro = (i: string) => (!i ? false : (!de || i >= de) && (!ate || i <= ate));

  const r = useMemo(() => {
    const ganhos = data.ganhos.filter((g) => (de || ate ? dentro(g.iso) : true));
    const abast = data.abastecimentos.filter((a) => (de || ate ? dentro(a.iso) : true));
    const despesas = data.despesas.filter((d) => (de || ate ? dentro(d.iso) : true));
    const repasses = data.repasses.filter((x) => (de || ate ? dentro(x.iso) : true));
    const manut = data.manutencoes.filter((m) => (de || ate ? dentro(m.iso) : true));

    const faturamento = ganhos.reduce((s, g) => s + g.faturamento, 0);
    const corridas = ganhos.reduce((s, g) => s + g.corridas, 0);
    const recebido = repasses.reduce((s, x) => s + x.valor, 0);
    const combustivel = abast.reduce((s, a) => s + a.valorPago, 0);
    const litros = abast.reduce((s, a) => s + a.litros, 0);
    const km = kmPeriodo(abast);
    // manutenções que também foram lançadas como despesa seriam contadas duas
    // vezes no custo — o valor fica só na despesa, que carrega o pagamento.
    const duplicadas = new Set(
      paresDuplicados(data.despesas, data.manutencoes).map((p) => p.manutencao.row),
    );
    const despesasCusto = despesas;
    const manutCusto = manut.filter((m) => !duplicadas.has(m.row));
    const outras = despesasCusto.reduce((s, d) => s + d.valor, 0);
    const manutencao = manutCusto.reduce((s, m) => s + m.valor, 0);
    const custos = combustivel + outras + manutencao;

    const lucro = faturamento - custos;

    const grupo = <T,>(itens: T[], chave: (t: T) => string, valor: (t: T) => number) => {
      const m = new Map<string, number>();
      for (const it of itens) m.set(chave(it), (m.get(chave(it)) ?? 0) + valor(it));
      return [...m.entries()]
        .map(([nome, v]) => ({ nome, valor: v }))
        .sort((a, b) => b.valor - a.valor);
    };

    const porPlataforma = grupo(ganhos, (g) => g.plataforma, (g) => g.faturamento);
    const porCategoria = grupo(despesasCusto, (d) => d.categoria, (d) => d.valor);

    const mesesSet = new Map<
      string,
      { fat: number; comb: number; desp: number; manut: number; corridas: number }
    >();
    const bucket = (k: string) =>
      mesesSet.get(k) ??
      (mesesSet.set(k, { fat: 0, comb: 0, desp: 0, manut: 0, corridas: 0 }), mesesSet.get(k)!);
    for (const g of ganhos) if (g.iso) { const b = bucket(g.iso.slice(0, 7)); b.fat += g.faturamento; b.corridas += g.corridas; }
    for (const a of abast) if (a.iso) bucket(a.iso.slice(0, 7)).comb += a.valorPago;
    for (const d of despesasCusto) if (d.iso) bucket(d.iso.slice(0, 7)).desp += d.valor;
    for (const m of manutCusto) if (m.iso) bucket(m.iso.slice(0, 7)).manut += m.valor;
    const porMes = [...mesesSet.entries()]
      .map(([mes, v]) => ({ mes, ...v, lucro: v.fat - v.comb - v.desp - v.manut }))
      .sort((a, b) => b.mes.localeCompare(a.mes));

    return {
      faturamento, corridas, recebido, combustivel, litros, km, outras,
      manutencao, custos, lucro, porPlataforma, porCategoria, porMes,
      listas: { ganhos, abast, despesas: despesasCusto, repasses, manut: manutCusto },
      qtd: { ganhos: ganhos.length, abast: abast.length, despesas: despesas.length, repasses: repasses.length, manut: manut.length },
    };
  }, [data, de, ate]);


  const baixarCsv = () => {
    const linhas: string[][] = [
      ["Relatório Rota Control", `${de || "início"} a ${ate || "hoje"}`],
      [],
      ["Indicador", "Valor"],
      ["Faturamento", r.faturamento.toFixed(2)],
      ["Recebido (repasses)", r.recebido.toFixed(2)],
      ["Combustível", r.combustivel.toFixed(2)],
      ["Despesas", r.outras.toFixed(2)],
      ["Manutenção", r.manutencao.toFixed(2)],
      ["Custo total", r.custos.toFixed(2)],
      ["Lucro líquido", r.lucro.toFixed(2)],
      ["Corridas", String(r.corridas)],
      ["KM rodados", String(r.km)],
      ["Litros", r.litros.toFixed(2)],
      [],
      ["Mês", "Faturamento", "Combustível", "Despesas", "Manutenção", "Lucro"],
      ...r.porMes.map((m) => [
        rotuloMes(m.mes), m.fat.toFixed(2), m.comb.toFixed(2), m.desp.toFixed(2),
        m.manut.toFixed(2), m.lucro.toFixed(2),
      ]),
    ];
    const csv = linhas.map((l) => l.join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${de || "inicio"}-${ate || "hoje"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const margem = r.faturamento ? (r.lucro / r.faturamento) * 100 : 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:gap-4 lg:gap-6">
      <PageHeader
        title="Relatório por período"
        subtitle="Consolidado de ganhos, custos e lucro líquido"
        action={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={baixarCsv} className="px-2 sm:px-3">
              <Download className="size-4" /> <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button size="sm" onClick={() => window.print()} className="px-2 sm:px-3">
              <Printer className="size-4" /> <span className="hidden sm:inline">Imprimir</span>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col items-center gap-3 print:hidden">
        <AtalhoPaginas />
      </div>

      <SectionCard title="Período" description="Escolha um atalho ou defina as datas">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap gap-2 print:hidden">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                size="sm"
                className="h-8 text-xs"
                variant={de === p.de() && ate === p.ate() ? "default" : "secondary"}
                onClick={() => {
                  setDe(p.de());
                  setAte(p.ate());
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="de" className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                De
              </Label>
              <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-9 w-36 text-xs sm:w-44 sm:text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="ate" className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
                Até
              </Label>
              <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-9 w-36 text-xs sm:w-44 sm:text-sm" />
            </div>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              {r.qtd.ganhos} ganhos · {r.qtd.abast} abastecimentos · {r.qtd.despesas} despesas ·{" "}
              {r.qtd.repasses} repasses · {r.qtd.manut} manutenções
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Faturamento" value={brl(r.faturamento)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Custo total" value={brl(r.custos)} hint="Combustível + despesas + manutenção" icon={Receipt} tone="destructive" />
        <StatCard label="Lucro líquido" value={brl(r.lucro)} hint={`Margem de ${margem.toFixed(1)}%`} icon={TrendingUp} tone={r.lucro >= 0 ? "success" : "destructive"} />
        <StatCard label="Recebido" value={brl(r.recebido)} hint="Repasses das plataformas" icon={Wallet} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Corridas" value={String(r.corridas)} hint={`Ticket médio ${brl(r.corridas ? r.faturamento / r.corridas : 0)}`} icon={Bike} />
        <StatCard label="KM rodados" value={`${r.km.toLocaleString("pt-BR")} km`} hint={`${r.litros.toFixed(1)} L abastecidos`} icon={Gauge} />
        <StatCard label="Combustível" value={brl(r.combustivel)} hint={`${r.km ? brl(r.combustivel / r.km) : brl(0)} por km`} icon={Fuel} tone="warning" />
        <StatCard label="Manutenção" value={brl(r.manutencao)} icon={Wrench} />
      </div>

      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <SectionCard title="Faturamento por plataforma">
          <Barras itens={r.porPlataforma} total={r.faturamento} />
        </SectionCard>
        <SectionCard title="Despesas por categoria">
          <Barras itens={r.porCategoria} total={r.outras} />
        </SectionCard>
      </div>

      <SectionCard title="Resumo mensal" description="Todo o período dividido por mês">
        <div className="-mx-3 overflow-x-auto sm:-mx-5">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap text-[10px] sm:text-xs">Mês</TableHead>
                <TableHead className="whitespace-nowrap text-right text-[10px] sm:text-xs">Corridas</TableHead>
                <TableHead className="whitespace-nowrap text-right text-[10px] sm:text-xs">Faturamento</TableHead>
                <TableHead className="whitespace-nowrap text-right text-[10px] sm:text-xs">Combustível</TableHead>
                <TableHead className="whitespace-nowrap text-right text-[10px] sm:text-xs">Despesas</TableHead>
                <TableHead className="whitespace-nowrap text-right text-[10px] sm:text-xs">Manutenção</TableHead>
                <TableHead className="whitespace-nowrap text-right text-[10px] sm:text-xs">Lucro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.porMes.map((m) => (
                <TableRow key={m.mes}>
                  <TableCell className="whitespace-nowrap text-[10px] font-medium sm:text-xs">{rotuloMes(m.mes)}</TableCell>
                  <TableCell className="num whitespace-nowrap text-right text-[10px] sm:text-xs">{m.corridas || "—"}</TableCell>
                  <TableCell className="num whitespace-nowrap text-right text-[10px] text-success sm:text-xs">{brl(m.fat)}</TableCell>
                  <TableCell className="num whitespace-nowrap text-right text-[10px] sm:text-xs">{brl(m.comb)}</TableCell>
                  <TableCell className="num whitespace-nowrap text-right text-[10px] sm:text-xs">{brl(m.desp)}</TableCell>
                  <TableCell className="num whitespace-nowrap text-right text-[10px] sm:text-xs">{brl(m.manut)}</TableCell>
                  <TableCell className={`num whitespace-nowrap text-right text-[10px] font-semibold sm:text-xs ${m.lucro >= 0 ? "text-success" : "text-destructive"}`}>
                    {brl(m.lucro)}
                  </TableCell>
                </TableRow>
              ))}
              {r.porMes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[10px] text-muted-foreground sm:text-sm">
                    Nenhum lançamento nesse período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}

function Barras({ itens, total }: { itens: { nome: string; valor: number }[]; total: number }) {
  if (itens.length === 0) {
    return <p className="text-xs text-muted-foreground sm:text-sm">Sem dados no período.</p>;
  }
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {itens.slice(0, 8).map((i) => (
        <div key={i.nome} className="flex items-center gap-2 sm:gap-3">
          <span className="w-20 shrink-0 truncate text-[10px] text-muted-foreground sm:w-28 sm:text-sm">{i.nome}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${total ? (i.valor / total) * 100 : 0}%` }}
            />
          </div>
          <span className="num w-18 text-right text-[10px] font-medium sm:w-24 sm:text-sm">{brl(i.valor)}</span>
        </div>
      ))}
    </div>
  );
}
