import type { Tipo } from "./entry-schema";
import { appendRow, deleteRow, txt, updateCells } from "./sheets.server";

type Mapa = {
  sheet: string;
  largura: number;
  /** coluna (0-based) de cada campo do formulário */
  cols: Record<string, number>;
  /** coluna do mês, preenchida automaticamente no cadastro */
  mesCol?: number;
  idCol: number;
};

const MAPAS: Record<Tipo, Mapa> = {
  ganho: {
    sheet: "DIA A DIA",
    largura: 7,
    idCol: 0,
    mesCol: 1,
    cols: { data: 2, plataforma: 3, faturamento: 4, corridas: 5, recebido: 6 },
  },
  abastecimento: {
    sheet: "COMBUSTIVE/KM",
    largura: 14,
    idCol: 0,
    mesCol: 1,
    cols: { data: 2, odometro: 3, litros: 4, precoLitro: 5, valorPago: 12, pagamento: 13 },
  },
  despesa: {
    sheet: "DESPESA",
    largura: 7,
    idCol: 0,
    mesCol: 1,
    cols: { data: 2, valor: 3, categoria: 4, descricao: 5, pagamento: 6 },
  },
  repasse: {
    sheet: "REPASSE",
    largura: 5,
    idCol: 0,
    cols: { data: 1, aplicativo: 2, valor: 3, forma: 4 },
  },
  manutencao: {
    sheet: "MANUTENCAO",
    largura: 9,
    idCol: 0,
    cols: {
      veiculo: 1,
      data: 2,
      servico: 3,
      kmTroca: 4,
      validadeKm: 5,
      valor: 6,
      observacao: 7,
    },
  },
};

const MESES = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

/** "aaaa-mm-dd" (input date) -> "dd/mm/aaaa" */
function paraBr(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(valor));
  if (!m) return txt(valor);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function mesDe(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(valor));
  return m ? (MESES[Number(m[2]) - 1] ?? "") : "";
}

function normaliza(campo: string, valor: string): string {
  if (campo === "data") return paraBr(valor);
  return txt(valor);
}

export async function salvarLancamento(
  tipo: Tipo,
  valores: Record<string, string>,
  row?: number,
): Promise<void> {
  const mapa = MAPAS[tipo];
  const entradas = Object.entries(mapa.cols)
    .filter(([campo]) => valores[campo] !== undefined)
    .map(([campo, col]) => ({ col, value: normaliza(campo, valores[campo] ?? "") }));

  if (row) {
    if (mapa.mesCol != null && valores["data"]) {
      entradas.push({ col: mapa.mesCol, value: mesDe(valores["data"]) });
    }
    await updateCells(mapa.sheet, row, entradas);
    return;
  }

  const linha = Array.from({ length: mapa.largura }, () => "");
  for (const e of entradas) linha[e.col] = e.value;
  linha[mapa.idCol] = String(Date.now()).slice(-8);
  if (mapa.mesCol != null) linha[mapa.mesCol] = mesDe(valores["data"] ?? "");
  await appendRow(mapa.sheet, linha);
}

export async function excluirLancamento(tipo: Tipo, row: number): Promise<void> {
  await deleteRow(MAPAS[tipo].sheet, row);
}
