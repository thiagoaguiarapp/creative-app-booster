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
    const km = abast.reduce((s, a) => s + a.kmRodado, 0);
    const outras = despesas.reduce((s, d) => s + d.valor, 0);
    const manutencao = manut.reduce((s, m) => s + m.valor, 0);
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
    const porCategoria = grupo(despesas, (d) => d.categoria, (d) => d.valor);

    const mesesSet = new Map<
      string,
      { fat: number; comb: number; desp: number; manut: number; corridas: number }
    >();
    const bucket = (k: string) =>
      mesesSet.get(k) ??
      (mesesSet.set(k, { fat: 0, comb: 0, desp: 0, manut: 0, corridas: 0 }), mesesSet.get(k)!);
    for (const g of ganhos) if (g.iso) { const b = bucket(g.iso.slice(0, 7)); b.fat += g.faturamento; b.corridas += g.corridas; }
    for (const a of abast) if (a.iso) bucket(a.iso.slice(0, 7)).comb += a.valorPago;
    for (const d of despesas) if (d.iso) bucket(d.iso.slice(0, 7)).desp += d.valor;
    for (const m of manut) if (m.iso) bucket(m.iso.slice(0, 7)).manut += m.valor;
    const porMes = [...mesesSet.entries()]
      .map(([mes, v]) => ({ mes, ...v, lucro: v.fat - v.comb - v.desp - v.manut }))
      .sort((a, b) => b.mes.localeCompare(a.mes));

    return {
      faturamento, corridas, recebido, combustivel, litros, km, outras,
      manutencao, custos, lucro, porPlataforma, porCategoria, porMes,
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Relatório por período"
        subtitle="Consolidado de ganhos, custos e lucro líquido"
        action={
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={baixarCsv}>
              <Download className="size-4" /> CSV
            </Button>
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimir
            </Button>
          </div>
        }
      />

      <SectionCard title="Período" description="Escolha um atalho ou defina as datas">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 print:hidden">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                size="sm"
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
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="de" className="text-xs uppercase tracking-wide text-muted-foreground">
                De
              </Label>
              <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-44" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="ate" className="text-xs uppercase tracking-wide text-muted-foreground">
                Até
              </Label>
              <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-44" />
            </div>
            <p className="text-xs text-muted-foreground">
              {r.qtd.ganhos} ganhos · {r.qtd.abast} abastecimentos · {r.qtd.despesas} despesas ·{" "}
              {r.qtd.repasses} repasses · {r.qtd.manut} manutenções
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturamento" value={brl(r.faturamento)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Custo total" value={brl(r.custos)} hint="Combustível + despesas + manutenção" icon={Receipt} tone="destructive" />
        <StatCard label="Lucro líquido" value={brl(r.lucro)} hint={`Margem de ${margem.toFixed(1)}%`} icon={TrendingUp} tone={r.lucro >= 0 ? "success" : "destructive"} />
        <StatCard label="Recebido" value={brl(r.recebido)} hint="Repasses das plataformas" icon={Wallet} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Corridas" value={String(r.corridas)} hint={`Ticket médio ${brl(r.corridas ? r.faturamento / r.corridas : 0)}`} icon={Bike} />
        <StatCard label="KM rodados" value={`${r.km.toLocaleString("pt-BR")} km`} hint={`${r.litros.toFixed(1)} L abastecidos`} icon={Gauge} />
        <StatCard label="Combustível" value={brl(r.combustivel)} hint={`${r.km ? brl(r.combustivel / r.km) : brl(0)} por km`} icon={Fuel} tone="warning" />
        <StatCard label="Manutenção" value={brl(r.manutencao)} hint={`Ganho por km ${r.km ? brl(r.lucro / r.km) : brl(0)}`} icon={Wrench} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Faturamento por plataforma">
          <Barras itens={r.porPlataforma} total={r.faturamento} />
        </SectionCard>
        <SectionCard title="Despesas por categoria">
          <Barras itens={r.porCategoria} total={r.outras} />
        </SectionCard>
      </div>

      <SectionCard title="Resumo mensal" description="Todo o período dividido por mês">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-right">Corridas</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
              <TableHead className="text-right">Combustível</TableHead>
              <TableHead className="text-right">Despesas</TableHead>
              <TableHead className="text-right">Manutenção</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.porMes.map((m) => (
              <TableRow key={m.mes}>
                <TableCell className="font-medium">{rotuloMes(m.mes)}</TableCell>
                <TableCell className="num text-right">{m.corridas || "—"}</TableCell>
                <TableCell className="num text-right text-success">{brl(m.fat)}</TableCell>
                <TableCell className="num text-right">{brl(m.comb)}</TableCell>
                <TableCell className="num text-right">{brl(m.desp)}</TableCell>
                <TableCell className="num text-right">{brl(m.manut)}</TableCell>
                <TableCell className={`num text-right font-semibold ${m.lucro >= 0 ? "text-success" : "text-destructive"}`}>
                  {brl(m.lucro)}
                </TableCell>
              </TableRow>
            ))}
            {r.porMes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Nenhum lançamento nesse período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

function Barras({ itens, total }: { itens: { nome: string; valor: number }[]; total: number }) {
  if (itens.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados no período.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {itens.slice(0, 8).map((i) => (
        <div key={i.nome} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-muted-foreground">{i.nome}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${total ? (i.valor / total) * 100 : 0}%` }}
            />
          </div>
          <span className="num w-24 text-right text-sm font-medium">{brl(i.valor)}</span>
        </div>
      ))}
    </div>
  );
}
