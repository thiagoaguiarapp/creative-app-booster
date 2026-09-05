import { ehExtra } from "./extras";
import {
  FORMAS,
  montaPagamentos,
  type Forma,
} from "./pagamentos";
import type { PainelData } from "./sheets-types";

export type MesFluxo = {
  /** aaaa-mm */
  mes: string;
  /** faturado no mês (competência) — não entra no caixa para não duplicar o repasse */
  faturado: number;
  /** ganhos recebidos direto na mão (gorjeta, sobra de troco) */
  extras: number;
  /** repasses recebidos das plataformas */
  repasses: number;
  /** dinheiro que realmente entrou = repasses + extras */
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

function proximoMes(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano!, m!, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function novoMes(mes: string): MesFluxo {
  return {
    mes,
    faturado: 0,
    extras: 0,
    repasses: 0,
    entradas: 0,
    saidas: 0,
    credito: 0,
    saldo: 0,
    entradasPorPlataforma: [],
    saidasPorForma: [],
  };
}

/**
 * Consolida o painel mês a mês pelo regime de caixa.
 * Entradas contam apenas o dinheiro recebido (repasses + ganhos extras);
 * o faturamento das plataformas fica separado para não somar duas vezes.
 */
export function montaFluxo(data: PainelData): MesFluxo[] {
  const mapa = new Map<string, MesFluxo>();
  const pegar = (mes: string) => {
    let item = mapa.get(mes);
    if (!item) mapa.set(mes, (item = novoMes(mes)));
    return item;
  };

  const plataforma = new Map<string, Map<string, number>>();
  const somaEntrada = (mes: string, nome: string, valor: number) => {
    let m = plataforma.get(mes);
    if (!m) plataforma.set(mes, (m = new Map()));
    const chave = (nome ?? "").trim().toUpperCase() || "—";
    m.set(chave, (m.get(chave) ?? 0) + valor);
  };

  for (const g of data.ganhos) {
    const mes = mesDe(g.iso);
    if (!mes) continue;
    const item = pegar(mes);
    if (ehExtra(g.plataforma)) {
      item.extras += g.faturamento;
      somaEntrada(mes, g.plataforma, g.faturamento);
    } else {
      item.faturado += g.faturamento;
    }
  }

  for (const r of data.repasses) {
    const mes = mesDe(r.iso);
    if (!mes) continue;
    pegar(mes).repasses += r.valor;
    somaEntrada(mes, r.aplicativo, r.valor);
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

  // preenche meses sem movimento entre o primeiro e o último
  const chaves = Array.from(mapa.keys()).sort();
  if (chaves.length > 1) {
    const fim = chaves[chaves.length - 1]!;
    let atual = chaves[0]!;
    while (atual < fim) {
      atual = proximoMes(atual);
      if (!mapa.has(atual)) mapa.set(atual, novoMes(atual));
    }
  }

  const lista = Array.from(mapa.values()).sort((a, b) =>
    b.mes.localeCompare(a.mes),
  );

  for (const item of lista) {
    item.entradas = item.repasses + item.extras;
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

/** quanto ainda falta receber das plataformas (faturado − recebido, sem contar extras) */
export function faltaReceber(data: PainelData): number {
  const faturado = data.ganhos.reduce(
    (s, g) => (ehExtra(g.plataforma) ? s : s + g.faturamento),
    0,
  );
  const recebido = data.repasses.reduce((s, r) => s + r.valor, 0);
  return Math.max(0, faturado - recebido);
}
