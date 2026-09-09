import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AtalhoPaginas } from "@/components/atalho-paginas";
import { BaixaPagamentoDialog, BotaoBaixaRapida } from "@/components/baixa-pagamento";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  agrupaCustos,
  montaCustos,
  paresDuplicados,
  resumoFechamento,
  type ItemCusto,
} from "@/lib/fechamento";
import { parcelasPagas } from "@/lib/pagamentos";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/fechamento")({
  head: () => ({
    meta: [
      { title: "Fechamento do mês — Rota Control" },
      {
        name: "description",
        content:
          "Feche o mês em uma tela só: custos de combustível, despesas e manutenção juntos, o que já foi pago e o que ainda vence.",
      },
      { property: "og:title", content: "Fechamento do mês — Rota Control" },
      {
        property: "og:description",
        content:
          "Custos consolidados por mês de lançamento, situação de pagamento e conferência de lançamentos duplicados.",
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
  component: FechamentoPage,
});

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function inicioMes(offset = 0) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}
function fimMes(offset = 0) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset + 1, 0);
}

const CHAVE_FECHADOS = "rota-control:meses-fechados";

function lerFechados(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CHAVE_FECHADOS) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function FechamentoPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [de, setDe] = useState(() => iso(inicioMes()));
  const [ate, setAte] = useState(() => iso(fimMes()));
  const [abertos, setAbertos] = useState<string[]>([]);
  const [fechados, setFechados] = useState<Record<string, string>>({});

  useEffect(() => setFechados(lerFechados()), []);

  const hoje = iso(new Date());
  const dentro = (i: string) => Boolean(i) && (!de || i >= de) && (!ate || i <= ate);

  const todosCustos = useMemo(() => montaCustos(data), [data]);
  const itens = useMemo(() => todosCustos.filter((i) => dentro(i.iso)), [todosCustos, de, ate]);
  const grupos = useMemo(() => agrupaCustos(itens), [itens]);
  const resumo = useMemo(
    () => resumoFechamento(data, itens, dentro, hoje, ate),
    [data, itens, de, ate, hoje],
  );

  const emAberto = useMemo(
    () =>
      itens
        .filter((i) => !i.pago && i.pagamento)
        .sort((a, b) => a.isoVencimento.localeCompare(b.isoVencimento)),
    [itens],
  );
  const pagasCredito = useMemo(
    () => parcelasPagas(todosCustos.flatMap((i) => (i.pagamento ? [i.pagamento] : []))),
    [todosCustos],
  );
  const duplicados = useMemo(
    () => paresDuplicados(data.despesas, data.manutencoes).filter((p) => dentro(p.despesa.iso)),
    [data, de, ate],
  );

  const chaveMes = de.slice(0, 7);
  const fechadoEm = fechados[chaveMes];
  const margem = resumo.faturado ? (resumo.lucro / resumo.faturado) * 100 : 0;

  function alternarFechamento() {
    const proximo = { ...fechados };
    if (fechadoEm) delete proximo[chaveMes];
    else proximo[chaveMes] = new Date().toLocaleDateString("pt-BR");
    setFechados(proximo);
    window.localStorage.setItem(CHAVE_FECHADOS, JSON.stringify(proximo));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Fechamento do mês"
        subtitle="Tudo o que você precisa conferir para fechar o mês em uma tela só"
      />

      <div className="flex flex-col items-center gap-3">
        <AtalhoPaginas />
      </div>

      <SectionCard title="Período" description="Todo custo conta no mês em que foi lançado">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={de === iso(inicioMes()) ? "default" : "secondary"}
              onClick={() => {
                setDe(iso(inicioMes()));
                setAte(iso(fimMes()));
              }}
            >
              Mês atual
            </Button>
            <Button
              size="sm"
              variant={de === iso(inicioMes(-1)) ? "default" : "secondary"}
              onClick={() => {
                setDe(iso(inicioMes(-1)));
                setAte(iso(fimMes(-1)));
              }}
            >
              Mês passado
            </Button>
            <Button
              size="sm"
              variant={de === iso(inicioMes(-2)) ? "default" : "secondary"}
              onClick={() => {
                setDe(iso(inicioMes(-2)));
                setAte(iso(fimMes(-2)));
              }}
            >
              Dois meses atrás
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="fech-de" className="text-[10px] uppercase tracking-wide text-muted-foreground">
                De
              </Label>
              <Input id="fech-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-9 w-36 text-xs sm:w-44 sm:text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="fech-ate" className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Até
              </Label>
              <Input id="fech-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-9 w-36 text-xs sm:w-44 sm:text-sm" />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Faturado" value={brl(resumo.faturado)} icon={CircleDollarSign} tone="success" />
        <StatCard label="Recebido" value={brl(resumo.recebido)} hint="Repasses das plataformas" icon={Wallet} />
        <StatCard
          label="Custo total"
          value={brl(resumo.custos)}
          hint="Combustível + despesas + manutenção"
          icon={Receipt}
          tone="destructive"
        />
        <StatCard
          label="Lucro"
          value={brl(resumo.lucro)}
          hint={`Margem de ${margem.toFixed(1)}%`}
          icon={TrendingUp}
          tone={resumo.lucro >= 0 ? "success" : "destructive"}
        />
      </div>

      <SectionCard
        title="Custos do período"
        description="Combustível, despesas e manutenção na mesma lista, sem repetir valores"
      >
        {grupos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum custo lançado no período.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {grupos.map((g) => {
              const aberto = abertos.includes(g.grupo);
              return (
                <div key={g.grupo} className="py-2">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() =>
                      setAbertos((s) =>
                        s.includes(g.grupo) ? s.filter((x) => x !== g.grupo) : [...s, g.grupo],
                      )
                    }
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform ${aberto ? "" : "-rotate-90"}`}
                      />
                      <span className="truncate text-sm font-medium">{g.grupo}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {g.itens.length} lanç.
                      </span>
                    </span>
                    <span className="num shrink-0 text-sm font-semibold">{brl(g.total)}</span>
                  </button>
                  {aberto && (
                    <div className="mt-2 flex flex-col divide-y divide-border border-l border-border pl-3">
                      {g.itens.map((i) => (
                        <LinhaItem key={i.id} item={i} hoje={hoje} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Já pago" value={brl(resumo.jaPago)} icon={CheckCircle2} tone="success" />
        <StatCard label="Ainda a pagar" value={brl(resumo.aPagar)} icon={CalendarClock} tone="warning" />
        <StatCard
          label="Vencido"
          value={brl(resumo.vencido)}
          hint="Sem baixa e com vencimento passado"
          icon={AlertTriangle}
          tone={resumo.vencido > 0 ? "destructive" : "success"}
        />
        <StatCard
          label="Vence depois"
          value={brl(resumo.venceDepois)}
          hint="Deste período, mas vence em meses seguintes"
          icon={CalendarClock}
        />
      </div>

      <SectionCard
        title="Situação de pagamento"
        description={`${emAberto.length} lançamento${emAberto.length === 1 ? "" : "s"} sem baixa neste período`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <BaixaPagamentoDialog
              abertas={emAberto.flatMap((i) => (i.pagamento ? [i.pagamento] : []))}
              pagas={pagasCredito}
              hojeIso={hoje}
            >
              <Button variant="outline">
                <CheckCircle2 className="size-4" /> Lançar pagamento
              </Button>
            </BaixaPagamentoDialog>
            <Button variant={fechadoEm ? "secondary" : "default"} onClick={alternarFechamento}>
              <CheckCircle2 className="size-4" />
              {fechadoEm ? `Mês conferido em ${fechadoEm} · reabrir` : "Fechar mês"}
            </Button>
          </div>

          {emAberto.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tudo pago neste período.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {emAberto.map((i) => (
                <LinhaItem key={i.id} item={i} hoje={hoje} />
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Conferência"
        description="Lançamentos que parecem estar em duplicidade"
      >
        {duplicados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma duplicidade encontrada no período.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Estes serviços aparecem como despesa e como manutenção. O valor está sendo contado
              uma vez só (pela despesa), mas vale conferir e apagar a cópia.
            </p>
            <div className="flex flex-col divide-y divide-border">
              {duplicados.map((p) => (
                <div
                  key={`${p.despesa.row}-${p.manutencao.row}`}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {p.manutencao.servico || p.despesa.categoria}
                    </div>
                    <div className="num text-xs text-muted-foreground">
                      despesa {p.despesa.data} · manutenção {p.manutencao.data}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="num text-sm font-semibold">{brl(p.despesa.valor)}</span>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/lancamentos">Abrir</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function LinhaItem({ item, hoje }: { item: ItemCusto; hoje: string }) {
  const vencida = !item.pago && Boolean(item.isoVencimento) && item.isoVencimento <= hoje;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="truncate text-sm">{item.descricao}</div>
        <div className="num mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{item.data}</span>
          <Badge variant="outline">{item.forma === "Outros" ? "Não informado" : item.forma}</Badge>
          {!item.pago && <span>vence {item.dataVencimento}</span>}
          {vencida && <Badge variant="destructive">vencida</Badge>}
          {item.pago && item.forma === "Crédito" && <Badge variant="secondary">pago</Badge>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="num text-sm font-semibold">{brl(item.valor)}</span>
        {!item.pago && item.pagamento && <BotaoBaixaRapida pagamento={item.pagamento} />}
      </div>
    </div>
  );
}
