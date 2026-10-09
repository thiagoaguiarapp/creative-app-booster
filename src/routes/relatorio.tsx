import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bike,
  ChevronDown,
  CircleDollarSign,
  Download,
  Fuel,
  Gauge,
  Printer,
  Receipt,
  Search,
  X,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RepassesContent } from "@/components/repasses-content";
import { AtalhoPaginas } from "@/components/atalho-paginas";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { paresDuplicados } from "@/lib/fechamento";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorio")({
  head: () => ({
    meta: [
      { title: "Financeiro — No Corre" },
      {
        name: "description",
        content:
          "Relatório completo por período: faturamento, combustível, despesas, manutenção e lucro líquido do entregador.",
      },
      { property: "og:title", content: "Financeiro — No Corre" },
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
      {(error as Error).message}
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

type TipoFiltro = "todos" | "ganho" | "abastecimento" | "despesa" | "manutencao" | "repasse";
const TIPOS_FILTRO: TipoFiltro[] = ["todos", "ganho", "abastecimento", "despesa", "manutencao", "repasse"];
const ROTULO_TIPO: Record<TipoFiltro, string> = {
  todos: "Todos",
  ganho: "Faturamento",
  abastecimento: "Combustível",
  despesa: "Despesas",
  manutencao: "Manutenção",
  repasse: "Repasses",
};
const ABA_DO_TIPO: Record<Exclude<TipoFiltro, "todos">, string> = {
  ganho: "geral",
  abastecimento: "abastecimento",
  despesa: "despesa",
  manutencao: "manutencao",
  repasse: "repasse",
};
const normaliza = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

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
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [veiculo, setVeiculo] = useState("");
  const [aba, setAba] = useState("geral");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const filtrosAtivos = [
    busca.trim() && `"${busca.trim()}"`,
    tipo !== "todos" && ROTULO_TIPO[tipo],
    veiculo,
  ].filter(Boolean) as string[];
  const filtrando = filtrosAtivos.length > 0;
  const resumoFiltros = filtrosAtivos.join(" · ");

  const veiculos = useMemo(() => {
    const set = new Set<string>();
    for (const a of data.abastecimentos) if (a.veiculo) set.add(a.veiculo);
    for (const m of data.manutencoes) if (m.veiculo) set.add(m.veiculo);
    return [...set].sort();
  }, [data]);

  const filtrarPor = (texto: string, t: TipoFiltro) => {
    setBusca(texto);
    setTipo(t);
    setFiltrosAbertos(true);
    if (t !== "todos") setAba(ABA_DO_TIPO[t]);
  };

  const dentro = (i: string) => (!i ? false : (!de || i >= de) && (!ate || i <= ate));

  const r = useMemo(() => {
    const termo = normaliza(busca);
    const casa = (...campos: (string | undefined)[]) =>
      !termo || campos.some((c) => normaliza(c ?? "").includes(termo));
    const ok = (t: TipoFiltro) => tipo === "todos" || tipo === t;
    const periodo = (i: string) => (de || ate ? dentro(i) : true);
    const veic = (v?: string) => !veiculo || v === veiculo;
    // filtro de veículo só se aplica a quem tem veículo (combustível/manutenção)
    const semVeic = !veiculo;
    const ganhos = data.ganhos.filter((g) => semVeic && ok("ganho") && periodo(g.iso) && casa(g.plataforma));
    const abast = data.abastecimentos.filter((a) => ok("abastecimento") && periodo(a.iso) && veic(a.veiculo) && casa(a.posto, a.combustivel, a.veiculo, a.pagamento, "combustivel abastecimento"));
    const despesas = data.despesas.filter((d) => semVeic && ok("despesa") && periodo(d.iso) && casa(d.categoria, d.descricao, d.pagamento));
    const repasses = data.repasses.filter((x) => semVeic && ok("repasse") && periodo(x.iso) && casa(x.aplicativo, x.forma));
    const manut = data.manutencoes.filter((m) => ok("manutencao") && periodo(m.iso) && veic(m.veiculo) && casa(m.servico, m.veiculo));

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
      { fat: number; comb: number; desp: number; manut: number; corridas: number; litros: number }
    >();
    const bucket = (k: string) =>
      mesesSet.get(k) ??
      (mesesSet.set(k, { fat: 0, comb: 0, desp: 0, manut: 0, corridas: 0, litros: 0 }), mesesSet.get(k)!);
    for (const g of ganhos) if (g.iso) { const b = bucket(g.iso.slice(0, 7)); b.fat += g.faturamento; b.corridas += g.corridas; }
    for (const a of abast) if (a.iso) { const b = bucket(a.iso.slice(0, 7)); b.comb += a.valorPago; b.litros += a.litros; }
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
  }, [data, de, ate, busca, tipo, veiculo]);


  const baixarCsv = () => {
    const linhas: string[][] = [
      ["Relatório No Corre", `${de || "início"} a ${ate || "hoje"}`],
      ...(busca || tipo !== "todos" || veiculo
        ? [["Filtro", [busca && `busca "${busca}"`, tipo !== "todos" && ROTULO_TIPO[tipo], veiculo].filter(Boolean).join(" · ")]]
        : []),
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


  const r2 = (v: number) => Math.round(v * 100) / 100;
  const meses = [...r.porMes].reverse();
  const graficoUnico = (titulo: string, desc: string, nome: string, cor: string, valor: (m: (typeof meses)[number]) => number, litros = false) => (
    <SectionCard title={titulo} description={desc}>
      {meses.every((m) => valor(m) === 0) ? (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={meses.map((m) => ({ mes: rotuloMes(m.mes), [nome]: r2(valor(m)), Litros: r2(m.litros) }))}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                formatter={(v: number, n: string) => (n === "Litros" ? `${v.toFixed(1)} L` : brl(v))}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey={nome} stroke={cor} strokeWidth={2} dot={{ r: 3 }} />
              {litros && <Line type="monotone" dataKey="Litros" stroke="transparent" legendType="none" dot={false} activeDot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
  const grafDespesa = graficoUnico("Evolução das despesas", "Gastos operacionais mês a mês", "Despesas", "var(--destructive)", (m) => m.desp);
  const grafManut = graficoUnico("Evolução da manutenção", "Gastos com oficina e peças mês a mês", "Manutenção", "var(--warning, var(--chart-3))", (m) => m.manut);
  const grafAbast = graficoUnico("Evolução do combustível", "Valor abastecido mês a mês (toque para ver os litros)", "Combustível", "var(--primary)", (m) => m.comb, true);

  const evolucao = (
    <SectionCard title="Evolução" description="Faturamento, custos e lucro mês a mês">
      {r.porMes.length < 1 ? (
        <p className="text-sm text-muted-foreground">Sem dados no período.</p>
      ) : (
        <div className="h-64 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={[...r.porMes].reverse().map((m) => ({
                mes: rotuloMes(m.mes),
                Faturamento: Math.round(m.fat * 100) / 100,
                Custos: Math.round((m.comb + m.desp + m.manut) * 100) / 100,
                Lucro: Math.round(m.lucro * 100) / 100,
              }))}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                formatter={(v: number) => brl(v)}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Faturamento" stroke="var(--primary)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Custos" stroke="var(--destructive)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Lucro" stroke="var(--success, var(--chart-2))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-3 sm:gap-4 lg:gap-6">
      <PageHeader
        title="Financeiro"
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


      <Collapsible
        open={filtrosAbertos}
        onOpenChange={setFiltrosAbertos}
        className="panel overflow-hidden"
      >
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 sm:px-5 sm:py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Search className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-semibold uppercase tracking-wide sm:text-lg">
              Buscar e filtrar
            </span>
            <span className="block truncate text-[10px] text-muted-foreground sm:text-xs">
              {filtrando
                ? `Filtrando: ${resumoFiltros}`
                : "Toque para buscar por app, posto, categoria ou serviço"}
            </span>
          </span>
          {filtrando && (
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {filtrosAtivos.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              filtrosAbertos && "rotate-180",
            )}
          />
        </CollapsibleTrigger>

        {filtrando && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-primary/10 px-3 py-2 text-xs">
            <span className="min-w-0">
              {resumoFiltros}
              {" — "}resultado {brl(r.lucro)} líquido
            </span>
            <button
              type="button"
              className="shrink-0 font-medium text-primary"
              onClick={() => {
                setBusca("");
                setTipo("todos");
                setVeiculo("");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t border-border p-3 sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="App, posto, categoria, serviço ou descrição…"
                className="h-10 pl-9 pr-9 text-sm"
              />
              {busca && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setBusca("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {TIPOS_FILTRO.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  className="h-8 text-xs"
                  variant={tipo === t ? "default" : "secondary"}
                  onClick={() => {
                    setTipo(t);
                    if (t !== "todos") setAba(ABA_DO_TIPO[t]);
                  }}
                >
                  {ROTULO_TIPO[t]}
                </Button>
              ))}
            </div>
            {veiculos.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Veículo:</span>
                <Button size="sm" className="h-7 text-xs" variant={!veiculo ? "default" : "outline"} onClick={() => setVeiculo("")}>Todos</Button>
                {veiculos.map((v) => (
                  <Button key={v} size="sm" className="h-7 text-xs" variant={veiculo === v ? "default" : "outline"} onClick={() => setVeiculo(v)}>{v}</Button>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Tabs value={aba} onValueChange={setAba}>
        <div className="-mx-3 overflow-x-auto px-3 print:hidden sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="geral" className="text-xs">Geral</TabsTrigger>
            <TabsTrigger value="despesa" className="text-xs">Despesa</TabsTrigger>
            <TabsTrigger value="manutencao" className="text-xs">Manutenção</TabsTrigger>
            <TabsTrigger value="repasse" className="text-xs">Repasses e a receber</TabsTrigger>
            <TabsTrigger value="abastecimento" className="text-xs">Abastecimento</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="geral" className="mt-3 flex flex-col gap-3 sm:gap-4 lg:gap-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
            <StatCard label="Faturamento" value={brl(r.faturamento)} icon={CircleDollarSign} tone="success" />
            <StatCard label="Custo total" value={brl(r.custos)} hint="Combustível + despesas + manutenção" icon={Receipt} tone="destructive" />
            <div className="col-span-2 sm:col-span-1">
              <StatCard label="Lucro líquido" value={brl(r.lucro)} hint={`Margem de ${margem.toFixed(1)}%`} icon={TrendingUp} tone={r.lucro >= 0 ? "success" : "destructive"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Corridas" value={String(r.corridas)} hint={`Ticket médio ${brl(r.corridas ? r.faturamento / r.corridas : 0)}`} icon={Bike} />
            <StatCard label="KM rodados" value={`${r.km.toLocaleString("pt-BR")} km`} hint={`${r.litros.toFixed(1)} L abastecidos`} icon={Gauge} />
            <StatCard label="Combustível" value={brl(r.combustivel)} hint={`${r.km ? brl(r.combustivel / r.km) : brl(0)} por km`} icon={Fuel} tone="warning" />
            <StatCard label="Manutenção" value={brl(r.manutencao)} icon={Wrench} />
          </div>

          {evolucao}

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <SectionCard title="Faturamento por plataforma">
              <Barras itens={r.porPlataforma} total={r.faturamento} onEscolher={(n) => filtrarPor(n, "todos")} ativo={busca} />
            </SectionCard>
            <SectionCard title="Despesas por categoria">
              <Barras itens={r.porCategoria} total={r.outras} onEscolher={(n) => filtrarPor(n, "despesa")} ativo={busca} />
            </SectionCard>
          </div>

          <SectionCard title="Resumo mensal" description="Todo o período dividido por mês">
            <div className="-mx-3 max-w-[calc(100%+1.5rem)] overflow-x-auto sm:-mx-5 sm:max-w-[calc(100%+2.5rem)]">
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
        </TabsContent>

        <TabsContent value="despesa" className="mt-3 flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total de despesas" value={brl(r.outras)} icon={Receipt} tone="destructive" />
            <StatCard label="Lançamentos" value={String(r.listas.despesas.length)} icon={Receipt} />
            <StatCard
              label="Média por lançamento"
              value={brl(r.listas.despesas.length ? r.outras / r.listas.despesas.length : 0)}
              icon={CircleDollarSign}
            />
            <StatCard
              label="% do faturamento"
              value={`${r.faturamento ? ((r.outras / r.faturamento) * 100).toFixed(1) : "0,0"}%`}
              icon={TrendingUp}
            />
          </div>
          {grafDespesa}
          <SectionCard title="Despesas por categoria">
            <Barras itens={r.porCategoria} total={r.outras} onEscolher={(n) => filtrarPor(n, "despesa")} ativo={busca} />
          </SectionCard>
          <TabelaLista
            titulo="Despesas do período"
            colunas={["Data", "Categoria", "Descrição", "Pagamento", "Valor"]}
            linhas={[...r.listas.despesas]
              .sort((a, b) => b.iso.localeCompare(a.iso))
              .map((d) => ({
                id: d.id,
                celulas: [d.data, d.categoria || "—", d.descricao || "—", d.pagamento || "—"],
                valor: d.valor,
              }))}
            total={r.outras}
          />
        </TabsContent>

        <TabsContent value="manutencao" className="mt-3 flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Total em manutenção" value={brl(r.manutencao)} icon={Wrench} tone="warning" />
            <StatCard label="Serviços" value={String(r.listas.manut.length)} icon={Wrench} />
            <StatCard
              label="Média por serviço"
              value={brl(r.listas.manut.length ? r.manutencao / r.listas.manut.length : 0)}
              icon={CircleDollarSign}
            />
            <StatCard
              label="Custo por km"
              value={r.km ? brl(r.manutencao / r.km) : brl(0)}
              icon={Gauge}
            />
          </div>
          {grafManut}
          <TabelaLista
            titulo="Manutenções do período"
            colunas={["Data", "Veículo", "Serviço", "Km da troca", "Valor"]}
            linhas={[...r.listas.manut]
              .sort((a, b) => b.iso.localeCompare(a.iso))
              .map((m) => ({
                id: m.id,
                celulas: [
                  m.data,
                  m.veiculo || "—",
                  m.servico || "—",
                  m.kmTroca ? `${m.kmTroca.toLocaleString("pt-BR")} km` : "—",
                ],
                valor: m.valor,
              }))}
            total={r.manutencao}
          />
        </TabsContent>

        <TabsContent value="repasse" className="mt-3 min-w-0">
          <RepassesContent intervalo={{ de, ate }} />
        </TabsContent>

        <TabsContent value="abastecimento" className="mt-3 flex flex-col gap-3 sm:gap-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Combustível" value={brl(r.combustivel)} icon={Fuel} tone="warning" />
            <StatCard label="Litros" value={`${r.litros.toFixed(1)} L`} icon={Fuel} />
            <StatCard
              label="Preço médio do litro"
              value={brl(r.litros ? r.combustivel / r.litros : 0)}
              icon={CircleDollarSign}
            />
            <StatCard
              label="Consumo médio"
              value={`${r.litros ? (r.km / r.litros).toFixed(1) : "0,0"} km/L`}
              hint={`${r.km.toLocaleString("pt-BR")} km rodados`}
              icon={Gauge}
            />
          </div>
          {grafAbast}
          <TabelaLista
            titulo="Abastecimentos do período"
            colunas={["Data", "Posto", "Combustível", "Litros", "Valor"]}
            linhas={[...r.listas.abast]
              .sort((a, b) => b.iso.localeCompare(a.iso))
              .map((a) => ({
                id: a.id,
                celulas: [
                  a.data,
                  a.posto || "—",
                  a.combustivel || "—",
                  a.litros ? `${a.litros.toFixed(2)} L` : "—",
                ],
                valor: a.valorPago,
              }))}
            total={r.combustivel}
          />
        </TabsContent>
      </Tabs>


    </div>
  );
}

function Barras({
  itens,
  total,
  onEscolher,
  ativo,
}: {
  itens: { nome: string; valor: number }[];
  total: number;
  onEscolher?: (nome: string) => void;
  ativo?: string;
}) {
  if (itens.length === 0) {
    return <p className="text-xs text-muted-foreground sm:text-sm">Sem dados no período.</p>;
  }
  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {itens.slice(0, 8).map((i) => (
        <button
          type="button"
          key={i.nome}
          onClick={() => onEscolher?.(i.nome)}
          title="Toque para filtrar"
          className={`flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/50 sm:gap-3 ${ativo === i.nome ? "bg-primary/10" : ""}`}
        >
          <span className="w-20 shrink-0 truncate text-[10px] text-muted-foreground sm:w-28 sm:text-sm">{i.nome}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${total ? (i.valor / total) * 100 : 0}%` }}
            />
          </div>
          <span className="num w-18 text-right text-[10px] font-medium sm:w-24 sm:text-sm">{brl(i.valor)}</span>
        </button>
      ))}
    </div>
  );
}

function TabelaLista({
  titulo,
  colunas,
  linhas,
  total,
}: {
  titulo: string;
  colunas: string[];
  linhas: { id: string; celulas: string[]; valor: number }[];
  total: number;
}) {
  return (
    <SectionCard title={titulo} description={`${linhas.length} lançamento(s) · ${brl(total)}`}>
      <div className="-mx-3 max-w-[calc(100%+1.5rem)] overflow-x-auto sm:-mx-5 sm:max-w-[calc(100%+2.5rem)]">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              {colunas.map((c, i) => (
                <TableHead
                  key={c}
                  className={`whitespace-nowrap text-[10px] sm:text-xs ${i === colunas.length - 1 ? "text-right" : ""}`}
                >
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => (
              <TableRow key={l.id}>
                {l.celulas.map((c, i) => (
                  <TableCell
                    key={i}
                    className={`whitespace-nowrap text-[10px] sm:text-xs ${i === 0 ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {c}
                  </TableCell>
                ))}
                <TableCell className="num whitespace-nowrap text-right text-[10px] font-semibold sm:text-xs">
                  {brl(l.valor)}
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={colunas.length} className="text-center text-[10px] text-muted-foreground sm:text-sm">
                  Nenhum lançamento nesse período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
