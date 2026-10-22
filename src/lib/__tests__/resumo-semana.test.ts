import { describe, expect, it } from "vitest";
import { resumoSemanaPorDia, totaisSemana } from "../resumo-semana";
import type { PainelData } from "../sheets-types";

const data: PainelData = {
  ganhos: [
    { id: "g1", row: "g1", data: "19/10/2026", iso: "2026-10-19", plataforma: "99", faturamento: 100, recebido: 150, corridas: 2 },
    { id: "g2", row: "g2", data: "20/10/2026", iso: "2026-10-20", plataforma: "Uber", faturamento: 80, recebido: 0, corridas: 3 },
    { id: "g3", row: "g3", data: "18/10/2026", iso: "2026-10-18", plataforma: "99", faturamento: 999, recebido: 0, corridas: 1 },
  ],
  despesas: [{ id: "d1", row: "d1", data: "19/10/2026", iso: "2026-10-19", valor: 30, categoria: "Celular", descricao: "Plano", pagamento: "Crédito", vencimentoIso: "2026-11-19" }],
  abastecimentos: [{ id: "a1", row: "a1", data: "20/10/2026", iso: "2026-10-20", valorPago: 20, posto: "", combustivel: "", veiculo: "", odometro: 0, litros: 0, precoLitro: 0, kmRodado: 0, kmPorLitro: 0, custoKm: 0, desconto: 0, pagamento: "Pix", dataPago: "", parcelas: 1, primeiraParcela: "" }],
  repasses: [], manutencoes: [], odometroAtual: 0,
};

describe("detalhes da semana da Início", () => {
  it("separa faturamento e gastos por dia, incluindo combustível", () => {
    const dias = resumoSemanaPorDia(data, "2026-10-19");
    expect(dias[0]).toEqual({ iso: "2026-10-19", faturamento: 100, gastos: 30, lucro: 70 });
    expect(dias[1]).toEqual({ iso: "2026-10-20", faturamento: 80, gastos: 20, lucro: 60 });
  });
  it("mostra sete dias de segunda a domingo, incluindo dias sem movimento", () => {
    const dias = resumoSemanaPorDia(data, "2026-10-19");
    expect(dias).toHaveLength(7);
    expect(dias[6]).toEqual({ iso: "2026-10-25", faturamento: 0, gastos: 0, lucro: 0 });
  });
  it("totaliza somente a semana exibida, sem usar recebido como faturamento", () => {
    expect(totaisSemana(resumoSemanaPorDia(data, "2026-10-19"))).toEqual({ faturamento: 180, gastos: 50, lucro: 130 });
  });
  it("mantém a despesa no dia da compra, não no vencimento do crédito", () => {
    expect(resumoSemanaPorDia(data, "2026-11-16").every((d) => d.gastos === 0)).toBe(true);
    expect(resumoSemanaPorDia(data, "2026-10-19")[0]?.gastos).toBe(30);
  });
});