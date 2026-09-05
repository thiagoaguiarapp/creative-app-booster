import {
  FORMAS,
  montaPagamentos,
  type Forma,
} from "./pagamentos";
import type { PainelData } from "./sheets-types";

export type MesFluxo = {
  /** aaaa-mm */
  mes: string;
  ganhos: number;
  repasses: number;
  entradas: number;
  /** saídas pela data em que o dinheiro sai (crédito = vencimento da parcela) */
  saidas: number;
  /** parte das saídas paga no crédito (fatura do mês) */
  credito: number;
  saldo: number;
  entradasPorPlataforma: { nome: string; total: number }[];
  saidasPorForma: { forma: Forma; total: number }[];
};

function mesDe(iso: string) {
  return (iso ?? "").slice(0, 7);
}

/** consolida o painel mês a mês: entradas, saídas pelo caixa e saldo */
export function montaFluxo(data: PainelData): MesFluxo[] {
  const mapa = new Map<string, MesFluxo>();
  const pegar = (mes: string) => {
    let item = mapa.get(mes);
    if (!item) {
      item = {
        mes,
        ganhos: 0,
        repasses: 0,
        entradas: 0,
        saidas: 0,
        credito: 0,
        saldo: 0,
        entradasPorPlataforma: [],
        saidasPorForma: [],
      };
      mapa.set(mes, item);
    }
    return item;
  };

  const plataforma = new Map<string, Map<string, number>>();

  for (const g of data.ganhos) {
    const mes = mesDe(g.iso);
    if (!mes) continue;
    pegar(mes).ganhos += g.faturamento;
    const nome = (g.plataforma ?? "").trim().toUpperCase() || "—";
    let m = plataforma.get(mes);
    if (!m) plataforma.set(mes, (m = new Map()));
    m.set(nome, (m.get(nome) ?? 0) + g.faturamento);
  }

  for (const r of data.repasses) {
    const mes = mesDe(r.iso);
    if (!mes) continue;
    pegar(mes).repasses += r.valor;
  }

  const pagamentos = montaPagamentos(data.despesas, data.abastecimentos);
  const forma = new Map<string, Map<Forma, number>>();
  for (const p of pagamentos) {
    const mes = mesDe(p.isoPagamento);
    if (!mes) continue;
    const item = pegar(mes);
    item.saidas += p.valor;
    if (p.forma === "Crédito") item.credito += p.valor;
    let m = forma.get(mes);
    if (!m) forma.set(mes, (m = new Map()));
    m.set(p.forma, (m.get(p.forma) ?? 0) + p.valor);
  }

  const lista = Array.from(mapa.values()).sort((a, b) =>
    b.mes.localeCompare(a.mes),
  );

  for (const item of lista) {
    item.entradas = item.ganhos + item.repasses;
    item.saldo = item.entradas - item.saidas;
    const p = plataforma.get(item.mes);
    item.entradasPorPlataforma = p
      ? Array.from(p.entries())
          .map(([nome, total]) => ({ nome, total }))
          .sort((a, b) => b.total - a.total)
      : [];
    const f = forma.get(item.mes);
    item.saidasPorForma = FORMAS.map((formaNome) => ({
      forma: formaNome,
      total: f?.get(formaNome) ?? 0,
    })).filter((t) => t.total > 0);
  }

  return lista;
}

/** quanto ainda falta receber das plataformas (faturado − recebido, todo o histórico) */
export function faltaReceber(data: PainelData): number {
  const faturado = data.ganhos.reduce((s, g) => s + g.faturamento, 0);
  const recebido = data.repasses.reduce((s, r) => s + r.valor, 0);
  return Math.max(0, faturado - recebido);
}
