import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Search, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { montaExtrato, totaisExtrato } from "@/lib/extrato";
import { painelQueryOptions } from "@/lib/painel-query";
import { brl } from "@/lib/sheets-types";

type Periodo = "atual" | "passado" | "total";
type Tipo = "tudo" | "entrada" | "saida";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "atual", label: "Mês atual" },
  { id: "passado", label: "Mês passado" },
  { id: "total", label: "Total" },
];

const TIPOS: { id: Tipo; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "entrada", label: "Entradas" },
  { id: "saida", label: "Saídas" },
];

function normaliza(texto: string) {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function prefixoMes(offset: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AbaExtrato() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const [periodo, setPeriodo] = useState<Periodo>("total");
  const [tipo, setTipo] = useState<Tipo>("tudo");
  const [busca, setBusca] = useState("");

  const movimentos = useMemo(() => montaExtrato(data), [data]);
  const saldoConta = movimentos[0]?.saldo ?? 0;

  const filtrados = useMemo(() => {
    const p = periodo === "total" ? "" : prefixoMes(periodo === "atual" ? 0 : -1);
    const termo = normaliza(busca.trim());
    return movimentos.filter((m) => {
      if (p && !m.iso.startsWith(p)) return false;
      if (tipo !== "tudo" && m.tipo !== tipo) return false;
      if (!termo) return true;
      const alvo = normaliza(
        [m.descricao, m.origem, m.forma, m.data, brl(m.valor)].join(" "),
      );
      return alvo.includes(termo);
    });
  }, [movimentos, periodo, tipo, busca]);

  const totais = totaisExtrato(filtrados);

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-2 z-20">
        <div className="rounded-xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="size-5" />
              </span>
              <div>
                <div className="text-xs text-muted-foreground">Saldo em conta</div>
                <div
                  className={`num text-2xl font-semibold ${saldoConta < 0 ? "text-destructive" : "text-success"}`}
                >
                  {brl(saldoConta)}
                </div>
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-xs text-muted-foreground">Entradas</div>
                <div className="num text-sm font-semibold text-success">{brl(totais.entradas)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Saídas</div>
                <div className="num text-sm font-semibold text-destructive">
                  {brl(totais.saidas)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
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
          <span className="mx-1 hidden w-px bg-border sm:block" />
          {TIPOS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={tipo === t.id ? "secondary" : "ghost"}
              onClick={() => setTipo(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar por descrição, origem, forma, data ou valor"
            className="pl-9"
            aria-label="Procurar no extrato"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Entradas do filtro"
          value={brl(totais.entradas)}
          icon={ArrowUpCircle}
          tone="success"
        />
        <StatCard
          label="Saídas do filtro"
          value={brl(totais.saidas)}
          icon={ArrowDownCircle}
          tone="destructive"
        />
        <StatCard
          label="Resultado do filtro"
          value={brl(totais.saldo)}
          icon={Wallet}
          tone={totais.saldo < 0 ? "warning" : "default"}
        />
      </div>

      <SectionCard
        title="Movimentação"
        description={`${filtrados.length} lançamento${filtrados.length === 1 ? "" : "s"} · dinheiro, Pix, débito e pagamentos de fatura`}
      >
        {filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {busca ? "Nenhuma movimentação encontrada para a busca." : "Nenhuma movimentação no período."}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {filtrados.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{m.descricao}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="num text-xs text-muted-foreground">{m.data}</span>
                    <Badge variant="secondary">{m.origem}</Badge>
                    <Badge variant="outline">{m.forma}</Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={`num text-sm font-semibold ${m.tipo === "entrada" ? "text-success" : "text-destructive"}`}
                  >
                    {m.tipo === "entrada" ? "+" : "−"} {brl(m.valor)}
                  </div>
                  <div className="num text-xs text-muted-foreground">saldo {brl(m.saldo)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
