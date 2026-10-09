import { describe, expect, it } from "vitest";
import { manutencoesPendentes } from "../manutencao-alerta";
import type { Manutencao } from "../sheets-types";

const m = (p: Partial<Manutencao>): Manutencao => ({
  id: "1", row: "1", veiculo: "Moto", data: "", iso: "2026-01-01", servico: "Troca de óleo",
  kmTroca: 50000, validadeKm: 5000, valor: 0, observacao: "", pagamento: "", ...p,
});

describe("manutencoesPendentes", () => {
  it("avisa quando passou do km", () => {
    const r = manutencoesPendentes([m({})], 55200);
    expect(r[0]).toMatchObject({ vencido: true, km: 200 });
  });
  it("avisa quando faltam 20% ou menos", () => {
    expect(manutencoesPendentes([m({})], 54000)[0]).toMatchObject({ vencido: false, km: 1000 });
  });
  it("não avisa quando está em dia", () => {
    expect(manutencoesPendentes([m({})], 52000)).toHaveLength(0);
  });
  it("usa só a troca mais recente", () => {
    const r = manutencoesPendentes([m({}), m({ id: "2", iso: "2026-05-01", kmTroca: 55000 })], 55200);
    expect(r).toHaveLength(0);
  });
});
