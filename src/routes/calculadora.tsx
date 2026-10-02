import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calculator } from "lucide-react";
import { useMemo, useState } from "react";

import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/calculadora")({
  head: () => ({
    meta: [
      { title: "Calculadora de custo por km — Rota Control" },
      {
        name: "description",
        content:
          "Calculadora gratuita de custo por quilômetro para moto e carro: descubra quanto custa cada km rodado e quanto do seu faturamento vai para o veículo.",
      },
      { property: "og:title", content: "Calculadora de custo por km — Rota Control" },
      {
        property: "og:description",
        content: "Descubra grátis quanto custa cada km rodado da sua moto ou carro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calculadora,
});

function numero(valor: string): number {
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Calculadora() {
  const [precoLitro, setPrecoLitro] = useState("5,80");
  const [consumo, setConsumo] = useState("35");
  const [manutencaoMes, setManutencaoMes] = useState("200");
  const [kmMes, setKmMes] = useState("4000");
  const [faturamentoMes, setFaturamentoMes] = useState("4000");

  const resultado = useMemo(() => {
    const litro = numero(precoLitro);
    const kmPorLitro = numero(consumo);
    const manut = numero(manutencaoMes);
    const km = numero(kmMes);
    const faturamento = numero(faturamentoMes);
    if (!litro || !kmPorLitro || !km) return null;

    const custoCombustivelKm = litro / kmPorLitro;
    const custoManutencaoKm = manut / km;
    const custoTotalKm = custoCombustivelKm + custoManutencaoKm;
    const custoMes = custoTotalKm * km;
    const percentualFaturamento = faturamento ? (custoMes / faturamento) * 100 : null;

    return { custoCombustivelKm, custoManutencaoKm, custoTotalKm, custoMes, percentualFaturamento };
  }, [precoLitro, consumo, manutencaoMes, kmMes, faturamentoMes]);

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
          <div className="flex items-center gap-2">
            <Calculator className="size-7 text-primary" />
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              Calculadora de custo por km
            </h1>
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Descubra quanto custa cada quilômetro rodado da sua moto ou carro. Com esse número você
            sabe quais corridas valem a pena e quanto do faturamento fica com o veículo.
          </p>
        </section>

        <section className="panel flex flex-col gap-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="preco">Preço do litro do combustível (R$)</Label>
              <Input
                id="preco"
                inputMode="decimal"
                value={precoLitro}
                onChange={(e) => setPrecoLitro(e.target.value)}
                placeholder="5,80"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="consumo">Consumo do veículo (km por litro)</Label>
              <Input
                id="consumo"
                inputMode="decimal"
                value={consumo}
                onChange={(e) => setConsumo(e.target.value)}
                placeholder="35"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="manut">Manutenção por mês (R$)</Label>
              <Input
                id="manut"
                inputMode="decimal"
                value={manutencaoMes}
                onChange={(e) => setManutencaoMes(e.target.value)}
                placeholder="200"
              />
              <p className="text-xs text-muted-foreground">
                Óleo, pneus, relação, freios, revisões — some tudo e divida pelo mês.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="km">Quilômetros rodados por mês</Label>
              <Input
                id="km"
                inputMode="numeric"
                value={kmMes}
                onChange={(e) => setKmMes(e.target.value)}
                placeholder="4000"
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="fat">Faturamento mensal (R$) — opcional</Label>
              <Input
                id="fat"
                inputMode="decimal"
                value={faturamentoMes}
                onChange={(e) => setFaturamentoMes(e.target.value)}
                placeholder="4000"
              />
            </div>
          </div>

          {resultado && (
            <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-5">
              <h2 className="font-display text-lg font-semibold">Seu resultado</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Custo de combustível por km</p>
                  <p className="text-lg font-semibold">{moeda(resultado.custoCombustivelKm)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Custo de manutenção por km</p>
                  <p className="text-lg font-semibold">{moeda(resultado.custoManutencaoKm)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Custo total por km</p>
                  <p className="text-xl font-bold text-primary">{moeda(resultado.custoTotalKm)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Custo do veículo por mês</p>
                  <p className="text-xl font-bold text-primary">{moeda(resultado.custoMes)}</p>
                </div>
                {resultado.percentualFaturamento !== null && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Quanto do seu faturamento fica com o veículo
                    </p>
                    <p className="text-xl font-bold">
                      {resultado.percentualFaturamento.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Dica: uma corrida só vale a pena quando o valor por km é bem maior que o seu custo
                por km. Abaixo de 2x o custo, o lucro é quase zero.
              </p>
            </div>
          )}
        </section>

        <section className="panel flex flex-col items-center gap-3 p-8 text-center">
          <h2 className="font-display text-xl font-semibold">
            No app, esse cálculo é automático
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            A cada abastecimento o Rota Control recalcula seu consumo e custo por km — e ainda
            cruza com seus ganhos para mostrar o lucro real por dia.
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
