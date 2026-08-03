import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Gauge, Wrench } from "lucide-react";

import { PageHeader, SectionCard, StatCard } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brl, manutencoes, odometroAtual, statusManutencao } from "@/lib/mock-data";
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

function ManutencaoPage() {
  const itens = manutencoes
    .map((m) => ({ m, s: statusManutencao(m) }))
    .sort((a, b) => a.s.restante - b.s.restante);

  const vencidos = itens.filter((i) => i.s.nivel === "vencido").length;
  const atencao = itens.filter((i) => i.s.nivel === "atencao").length;
  const custoPrevisto = itens
    .filter((i) => i.s.nivel !== "ok")
    .reduce((s, i) => s + i.m.custoEstimado, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Manutenção"
        subtitle="Controle por quilometragem, com alerta antes de vencer"
        action={<Button>Registrar serviço</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Odômetro atual"
          value={`${odometroAtual.toLocaleString("pt-BR")} km`}
          icon={Gauge}
        />
        <StatCard label="Vencidos" value={String(vencidos)} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Próximos" value={String(atencao)} icon={CalendarClock} tone="warning" />
        <StatCard
          label="Custo previsto"
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
                  <div>
                    <h3 className="font-display text-lg font-semibold">{m.item}</h3>
                    <p className="text-xs text-muted-foreground">{m.oficina}</p>
                  </div>
                  <Badge variant="outline" className={info.badge}>
                    {info.label}
                  </Badge>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className={cn("h-full rounded-full", info.bar)} style={{ width: `${s.progresso}%` }} />
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
                    <dt className="text-muted-foreground">Custo est.</dt>
                    <dd className="font-medium">{brl(m.custoEstimado)}</dd>
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
