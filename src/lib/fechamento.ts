import { ehCategoriaManutencao } from "./manutencao-link";
import { montaPagamentos, type Pagamento } from "./pagamentos";
import type { Despesa, Manutencao, PainelData } from "./sheets-types";

export type ParDuplicado = {
  despesa: Despesa;
  manutencao: Manutencao;
};

function diasEntre(a: string, b: string): number {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const ta = Date.parse(`${a}T00:00:00Z`);
  const tb = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return Number.POSITIVE_INFINITY;
  return Math.abs(ta - tb) / 86400000;
}

/**
 * Despesas de manutenção que têm um registro equivalente na tabela MANUTENCAO
 * (mesmo valor, datas próximas). O gasto vale uma vez só: mantemos a despesa,
 * que carrega forma de pagamento e vencimento, e descartamos o valor da manutenção.
 */
export function paresDuplicados(
  despesas: Despesa[],
  manutencoes: Manutencao[],
): ParDuplicado[] {
  const usadas = new Set<string>();
  const pares: ParDuplicado[] = [];
  for (const d of despesas) {
    if (!ehCategoriaManutencao(d.categoria) || d.valor <= 0) continue;
    const m = manutencoes.find(
      (x) =>
        !usadas.has(x.row) &&
        x.valor > 0 &&
        Math.abs(x.valor - d.valor) < 0.01 &&
        diasEntre(x.iso, d.iso) <= 3,
    );
    if (!m) continue;
    usadas.add(m.row);
    pares.push({ despesa: d, manutencao: m });
  }
  return pares;
}

export type OrigemCusto = "Combustível" | "Despesa" | "Manutenção";

export type ItemCusto = {
  id: string;
  origem: OrigemCusto;
  /** categoria usada para agrupar na lista única de custos */
  grupo: string;
  descricao: string;
  /** competência: data da compra/lançamento */
  iso: string;
  data: string;
  valor: number;
  forma: string;
  pago: boolean;
  /** vencimento (crédito) ou a própria data quando pago no ato */
  isoVencimento: string;
  dataVencimento: string;
  /** presente quando o item pode receber baixa de pagamento */
  pagamento?: Pagamento;
};

/**
 * Junta combustível, despesas e manutenção numa lista única de custos,
 * sempre pela data da compra e sem contar manutenção duas vezes.
 */
export function montaCustos(data: PainelData): ItemCusto[] {
  const pagamentos = montaPagamentos(data.despesas, data.abastecimentos);
  const itens: ItemCusto[] = pagamentos.map((p) => ({
    id: p.id,
    origem: p.origem === "Abastecimento" ? "Combustível" : "Despesa",
    grupo:
      p.origem === "Abastecimento"
        ? "Combustível"
        : ehCategoriaManutencao(p.categoria)
          ? "Manutenção"
          : p.categoria || "Outros",
    descricao: p.descricao,
    iso: p.iso,
    data: p.data,
    valor: p.valor,
    forma: p.forma,
    pago: p.pago,
    isoVencimento: p.isoPagamento,
    dataVencimento: p.dataPagamento,
    pagamento: p,
  }));

  const duplicadas = new Set(paresDuplicados(data.despesas, data.manutencoes).map((p) => p.manutencao.row));
  for (const m of data.manutencoes) {
    if (m.valor <= 0 || duplicadas.has(m.row)) continue;
    itens.push({
      id: `manutencao-${m.row}`,
      origem: "Manutenção",
      grupo: "Manutenção",
      descricao: m.servico || "Manutenção",
      iso: m.iso,
      data: m.data,
      valor: m.valor,
      forma: "Outros",
      pago: true,
      isoVencimento: m.iso,
      dataVencimento: m.data,
    });
  }

  return itens.sort((a, b) => b.iso.localeCompare(a.iso));
}

export type GrupoCusto = {
  grupo: string;
  total: number;
  itens: ItemCusto[];
};

export function agrupaCustos(itens: ItemCusto[]): GrupoCusto[] {
  const mapa = new Map<string, GrupoCusto>();
  for (const item of itens) {
    let g = mapa.get(item.grupo);
    if (!g) {
      g = { grupo: item.grupo, total: 0, itens: [] };
      mapa.set(item.grupo, g);
    }
    g.total += item.valor;
    g.itens.push(item);
  }
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

export type ResumoFechamento = {
  faturado: number;
  recebido: number;
  custos: number;
  lucro: number;
  jaPago: number;
  aPagar: number;
  vencido: number;
  /** parte dos custos deste período que só vence em meses seguintes */
  venceDepois: number;
};

export function resumoFechamento(
  data: PainelData,
  itens: ItemCusto[],
  dentro: (iso: string) => boolean,
  hojeIso: string,
  fimPeriodoIso: string,
): ResumoFechamento {
  const faturado = data.ganhos.filter((g) => dentro(g.iso)).reduce((s, g) => s + g.faturamento, 0);
  const recebido = data.repasses.filter((r) => dentro(r.iso)).reduce((s, r) => s + r.valor, 0);
  const custos = itens.reduce((s, i) => s + i.valor, 0);
  const jaPago = itens.filter((i) => i.pago).reduce((s, i) => s + i.valor, 0);
  const abertos = itens.filter((i) => !i.pago);
  const aPagar = abertos.reduce((s, i) => s + i.valor, 0);
  const vencido = abertos
    .filter((i) => i.isoVencimento && i.isoVencimento <= hojeIso)
    .reduce((s, i) => s + i.valor, 0);
  const venceDepois = itens
    .filter((i) => !i.pago && fimPeriodoIso && i.isoVencimento > fimPeriodoIso)
    .reduce((s, i) => s + i.valor, 0);
  return { faturado, recebido, custos, lucro: faturado - custos, jaPago, aPagar, vencido, venceDepois };
}
