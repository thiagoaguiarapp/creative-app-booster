import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Fuel, HandCoins, Target, Wrench } from "lucide-react";

import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre nós — No Corre" },
      {
        name: "description",
        content:
          "Conheça o No Corre: o aplicativo feito para entregadores e motoristas saberem quanto realmente ganham, controlando combustível, manutenção e repasses.",
      },
      { property: "og:title", content: "Sobre nós — No Corre" },
      {
        property: "og:description",
        content:
          "O aplicativo feito para entregadores e motoristas saberem quanto realmente ganham.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Sobre,
});

const VALORES = [
  {
    icon: HandCoins,
    titulo: "Clareza financeira",
    texto:
      "Faturamento não é lucro. Nosso objetivo é mostrar, em números simples, quanto sobra de verdade depois de todos os custos da roda.",
  },
  {
    icon: Fuel,
    titulo: "Feito para a rua",
    texto:
      "Lançamento rápido em poucos toques, pensado para quem está parado no semáforo ou esperando o pedido ficar pronto — não para quem trabalha em escritório.",
  },
  {
    icon: Wrench,
    titulo: "Prevenir é lucrar",
    texto:
      "Alertas de manutenção por quilometragem evitam quebras caras e dias parados. A moto ou o carro é a ferramenta de trabalho — cuidar dela é cuidar da renda.",
  },
  {
    icon: Target,
    titulo: "Metas alcançáveis",
    texto:
      "Acompanhar o progresso da meta semanal ajuda o motorista a distribuir melhor os turnos e saber quando vale a pena esticar mais uma hora.",
  },
];

function Sobre() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1 size-4" /> Voltar
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </header>

        <section className="flex flex-col gap-4">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Sobre o No Corre</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            O No Corre nasceu de uma pergunta simples que todo entregador e motorista de
            aplicativo já se fez: <strong className="text-foreground">quanto eu realmente ganhei hoje?</strong>
          </p>
          <p className="text-sm text-muted-foreground sm:text-base">
            A resposta parece óbvia olhando o extrato dos aplicativos, mas não é. Entre o valor
            faturado e o dinheiro que fica no bolso existem o combustível, a manutenção da moto ou
            do carro, as taxas das plataformas, o celular, o seguro e a depreciação do veículo.
            Quem não controla esses números trabalha no escuro — e muitas vezes no prejuízo.
          </p>
          <p className="text-sm text-muted-foreground sm:text-base">
            Nosso aplicativo reúne em um só lugar os ganhos por plataforma, os abastecimentos, as
            despesas, a manutenção do veículo e os repasses a receber. Com relatórios por período e
            alertas automáticos, o motorista deixa de adivinhar e passa a decidir com dados: qual
            corrida vale a pena, qual plataforma paga melhor e quando é hora de trocar o óleo.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold">No que acreditamos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALORES.map((v) => (
              <div key={v.titulo} className="panel flex flex-col gap-2 p-5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <v.icon className="size-4" />
                </div>
                <h3 className="font-semibold">{v.titulo}</h3>
                <p className="text-sm text-muted-foreground">{v.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel flex flex-col items-center gap-3 p-8 text-center">
          <h2 className="font-display text-xl font-semibold">Comece a controlar sua rota hoje</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Grátis para começar, direto do celular. Em menos de um minuto você cadastra seu veículo
            e já faz o primeiro lançamento.
          </p>
          <Button asChild>
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </section>
      </div>
      <LandingFooter />
    </div>
  );
}
