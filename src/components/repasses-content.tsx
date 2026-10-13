import { useSuspenseQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { AcoesLancamento, NovoLancamento, hojeInputDate } from "@/components/lancamento-form";
import { AtalhoPaginas } from "@/components/atalho-paginas";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { conciliacaoRecebimentos, normalizarPlataforma } from "@/lib/conciliacao";
import { ehExtra } from "@/lib/extras";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

type Periodo = "atual" | "passado" | "total" | "custom";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "atual", label: "Mês atual" },
  { id: "passado", label: "Mês passado" },
  { id: "total", label: "Total" },
  { id: "custom", label: "Personalizado" },
];

function prefixoMes(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function RepassesContent({ intervalo }: { intervalo?: { de: string; ate: string } }) {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodoLocal, setPeriodo] = useState<Periodo>("total");
  const periodo = intervalo ? "custom" : periodoLocal;
  const visaoTotal = periodo === "total";
  const labelFaturado = visaoTotal ? "Faturado geral" : "Faturado no período";
  const labelRecebido = visaoTotal ? "Recebido geral" : "Recebido no período";
  const [aberto, setAberto] = useState<string | null>(null);
  const [aba, setAba] = useState<"saldo" | "historico">("saldo");
  const [deLocal, setDe] = useState("");
  const [ateLocal, setAte] = useState("");
  const de = intervalo?.de ?? deLocal;
  const ate = intervalo?.ate ?? ateLocal;

  const prefixo = periodo === "total" ? null : prefixoMes(periodo === "atual" ? 0 : -1);
  // corte de "meses anteriores": no período personalizado usa a data inicial.
  const corte = periodo === "total" ? null : periodo === "custom" ? de || null : prefixo;

  const filtra = (iso: string) =>
    periodo === "custom"
      ? (!de || iso >= de) && (!ate || iso <= ate)
      : prefixo
        ? iso.startsWith(prefixo)
        : true;

  const repasses = useMemo(
    () => data.repasses.filter((r) => filtra(r.iso)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.repasses, periodo, de, ate, prefixo],
  );
  const ganhos = useMemo(
    () => data.ganhos.filter((g) => filtra(g.iso)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.ganhos, periodo, de, ate, prefixo],
  );

  const recentes = [...repasses].sort((a, b) => b.iso.localeCompare(a.iso));

  const extrasNoRepasse = repasses.filter((r) => ehExtra(r.aplicativo));
  const extrasNoRepasseValor = extrasNoRepasse.reduce((s, r) => s + r.valor, 0);

  const recebidoPlataformas = repasses
    .filter((r) => !ehExtra(r.aplicativo))
    .reduce((s, r) => s + r.valor, 0);

  const faturado = ganhos
    .filter((g) => !ehExtra(g.plataforma))
    .reduce((s, g) => s + g.faturamento, 0);

  const norm = normalizarPlataforma;

  // Saldo é sempre a posição de hoje (todo o histórico), independente do filtro.
  const porApp = useMemo(
    () => conciliacaoRecebimentos(data.ganhos, data.repasses, () => true, null),
    [data.ganhos, data.repasses],
  );

  const aReceberGeral = porApp.reduce((s, a) => s + a.pendenteMes + a.restanteAnterior, 0);
  const recebidoAMais = porApp.reduce((s, a) => s + Math.max(0, -a.pendente), 0);

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

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4 sm:gap-6">
      {!intervalo && <PageHeader
        title="Recebimento / Repasse"
        subtitle="O que cada aplicativo ainda tem que te pagar"
      />}

      <div className="flex flex-col items-center gap-3">
        {!intervalo && <AtalhoPaginas />}
        <NovoLancamento tipo="repasse" />
      </div>

      {!intervalo && <div className="flex flex-wrap items-end gap-2">
        {PERIODOS.map((p) => (
          <Button
            key={p.id}
            size="sm"
            variant={periodo === p.id ? "default" : "outline"}
             aria-pressed={periodo === p.id}
            onClick={() => setPeriodo(p.id)}
          >
            {p.label}
          </Button>
        ))}
        {periodo === "custom" && (
          <>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Até</Label>
              <Input
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
                className="h-9 w-40"
              />
            </div>
          </>
        )}
      </div>}

      {extrasNoRepasse.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <span className="flex-1">
            {extrasNoRepasse.length} lançamento(s) de gorjeta/sobra de troco ({brl(extrasNoRepasseValor)}) estão
            nesta aba. O certo agora é lançar em Ganhos diários.
          </span>
        </div>
      )}

      <div role="tablist" aria-label="Seções" className="grid grid-cols-2 gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
        {([
          { id: "saldo", label: "Saldo" },
          { id: "historico", label: "Histórico de recebimentos" },
        ] as const).map((t) => (
          <Button
            key={t.id}
            role="tab"
            aria-selected={aba === t.id}
            size="sm"
            variant={aba === t.id ? "default" : "ghost"}
            className="whitespace-normal"
            onClick={() => setAba(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {aba === "saldo" && <>
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Total a receber"
          value={brl(aReceberGeral)}
          icon={Clock}
          tone="warning"
          hint="O que as plataformas te devem hoje"
        />
        <StatCard
          label="Recebido a mais"
          value={brl(recebidoAMais)}
          icon={CheckCircle2}
          tone="success"
          hint="Quando a plataforma pagou além do faturado"
        />
      </div>

      <SectionCard
        title="Saldo por aplicativo"
        description="Quanto cada plataforma te deve ou pagou a mais"
      >
        {/* Mobile cards */}
        <div className="flex flex-col gap-3 lg:hidden">
          {porApp.map((a) => {
                        const quitado = a.pendente <= 0.009;
            const parcial = !quitado && (a.quitado > 0.009 || a.recebido > 0.009);

            const baixas = repasses
              .filter((r) => norm(r.aplicativo) === norm(a.app))
              .sort((x, y) => y.iso.localeCompare(x.iso));
            const expandido = aberto === norm(a.app);
            return (
              <div
                key={`app-m-${a.app}`}
                className="flex flex-col gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    className="h-auto min-w-0 justify-start gap-1.5 p-0 text-left font-medium"
                    onClick={() => setAberto(expandido ? null : norm(a.app))}
                    aria-expanded={expandido}
                  >
                    <ChevronRight
                      className={`size-4 shrink-0 transition-transform ${expandido ? "rotate-90" : ""}`}
                    />
                    <span className="truncate">{a.app}</span>
                    {baixas.length > 0 && (
                      <span className="text-xs text-muted-foreground">({baixas.length})</span>
                    )}
                  </Button>
                  <Badge variant={quitado ? "default" : parcial ? "secondary" : "outline"}>
                    {quitado ? "Quitado" : parcial ? "Parcial" : "Pendente"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <p className="text-xs text-muted-foreground">
                    {a.pendente < -0.009 ? "Recebido a mais" : "Saldo hoje"}
                  </p>
                  <p
                    className={`num font-semibold ${
                      a.pendente > 0.009
                        ? "text-warning"
                        : a.pendente < -0.009
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {brl(Math.abs(a.pendente))}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
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
                </div>

                {expandido && (
                  <div className="flex flex-col divide-y divide-border rounded-md bg-muted/30">
                    {baixas.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-muted-foreground">
                        Nenhuma baixa registrada para {a.app} neste período.
                      </p>
                    ) : (
                      baixas.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
                        >
                          <span className="num w-20 text-muted-foreground">{r.data}</span>
                          <span className="flex-1 truncate text-muted-foreground">{r.forma}</span>
                          <span className="num font-semibold text-success">{brl(r.valor)}</span>
                          <AcoesLancamento tipo="repasse" registro={r} />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <p className="text-muted-foreground">Total a receber hoje</p>
            <p className="num font-semibold text-warning">{brl(aReceberGeral)}</p>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aplicativo</TableHead>
                <TableHead className="text-right">Saldo hoje</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36 text-right">Baixa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porApp.map((a) => {
                                const quitado = a.pendente <= 0.009;
                const parcial = !quitado && (a.quitado > 0.009 || a.recebido > 0.009);
    
                const baixas = repasses
                  .filter((r) => norm(r.aplicativo) === norm(a.app))
                  .sort((x, y) => y.iso.localeCompare(x.iso));
                const expandido = aberto === norm(a.app);
                return (
                  <Fragment key={a.app}>
                    <TableRow key={a.app}>
                      <TableCell className="font-medium">
                        <Button
                          variant="ghost"
                          className="h-auto justify-start gap-1.5 p-0 text-left"
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
                        </Button>
                      </TableCell>
                      <TableCell
                        className={`num text-right ${a.pendente > 0.009 ? "text-warning" : a.pendente < -0.009 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {brl(a.pendente)}
                      </TableCell>
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
                        <TableCell colSpan={6} className="p-0">
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
                <TableCell className="num text-right font-semibold text-warning">
                  {brl(aReceberGeral)}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SectionCard>
      </>}

      {aba === "historico" && <>
      <StatCard
        label={visaoTotal ? "Total recebido" : "Recebido no período"}
        value={brl(recebidoPlataformas)}
        icon={CheckCircle2}
        tone="success"
        hint={`${repasses.filter((r) => !ehExtra(r.aplicativo)).length} recebimento(s)`}
      />

      <SectionCard
        title="Por forma de recebimento"
        description="Como o dinheiro entrou no período"
      >
        {porForma.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum recebimento no período.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {porForma.map((f) => {
              const pct = recebidoPlataformas > 0 ? Math.round((f.valor / recebidoPlataformas) * 100) : 0;
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

      <SectionCard title="Extrato de recebimentos" description="Tudo que caiu na sua conta no período">
        {recentes.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum recebimento no período.</p>
        )}
        {/* Mobile cards */}
        <div className="flex flex-col gap-3 lg:hidden">
          {recentes.map((r) => (
            <div
              key={`rec-m-${r.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border/60 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{r.aplicativo}</Badge>
                <AcoesLancamento tipo="repasse" registro={r} />
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="num text-muted-foreground">{r.data}</span>
                <span className="text-muted-foreground">{r.forma}</span>
              </div>
              <p className="num text-right text-lg font-semibold text-success">{brl(r.valor)}</p>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block">
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
        </div>
      </SectionCard>
      </>}
    </div>
  );
}
