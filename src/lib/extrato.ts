import { ehExtra } from "./extras";
import { dataPago, limpaDescricao, montaPagamentos } from "./pagamentos";
import type { PainelData } from "./sheets-types";

export type Movimento = {
  id: string;
  iso: string;
  data: string;
  descricao: string;
  origem: string;
  forma: string;
  tipo: "entrada" | "saida";
  valor: number;
  /** saldo da conta depois deste movimento */
  saldo: number;
};

function paraBr(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function paraIso(br: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br ?? "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

/**
 * Extrato da "conta bancária": tudo que entra e tudo que sai em dinheiro,
 * Pix ou débito. Compras no cartão não entram; entra o pagamento da fatura,
 * na data em que a baixa foi registrada.
 */
export function montaExtrato(data: PainelData): Movimento[] {
  const linhas: Omit<Movimento, "saldo">[] = [];

  for (const g of data.ganhos) {
    if (!ehExtra(g.plataforma)) continue;
    linhas.push({
      id: `extra-${g.row}`,
      iso: g.iso,
      data: g.data,
      descricao: g.plataforma || "Ganho extra",
      origem: "Extra",
      forma: "Dinheiro",
      tipo: "entrada",
      valor: g.faturamento,
    });
  }

  for (const r of data.repasses) {
    linhas.push({
      id: `repasse-${r.row}`,
      iso: r.iso,
      data: r.data,
      descricao: r.aplicativo || "Repasse",
      origem: "Repasse",
      forma: r.forma || "—",
      tipo: "entrada",
      valor: r.valor,
    });
  }

  const pagamentos = montaPagamentos(data.despesas, data.abastecimentos);
  for (const p of pagamentos) {
    if (p.forma === "Crédito") continue;
    linhas.push({
      id: p.id,
      iso: p.isoPagamento,
      data: p.dataPagamento,
      descricao: p.descricao,
      origem: p.origem,
      forma: p.forma === "Outros" ? "Não informado" : p.forma,
      tipo: "saida",
      valor: p.valor,
    });
  }

  // pagamento da fatura do cartão: cada parcela com baixa vira uma saída
  for (const d of data.despesas) {
    const baixa = dataPago(d.descricao);
    if (!baixa) continue;
    const iso = paraIso(baixa);
    linhas.push({
      id: `fatura-${d.row}`,
      iso: iso || d.iso,
      data: baixa || d.data,
      descricao: `Pagamento de fatura · ${limpaDescricao(d.descricao) || d.categoria}`,
      origem: "Fatura do cartão",
      forma: "Cartão",
      tipo: "saida",
      valor: d.valor,
    });
  }

  const ordenadas = linhas
    .filter((l) => l.iso)
    .sort((a, b) => (a.iso === b.iso ? a.id.localeCompare(b.id) : a.iso.localeCompare(b.iso)));

  let saldo = 0;
  const comSaldo: Movimento[] = ordenadas.map((l) => {
    saldo += l.tipo === "entrada" ? l.valor : -l.valor;
    return { ...l, saldo };
  });

  return comSaldo.reverse();
}

/** saldo, entradas e saídas de uma lista de movimentos */
export function totaisExtrato(movimentos: Movimento[]) {
  const entradas = movimentos
    .filter((m) => m.tipo === "entrada")
    .reduce((s, m) => s + m.valor, 0);
  const saidas = movimentos
    .filter((m) => m.tipo === "saida")
    .reduce((s, m) => s + m.valor, 0);
  return { entradas, saidas, saldo: entradas - saidas };
}

export { paraBr as isoParaBr };
