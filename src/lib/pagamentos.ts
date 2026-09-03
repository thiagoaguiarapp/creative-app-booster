import type { Abastecimento, Despesa } from "./sheets-types";

export type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito" | "Outros";

export const FORMAS: Forma[] = ["Dinheiro", "Pix", "Débito", "Crédito", "Outros"];

export type Pagamento = {
  id: string;
  origem: "Despesa" | "Abastecimento";
  /** data da compra (competência) */
  data: string;
  iso: string;
  /** data em que o valor sai do bolso (crédito = vencimento calculado) */
  dataPagamento: string;
  isoPagamento: string;
  descricao: string;
  forma: Forma;
  valor: number;
};

/** "aaaa-mm-dd" + n meses, ajustando o dia ao último dia do mês quando necessário */
export function somaMeses(iso: string, meses: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return iso;
  const ano = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const dia = Number(m[3]);
  const ultimoDia = new Date(ano, mes + meses + 1, 0).getDate();
  const d = new Date(ano, mes + meses, Math.min(dia, ultimoDia));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function paraBr(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** lê "(2/6)" na observação e devolve o número da parcela (1 quando não houver) */
export function numeroParcela(descricao: string): number {
  const m = /\((\d+)\s*\/\s*(\d+)\)/.exec(descricao ?? "");
  return m ? Number(m[1]) : 1;
}

/** crédito: parcela 1 vence no mês seguinte à compra; demais, um mês depois de cada */
function vencimento(iso: string, forma: Forma, descricao: string): string {
  if (forma !== "Crédito" || !iso) return iso;
  return somaMeses(iso, numeroParcela(descricao));
}

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
  const bruto = [
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
  const lista: Pagamento[] = bruto.map((p) => {
    const isoPagamento = vencimento(p.iso, p.forma, p.descricao);
    return { ...p, isoPagamento, dataPagamento: paraBr(isoPagamento) };
  });
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

/** total de crédito que vence em cada mês (aaaa-mm), do mais antigo ao mais novo */
export function faturaPorMes(pagamentos: Pagamento[]) {
  const mapa = new Map<string, number>();
  for (const p of pagamentos) {
    if (p.forma !== "Crédito" || !p.isoPagamento) continue;
    const mes = p.isoPagamento.slice(0, 7);
    mapa.set(mes, (mapa.get(mes) ?? 0) + p.valor);
  }
  return Array.from(mapa.entries())
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

/** parcelas de crédito que ainda vão vencer */
export function parcelasEmAberto(pagamentos: Pagamento[], hojeIso: string) {
  return pagamentos
    .filter((p) => p.forma === "Crédito" && p.isoPagamento > hojeIso)
    .sort((a, b) => a.isoPagamento.localeCompare(b.isoPagamento));
}

export function rotuloMes(mes: string) {
  const [ano, m] = mes.split("-");
  const nomes = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${nomes[Number(m) - 1] ?? m}/${ano}`;
}
