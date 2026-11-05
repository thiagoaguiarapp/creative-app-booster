import { describe, expect, it } from "vitest";
import { calcularCaixa, configuracaoCaixaSchema, exigirPremiumCaixa, lerConfiguracaoCaixa } from "../fluxo-caixa";
import type { Despesa, PainelData } from "../sheets-types";

const painel = (changes: Partial<PainelData> = {}): PainelData => ({ ganhos: [], repasses: [], despesas: [], abastecimentos: [], manutencoes: [], odometroAtual: 0, ...changes });
const despesa = (changes: Partial<Despesa> = {}): Despesa => ({ id: "d1", row: "d1", iso: "2026-11-04", data: "04/11/2026", valor: 42, categoria: "Manutenção", descricao: "Troca de óleo", pagamento: "Pix", ...changes });
const config = { inicio: "2026-11-01", saldoInicial: 500, historicas: [] as string[] };
const calcular = (data: PainelData, c = config) => calcularCaixa(data, c, "2026-11-01", "2026-11-30", "2026-11-05");

describe("Controle de caixa Premium", () => {
  it("nega o controle para Free e permite Premium", () => {
    expect(() => exigirPremiumCaixa({ isPremium: false })).toThrow("Premium");
    expect(() => exigirPremiumCaixa({ isPremium: true })).not.toThrow();
  });
  it("mantém seis meses anteriores no histórico sem criar dívidas automáticas", () => {
    const data = painel({ despesas: [despesa({ iso: "2026-05-01", pagamento: "Crédito", vencimentoIso: "2026-05-30" }), despesa({ row: "vista", iso: "2026-10-30", valor: 200 })] });
    const r = calcular(data);
    expect(r.aPagar).toBe(0);
    expect(r.saldoAcumulado).toBe(500);
    expect(r.historicas.map((p) => p.id)).toEqual(["despesa-d1"]);
    expect(data.despesas).toHaveLength(2);
  });
  it("inclui parcelas compradas antes que vencem após o início", () => {
    const r = calcular(painel({ despesas: [despesa({ iso: "2026-10-01", pagamento: "Crédito", vencimentoIso: "2026-12-06" })] }));
    expect(r.aPagar).toBe(42);
    expect(r.saidas).toBe(0);
  });
  it("cartão só sai do saldo na data da baixa, não na compra nem no vencimento", () => {
    const pendente = despesa({ pagamento: "Crédito", vencimentoIso: "2026-12-06" });
    expect(calcular(painel({ despesas: [pendente] })).saidas).toBe(0);
    const pago = calcular(painel({ despesas: [{ ...pendente, descricao: "Troca de óleo [pago 05/11/2026]" }] }));
    expect(pago.saidas).toBe(42);
    expect(pago.saldoAcumulado).toBe(458);
    expect(pago.movimentos[0]?.iso).toBe("2026-11-05");
  });
  it("saldo acumulado soma saldo inicial e entradas menos saídas", () => {
    const data = painel({ repasses: [{ id: "r", row: "r", data: "04/11/2026", iso: "2026-11-04", aplicativo: "iFood", valor: 350, forma: "Pix", taxa: 0 }], despesas: [despesa()] });
    const r = calcular(data);
    expect(r.entradas).toBe(350);
    expect(r.saidas).toBe(42);
    expect(r.saldoPeriodo).toBe(308);
    expect(r.saldoAcumulado).toBe(808);
  });
  it("entrada imediata não duplica ganho recebido e repasse", () => {
    const data = painel({ ganhos: [{ id: "g", row: "g", data: "04/11/2026", iso: "2026-11-04", plataforma: "iFood", corridas: 1, faturamento: 100, recebido: 100 }], repasses: [{ id: "r", row: "r", data: "04/11/2026", iso: "2026-11-04", aplicativo: "iFood", valor: 100, forma: "Dinheiro", taxa: 0 }] });
    expect(calcular(data).entradas).toBe(100);
    expect(calcular(data).aReceber).toBe(0);
  });
  it("conta antiga só entra quando selecionada explicitamente", () => {
    const data = painel({ despesas: [despesa({ iso: "2026-05-01", pagamento: "Crédito", vencimentoIso: "2026-05-30" })] });
    expect(calcular(data, { ...config, historicas: ["despesa-d1"] }).aPagar).toBe(42);
  });
  it("permite saldo inicial negativo e recusa datas impossíveis", () => {
    expect(calcular(painel(), { ...config, saldoInicial: -500 }).saldoAcumulado).toBe(-500);
    expect(configuracaoCaixaSchema.safeParse({ ...config, inicio: "2026-02-30" }).success).toBe(false);
    expect(lerConfiguracaoCaixa(undefined)).toBeNull();
  });
  it("carrega saldo do mês anterior sem colocá-lo nas entradas do mês", () => {
    const data = painel({ despesas: [despesa({ iso: "2026-10-05", valor: 100 })] });
    const r = calcular(data, { ...config, inicio: "2026-10-01" });
    expect(r.saidas).toBe(0);
    expect(r.saldoAcumulado).toBe(400);
  });
  it("baixa de conta antiga após o início entra como saída real", () => {
    const data = painel({ despesas: [despesa({ iso: "2026-05-01", pagamento: "Crédito", vencimentoIso: "2026-05-30", descricao: "Óleo [pago 04/11/2026]" })] });
    expect(calcular(data).saidas).toBe(42);
    expect(calcular(data).aPagar).toBe(0);
  });
  it("abastecimento parcelado quitado sai uma única vez pelo valor total", () => {
    const data = painel({ abastecimentos: [{ id: "a", row: "a", data: "04/11/2026", iso: "2026-11-04", posto: "Posto", combustivel: "Gasolina", veiculo: "Moto", odometro: 100, litros: 10, precoLitro: 10, kmRodado: 100, kmPorLitro: 10, custoKm: 1, desconto: 0, valorPago: 100, pagamento: "Crédito", dataPago: "05/11/2026", parcelas: 3, primeiraParcela: "2026-12-06" }] });
    const r = calcular(data);
    expect(r.saidas).toBe(100);
    expect(r.saldoAcumulado).toBe(400);
    expect(r.aPagar).toBe(0);
  });
});