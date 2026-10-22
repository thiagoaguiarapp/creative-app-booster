import { addDays, format, parseISO } from "date-fns";
import type { PainelData } from "./sheets-types";

/** Mesma leitura da Início: faturamento menos despesas e abastecimentos. */
export function resumoSemanaPorDia(data: PainelData, inicio: string) {
  return Array.from({ length: 7 }, (_, indice) => {
    const iso = format(addDays(parseISO(inicio), indice), "yyyy-MM-dd");
    const faturamento = data.ganhos
      .filter((g) => g.iso === iso)
      .reduce((s, g) => s + g.faturamento, 0);
    const gastos = data.despesas
      .filter((d) => d.iso === iso)
      .reduce((s, d) => s + d.valor, 0) + data.abastecimentos
      .filter((a) => a.iso === iso)
      .reduce((s, a) => s + a.valorPago, 0);
    return { iso, faturamento, gastos, lucro: faturamento - gastos };
  });
}

export function totaisSemana(dias: ReturnType<typeof resumoSemanaPorDia>) {
  return dias.reduce((s, d) => ({
    faturamento: s.faturamento + d.faturamento,
    gastos: s.gastos + d.gastos,
    lucro: s.lucro + d.lucro,
  }), { faturamento: 0, gastos: 0, lucro: 0 });
}