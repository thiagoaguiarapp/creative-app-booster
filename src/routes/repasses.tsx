import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  HandCoins,
  History,

  Landmark,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento, hojeInputDate } from "@/components/lancamento-form";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { criarAuditoriaMensal, normalizarPlataforma, saldosAteMes } from "@/lib/conciliacao";
import { ehExtra, ehGorjeta, ehSobra } from "@/lib/extras";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/repasses")({
  head: () => ({
    meta: [
      { title: "Recebimento e repasse — Rota Control" },
      {
        name: "description",
        content: "Acompanhe os repasses das plataformas por aplicativo, forma de recebimento e data.",
      },
      { property: "og:title", content: "Recebimento e repasse — Rota Control" },
      {
        property: "og:description",
        content: "Repasses das plataformas por aplicativo, forma de recebimento e data.",
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
  component: RepassesPage,
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

function RepassesPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("atual");
  const [aberto, setAberto] = useState<string | null>(null);

  const prefixo = periodo === "total" ? null : prefixoMes(periodo === "atual" ? 0 : -1);

  const repasses = useMemo(
    () => (prefixo ? data.repasses.filter((r) => r.iso.startsWith(prefixo)) : data.repasses),
    [data.repasses, prefixo],
  );
  const ganhos = useMemo(
    () => (prefixo ? data.ganhos.filter((g) => g.iso.startsWith(prefixo)) : data.ganhos),
    [data.ganhos, prefixo],
  );

  const recentes = [...repasses].sort((a, b) => b.iso.localeCompare(a.iso)).slice(0, 15);

  // regra: gorjeta, caixinha e sobra de troco só contam quando lançadas em Ganhos diários.
  const gorjetas = ganhos.filter((g) => ehGorjeta(g.plataforma)).reduce((s, g) => s + g.faturamento, 0);
  const sobraTroco = ganhos.filter((g) => ehSobra(g.plataforma)).reduce((s, g) => s + g.faturamento, 0);

  const extrasNoRepasse = repasses.filter((r) => ehExtra(r.aplicativo));
  const extrasNoRepasseValor = extrasNoRepasse.reduce((s, r) => s + r.valor, 0);

  const recebidoPlataformas = repasses
    .filter((r) => !ehExtra(r.aplicativo))
    .reduce((s, r) => s + r.valor, 0);
  // "Recebido" compara com "Faturado", que não inclui extras — extras ficam em cards próprios.
  const recebido = recebidoPlataformas;



  const faturado = ganhos
    .filter((g) => !ehExtra(g.plataforma))
    .reduce((s, g) => s + g.faturamento, 0);
  

  

  const norm = normalizarPlataforma;

  const porApp = useMemo(() => {
    const mapa = new Map<string, { app: string; faturado: number; recebido: number }>();
    const pegar = (nome: string) => {
      const chave = norm(nome);
      let item = mapa.get(chave);
      if (!item) {
        item = { app: nome.trim() || "—", faturado: 0, recebido: 0 };
        mapa.set(chave, item);
      }
      return item;
    };
    for (const g of ganhos) {
      if (ehExtra(g.plataforma)) continue;
      pegar(g.plataforma).faturado += g.faturamento;
    }
    for (const r of repasses) {
      if (ehExtra(r.aplicativo)) continue;
      pegar(r.aplicativo).recebido += r.valor;
    }
    return Array.from(mapa.values())
      .map((i) => ({ ...i, pendente: i.faturado - i.recebido }))
      .filter((i) => i.faturado !== 0 || i.recebido !== 0)
      .sort((a, b) => b.faturado - a.faturado || b.recebido - a.recebido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ganhos, repasses]);

  const auditoria = useMemo(
    () => criarAuditoriaMensal(data.ganhos, data.repasses),
    [data.ganhos, data.repasses],
  );
  const saldosSelecionados = useMemo(
    () => (prefixo ? saldosAteMes(auditoria, prefixo) : new Map<string, { app: string; saldo: number }>()),
    [auditoria, prefixo],
  );

  // conciliação: o que sobrou do recebido no mês abate a pendência antiga do mesmo app
  const conciliacao = useMemo(() => {
    const chaves = new Set([...porApp.map((a) => norm(a.app)), ...saldosSelecionados.keys()]);
    return Array.from(chaves).map((chave) => {
      const mes = porApp.find((a) => norm(a.app) === chave);
      const acumulado = saldosSelecionados.get(chave);
      const app = mes?.app ?? acumulado?.app ?? "—";
      const faturadoMes = mes?.faturado ?? 0;
      const recebidoMes = mes?.recebido ?? 0;
      const pendenteMes = Math.max(0, faturadoMes - recebidoMes);
      const saldoAcumulado = Math.max(0, acumulado?.saldo ?? 0);
      const restanteAnterior = Math.max(0, saldoAcumulado - pendenteMes);
      const historicoAntes = auditoria
        .filter((item) => item.mes < (prefixo ?? "") && norm(item.app) === chave)
        .at(0);
      const pendenteAnterior = Math.max(0, historicoAntes?.saldoAcumulado ?? 0);
      const abatido = Math.max(0, pendenteAnterior - restanteAnterior);
      return {
        app,
        faturadoMes,
        recebidoMes,
        pendenteAnterior,
        abatido,
        restanteAnterior,
        pendenteMes,
        total: pendenteMes + restanteAnterior,
      };
    }).sort((a, b) => b.total - a.total || b.pendenteAnterior - a.pendenteAnterior);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porApp, saldosSelecionados, auditoria, prefixo]);


  const pendenteAnteriorTotal = conciliacao.reduce((s, a) => s + a.pendenteAnterior, 0);
  const abatidoTotal = conciliacao.reduce((s, a) => s + a.abatido, 0);
  const restanteAnteriorTotal = conciliacao.reduce((s, a) => s + a.restanteAnterior, 0);

  const pendenteTotal = conciliacao.reduce((s, a) => s + a.pendenteMes, 0);
  const aReceberGeral = pendenteTotal + restanteAnteriorTotal;

  const porForma = useMemo(() => {

    const mapa = new Map<string, { forma: string; valor: number }>();
    for (const r of repasses) {
      if (ehExtra(r.aplicativo)) continue;
      const nome = (r.forma || "—").trim() || "—";
      const chave = nome.toUpperCase();
      const item = mapa.get(chave) ?? { forma: nome, valor: 0 };
      item.valor += r.valor;
      mapa.set(chave, item);
    }
    return Array.from(mapa.values()).sort((a, b) => b.valor - a.valor);
  }, [repasses]);

  const somaForma = (teste: (f: string) => boolean) =>
    repasses
      .filter((r) => !ehExtra(r.aplicativo) && teste((r.forma || "").trim().toUpperCase()))
      .reduce((s, r) => s + r.valor, 0);
  // a forma vem como "IFOOD DINHEIRO", "99 PIX", "99 DEPOSITO" — comparar por conteúdo, não por início.
  const emDinheiro = somaForma((f) => f.includes("DINHEIRO") || f.includes("ESPÉCIE") || f.includes("ESPECIE"));
  const emPix = somaForma((f) => f.includes("PIX"));
  const emDeposito = somaForma((f) => f.includes("DEPOSITO") || f.includes("DEPÓSITO") || f.includes("REPASSE"));



  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Recebimento / Repasse"
        subtitle="Conciliação dos repasses das plataformas (aba REPASSE)"
        action={<NovoLancamento tipo="repasse" />}
      />

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

      {extrasNoRepasse.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <span className="flex-1">
            {extrasNoRepasse.length} lançamento(s) de gorjeta/sobra de troco ({brl(extrasNoRepasseValor)}) estão
            nesta aba. O certo agora é lançar em Ganhos diários.
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to="/limpeza">Limpar duplicados</Link>
          </Button>
        </div>
      )}



      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Faturado" value={brl(faturado)} icon={Wallet} />
        <StatCard
          label="Recebido"
          value={brl(recebido)}
          icon={CheckCircle2}
          tone="success"
          hint={`Depósito ${brl(emDeposito)} · dinheiro/Pix ${brl(emDinheiro + emPix)}`}
        />

        <StatCard
          label="A receber (mês)"
          value={brl(pendenteTotal)}
          icon={Clock}
          tone="warning"
          hint="Pendências do período selecionado"
        />
        {prefixo && (
          <StatCard
            label="A receber (meses anteriores)"
            value={brl(restanteAnteriorTotal)}
            icon={History}
            tone="warning"
            hint={`Antigo ${brl(pendenteAnteriorTotal)} · abatido ${brl(abatidoTotal)} · geral ${brl(aReceberGeral)}`}
          />
        )}
        <StatCard label="Repasses" value={String(repasses.length)} icon={Landmark} />

        <StatCard
          label="Gorjetas"
          value={brl(gorjetas)}
          icon={HandCoins}
          tone="success"
          hint="Lançadas em Ganhos diários"
        />
        <StatCard
          label="Sobra de troco"
          value={brl(sobraTroco)}
          icon={Coins}
          tone="success"
          hint="Lançada em Ganhos diários"
        />

        <StatCard
          label="Recebido em dinheiro"
          value={brl(emDinheiro)}
          icon={Banknote}
          tone="success"
          hint="Entregas pagas na hora"
        />
        <StatCard
          label="Recebido em Pix"
          value={brl(emPix)}
          icon={Smartphone}
          tone="success"
          hint="Entregas pagas na hora"
        />
      </div>

      {prefixo && conciliacao.some((c) => c.restanteAnterior > 0.009) && (
        <SectionCard
          title="A receber de meses anteriores"
          description="Pendências antigas por aplicativo e o quanto já foi abatido com o recebido deste período"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aplicativo</TableHead>
                <TableHead className="text-right">Pendente antigo</TableHead>
                <TableHead className="text-right">Abatido agora</TableHead>
                <TableHead className="text-right">Ainda falta</TableHead>
                <TableHead className="w-36 text-right">Baixa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conciliacao
                .filter((c) => c.restanteAnterior > 0.009)
                .map((c) => (
                  <TableRow key={`ant-${c.app}`}>
                    <TableCell className="font-medium">{c.app}</TableCell>
                    <TableCell className="num text-right">{brl(c.pendenteAnterior)}</TableCell>
                    <TableCell className="num text-right text-success">
                      {c.abatido > 0.009 ? brl(c.abatido) : "—"}
                    </TableCell>
                    <TableCell className="num text-right font-semibold text-warning">
                      {brl(c.restanteAnterior)}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.restanteAnterior > 0.009 && (
                        <NovoLancamento
                          tipo="repasse"
                          rotulo="Dar baixa"
                          size="sm"
                          icone={CheckCircle2}
                          titulo={`Baixa de mês anterior — ${c.app}`}
                          iniciais={{
                            data: hojeInputDate(),
                            aplicativo: c.app,
                            valor: c.restanteAnterior.toFixed(2),
                            forma: "Repasse do app",
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="num text-right font-semibold">{brl(pendenteAnteriorTotal)}</TableCell>
                <TableCell className="num text-right font-semibold text-success">{brl(abatidoTotal)}</TableCell>
                <TableCell className="num text-right font-semibold text-warning">
                  {brl(restanteAnteriorTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
          <p className="mt-3 text-sm text-muted-foreground">
            Quando o app paga o mês passado junto com o atual, o valor recebido a mais no período abate
            automaticamente a dívida antiga. A receber no total: <strong>{brl(aReceberGeral)}</strong>.
          </p>
        </SectionCard>
      )}

      <SectionCard
        title="Conciliação por aplicativo"
        description="Faturado no período x recebido (repasse, dinheiro ou Pix na entrega)"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aplicativo</TableHead>
              <TableHead className="text-right">Faturado</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              <TableHead className="text-right">Falta receber</TableHead>
              <TableHead className="w-24 text-right">%</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-36 text-right">Baixa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {porApp.map((a) => {
              const pct = a.faturado > 0 ? Math.round((a.recebido / a.faturado) * 100) : 100;
              const quitado = a.pendente <= 0.009;
              const parcial = !quitado && a.recebido > 0.009;
              const baixas = repasses
                .filter((r) => norm(r.aplicativo) === norm(a.app))
                .sort((x, y) => y.iso.localeCompare(x.iso));
              const expandido = aberto === norm(a.app);
              return (
                <Fragment key={a.app}>
                  <TableRow key={a.app}>
                    <TableCell className="font-medium">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-left hover:text-primary"
                        onClick={() => setAberto(expandido ? null : norm(a.app))}
                        aria-expanded={expandido}
                      >
                        <ChevronRight
                          className={`size-4 shrink-0 transition-transform ${expandido ? "rotate-90" : ""}`}
                        />
                        {a.app}
                        {baixas.length > 0 && (
                          <span className="text-xs text-muted-foreground">({baixas.length})</span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="num text-right">{brl(a.faturado)}</TableCell>
                    <TableCell className="num text-right text-success">{brl(a.recebido)}</TableCell>
                    <TableCell
                      className={`num text-right ${a.pendente > 0.009 ? "text-warning" : a.pendente < -0.009 ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {brl(a.pendente)}
                    </TableCell>
                    <TableCell className="num text-right text-muted-foreground">{pct}%</TableCell>
                    <TableCell>
                      <Badge variant={quitado ? "default" : parcial ? "secondary" : "outline"}>
                        {quitado ? "Quitado" : parcial ? "Parcial" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!quitado && (
                        <NovoLancamento
                          tipo="repasse"
                          rotulo="Dar baixa"
                          variant="outline"
                          size="sm"
                          icone={CheckCircle2}
                          titulo={`Dar baixa — ${a.app}`}
                          iniciais={{
                            data: hojeInputDate(),
                            aplicativo: a.app,
                            valor: a.pendente.toFixed(2),
                            forma: "Dinheiro",
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                  {expandido && (
                    <TableRow key={`${a.app}-baixas`} className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={7} className="p-0">
                        {baixas.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-muted-foreground">
                            Nenhuma baixa registrada para {a.app} neste período.
                          </p>
                        ) : (
                          <div className="flex flex-col divide-y divide-border">
                            {baixas.map((r) => (
                              <div
                                key={r.id}
                                className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
                              >
                                <span className="num w-24 text-muted-foreground">{r.data}</span>
                                <span className="flex-1 text-muted-foreground">{r.forma}</span>
                                <span className="num font-semibold text-success">{brl(r.valor)}</span>
                                <AcoesLancamento tipo="repasse" registro={r} />
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="num text-right font-semibold">{brl(faturado)}</TableCell>
              <TableCell className="num text-right font-semibold text-success">
                {brl(recebidoPlataformas)}
              </TableCell>
              <TableCell className="num text-right font-semibold text-warning">
                {brl(pendenteTotal)}
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard
        title="Por forma de recebimento"
        description="Como o dinheiro entrou no período"
      >
        {porForma.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum recebimento no período.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {porForma.map((f) => {
              const pct = recebido > 0 ? Math.round((f.valor / recebido) * 100) : 0;
              return (
                <div key={f.forma} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{f.forma}</span>
                    <span className="num text-muted-foreground">
                      {brl(f.valor)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>


      <SectionCard title="Últimos repasses">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Aplicativo</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead className="text-right">Valor recebido</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentes.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="num">{r.data}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.aplicativo}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{r.forma}</TableCell>
                <TableCell className="num text-right font-semibold text-success">
                  {brl(r.valor)}
                </TableCell>
                <TableCell>
                  <AcoesLancamento tipo="repasse" registro={r} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
