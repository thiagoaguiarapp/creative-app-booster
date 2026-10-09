import { describe, expect, it } from "vitest";
import { conciliacaoRecebimentos } from "../conciliacao";
import type { Ganho, Repasse } from "../sheets-types";

const ganho = (plataforma: string, iso: string, faturamento: number): Ganho => ({
  id: iso + plataforma, row: "1", data: iso, iso, plataforma, faturamento, corridas: 1, recebido: 0,
});
const repasse = (aplicativo: string, iso: string, valor: number): Repasse => ({
  id: iso + aplicativo, row: "1", data: iso, iso, aplicativo, valor, forma: "Pix", taxa: 0,
});
const periodo = (iso: string) => iso.startsWith("2026-10");

describe("conciliação unificada de recebimentos", () => {
  it("inclui plataforma com pendência antiga sem movimento atual", () => {
    const lista = conciliacaoRecebimentos([ganho("Zuply", "2026-09-01", 10.31)], [], periodo, "2026-10");
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ app: "Zuply", pendenteMes: 0, restanteAnterior: 10.31, pendente: 10.31 });
  });
  it("soma período e anteriores no valor para dar baixa e no total", () => {
    const lista = conciliacaoRecebimentos([
      ganho("iFood", "2026-09-01", 100), ganho("IFOOD", "2026-10-01", 200),
      ganho("Zuply", "2026-09-01", 10.31),
    ], [repasse("ifood", "2026-10-02", 40)], periodo, "2026-10");
    expect(lista[0]).toMatchObject({ pendenteMes: 200, restanteAnterior: 60, pendente: 260 });
    expect(lista.reduce((s, a) => s + a.pendente, 0)).toBeCloseTo(270.31, 2);
  });
  it("não mantém pendência antiga já quitada por recebimento posterior", () => {
    const lista = conciliacaoRecebimentos([
      ganho("Uber", "2026-09-01", 30), ganho("Uber", "2026-10-01", 50),
    ], [repasse("Uber", "2026-10-02", 40)], periodo, "2026-10");
    expect(lista[0]).toMatchObject({ restanteAnterior: 0, pendenteMes: 40, pendente: 40 });
  });
  it("não duplica dívida no filtro Total nem inclui extras", () => {
    const lista = conciliacaoRecebimentos([
      ganho("99", "2026-09-01", 100), ganho("99", "2026-10-01", 50),
      ganho("Gorjeta", "2026-10-01", 20),
    ], [repasse("99", "2026-10-02", 120)], () => true, null);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ restanteAnterior: 0, pendente: 30 });
  });
});