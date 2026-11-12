import { describe, expect, it } from "vitest";
import { normalizarSugestao, pedidoSugestaoSchema } from "../sugestao-despesa";

describe("sugestão de despesa por IA", () => {
  it("reaproveita a categoria já cadastrada ignorando acento e maiúscula", () => {
    const s = normalizarSugestao({ categoria: "manutencao", descricao: " Troca da corrente " }, ["MANUTENÇÃO", "LANCHE"]);
    expect(s).toEqual({ categoria: "MANUTENÇÃO", descricao: "Troca da corrente" });
  });
  it("categoria nova vem em maiúsculas", () => {
    expect(normalizarSugestao({ categoria: "pneu moto", descricao: "x" }, []).categoria).toBe("PNEU MOTO");
  });
  it("exige tipo de gasto e valor positivo", () => {
    expect(pedidoSugestaoSchema.safeParse({ tipoGasto: "a", valor: 10, situacao: "Funcionando normal" }).success).toBe(false);
    expect(pedidoSugestaoSchema.safeParse({ tipoGasto: "óleo", valor: 0, situacao: "Funcionando normal" }).success).toBe(false);
    expect(pedidoSugestaoSchema.safeParse({ tipoGasto: "óleo", valor: 42, situacao: "Funcionando normal" }).success).toBe(true);
  });
});
