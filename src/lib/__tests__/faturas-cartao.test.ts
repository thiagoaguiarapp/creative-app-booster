import { describe, expect, it } from "vitest";
import { agruparFaturas, cartaoDe, competenciaDespesa, limpaDescricao, marcaCartao, type Pagamento } from "../pagamentos";

const p = (o: Partial<Pagamento>): Pagamento => ({
  id: "x", row: "1", origem: "Despesa", data: "", iso: "2026-10-01", dataPagamento: "",
  isoPagamento: "2026-11-05", descricao: "", categoria: "", forma: "Crédito", valor: 10,
  pago: false, dataPago: "", cartao: "", ...o,
});

describe("parcela conta no mês do vencimento", () => {
  it("parcelado usa o vencimento da parcela", () => {
    expect(competenciaDespesa("PNEU (2/3) [compra 04/11/2026]", "2027-01-05")).toBe("2027-01-05");
  });
  it("crédito à vista continua na data da compra", () => {
    expect(competenciaDespesa("LANCHE [compra 04/11/2026]", "2026-12-06")).toBe("2026-11-04");
  });
});

describe("apelido do cartão", () => {
  it("grava, lê em maiúsculas e some da descrição", () => {
    const obs = `ALMOÇO ${marcaCartao(" nubank ")}`;
    expect(cartaoDe(obs)).toBe("NUBANK");
    expect(limpaDescricao(obs)).toBe("ALMOÇO");
  });
  it("sem apelido não grava marca", () => {
    expect(marcaCartao("  ")).toBe("");
  });
});

describe("faturas", () => {
  it("separa por cartão e vencimento e soma o total", () => {
    const f = agruparFaturas([
      p({ id: "a", cartao: "NUBANK", valor: 30.18 }),
      p({ id: "b", cartao: "NUBANK", valor: 27.5 }),
      p({ id: "c", cartao: "INTER", isoPagamento: "2026-11-15", valor: 21.88 }),
      p({ id: "d", cartao: "NUBANK", pago: true, valor: 99 }),
    ]);
    expect(f.map((x) => [x.cartao, x.isoVencimento, x.total, x.itens.length])).toEqual([
      ["NUBANK", "2026-11-05", 57.68, 2],
      ["INTER", "2026-11-15", 21.88, 1],
    ]);
  });
});
