import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouteContext, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownLeft, ArrowUpRight, Check, ChevronDown, CreditCard, Crown, Pencil, Wallet, CalendarClock, TrendingUp, HandCoins } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calcularCaixa, type ConfiguracaoCaixa } from "@/lib/fluxo-caixa";
import { baixarContaCaixaFn, baixarFaturaCaixaFn, salvarCaixaFn } from "@/lib/fluxo-caixa.functions";
import { isoLocal } from "@/lib/entregas-filtro";
import { paraNumeroBr } from "@/lib/numero";
import { painelQueryOptions } from "@/lib/painel-query";
import { agruparFaturas, type Fatura, type Pagamento } from "@/lib/pagamentos";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

const dataBr = (iso: string) => iso.split("-").reverse().join("/");
export const Route = createFileRoute("/contas-a-pagar")({
  head: () => ({ meta: [
    { title: "Fluxo de caixa — No Corre" },
    { name: "description", content: "Controle Premium de entradas, saídas, vencimentos e saldo acumulado com data de início e saldo inicial." },
    { property: "og:title", content: "Fluxo de caixa — No Corre" },
    { property: "og:description", content: "Acompanhe pagamentos, recebimentos e seu saldo desde o início do controle." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ContasPage,
});
function ContasPage() {
  const { usuario } = useRouteContext({ from: "__root__" });
  if (!usuario?.isPremium) return <div className="mx-auto max-w-3xl space-y-5"><PageHeader title="Fluxo de caixa" subtitle="Premium" /><div className="flex flex-col items-center gap-3 py-10 text-center"><Crown className="size-8 text-primary" /><h2 className="font-semibold">Recurso Premium</h2><Button asChild><Link to="/premium">Desbloquear Premium</Link></Button></div></div>;
  return <ContasPremium config={usuario.caixa ?? null} />;
}
function ContasPremium({ config }: { config: ConfiguracaoCaixa | null }) {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const router = useRouter();
  const salvar = useServerFn(salvarCaixaFn);
  const hoje = isoLocal(new Date());
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [ajustando, setAjustando] = useState(false);
  const [inicio, setInicio] = useState(config?.inicio ?? `${hoje.slice(0, 7)}-01`);
  const [saldo, setSaldo] = useState(String(config?.saldoInicial ?? 0).replace(".", ","));
  const [salvando, setSalvando] = useState(false);
  const [aba, setAba] = useState("pendentes");
  const [filtro, setFiltro] = useState("todas");
  const de = `${mes}-01`;
  const [ano, numeroMes] = mes.split("-").map(Number);
  const ate = isoLocal(new Date(ano ?? 2026, numeroMes ?? 1, 0));
  const caixa = useMemo(() => config ? calcularCaixa(data, config, de, ate, hoje) : null, [data, config, de, ate, hoje]);
  async function persistir(nova: ConfiguracaoCaixa) {
    setSalvando(true);
    try { await salvar({ data: nova }); await router.invalidate(); toast.success("Controle salvo."); setAjustando(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }
  const formulario = <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void persistir({ inicio, saldoInicial: paraNumeroBr(saldo), historicas: config?.historicas ?? [] }); }}>
    <div className="grid gap-1.5"><Label htmlFor="caixa-inicio">Data de início do controle</Label><Input required id="caixa-inicio" type="date" max={hoje} value={inicio} onChange={(e) => setInicio(e.target.value)} /></div>
    <div className="grid gap-1.5"><Label htmlFor="caixa-saldo">Saldo inicial (R$)</Label><Input required id="caixa-saldo" inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} /><p className="text-xs text-muted-foreground">Valor disponível antes dos movimentos da data de início. Pode ser negativo.</p></div>
    <p className="text-sm text-muted-foreground">Seu histórico continua salvo. Contas vencidas antes dessa data ficam separadas, sem entrar automaticamente no saldo ou nas pendências.</p>
    {config && <p className="text-xs text-warning">Alterar a data ou o saldo inicial recalcula todo o controle, sem excluir lançamentos.</p>}
    <Button disabled={salvando} type="submit">{salvando ? "Salvando…" : config ? "Salvar ajustes" : "Iniciar controle"}</Button>
  </form>;
  if (!config || !caixa) return <div className="mx-auto max-w-3xl space-y-6"><PageHeader title="Fluxo de caixa" subtitle="Entradas, saídas e faturas · Premium" /><section className="max-w-lg space-y-5 border-t border-border pt-5"><h2 className="text-lg font-semibold">Início do controle</h2>{formulario}</section></div>;
  const pagas = caixa.contas.filter((p) => p.pago && (p.forma === "Crédito" ? p.dataPago.split("/").reverse().join("-") : p.iso) >= de && (p.forma === "Crédito" ? p.dataPago.split("/").reverse().join("-") : p.iso) <= ate);
  const lista = (aba === "pendentes" ? caixa.abertos : pagas.filter((p) => filtro === "todas" || p.forma === filtro));
  return <div className="mx-auto w-full max-w-5xl min-w-0 space-y-5">
    <PageHeader title="Fluxo de caixa" subtitle="Entradas, saídas e faturas · Premium" />
    <section className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
      <div><p className="text-sm font-medium">Desde {dataBr(config.inicio)}</p><p className="text-xs text-muted-foreground">Saldo inicial {brl(config.saldoInicial)}</p></div>
      <Button size="sm" variant="outline" onClick={() => { setInicio(config.inicio); setSaldo(String(config.saldoInicial).replace(".", ",")); setAjustando(true); }}><Pencil className="size-3.5" />Ajustar</Button>
    </section>
    <div className="flex flex-wrap items-center gap-3"><Label htmlFor="caixa-mes">Período</Label><Input id="caixa-mes" type="month" className="w-44" min={config.inicio.slice(0, 7)} max={hoje.slice(0, 7)} value={mes} onChange={(e) => { if (e.target.value) setMes(e.target.value); }} /></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Entradas do mês" value={brl(caixa.entradas)} icon={ArrowDownLeft} tone="success" />
      <StatCard label="Saídas do mês" value={brl(caixa.saidas)} icon={ArrowUpRight} tone="destructive" />
      <StatCard label="Saldo do mês" value={brl(caixa.saldoPeriodo)} icon={TrendingUp} tone={caixa.saldoPeriodo < 0 ? "destructive" : "success"} />
      <StatCard label="Saldo acumulado" value={brl(caixa.saldoAcumulado)} icon={Wallet} hint={`Até ${dataBr(ate < hoje ? ate : hoje)}`} />
    </div>
    <section className="space-y-3 border-b border-border pb-4"><h2 className="font-semibold">Evolução do saldo</h2><div className="h-52 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><AreaChart data={caixa.evolucao} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="dia" tickFormatter={(v: string) => dataBr(v).slice(0, 5)} stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} width={65} /><Tooltip formatter={(v) => [brl(Number(v)), "Saldo"]} labelFormatter={(v) => dataBr(String(v))} contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} /><Area type="stepAfter" dataKey="saldo" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} /></AreaChart></ResponsiveContainer></div></section>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><StatCard label="Contas em aberto" value={brl(caixa.aPagar)} icon={CalendarClock} tone="warning" /><StatCard label="Ainda a receber" value={brl(caixa.aReceber)} icon={HandCoins} /><StatCard label="Saldo previsto" value={brl(caixa.previsto)} icon={Wallet} hint="Saldo + a receber − contas abertas" /></div>
    <Tabs defaultValue="contas"><TabsList className="w-full"><TabsTrigger className="flex-1" value="contas">Contas a pagar</TabsTrigger><TabsTrigger className="flex-1" value="extrato">Extrato do mês</TabsTrigger></TabsList>
      <TabsContent value="contas" className="space-y-4">
        <div className="flex flex-wrap gap-2"><Button size="sm" variant={aba === "pendentes" ? "default" : "outline"} onClick={() => setAba("pendentes")}>Em aberto ({caixa.abertos.length})</Button><Button size="sm" variant={aba === "pagas" ? "default" : "outline"} onClick={() => setAba("pagas")}>Pagas no mês ({pagas.length})</Button></div>
        {aba === "pagas" && <div className="flex flex-wrap gap-2">{["todas", "Crédito", "Pix", "Débito", "Dinheiro", "Outros"].map((forma) => <Button key={forma} size="sm" variant={filtro === forma ? "secondary" : "ghost"} onClick={() => setFiltro(forma)}>{forma === "todas" ? "Todas" : forma}</Button>)}</div>}
        {aba === "pendentes" ? <div className="space-y-3">{caixa.abertos.length ? agruparFaturas(caixa.abertos).map((f) => <FaturaCard key={f.chave} fatura={f} inicio={config.inicio} />) : <p className="py-6 text-sm text-muted-foreground">Nenhuma conta em aberto.</p>}</div> :
        <div className="divide-y divide-border">{lista.length ? lista.map((p) => <ItemConta key={p.id} p={p} inicio={config.inicio} totalBaixa={p.origem === "Abastecimento" ? data.abastecimentos.find((a) => a.row === p.row)?.valorPago ?? p.valor : p.valor} />) : <p className="py-6 text-sm text-muted-foreground">Nenhuma conta paga neste mês.</p>}</div>}
        {caixa.historicas.length > 0 && <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">Contas anteriores fora do controle ({caixa.historicas.length})</summary><p className="my-3 text-xs text-muted-foreground">Inclua somente o que ainda precisa pagar. O histórico não foi alterado.</p>{caixa.historicas.map((p) => <div key={p.id} className="flex items-center justify-between gap-3 border-b border-border py-3"><div className="min-w-0"><p className="text-sm">{p.descricao}</p><p className="text-xs text-muted-foreground">Vence {p.dataPagamento} · {brl(p.valor)}</p></div><Button size="sm" variant="outline" disabled={salvando} onClick={() => void persistir({ ...config, historicas: [...config.historicas, p.id] })}>Incluir</Button></div>)}</details>}
      </TabsContent>
      <TabsContent value="extrato"><div className="divide-y divide-border">{caixa.movimentos.length ? caixa.movimentos.map((m) => <div key={m.id} className="flex justify-between gap-3 py-3"><div className="min-w-0"><p className="text-sm font-medium">{m.descricao}</p><p className="text-xs text-muted-foreground">{dataBr(m.iso)} · {m.forma}</p></div><div className="shrink-0 text-right"><p className={cn("text-sm font-semibold", m.entrada ? "text-success" : "text-destructive")}>{m.entrada ? "+" : "−"}{brl(m.entrada || m.saida)}</p><p className="text-xs text-muted-foreground">Saldo {brl(m.saldo)}</p></div></div>) : <p className="py-6 text-sm text-muted-foreground">Nenhuma movimentação neste mês.</p>}</div></TabsContent>
    </Tabs>
    <Sheet open={ajustando} onOpenChange={setAjustando}><SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto pb-[calc(1rem+var(--altura-banner-ads,0px))]"><SheetHeader><SheetTitle>Ajustar início do controle</SheetTitle><SheetDescription>Data de início e saldo disponível.</SheetDescription></SheetHeader><div className="mx-auto mt-5 max-w-lg">{formulario}</div></SheetContent></Sheet>
  </div>;
}
function ItemConta({ p, inicio, totalBaixa }: { p: Pagamento; inicio: string; totalBaixa: number }) {
  const baixar = useServerFn(baixarContaCaixaFn);
  const qc = useQueryClient();
  const hoje = isoLocal(new Date());
  const [aberta, setAberta] = useState(false);
  const [dataPago, setDataPago] = useState(hoje);
  const [salvando, setSalvando] = useState(false);
  const credito = p.forma === "Crédito";
  async function confirmar() {
    setSalvando(true);
    try { await baixar({ data: { id: p.id, dataPago: p.pago ? null : dataPago } }); await qc.invalidateQueries({ queryKey: ["painel"] }); toast.success(p.pago ? "Baixa desfeita." : "Pagamento registrado."); setAberta(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }
  return <div className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{p.descricao || p.categoria}</p><p className="text-xs text-muted-foreground">Compra {p.data}{credito ? ` · Vence ${p.dataPagamento}` : ` · ${p.forma}`}</p><p className={cn("text-xs", p.pago ? "text-success" : p.isoPagamento < hoje ? "text-destructive" : "text-warning")}>{p.pago ? p.dataPago ? `Pago em ${p.dataPago}` : "Quitado" : p.isoPagamento < hoje ? "Vencida" : "Pendente"}</p></div><div className="flex shrink-0 flex-col items-end gap-1"><span className="text-sm font-semibold">{brl(p.valor)}</span>{credito ? <Button size="sm" variant={p.pago ? "ghost" : "default"} onClick={() => setAberta(true)}>{p.pago ? "Desfazer" : "Dar baixa"}</Button> : <Check className="size-4 text-success" />}</div>
    <Sheet open={aberta} onOpenChange={setAberta}><SheetContent side="bottom" className="pb-[calc(1rem+var(--altura-banner-ads,0px))]"><SheetHeader><SheetTitle>{p.pago ? "Desfazer pagamento" : "Dar baixa"}</SheetTitle><SheetDescription>{p.descricao} · {brl(totalBaixa)}</SheetDescription></SheetHeader><div className="mx-auto mt-5 grid max-w-lg gap-4">{p.origem === "Abastecimento" && <p className="text-sm text-warning">A baixa deste abastecimento quita todas as parcelas juntas: {brl(totalBaixa)}.</p>}{!p.pago && <div className="grid gap-2"><Label htmlFor={`baixa-${p.id}`}>Data do pagamento</Label><Input id={`baixa-${p.id}`} type="date" min={inicio} max={hoje} value={dataPago} onChange={(e) => setDataPago(e.target.value)} /></div>}<Button disabled={salvando} onClick={() => void confirmar()}>{salvando ? "Salvando…" : p.pago ? "Desfazer baixa" : "Confirmar pagamento"}</Button></div></SheetContent></Sheet>
  </div>;
}

/** total que a baixa realmente quita: abastecimento parcelado quita todas as parcelas juntas */
function totalSelecao(itens: Pagamento[]) {
  return Math.round(itens.reduce((s, p) => s + p.valor, 0) * 100) / 100;
}
function FaturaCard({ fatura, inicio }: { fatura: Fatura; inicio: string }) {
  const baixarLote = useServerFn(baixarFaturaCaixaFn);
  const qc = useQueryClient();
  const hoje = isoLocal(new Date());
  const [aberta, setAberta] = useState(false);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [confirmando, setConfirmando] = useState<Pagamento[] | null>(null);
  const [dataPago, setDataPago] = useState(hoje);
  const [salvando, setSalvando] = useState(false);
  const pagaveis = fatura.itens;
  const vencida = fatura.isoVencimento < hoje;
  const escolhidas = pagaveis.filter((p) => selecionadas.includes(p.id));
  // parcelas irmãs de abastecimento parcelado saem juntas na mesma baixa
  const temParcelado = (confirmando ?? []).some((p) => p.origem === "Abastecimento" && /\(\d+\/\d+\)/.test(p.descricao));
  async function confirmar() {
    if (!confirmando?.length) return;
    setSalvando(true);
    try {
      const r = await baixarLote({ data: { ids: confirmando.map((p) => p.id), dataPago } });
      await qc.invalidateQueries({ queryKey: ["painel"] });
      toast.success(`${r.quantidade} ${r.quantidade === 1 ? "conta paga" : "contas pagas"}.`);
      setConfirmando(null); setSelecionadas([]);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }
  return <section className="rounded-lg border border-border bg-card">
    <div className="flex flex-wrap items-center gap-3 p-4">
      <CreditCard className="size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{fatura.cartao ? `Fatura ${fatura.cartao}` : "Fatura do cartão"}</p>
        <p className="text-xs text-muted-foreground">Vence {dataBr(fatura.isoVencimento)} · {fatura.itens.length} {fatura.itens.length === 1 ? "compra" : "compras"}</p>
        <p className={cn("text-xs", vencida ? "text-destructive" : "text-warning")}>{vencida ? "Vencida" : "Em aberto"}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-lg font-bold">{brl(fatura.total)}</span>
        {pagaveis.length > 0 && <Button size="sm" onClick={() => { setDataPago(hoje); setConfirmando(pagaveis); }}>Pagar fatura</Button>}
      </div>
    </div>
    <button type="button" className="flex w-full items-center justify-between border-t border-border px-4 py-2 text-sm text-muted-foreground" onClick={() => setAberta((v) => !v)} aria-expanded={aberta}>
      {aberta ? "Esconder compras" : "Ver compras desta fatura"}<ChevronDown className={cn("size-4 transition-transform", aberta && "rotate-180")} />
    </button>
    {aberta && <div className="border-t border-border px-4">
      {pagaveis.length > 1 && <label className="flex items-center gap-2 py-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={escolhidas.length === pagaveis.length} onChange={(e) => setSelecionadas(e.target.checked ? pagaveis.map((p) => p.id) : [])} />Selecionar todas</label>}
      <div className="divide-y divide-border">{fatura.itens.map((p) => {
        const pagavel = true;
        return <div key={p.id} className="flex items-center gap-3 py-3">
          {pagavel ? <input type="checkbox" aria-label={`Selecionar ${p.descricao}`} className="size-4 shrink-0 accent-primary" checked={selecionadas.includes(p.id)} onChange={(e) => setSelecionadas((atual) => e.target.checked ? [...atual, p.id] : atual.filter((id) => id !== p.id))} /> : <span className="size-4 shrink-0" />}
          <div className="min-w-0 flex-1"><p className="truncate text-sm">{p.descricao || p.categoria}</p><p className="text-xs text-muted-foreground">Compra {p.data}</p></div>
          <div className="flex shrink-0 flex-col items-end gap-1"><span className="text-sm font-semibold">{brl(p.valor)}</span>{!pagavel && <Button size="sm" variant="outline" asChild><Link to="/despesas">Editar despesa</Link></Button>}</div>
        </div>;
      })}</div>
      {escolhidas.length > 0 && <div className="py-3"><Button className="w-full" variant="secondary" onClick={() => { setDataPago(hoje); setConfirmando(escolhidas); }}>Pagar {escolhidas.length} {escolhidas.length === 1 ? "selecionada" : "selecionadas"} · {brl(totalSelecao(escolhidas))}</Button></div>}
    </div>}
    <Sheet open={!!confirmando} onOpenChange={(v) => { if (!v) setConfirmando(null); }}><SheetContent side="bottom" className="pb-[calc(1rem+var(--altura-banner-ads,0px))]"><SheetHeader><SheetTitle>Confirmar pagamento</SheetTitle><SheetDescription>{confirmando?.length} {confirmando?.length === 1 ? "compra" : "compras"} · {brl(totalSelecao(confirmando ?? []))}</SheetDescription></SheetHeader><div className="mx-auto mt-5 grid max-w-lg gap-4">{temParcelado && <p className="text-sm text-warning">Abastecimento parcelado: a baixa quita todas as parcelas dele juntas.</p>}<div className="grid gap-2"><Label htmlFor={`fatura-${fatura.chave}`}>Data do pagamento</Label><Input id={`fatura-${fatura.chave}`} type="date" min={inicio} max={hoje} value={dataPago} onChange={(e) => setDataPago(e.target.value)} /></div><Button disabled={salvando || !dataPago} onClick={() => void confirmar()}>{salvando ? "Salvando…" : "Confirmar pagamento"}</Button></div></SheetContent></Sheet>
  </section>;
}
