import type { Abastecimento, Despesa } from "./sheets-types";

export type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito" | "Outros";

export const FORMAS: Forma[] = ["Dinheiro", "Pix", "Débito", "Crédito", "Outros"];

export type Pagamento = {
  id: string;
  origem: "Despesa" | "Abastecimento";
  data: string;
  iso: string;
  descricao: string;
  forma: Forma;
  valor: number;
};

function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizaForma(valor: string): Forma {
  const t = semAcento(valor ?? "");
  if (!t) return "Outros";
  if (t.includes("pix")) return "Pix";
  if (t.includes("credito")) return "Crédito";
  if (t.includes("debito")) return "Débito";
  if (t.includes("dinheiro") || t.includes("a vista") || t.includes("avista")) return "Dinheiro";
  return "Outros";
}

export function montaPagamentos(
  despesas: Despesa[],
  abastecimentos: Abastecimento[],
): Pagamento[] {
  const lista: Pagamento[] = [
    ...despesas.map((d) => ({
      id: `despesa-${d.row}`,
      origem: "Despesa" as const,
      data: d.data,
      iso: d.iso,
      descricao: [d.categoria, d.descricao].filter(Boolean).join(" · "),
      forma: normalizaForma(d.pagamento),
      valor: d.valor,
    })),
    ...abastecimentos.map((a) => ({
      id: `abastecimento-${a.row}`,
      origem: "Abastecimento" as const,
      data: a.data,
      iso: a.iso,
      descricao: a.posto ? `Abastecimento · ${a.posto}` : "Abastecimento",
      forma: normalizaForma(a.pagamento),
      valor: a.valorPago,
    })),
  ];
  return lista.sort((a, b) => b.iso.localeCompare(a.iso));
}

export function totaisPorForma(pagamentos: Pagamento[]) {
  return FORMAS.map((forma) => {
    const itens = pagamentos.filter((p) => p.forma === forma);
    return {
      forma,
      total: itens.reduce((s, p) => s + p.valor, 0),
      quantidade: itens.length,
    };
  });
}

/** total de crédito lançado em cada mês (aaaa-mm), ordenado do mais antigo ao mais novo */
export function faturaPorMes(pagamentos: Pagamento[]) {
  const mapa = new Map<string, number>();
  for (const p of pagamentos) {
    if (p.forma !== "Crédito" || !p.iso) continue;
    const mes = p.iso.slice(0, 7);
    mapa.set(mes, (mapa.get(mes) ?? 0) + p.valor);
  }
  return Array.from(mapa.entries())
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

/** parcelas de crédito com data futura */
export function parcelasEmAberto(pagamentos: Pagamento[], hojeIso: string) {
  return pagamentos
    .filter((p) => p.forma === "Crédito" && p.iso > hojeIso)
    .sort((a, b) => a.iso.localeCompare(b.iso));
}

export function rotuloMes(mes: string) {
  const [ano, m] = mes.split("-");
  const nomes = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${nomes[Number(m) - 1] ?? m}/${ano}`;
}
