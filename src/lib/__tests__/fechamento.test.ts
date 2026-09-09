import { describe, expect, it } from "vitest";

import { agrupaCustos, montaCustos, paresDuplicados, resumoFechamento } from "../fechamento";
import type { Abastecimento, Despesa, Manutencao, PainelData } from "../sheets-types";

const despesa = (p: Partial<Despesa>): Despesa => ({
  id: "1",
  row: "1",
  data: "05/09/2026",
  iso: "2026-09-05",
  valor: 100,
  categoria: "Outros",
  descricao: "",
  pagamento: "Dinheiro",
  ...p,
});

const manutencao = (p: Partial<Manutencao>): Manutencao => ({
  id: "1",
  row: "1",
  veiculo: "MOTO",
  data: "05/09/2026",
  iso: "2026-09-05",
  servico: "TROCA DE OLEO",
  kmTroca: 1000,
  validadeKm: 3000,
  valor: 100,
  observacao: "",
  ...p,
});

const abastecimento = (p: Partial<Abastecimento>): Abastecimento => ({
  id: "1",
  row: "1",
  data: "03/09/2026",
  iso: "2026-09-03",
  posto: "IPIRANGA",
  combustivel: "GASOLINA",
  odometro: 1000,
  litros: 10,
  precoLitro: 6,
  kmRodado: 100,
  kmPorLitro: 10,
  custoKm: 0.6,
  desconto: 0,
  valorPago: 60,
  pagamento: "Pix",
  dataPago: "",
  ...p,
});

const painel = (p: Partial<PainelData>): PainelData => ({
  ganhos: [],
  abastecimentos: [],
  despesas: [],
  repasses: [],
  manutencoes: [],
  odometroAtual: 0,
  ...p,
});

describe("paresDuplicados", () => {
  it("encontra a manutenção lançada também como despesa", () => {
    const pares = paresDuplicados(
      [despesa({ categoria: "MANUTENÇÃO", valor: 250 })],
      [manutencao({ valor: 250, iso: "2026-09-06", data: "06/09/2026" })],
    );
    expect(pares).toHaveLength(1);
  });

  it("não marca valores diferentes como duplicados", () => {
    const pares = paresDuplicados(
      [despesa({ categoria: "MANUTENÇÃO", valor: 250 })],
      [manutencao({ valor: 90 })],
    );
    expect(pares).toHaveLength(0);
  });
});

describe("montaCustos", () => {
  it("conta o gasto de manutenção uma vez só", () => {
    const itens = montaCustos(
      painel({
        despesas: [despesa({ categoria: "MANUTENÇÃO", valor: 250 })],
        manutencoes: [manutencao({ valor: 250 })],
      }),
    );
    expect(itens.reduce((s, i) => s + i.valor, 0)).toBe(250);
    expect(agrupaCustos(itens)[0]?.grupo).toBe("Manutenção");
  });

  it("mantém manutenção avulsa que não virou despesa", () => {
    const itens = montaCustos(painel({ manutencoes: [manutencao({ valor: 180 })] }));
    expect(itens.reduce((s, i) => s + i.valor, 0)).toBe(180);
  });

  it("usa a data da compra mesmo no crédito parcelado", () => {
    const itens = montaCustos(
      painel({
        despesas: [
          despesa({
            pagamento: "Crédito",
            descricao: "Pneu (1/2) [compra 20/08/2026]",
            iso: "2026-09-10",
            data: "10/09/2026",
          }),
        ],
      }),
    );
    expect(itens[0]?.iso).toBe("2026-08-20");
    expect(itens[0]?.isoVencimento).toBe("2026-09-10");
    expect(itens[0]?.pago).toBe(false);
  });
});

describe("resumoFechamento", () => {
  it("separa o que já foi pago do que ainda vence", () => {
    const data = painel({
      abastecimentos: [abastecimento({})],
      despesas: [
        despesa({ row: "2", pagamento: "Crédito", iso: "2026-09-25", data: "25/09/2026", valor: 300 }),
      ],
    });
    const itens = montaCustos(data);
    const r = resumoFechamento(data, itens, (i) => i.startsWith("2026-09"), "2026-09-10", "2026-09-30");
    expect(r.custos).toBe(360);
    expect(r.jaPago).toBe(60);
    expect(r.aPagar).toBe(300);
    expect(r.vencido).toBe(0);
    expect(r.venceDepois).toBe(0);
  });
});
