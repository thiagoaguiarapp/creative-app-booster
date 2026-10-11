import { describe, expect, it } from "vitest";

import { cardsPorForma, filtrarPagamentosPeriodo } from "../contas-pagar";
import type { Pagamento } from "../pagamentos";

const p = (o: Partial<Pagamento>): Pagamento => ({
  id: "x", row: "1", origem: "Despesa", data: "", iso: "2026-10-01", dataPagamento: "",
  isoPagamento: "2026-10-01", descricao: "", categoria: "", forma: "Pix", valor: 10,
  pago: true, dataPago: "", ...o,
});

describe("contas a pagar", () => {
  it("crédito filtra pelo vencimento, à vista pela data da compra", () => {
    const lista = [
      p({ id: "c", forma: "Crédito", iso: "2026-09-20", isoPagamento: "2026-10-10", pago: false }),
      p({ id: "pix", forma: "Pix", iso: "2026-09-20", isoPagamento: "2026-09-20" }),
    ];
    const r = filtrarPagamentosPeriodo(lista, { periodo: "personalizado", de: "2026-10-01", ate: "2026-10-31" });
    expect(r.map((x) => x.id)).toEqual(["c"]);
  });

  it("card soma total e em aberto por forma sem duplicar", () => {
    const cards = cardsPorForma([
      p({ forma: "Crédito", valor: 100, pago: false }),
      p({ forma: "Crédito", valor: 50, pago: true }),
    ]);
    const cred = cards.find((c) => c.forma === "Crédito")!;
    expect(cred.total).toBe(150);
    expect(cred.emAberto).toBe(100);
    expect(cred.quantidade).toBe(2);
  });
});
