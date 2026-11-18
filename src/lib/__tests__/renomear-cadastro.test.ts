import { describe, expect, it } from "vitest";
import { mesmoNome, trocaCartao } from "../renomear-cadastro";

describe("renomear cadastro", () => {
  it("troca só o cartão escolhido, mantendo as outras marcas", () => {
    expect(trocaCartao("Pneu [parcelas 6] [cartao nubank] [pago 01/11/2026]", "NUBANK", "Nubank Roxo"))
      .toBe("Pneu [parcelas 6] [cartao NUBANK ROXO] [pago 01/11/2026]");
  });
  it("não mexe em lançamento de outro cartão", () => {
    expect(trocaCartao("Óleo [cartao INTER]", "NUBANK", "X")).toBeNull();
  });
  it("categoria igual ignora acento e maiúscula", () => {
    expect(mesmoNome("MANUTENÇÃO", "manutencao")).toBe(true);
    expect(mesmoNome("Lavagem", "Manutenção")).toBe(false);
  });
});
