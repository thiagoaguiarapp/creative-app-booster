import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  CalendarClock,
  Gauge,
  Pencil,
  Trash2,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { NovoLancamento } from "@/components/lancamento-form";
import { AtalhoPaginas } from "@/components/atalho-paginas";
import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { painelQueryOptions } from "@/lib/painel-query";
import { salvarLancamentoFn, excluirLancamentoFn } from "@/lib/painel.functions";
import { brl, statusManutencao, type Manutencao } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/manutencao")({
  head: () => ({
    meta: [
      { title: "Manutenção — Rota Control" },
      {
        name: "description",
        content:
          "Plano de manutenção por quilometragem: óleo, relação, pneus e revisões com alertas de vencimento.",
      },
      { property: "og:title", content: "Manutenção — Rota Control" },
      {
        property: "og:description",
        content: "Plano de manutenção por quilometragem com alertas de vencimento.",
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
  component: ManutencaoPage,
});

const nivelInfo = {
  ok: { label: "Em dia", badge: "border-success/40 bg-success/15 text-success", bar: "bg-success" },
  atencao: {
    label: "Atenção",
    badge: "border-warning/40 bg-warning/15 text-warning",
    bar: "bg-warning",
  },
  vencido: {
    label: "Vencido",
    badge: "border-destructive/40 bg-destructive/15 text-destructive",
    bar: "bg-destructive",
  },
} as const;

function hojeInputDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function numeroBr(valor: string | undefined): number {
  const n = Number(String(valor ?? "").replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function AtualizarManutencaoDialog({
  registro,
  odometroAtual,
  aberto,
  onOpenChange,
}: {
  registro: Manutencao;
  odometroAtual: number;
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [valores, setValores] = useState({
    data: hojeInputDate(),
    kmTroca: String(odometroAtual > registro.kmTroca ? odometroAtual : registro.kmTroca),
    valor: registro.valor ? String(registro.valor.toFixed(2)) : "",
    observacao: registro.observacao || "",
    validadeKm: String(registro.validadeKm || ""),
  });

  const salvar = useServerFn(salvarLancamentoFn);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await salvar({
        data: {
          tipo: "manutencao",
          valores: {
            veiculo: registro.veiculo,
            data: valores.data,
            servico: registro.servico,
            kmTroca: valores.kmTroca,
            validadeKm: valores.validadeKm,
            valor: valores.valor,
            observacao: valores.observacao,
          },
          row: registro.row,
        },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["painel"] });
      toast.success("Manutenção atualizada.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!valores.kmTroca.trim() || numeroBr(valores.kmTroca) <= 0) {
      toast.error("Informe o km da troca.");
      return;
    }
    if (!valores.validadeKm.trim() || numeroBr(valores.validadeKm) <= 0) {
      toast.error("Informe a validade em km.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            Atualizar manutenção
          </DialogTitle>
          <DialogDescription>
            {registro.servico} · {registro.veiculo}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data">Data da troca</Label>
              <Input
                id="data"
                type="date"
                value={valores.data}
                onChange={(e) => setValores((v) => ({ ...v, data: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kmTroca">Km da troca</Label>
              <Input
                id="kmTroca"
                type="number"
                inputMode="decimal"
                step="any"
                value={valores.kmTroca}
                onChange={(e) => setValores((v) => ({ ...v, kmTroca: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor gasto</Label>
              <Input
                id="valor"
                type="text"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={valores.valor}
                onChange={(e) => setValores((v) => ({ ...v, valor: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="validadeKm">Validade (km)</Label>
              <Input
                id="validadeKm"
                type="number"
                inputMode="decimal"
                step="any"
                value={valores.validadeKm}
                onChange={(e) => setValores((v) => ({ ...v, validadeKm: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacao">Observação</Label>
            <Input
              id="observacao"
              type="text"
              value={valores.observacao}
              onChange={(e) => setValores((v) => ({ ...v, observacao: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando…" : "Atualizar manutenção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AcoesManutencao({
  registro,
  odometroAtual,
}: {
  registro: Manutencao;
  odometroAtual: number;
}) {
  const [editando, setEditando] = useState(false);
  const excluir = useServerFn(excluirLancamentoFn);
  const queryClient = useQueryClient();

  const remover = useMutation({
    mutationFn: () => excluir({ data: { tipo: "manutencao", row: registro.row } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["painel"] });
      toast.success("Manutenção excluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setEditando(true)}
        >
          <Pencil className="size-3" /> Atualizar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir manutenção"
          disabled={remover.isPending}
          onClick={() => {
            if (confirm("Excluir este registro de manutenção?")) remover.mutate();
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
      {editando && (
        <AtualizarManutencaoDialog
          registro={registro}
          odometroAtual={odometroAtual}
          aberto={editando}
          onOpenChange={setEditando}
        />
      )}
    </>
  );
}

function ManutencaoPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const odometroAtual = data.odometroAtual;

  // Mantém apenas o serviço mais recente de cada tipo por veículo.
  const ultimos = new Map<string, Manutencao>();
  for (const m of data.manutencoes) {
    const chave = `${m.veiculo}|${m.servico}`.toUpperCase();
    if (!ultimos.has(chave)) ultimos.set(chave, m);
  }

  const itens = [...ultimos.values()]
    .map((m) => ({ m, s: statusManutencao(m, odometroAtual) }))
    .sort((a, b) => a.s.restante - b.s.restante);

  const vencidos = itens.filter((i) => i.s.nivel === "vencido").length;
  const atencao = itens.filter((i) => i.s.nivel === "atencao").length;
  const custoPrevisto = itens
    .filter((i) => i.s.nivel !== "ok")
    .reduce((s, i) => s + i.m.valor, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Manutenção"
        subtitle="Controle por quilometragem, com alerta antes de vencer (aba MANUTENCAO)"
      />

      <div className="flex flex-col items-center gap-3">
        <AtalhoPaginas />
        <NovoLancamento tipo="manutencao" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Odômetro atual"
          value={`${odometroAtual.toLocaleString("pt-BR")} km`}
          icon={Gauge}
        />
        <StatCard label="Vencidos" value={String(vencidos)} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Próximos" value={String(atencao)} icon={CalendarClock} tone="warning" />
        <StatCard
          label="Último custo"
          value={brl(custoPrevisto)}
          hint="Itens vencidos e próximos"
          icon={Wrench}
        />
      </div>

      <SectionCard title="Plano de manutenção" description="Ordenado pelo que vence primeiro">
        <div className="grid gap-4 md:grid-cols-2">
          {itens.map(({ m, s }) => {
            const info = nivelInfo[s.nivel];
            return (
              <article key={m.id} className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold">{m.servico}</h3>
                    <p className="text-xs text-muted-foreground">
                      {m.veiculo} · {m.data}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant="outline" className={info.badge}>
                      {info.label}
                    </Badge>
                    <AcoesManutencao registro={m} odometroAtual={odometroAtual} />
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-full rounded-full", info.bar)}
                    style={{ width: `${s.progresso}%` }}
                  />
                </div>

                <dl className="num mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Rodado</dt>
                    <dd className="font-medium">{s.percorrido.toLocaleString("pt-BR")} km</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {s.restante <= 0 ? "Atrasado" : "Falta"}
                    </dt>
                    <dd className="font-medium">
                      {Math.abs(s.restante).toLocaleString("pt-BR")} km
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-muted-foreground">Último custo</dt>
                    <dd className="font-medium">{brl(m.valor)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
