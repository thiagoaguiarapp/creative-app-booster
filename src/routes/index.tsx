import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  Crown,
  Fuel,
  HandCoins,
  Receipt,
  Wallet,
  Wrench,
} from "lucide-react";

import { AdSenseSlot, ADSENSE_SLOT_LANDING } from "@/components/ad-sense-slot";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rota Control — Gestão financeira para entregadores" },
      {
        name: "description",
        content:
          "Controle ganhos por plataforma, abastecimento, despesas, manutenção da moto e repasses. Relatórios por período e alertas de manutenção. Grátis para começar.",
      },
      { property: "og:title", content: "Rota Control — Gestão financeira para entregadores" },
      {
        property: "og:description",
        content:
          "Controle ganhos por plataforma, abastecimento, despesas, manutenção da moto e repasses. Relatórios por período e alertas de manutenção.",
      },
    ],
  }),
  component: Landing,
});

const RECURSOS = [
  {
    icon: HandCoins,
    titulo: "Ganhos por plataforma",
    texto: "Registre corridas e faturamento de iFood, 99, Uber, Rappi e outras plataformas em segundos.",
  },
  {
    icon: Fuel,
    titulo: "Abastecimento",
    texto: "Litros, valor pago e odômetro — o app calcula o consumo e acompanha o custo por km.",
  },
  {
    icon: Receipt,
    titulo: "Despesas e parcelas",
    texto: "Despesas à vista ou parceladas no cartão, com vencimentos organizados mês a mês.",
  },
  {
    icon: Wrench,
    titulo: "Manutenção por km",
    texto: "Alertas de troca de óleo, pneus e revisão antes de vencer, com base no hodômetro.",
  },
  {
    icon: Wallet,
    titulo: "Repasses e recebimentos",
    texto: "Controle o que cada plataforma deve pagar e dê baixa quando o dinheiro cair.",
  },
  {
    icon: BarChart3,
    titulo: "Relatórios por período",
    texto: "Visão geral, despesas, manutenção, recebimentos e abastecimento no período que você escolher.",
  },
];

function Landing() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-8 sm:py-12">
      {/* Topo */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/icon-192-v2.png" alt="Logo Rota Control" className="size-10 rounded-xl" />
          <span className="font-display text-lg font-semibold uppercase tracking-[0.14em]">
            Rota Control
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Criar conta</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <img src="/icon-512-v2.png" alt="Rota Control" className="size-28 rounded-3xl shadow-2xl sm:size-36" />
        <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
          O controle completo das suas entregas
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Ganhos, gastos, combustível, manutenção  e repasses em um só lugar.
          Feito para quem vive na estrada e quer saber, de verdade, quanto sobra no fim do mês.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/auth">Começar grátis</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>
      </section>

      {/* Recursos */}
      <section className="flex flex-col gap-6">
        <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">
          Tudo que o entregador precisa
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="panel flex flex-col gap-3 p-5">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <r.icon className="size-5" />
              </div>
              <h3 className="font-semibold">{r.titulo}</h3>
              <p className="text-sm text-muted-foreground">{r.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium */}
      <section className="panel flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Crown className="size-6" />
        </div>
        <h2 className="font-display text-2xl font-semibold">Rota Control Premium</h2>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">
          Sem anúncios e com todos os recursos liberados. Assine pelo app Android na Google Play
          ou conheça os benefícios.
        </p>
        <Button variant="outline" asChild>
          <Link to="/auth">
            <Crown className="mr-1 size-4" /> Conhecer o Premium
          </Link>
        </Button>
      </section>

      {/* Anúncio */}
      <section aria-label="Publicidade" className="min-h-24">
        <AdSenseSlot slot={ADSENSE_SLOT_LANDING} />
      </section>

      {/* Chamada final */}
      <section className="flex flex-col items-center gap-4 pb-8 text-center">
        <CalendarClock className="size-8 text-primary" />
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Comece hoje a saber quanto você realmente ganha
        </h2>
        <Button size="lg" asChild>
          <Link to="/auth">Criar conta grátis</Link>
        </Button>
      </section>
    </div>
  );
}
