import { describe, expect, it } from "vitest";

import { resumoCartao } from "../cartao";
import { montaExtrato, totaisExtrato } from "../extrato";
import { montaPagamentos } from "../pagamentos";
import type { PainelData } from "../sheets-types";

const base: PainelData = {
  ganhos: [
    {
      id: "g1", row: "1", data: "05/09/2026", iso: "2026-09-05",
      plataforma: "Gorjeta", corridas: 0, faturamento: 50, recebido: 50,
    },
  ],
  abastecimentos: [
    {
      id: "a1", row: "1", data: "03/09/2026", iso: "2026-09-03", posto: "Shell",
      combustivel: "Gasolina", odometro: 100, litros: 10, precoLitro: 6, kmRodado: 0,
      kmPorLitro: 0, custoKm: 0, desconto: 0, valorPago: 60, pagamento: "Pix",
    },
  ],
  despesas: [
    {
      id: "d1", row: "10", data: "10/10/2026", iso: "2026-10-10", valor: 200,
      categoria: "Peças", descricao: "Pneu (1/2) [compra 02/09/2026] [pago 10/10/2026]",
      pagamento: "Crédito parcelado",
    },
    {
      id: "d2", row: "11", data: "10/11/2026", iso: "2026-11-10", valor: 200,
      categoria: "Peças", descricao: "Pneu (2/2) [compra 02/09/2026]",
      pagamento: "Crédito parcelado",
    },
  ],
  repasses: [
    {
      id: "r1", row: "1", data: "06/09/2026", iso: "2026-09-06",
      aplicativo: "iFood", valor: 600, forma: "Pix",
    },
  ],
  manutencoes: [],
  odometroAtual: 100,
};

describe("extrato", () => {
  const movimentos = montaExtrato(base);

  it("não traz compras no cartão, só o pagamento da fatura", () => {
    expect(movimentos.some((m) => m.descricao.includes("Pneu (2/2)"))).toBe(false);
    const fatura = movimentos.find((m) => m.origem === "Fatura do cartão");
    expect(fatura?.valor).toBe(200);
    expect(fatura?.iso).toBe("2026-10-10");
  });

  it("soma entradas e saídas como uma conta", () => {
    const t = totaisExtrato(movimentos);
    expect(t.entradas).toBe(650);
    expect(t.saidas).toBe(260);
    expect(t.saldo).toBe(390);
    expect(movimentos[0]?.saldo).toBe(390);
  });
});

describe("cartão", () => {
  it("compromete o limite só com parcelas em aberto", () => {
    const pagamentos = montaPagamentos(base.despesas, base.abastecimentos);
    const r = resumoCartao(pagamentos, 1000);
    expect(r.usado).toBe(200);
    expect(r.disponivel).toBe(800);
    expect(r.nivel).toBe("ok");
  });
});
