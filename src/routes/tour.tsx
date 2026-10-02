import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  BellRing,
  Fuel,
  HandCoins,
  LayoutDashboard,
  Wallet,
  Zap,
} from "lucide-react";

import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tour")({
  head: () => ({
    meta: [
      { title: "Tour pelo app — Rota Control" },
      {
        name: "description",
        content:
          "Veja como funciona o Rota Control: lançamento rápido por aplicativo, abastecimento, manutenção por km, repasses e relatórios por período.",
      },
      { property: "og:title", content: "Tour pelo app — Rota Control" },
      {
        property: "og:description",
        content: "Conheça as telas e recursos do Rota Control antes de criar sua conta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tour,
});

const TELAS = [
  {
    icon: LayoutDashboard,
    titulo: "Tela inicial",
    texto:
      "Ao abrir o app você vê o resumo do dia: quanto faturou, quanto gastou e o lucro líquido. A barra de progresso mostra quanto falta para bater sua meta semanal, e os alertas de manutenção aparecem em destaque quando algum item está perto de vencer.",
  },
  {
    icon: Zap,
    titulo: "Lançamento rápido por aplicativo",
    texto:
      "Na tela inicial ficam os botões dos aplicativos em que você roda — iFood, Uber, 99, Zé Delivery ou qualquer outro que você cadastrar. Toque no app, informe o valor faturado e a quantidade de entregas. Se recebeu algo em dinheiro ou Pix na entrega, registre no mesmo toque e o app já dá baixa no repasse automaticamente.",
  },
  {
    icon: Fuel,
    titulo: "Abastecimento e consumo",
    texto:
      "A cada abastecimento você informa litros, valor pago e o km do painel. O app calcula o consumo médio real do seu veículo e o custo por quilômetro — o número mais importante para decidir quais corridas aceitar.",
  },
  {
    icon: BellRing,
    titulo: "Manutenção por quilometragem",
    texto:
      "Cadastre os serviços (troca de óleo, relação, pneus, revisão) com o intervalo em km. Como cada abastecimento atualiza o hodômetro, o app avisa antes do vencimento — sem depender de memória nem de adesivo no para-brisa.",
  },
  {
    icon: Wallet,
    titulo: "Recebimentos e repasses",
    texto:
      "Controle quanto cada plataforma ainda deve te pagar. Quando o dinheiro cai na conta, você dá baixa com um toque. Se a plataforma cobrou taxa de repasse ou adiantamento, o app registra a taxa como despesa e a conta fecha no centavo.",
  },
  {
    icon: BarChart3,
    titulo: "Relatórios por período",
    texto:
      "Escolha o período — semana, mês ou datas personalizadas — e veja o panorama completo: ganhos por plataforma, despesas por categoria, gasto com combustível, manutenção e o lucro líquido real.",
  },
  {
    icon: HandCoins,
    titulo: "Despesas e parcelas",
    texto:
      "Despesas à vista ou parceladas no cartão, organizadas mês a mês. Tudo entra na conta do lucro real, para você nunca confundir faturamento com dinheiro no bolso.",
  },
];

function Tour() {
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

        <section className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Tour pelo aplicativo</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Conheça as principais telas e recursos do Rota Control antes de criar sua conta.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          {TELAS.map((t, i) => (
            <div key={t.titulo} className="panel flex items-start gap-4 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <t.icon className="size-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">
                  {i + 1}. {t.titulo}
                </h2>
                <p className="text-sm text-muted-foreground">{t.texto}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="panel flex flex-col items-center gap-3 p-8 text-center">
          <h2 className="font-display text-xl font-semibold">Pronto para começar?</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Crie sua conta grátis e faça o primeiro lançamento em menos de um minuto.
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
