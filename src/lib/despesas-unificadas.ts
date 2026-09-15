import { paresDuplicados } from "./fechamento";
import {
  dataPago,
  isoCompra,
  limpaDescricao,
  normalizaForma,
  type Forma,
} from "./pagamentos";
import type { Abastecimento, Despesa, Manutencao, PainelData } from "./sheets-types";

export type Origem = "Combustível" | "Manutenção" | "Despesa";

export const ORIGENS: Origem[] = ["Combustível", "Manutenção", "Despesa"];

export type ItemDespesa = {
  /** id único na lista unificada */
  id: string;
  row: string;
  origem: Origem;
  /** tipo usado pelas ações de editar/excluir */
  tipo: "abastecimento" | "manutencao" | "despesa";
  /** vencimento / competência do lançamento */
  iso: string;
  data: string;
  /** data da compra (igual a iso fora do crédito parcelado) */
  compraIso: string;
  valor: number;
  categoria: string;
  descricao: string;
  pagamento: string;
  /** data da baixa do crédito, quando houver */
  pagoEm: string;
  forma: Forma;
  /** linhas extras exibidas no submenu de detalhes */
  extras: { rotulo: string; valor: string }[];
  /** registro original, usado na edição */
  bruto: Record<string, unknown> & { row: string };
};

function itemDespesa(d: Despesa): ItemDespesa {
  return {
    id: `despesa-${d.row}`,
    row: d.row,
    origem: "Despesa",
    tipo: "despesa",
    iso: d.iso,
    data: d.data,
    compraIso: isoCompra(d.descricao, d.iso),
    valor: d.valor,
    categoria: d.categoria,
    descricao: limpaDescricao(d.descricao),
    pagamento: d.pagamento,
    pagoEm: dataPago(d.descricao),
    forma: normalizaForma(d.pagamento),
    extras: [],
    bruto: d as unknown as Record<string, unknown> & { row: string },
  };
}

function itemAbastecimento(a: Abastecimento): ItemDespesa {
  return {
    id: `abastecimento-${a.row}`,
    row: a.row,
    origem: "Combustível",
    tipo: "abastecimento",
    iso: a.iso,
    data: a.data,
    compraIso: a.iso,
    valor: a.valorPago,
    categoria: "Combustível",
    descricao: [a.combustivel, a.posto].filter(Boolean).join(" · "),
    pagamento: a.pagamento,
    pagoEm: a.dataPago,
    forma: normalizaForma(a.pagamento),
    extras: [
      { rotulo: "Combustível", valor: a.combustivel || "—" },
      { rotulo: "Posto", valor: a.posto || "—" },
      { rotulo: "Litros", valor: a.litros ? `${a.litros} L` : "—" },
      { rotulo: "Odômetro", valor: a.odometro ? `${a.odometro} km` : "—" },
    ],
    bruto: a as unknown as Record<string, unknown> & { row: string },
  };
}

function itemManutencao(m: Manutencao): ItemDespesa {
  return {
    id: `manutencao-${m.row}`,
    row: m.row,
    origem: "Manutenção",
    tipo: "manutencao",
    iso: m.iso,
    data: m.data,
    compraIso: m.iso,
    valor: m.valor,
    categoria: m.servico || "Manutenção",
    descricao: m.observacao || m.servico,
    pagamento: "",
    pagoEm: "",
    forma: "Outros",
    extras: [
      { rotulo: "Veículo", valor: m.veiculo || "—" },
      { rotulo: "Serviço", valor: m.servico || "—" },
      { rotulo: "Km da troca", valor: m.kmTroca ? `${m.kmTroca} km` : "—" },
      { rotulo: "Validade", valor: m.validadeKm ? `${m.validadeKm} km` : "—" },
    ],
    bruto: m as unknown as Record<string, unknown> & { row: string },
  };
}

/**
 * Lista única de gastos: despesas + combustível + manutenção.
 * Manutenções já lançadas como despesa (mesmo valor e data próxima) entram
 * uma vez só — mantemos a despesa, que carrega forma de pagamento.
 * Manutenção sem valor (só km/validade) não soma nada.
 */
export function montaDespesasUnificadas(data: PainelData): ItemDespesa[] {
  const duplicadas = new Set(
    paresDuplicados(data.despesas, data.manutencoes).map((p) => p.manutencao.row),
  );

  const itens: ItemDespesa[] = [
    ...data.despesas.map(itemDespesa),
    ...data.abastecimentos.map(itemAbastecimento),
    ...data.manutencoes
      .filter((m) => m.valor > 0 && !duplicadas.has(m.row))
      .map(itemManutencao),
  ];

  return itens.sort((a, b) => b.iso.localeCompare(a.iso));
}
