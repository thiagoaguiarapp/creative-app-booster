import type { PainelData } from "./sheets-types";
import { batchGet, isEmptyRow, isoDate, num, txt } from "./sheets.server";

const RANGES = [
  "DIA A DIA!A2:G20000",
  "COMBUSTIVE/KM!A2:N2000",
  "DESPESA!A2:G5000",
  "REPASSE!A2:E20000",
  "MANUTENCAO!A2:I2000",
];

const byIsoDesc = (a: { iso: string }, b: { iso: string }) =>
  b.iso.localeCompare(a.iso);

/** Anexa o número real da linha na planilha (dados começam na linha 2). */
function withRows(rows: string[][]): { r: string[]; row: number }[] {
  return rows.map((r, i) => ({ r, row: i + 2 }));
}

let cache: { data: PainelData; at: number } | null = null;
let emVoo: Promise<PainelData> | null = null;
const TTL = 60_000;

/** Limpa o cache após gravações para a próxima leitura vir fresca. */
export function invalidarPainelCache() {
  cache = null;
}

export async function loadPainelData(): Promise<PainelData> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  if (emVoo) return emVoo;
  emVoo = carregar()
    .then((d) => {
      cache = { data: d, at: Date.now() };
      return d;
    })
    .finally(() => {
      emVoo = null;
    });
  return emVoo;
}

async function carregar(): Promise<PainelData> {
  const [rGanhos, rComb, rDesp, rRep, rManut] = await batchGet(RANGES);


  const ganhos = withRows(rGanhos ?? [])
    .filter(({ r }) => !isEmptyRow(r) && txt(r[2]) !== "")
    .map(({ r, row }) => ({
      id: txt(r[0]) || `g${row}`,
      row,
      data: txt(r[2]),
      iso: isoDate(r[2]),
      plataforma: txt(r[3]) || "—",
      corridas: num(r[5]),
      faturamento: num(r[4]),
      recebido: num(r[6]),
    }))
    .sort(byIsoDesc);

  const abastecimentos = withRows(rComb ?? [])
    .filter(({ r }) => !isEmptyRow(r) && txt(r[2]) !== "")
    .map(({ r, row }) => ({
      id: txt(r[0]) || `a${row}`,
      row,
      data: txt(r[2]),
      iso: isoDate(r[2]),
      odometro: num(r[3]),
      litros: num(r[4]),
      precoLitro: num(r[5]),
      kmRodado: num(r[8]),
      kmPorLitro: num(r[10]),
      custoKm: num(r[11]),
      valorPago: num(r[12]),
      pagamento: txt(r[13]) || "—",
    }))
    .sort(byIsoDesc);

  const despesas = withRows(rDesp ?? [])
    .filter(({ r }) => !isEmptyRow(r) && txt(r[2]) !== "")
    .map(({ r, row }) => ({
      id: txt(r[0]) || `d${row}`,
      row,
      data: txt(r[2]),
      iso: isoDate(r[2]),
      valor: num(r[3]),
      categoria: txt(r[4]) || "Outros",
      descricao: txt(r[5]),
      pagamento: txt(r[6]) || "—",
    }))
    .sort(byIsoDesc);

  const repasses = withRows(rRep ?? [])
    .filter(({ r }) => !isEmptyRow(r) && txt(r[1]) !== "")
    .map(({ r, row }) => ({
      id: txt(r[0]) || `r${row}`,
      row,
      data: txt(r[1]),
      iso: isoDate(r[1]),
      aplicativo: txt(r[2]) || "—",
      valor: num(r[3]),
      forma: txt(r[4]) || "—",
    }))
    .sort(byIsoDesc);

  const manutencoes = withRows(rManut ?? [])
    .filter(({ r }) => !isEmptyRow(r) && txt(r[3]) !== "")
    .map(({ r, row }) => ({
      id: txt(r[0]) || `m${row}`,
      row,
      veiculo: txt(r[1]) || "—",
      data: txt(r[2]),
      iso: isoDate(r[2]),
      servico: txt(r[3]),
      kmTroca: num(r[4]),
      validadeKm: num(r[5]),
      valor: num(r[6]),
      observacao: txt(r[7]),
    }))
    .sort(byIsoDesc);

  const odometroAtual = Math.max(
    0,
    ...abastecimentos.map((a) => a.odometro),
    ...manutencoes.map((m) => m.kmTroca),
  );

  return { ganhos, abastecimentos, despesas, repasses, manutencoes, odometroAtual };
}
