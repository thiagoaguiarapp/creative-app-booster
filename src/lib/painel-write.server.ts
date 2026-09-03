import { atualizar, inserir, remover, txt, type Linha } from "./db.server";
import type { Tipo } from "./entry-schema";
import { TABELAS } from "./painel.server";

type Campo = { coluna: string; tipo: "texto" | "data" | "inteiro" | "dinheiro" };

const MAPAS: Record<Tipo, { tabela: string; mesColuna?: string; campos: Record<string, Campo> }> = {
  ganho: {
    tabela: TABELAS.ganho,
    mesColuna: "MES",
    campos: {
      data: { coluna: "DATA", tipo: "data" },
      plataforma: { coluna: "APP", tipo: "texto" },
      faturamento: { coluna: "FATURAMENTO", tipo: "dinheiro" },
      corridas: { coluna: "ROTAS CONCLUIDAS", tipo: "inteiro" },
      recebido: { coluna: "RECEBIDO", tipo: "dinheiro" },
    },
  },
  abastecimento: {
    tabela: TABELAS.abastecimento,
    campos: {
      data: { coluna: "Data", tipo: "data" },
      veiculo: { coluna: "VEICULO", tipo: "texto" },
      posto: { coluna: "POSTO", tipo: "texto" },
      odometro: { coluna: "Odômetro total", tipo: "inteiro" },
      litros: { coluna: "Volume abastecido", tipo: "dinheiro" },
      precoLitro: { coluna: "Preço do Litro", tipo: "dinheiro" },
      desconto: { coluna: "DESCONTO", tipo: "dinheiro" },
      valorPago: { coluna: "VALOR PAGO", tipo: "dinheiro" },
      pagamento: { coluna: "CONDIÇÃO PAGAMENTO", tipo: "texto" },
    },
  },

  despesa: {
    tabela: TABELAS.despesa,
    campos: {
      data: { coluna: "DATA", tipo: "data" },
      valor: { coluna: "VALOR", tipo: "dinheiro" },
      categoria: { coluna: "TIPO DE GASTO", tipo: "texto" },
      descricao: { coluna: "OBS", tipo: "texto" },
      pagamento: { coluna: "CONDIÇÃO DE PAGAMENTO", tipo: "texto" },
    },
  },
  repasse: {
    tabela: TABELAS.repasse,
    campos: {
      data: { coluna: "DATA", tipo: "data" },
      aplicativo: { coluna: "APLICATIVO", tipo: "texto" },
      valor: { coluna: "VALOR RECEBIDO", tipo: "dinheiro" },
      forma: { coluna: "FORMA RECEBIMENTO", tipo: "texto" },
    },
  },
  manutencao: {
    tabela: TABELAS.manutencao,
    campos: {
      veiculo: { coluna: "VEICULO", tipo: "texto" },
      data: { coluna: "DATA MANUTENÇÃO", tipo: "data" },
      servico: { coluna: "SERVIÇO", tipo: "texto" },
      kmTroca: { coluna: "KM TROCA", tipo: "inteiro" },
      validadeKm: { coluna: "VALIDADE (KM)", tipo: "inteiro" },
      valor: { coluna: "VALOR GASTO", tipo: "dinheiro" },
      observacao: { coluna: "OBSERVAÇÃO", tipo: "texto" },
    },
  },
};

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

/** "aaaa-mm-dd" (input date) -> "dd/mm/aaaa" */
function paraBr(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(valor));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : txt(valor);
}

function mesDe(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(valor));
  return m ? (MESES[Number(m[2]) - 1] ?? "") : "";
}

function paraNumero(valor: string): number {
  const n = Number(txt(valor).replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function converter(campo: Campo, valor: string): unknown {
  if (campo.tipo === "data") return paraBr(valor);
  if (campo.tipo === "inteiro") return Math.trunc(paraNumero(valor));
  if (campo.tipo === "dinheiro") {
    const n = paraNumero(valor);
    return n.toFixed(2).replace(".", ",");
  }
  return txt(valor);
}

function montaLinha(tipo: Tipo, valores: Record<string, string>): Linha {
  const mapa = MAPAS[tipo];
  const linha: Linha = {};
  for (const [chave, campo] of Object.entries(mapa.campos)) {
    if (valores[chave] === undefined) continue;
    linha[campo.coluna] = converter(campo, valores[chave] ?? "");
  }
  if (mapa.mesColuna && valores["data"]) linha[mapa.mesColuna] = mesDe(valores["data"]);
  return linha;
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

export async function salvarLancamento(
  tipo: Tipo,
  valores: Record<string, string>,
  userId: string,
  row?: string,
): Promise<void> {
  const mapa = MAPAS[tipo];

  if (row) {
    await atualizar(mapa.tabela, row, montaLinha(tipo, valores), userId);
    return;
  }

  const parcelas = Math.trunc(Number(valores["parcelas"] ?? "1")) || 1;
  const total = paraNumero(valores["valor"] ?? "0");

  if (tipo === "despesa" && parcelas > 1 && total > 0) {
    const base = Math.floor((total / parcelas) * 100) / 100;
    const resto = Math.round((total - base * parcelas) * 100) / 100;
    const dataBase = txt(valores["dataPrimeiraParcela"] ?? "") || (valores["data"] ?? "");
    for (let i = 0; i < parcelas; i++) {
      const valorParcela = i === 0 ? Math.round((base + resto) * 100) / 100 : base;
      const descricao = `${valores["descricao"] ?? ""}`.trim();
      await inserir(
        mapa.tabela,
        montaLinha(tipo, {
          ...valores,
          data: somaMeses(dataBase, i),
          valor: valorParcela.toFixed(2),
          descricao: `${descricao ? `${descricao} ` : ""}(${i + 1}/${parcelas})`,
        }),
        userId,
      );
    }
    return;
  }

  const primeira = txt(valores["dataPrimeiraParcela"] ?? "");
  await inserir(
    mapa.tabela,
    montaLinha(tipo, tipo === "despesa" && primeira ? { ...valores, data: primeira } : valores),
    userId,
  );
}

export async function excluirLancamento(
  tipo: Tipo,
  row: string,
  userId: string,
): Promise<void> {
  await remover(MAPAS[tipo].tabela, row, userId);
}

