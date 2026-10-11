import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Banknote, CreditCard, Crown, Landmark, QrCode, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cardsPorForma, filtrarPagamentosPeriodo } from "@/lib/contas-pagar";
import { isoLocal, type PeriodoEntregas } from "@/lib/entregas-filtro";
import { baixarPagamentoFn } from "@/lib/painel.functions";
import { painelQueryOptions } from "@/lib/painel-query";
import { montaPagamentos, type Forma } from "@/lib/pagamentos";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contas-a-pagar")({
  head: () => ({
    meta: [
      { title: "Contas a pagar — No Corre" },
      { name: "description", content: "Seus gastos por forma de pagamento: cartão, Pix, débito e dinheiro." },
      { property: "og:title", content: "Contas a pagar — No Corre" },
      { property: "og:description", content: "Seus gastos por forma de pagamento: cartão, Pix, débito e dinheiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(painelQueryOptions());
  },
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-destructive">{(error as Error).message}</div>
  ),
  component: ContasPage,
});

const PERIODOS: [PeriodoEntregas, string][] = [
  ["hoje", "Hoje"],
  ["semana", "Semana"],
  ["mes", "Mês"],
  ["tudo", "Tudo"],
  ["personalizado", "Personalizado"],
];

const ICONES: Record<Forma, typeof Wallet> = {
  Crédito: CreditCard,
  Pix: QrCode,
  Débito: Landmark,
  Dinheiro: Banknote,
  Outros: Wallet,
};

function ContasPage() {
  const context = useRouteContext({ from: "__root__" });
  const premium = context.usuario?.isPremium ?? false;

  if (!premium) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <PageHeader title="Contas a pagar" subtitle="Seus gastos por forma de pagamento." />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center">
          <Crown className="size-8 text-primary" />
          <p className="font-semibold">Recurso Premium</p>
          <p className="text-sm text-muted-foreground">
            Veja quanto gastou no cartão, Pix, débito e dinheiro, acompanhe os vencimentos do cartão e dê baixa na fatura.
          </p>
          <Button asChild><Link to="/premium">Desbloquear Premium</Link></Button>
        </div>
      </div>
    );
  }
  return <ContasPremium />;
}

function ContasPremium() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<PeriodoEntregas>("mes");
  const [de, setDe] = useState(() => isoLocal(new Date()));
  const [ate, setAte] = useState(() => isoLocal(new Date()));
  const [aberta, setAberta] = useState<Forma | null>(null);

  const todos = useMemo(() => montaPagamentos(data.despesas, data.abastecimentos), [data]);
  const lista = useMemo(
    () => filtrarPagamentosPeriodo(todos, { periodo, de, ate }),
    [todos, periodo, de, ate],
  );
  const cards = cardsPorForma(lista);
  const total = lista.reduce((s, p) => s + p.valor, 0);
  const itens = aberta ? lista.filter((p) => p.forma === aberta) : [];

  const chip = (ativo: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
      ativo ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
    );

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-4">
      <PageHeader title="Contas a pagar" subtitle="Seus gastos por forma de pagamento." />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODOS.map(([p, r]) => (
          <button key={p} type="button" className={chip(periodo === p)} onClick={() => setPeriodo(p)}>{r}</button>
        ))}
      </div>
      {periodo === "personalizado" && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="cp-de" className="text-xs text-muted-foreground">Do dia</Label>
            <Input id="cp-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-9 w-40 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="cp-ate" className="text-xs text-muted-foreground">Até o dia</Label>
            <Input id="cp-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-9 w-40 text-sm" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-primary/10 p-3">
        <p className="text-[11px] text-muted-foreground">Total gasto no período</p>
        <p className="text-2xl font-semibold tracking-tight">{brl(total)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((c) => {
          const Icone = ICONES[c.forma];
          return (
            <button
              key={c.forma}
              type="button"
              onClick={() => setAberta(c.forma)}
              className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 active:bg-accent"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icone className="size-4 text-primary" /> {c.forma === "Crédito" ? "Cartão (crédito)" : c.forma}
              </span>
              <span className="truncate text-lg font-semibold">{brl(c.total)}</span>
              <span className="text-[11px] text-muted-foreground">{c.quantidade} lançamento(s)</span>
              {c.forma === "Crédito" && c.emAberto > 0.009 && (
                <span className="text-[11px] font-medium text-destructive">Em aberto: {brl(c.emAberto)}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Cartão é filtrado pela data de vencimento; Pix, débito e dinheiro pela data da compra.
      </p>

      <Sheet open={aberta !== null} onOpenChange={(o) => !o && setAberta(null)}>
        <SheetContent
          side="bottom"
          className="flex max-h-[85dvh] flex-col gap-3 rounded-t-2xl px-4 pt-3"
          style={{ bottom: "var(--altura-banner-ads, 0px)", paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <SheetHeader className="text-left">
            <SheetTitle>{aberta === "Crédito" ? "Cartão (crédito)" : aberta}</SheetTitle>
            <SheetDescription>{itens.length} lançamento(s) · {brl(itens.reduce((s, p) => s + p.valor, 0))}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-2 overflow-y-auto">
            {itens.length === 0 && <p className="text-sm text-muted-foreground">Nada neste período.</p>}
            {itens.map((p) => <ItemConta key={p.id} p={p} />)}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ItemConta({ p }: { p: ReturnType<typeof montaPagamentos>[number] }) {
  const baixar = useServerFn(baixarPagamentoFn);
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const credito = p.forma === "Crédito";
  const hoje = isoLocal(new Date());
  const vencida = credito && !p.pago && p.isoPagamento < hoje;

  const alternar = async () => {
    setSalvando(true);
    try {
      await baixar({ data: { rows: [p.id], dataPago: p.pago ? null : hoje } });
      await qc.invalidateQueries({ queryKey: ["painel"] });
      toast.success(p.pago ? "Baixa desfeita." : "Pagamento baixado.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{p.descricao || p.categoria || p.origem}</p>
        <p className="text-xs text-muted-foreground">
          Compra {p.data}
          {credito && ` · Vence ${p.dataPagamento}`}
        </p>
        {credito && (
          <p className={cn("text-xs font-medium", p.pago ? "text-primary" : vencida ? "text-destructive" : "text-muted-foreground")}>
            {p.pago ? `Pago${p.dataPago ? ` em ${p.dataPago}` : ""}` : vencida ? "Vencida" : "Pendente"}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-semibold">{brl(p.valor)}</span>
        {credito && (
          <Button size="sm" variant={p.pago ? "ghost" : "default"} disabled={salvando} onClick={alternar}>
            {salvando ? "..." : p.pago ? "Desfazer" : "Dar baixa"}
          </Button>
        )}
      </div>
    </div>
  );
}
