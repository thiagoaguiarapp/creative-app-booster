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

/** "aaaa-mm-dd" + n meses, ajustando o dia ao último dia do mês quando necessário */
function somaMeses(iso: string, meses: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(iso));
  if (!m) return iso;
  const ano = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const dia = Number(m[3]);
  const ultimoDia = new Date(ano, mes + meses + 1, 0).getDate();
  const d = new Date(ano, mes + meses, Math.min(dia, ultimoDia));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function montaLinha(
  mapa: Mapa,
  valores: Record<string, string>,
  seq: number,
): string[] {
  const linha = Array.from({ length: mapa.largura }, () => "");
  for (const [campo, col] of Object.entries(mapa.cols)) {
    if (valores[campo] === undefined) continue;
    linha[col] = normaliza(campo, valores[campo] ?? "");
  }
  linha[mapa.idCol] = String(Date.now() + seq).slice(-8);
  if (mapa.mesCol != null) linha[mapa.mesCol] = mesDe(valores["data"] ?? "");
  return linha;
}

export async function salvarLancamento(
  tipo: Tipo,
  valores: Record<string, string>,
  row?: number,
): Promise<void> {
  const mapa = MAPAS[tipo];

  if (row) {
    const entradas = Object.entries(mapa.cols)
      .filter(([campo]) => valores[campo] !== undefined)
      .map(([campo, col]) => ({ col, value: normaliza(campo, valores[campo] ?? "") }));
    if (mapa.mesCol != null && valores["data"]) {
      entradas.push({ col: mapa.mesCol, value: mesDe(valores["data"]) });
    }
    await updateCells(mapa.sheet, row, entradas);
    return;
  }

  const parcelas = Math.trunc(Number(valores["parcelas"] ?? "1")) || 1;
  const total = Number(String(valores["valor"] ?? "0").replace(",", "."));

  if (tipo === "despesa" && parcelas > 1 && total > 0) {
    const base = Math.floor((total / parcelas) * 100) / 100;
    const resto = Math.round((total - base * parcelas) * 100) / 100;
    for (let i = 0; i < parcelas; i++) {
      const valorParcela = i === 0 ? Math.round((base + resto) * 100) / 100 : base;
      const descricao = `${valores["descricao"] ?? ""}`.trim();
      const linha = montaLinha(
        mapa,
        {
          ...valores,
          data: somaMeses(valores["data"] ?? "", i),
          valor: valorParcela.toFixed(2),
          descricao: `${descricao ? `${descricao} ` : ""}(${i + 1}/${parcelas})`,
        },
        i,
      );
      await appendRow(mapa.sheet, linha);
    }
    return;
  }

  await appendRow(mapa.sheet, montaLinha(mapa, valores, 0));
}

export async function excluirLancamento(tipo: Tipo, row: number): Promise<void> {
  await deleteRow(MAPAS[tipo].sheet, row);
}
