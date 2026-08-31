import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Receipt, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionCard, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lancamentosGlobaisFn } from "@/lib/admin.functions";
import { brl } from "@/lib/sheets-types";

export const Route = createFileRoute("/admin/relatorios")({
  component: AdminRelatorios,
});

const TIPOS = [
  { valor: "ganho", rotulo: "Faturamento" },
  { valor: "abastecimento", rotulo: "Abastecimento" },
  { valor: "despesa", rotulo: "Despesa" },
  { valor: "repasse", rotulo: "Repasse" },
  { valor: "manutencao", rotulo: "Manutenção" },
] as const;

const ROTULO: Record<string, string> = Object.fromEntries(
  TIPOS.map((t) => [t.valor, t.rotulo]),
);

const CUSTOS = new Set(["abastecimento", "despesa", "manutencao"]);

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
function inicioMes(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function mesRotulo(ym: string): string {
  const [a, m] = ym.split("-");
  return `${m}/${a?.slice(2)}`;
}

function AdminRelatorios() {
  const carregar = useServerFn(lancamentosGlobaisFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-lancamentos"],
    queryFn: () => carregar(),
  });

  const [de, setDe] = useState(inicioMes);
  const [ate, setAte] = useState(hoje);
  const [tipo, setTipo] = useState("todos");
  const [categoria, setCategoria] = useState("todas");

  const itens = useMemo(() => data ?? [], [data]);

  const categorias = useMemo(() => {
    const base = tipo === "todos" ? itens : itens.filter((i) => i.tipo === tipo);
    return Array.from(new Set(base.map((i) => i.categoria))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [itens, tipo]);

  const filtrados = useMemo(
    () =>
      itens.filter(
        (i) =>
          (!de || i.iso >= de) &&
          (!ate || i.iso <= ate) &&
          (tipo === "todos" || i.tipo === tipo) &&
          (categoria === "todas" || i.categoria === categoria),
      ),
    [itens, de, ate, tipo, categoria],
  );

  const totais = useMemo(() => {
    let entradas = 0;
    let custos = 0;
    let repasses = 0;
    const porTipo = new Map<string, { total: number; qtd: number }>();
    const porCategoria = new Map<string, number>();
    const porMes = new Map<string, { entradas: number; custos: number }>();

    for (const i of filtrados) {
      if (i.tipo === "ganho") entradas += i.valor;
      if (i.tipo === "repasse") repasses += i.valor;
      if (CUSTOS.has(i.tipo)) custos += i.valor;

      const t = porTipo.get(i.tipo) ?? { total: 0, qtd: 0 };
      porTipo.set(i.tipo, { total: t.total + i.valor, qtd: t.qtd + 1 });

      porCategoria.set(i.categoria, (porCategoria.get(i.categoria) ?? 0) + i.valor);

      const ym = i.iso.slice(0, 7);
      const m = porMes.get(ym) ?? { entradas: 0, custos: 0 };
      if (i.tipo === "ganho") m.entradas += i.valor;
      if (CUSTOS.has(i.tipo)) m.custos += i.valor;
      porMes.set(ym, m);
    }

    return {
      entradas,
      custos,
      repasses,
      lucro: entradas - custos,
      quantidade: filtrados.length,
      porTipo: Array.from(porTipo, ([nome, v]) => ({ nome, ...v })).sort(
        (a, b) => b.total - a.total,
      ),
      porCategoria: Array.from(porCategoria, ([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 12),
      porMes: Array.from(porMes, ([mes, v]) => ({ mes, ...v })).sort((a, b) =>
        a.mes.localeCompare(b.mes),
      ),
    };
  }, [filtrados]);

  const maxMes = Math.max(1, ...totais.porMes.map((m) => Math.max(m.entradas, m.custos)));
  const maxCat = Math.max(1, ...totais.porCategoria.map((c) => c.total));

  return (
    <div className="space-y-4 sm:space-y-6">
      <SectionCard title="Filtros" description="Período, tipo de lançamento e categoria">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="de">De</Label>
            <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ate">Até</Label>
            <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Tipo de lançamento</Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v);
                setCategoria("todas");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {TIPOS.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setDe(inicioMes());
              setAte(hoje());
            }}
          >
            Mês atual
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const d = new Date();
              setDe(new Date(d.getFullYear(), 0, 1).toISOString().slice(0, 10));
              setAte(hoje());
            }}
          >
            Ano atual
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDe("");
              setAte("");
              setTipo("todos");
              setCategoria("todas");
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </SectionCard>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando lançamentos…
        </div>
      )}
      {error && (
        <SectionCard title="Erro">
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        </SectionCard>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Faturamento" value={brl(totais.entradas)} icon={ArrowUpCircle} tone="success" />
        <StatCard label="Custos" value={brl(totais.custos)} icon={ArrowDownCircle} tone="warning" />
        <StatCard
          label="Lucro"
          value={brl(totais.lucro)}
          icon={Wallet}
          tone={totais.lucro >= 0 ? "success" : "danger"}
        />
        <StatCard label="Lançamentos" value={String(totais.quantidade)} icon={Receipt} />
      </div>

      <SectionCard title="Evolução por mês" description="Faturamento x custos no período filtrado">
        {totais.porMes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento no período.</p>
        ) : (
          <div className="flex h-48 items-end gap-3 overflow-x-auto pb-2">
            {totais.porMes.map((m) => (
              <div key={m.mes} className="flex min-w-12 flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t bg-success sm:w-4"
                    style={{ height: `${(m.entradas / maxMes) * 100}%` }}
                    title={`Faturamento ${brl(m.entradas)}`}
                  />
                  <div
                    className="w-3 rounded-t bg-warning sm:w-4"
                    style={{ height: `${(m.custos / maxMes) * 100}%` }}
                    title={`Custos ${brl(m.custos)}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{mesRotulo(m.mes)}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Totais por tipo de lançamento">
          {totais.porTipo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ul className="space-y-2">
              {totais.porTipo.map((t) => (
                <li
                  key={t.nome}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {ROTULO[t.nome] ?? t.nome}{" "}
                    <span className="text-xs">({t.qtd})</span>
                  </span>
                  <span className="num font-semibold">{brl(t.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Top categorias" description="Maiores valores no período">
          {totais.porCategoria.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ul className="space-y-2">
              {totais.porCategoria.map((c) => (
                <li key={c.nome} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate pr-2 text-muted-foreground">{c.nome}</span>
                    <span className="num font-semibold">{brl(c.total)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${(c.total / maxCat) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
