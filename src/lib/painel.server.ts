import { dataBr, isoDate, num, selectAll, txt, type Linha } from "./db.server";
import type { PainelData } from "./sheets-types";

export const TABELAS = {
  ganho: "DIARIO",
  abastecimento: "CONTROLE COMBUSTIVEL",
  despesa: "DESPESAS",
  repasse: "REPASSE",
  manutencao: "MANUTENCAO",
} as const;

const byIsoDesc = (a: { iso: string }, b: { iso: string }) =>
  b.iso.localeCompare(a.iso);

/** lê a primeira coluna existente entre os nomes informados */
function campo(linha: Linha, ...nomes: string[]): unknown {
  for (const n of nomes) {
    if (linha[n] !== undefined && linha[n] !== null && txt(linha[n]) !== "") {
      return linha[n];
    }
  }
  return undefined;
}

const idDe = (linha: Linha) => Number(linha["ID"] ?? 0);

let cache: { data: PainelData; at: number } | null = null;
let emVoo: Promise<PainelData> | null = null;
const TTL = 30_000;

/** Limpa o cache após gravações para a próxima leitura vir fresca. */
export function invalidarPainelCache() {
  cache = null;
}

export async function loadPainelData(): Promise<PainelData> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  if (emVoo) return emVoo;
  const anterior = cache;
  emVoo = carregar()
    .then((d) => {
      cache = { data: d, at: Date.now() };
      return d;
    })
    .catch((err) => {
      if (anterior) {
        cache = { data: anterior.data, at: Date.now() - TTL + 10_000 };
        return anterior.data;
      }
      throw err;
    })
    .finally(() => {
      emVoo = null;
    });
  return emVoo;
}

async function carregar(): Promise<PainelData> {
  const [rGanhos, rComb, rDesp, rRep, rManut] = await Promise.all([
    selectAll(TABELAS.ganho),
    selectAll(TABELAS.abastecimento),
    selectAll(TABELAS.despesa),
    selectAll(TABELAS.repasse),
    selectAll(TABELAS.manutencao),
  ]);

  const ganhos = rGanhos
    .filter((l) => txt(campo(l, "DATA", "Data")) !== "")
    .map((l) => ({
      id: String(idDe(l)),
      row: idDe(l),
      data: dataBr(campo(l, "DATA", "Data")),
      iso: isoDate(campo(l, "DATA", "Data")),
      plataforma: txt(campo(l, "APP", "APLICATIVO", "PLATAFORMA")) || "—",
      corridas: num(campo(l, "ROTAS CONCLUIDAS", "CORRIDAS")),
      faturamento: num(campo(l, "FATURAMENTO")),
      recebido: num(campo(l, "RECEBIDO", "VALOR RECEBIDO")),
    }))
    .sort(byIsoDesc);

  const abastecimentos = rComb
    .filter((l) => txt(campo(l, "Data", "DATA")) !== "")
    .map((l) => {
      const litros = num(campo(l, "Volume abastecido", "LITROS"));
      const kmRodado = num(campo(l, "KM RODADO"));
      return {
        id: String(idDe(l)),
        row: idDe(l),
        data: dataBr(campo(l, "Data", "DATA")),
        iso: isoDate(campo(l, "Data", "DATA")),
        odometro: num(campo(l, "Odômetro total", "ODOMETRO")),
        litros,
        precoLitro: num(campo(l, "Preço do Litro", "PRECO LITRO")),
        kmRodado,
        kmPorLitro: num(campo(l, "km/l")) || (litros ? kmRodado / litros : 0),
        custoKm: num(campo(l, "Custo do km")),
        valorPago: num(campo(l, "VALOR PAGO", "VALOR")),
        pagamento: txt(campo(l, "CONDIÇÃO PAGAMENTO", "CONDICAO PAGAMENTO")) || "—",
      };
    })
    .sort(byIsoDesc);

  const despesas = rDesp
    .filter((l) => txt(campo(l, "DATA", "Data")) !== "")
    .map((l) => ({
      id: String(idDe(l)),
      row: idDe(l),
      data: dataBr(campo(l, "DATA", "Data")),
      iso: isoDate(campo(l, "DATA", "Data")),
      valor: num(campo(l, "VALOR")),
      categoria: txt(campo(l, "TIPO DE GASTO", "CATEGORIA")) || "Outros",
      descricao: txt(campo(l, "OBS", "OBSERVAÇÃO", "DESCRICAO")),
      pagamento: txt(campo(l, "CONDIÇÃO DE PAGAMENTO", "CONDICAO DE PAGAMENTO")) || "—",
    }))
    .sort(byIsoDesc);

  const repasses = rRep
    .filter((l) => txt(campo(l, "DATA", "Data")) !== "")
    .map((l) => ({
      id: String(idDe(l)),
      row: idDe(l),
      data: dataBr(campo(l, "DATA", "Data")),
      iso: isoDate(campo(l, "DATA", "Data")),
      aplicativo: txt(campo(l, "APLICATIVO", "APP")) || "—",
      valor: num(campo(l, "VALOR RECEBIDO", "VALOR")),
      forma: txt(campo(l, "FORMA RECEBIMENTO", "FORMA")) || "—",
    }))
    .sort(byIsoDesc);

  const manutencoes = rManut
    .filter((l) => txt(campo(l, "SERVIÇO", "SERVICO")) !== "")
    .map((l) => ({
      id: String(idDe(l)),
      row: idDe(l),
      veiculo: txt(campo(l, "VEICULO", "VEÍCULO")) || "—",
      data: dataBr(campo(l, "DATA MANUTENÇÃO", "DATA MANUTENCAO", "DATA")),
      iso: isoDate(campo(l, "DATA MANUTENÇÃO", "DATA MANUTENCAO", "DATA")),
      servico: txt(campo(l, "SERVIÇO", "SERVICO")),
      kmTroca: num(campo(l, "KM TROCA")),
      validadeKm: num(campo(l, "VALIDADE (KM)", "VALIDADE KM")),
      valor: num(campo(l, "VALOR GASTO", "VALOR")),
      observacao: txt(campo(l, "OBSERVAÇÃO", "OBSERVACAO", "OBS")),
    }))
    .sort(byIsoDesc);

  const odometroAtual = Math.max(
    0,
    ...abastecimentos.map((a) => a.odometro),
    ...manutencoes.map((m) => m.kmTroca),
  );

  return { ganhos, abastecimentos, despesas, repasses, manutencoes, odometroAtual };
}
