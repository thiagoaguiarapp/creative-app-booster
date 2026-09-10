import { atualizar, inserir, remover, txt, type Linha } from "./db.server";
import type { Tipo } from "./entry-schema";
import { dataValida, paraNumeroBr } from "./numero";
import {
  aplicaBaixa,
  dataPago as leDataPago,
  limpaDescricao,
  marcaCompra,
  marcaPago,
  numeroParcela,
  semMarcaParcela,
  somaMeses,
} from "./pagamentos";
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

/** "aaaa-mm-dd" (input date) -> "dd/mm/aaaa"; recusa data fora do formato/ano válido */
function paraBr(valor: string): string {
  const bruto = txt(valor);
  if (!bruto) return "";
  if (!dataValida(bruto)) {
    throw new Error(`Data inválida: "${bruto}". Confira o dia, o mês e o ano.`);
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bruto);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : bruto;
}

function mesDe(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt(valor));
  return m ? (MESES[Number(m[2]) - 1] ?? "") : "";
}

function paraNumero(valor: string): number {
  return paraNumeroBr(valor);
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
  // abastecimento: grava posto e combustível juntos na coluna POSTO ("Posto · Combustível")
  if (tipo === "abastecimento") {
    const posto = txt(valores["posto"] ?? "");
    const combustivel = txt(valores["combustivel"] ?? "");
    valores = { ...valores, posto: [posto, combustivel].filter(Boolean).join(" · ") };
  }
  const linha: Linha = {};
  for (const [chave, campo] of Object.entries(mapa.campos)) {
    if (valores[chave] === undefined) continue;
    linha[campo.coluna] = converter(campo, valores[chave] ?? "");
  }
  if (mapa.mesColuna && valores["data"]) linha[mapa.mesColuna] = mesDe(valores["data"]);
  return linha;
}


/** grava uma despesa (à vista ou parcelada no crédito) */
async function gravarDespesa(valores: Record<string, string>, userId: string): Promise<void> {
  const mapa = MAPAS.despesa;
  const credito = /credito|crédito/i.test(txt(valores["pagamento"] ?? ""));
  const parcelas = credito ? Math.max(1, Math.trunc(Number(valores["parcelas"] ?? "1")) || 1) : 1;
  const total = paraNumero(valores["valor"] ?? "0");
  const dataCompra = txt(valores["data"] ?? "");
  const primeira = txt(valores["dataPrimeiraParcela"] ?? "") || dataCompra;
  const descricaoBase = `${valores["descricao"] ?? ""}`.trim();

  if (!credito) {
    await inserir(mapa.tabela, montaLinha("despesa", valores), userId);
    return;
  }

  const base = parcelas > 1 ? Math.floor((total / parcelas) * 100) / 100 : total;
  const resto = parcelas > 1 ? Math.round((total - base * parcelas) * 100) / 100 : 0;

  for (let i = 0; i < parcelas; i++) {
    const valorParcela = i === 0 ? Math.round((base + resto) * 100) / 100 : base;
    const vencimento = somaMeses(primeira, i);
    const partes = [
      descricaoBase,
      parcelas > 1 ? `(${i + 1}/${parcelas})` : "",
      marcaCompra(paraBr(dataCompra)),
    ].filter(Boolean);
    await inserir(
      mapa.tabela,
      montaLinha("despesa", {
        ...valores,
        data: vencimento,
        valor: valorParcela.toFixed(2),
        descricao: partes.join(" "),
      }),
      userId,
    );
  }
}

/**
 * edita uma única parcela de crédito: grava a data do vencimento na linha e
 * regrava as marcas internas "(n/total)", "[compra ...]" e "[pago ...]".
 */
async function editarParcela(
  row: string,
  valores: Record<string, string>,
  userId: string,
): Promise<void> {
  const { selectAll } = await import("./db.server");
  const linhas = await selectAll(TABELAS.despesa, userId);
  const atual = linhas.find((l) => txt(l["ID"]) === txt(row));
  const obsAtual = txt(atual?.["OBS"] ?? atual?.["OBSERVAÇÃO"] ?? atual?.["DESCRICAO"] ?? "");

  const dataCompra = txt(valores["data"] ?? "");
  const vencimento = txt(valores["dataPrimeiraParcela"] ?? "") || dataCompra;
  const total = Math.max(1, Math.trunc(Number(valores["parcelas"] ?? "1")) || 1);
  const numero = Math.min(Math.max(1, numeroParcela(obsAtual)), total);
  const baixa = leDataPago(obsAtual);
  const base = semMarcaParcela(limpaDescricao(txt(valores["descricao"] ?? "")));

  const descricao = [
    base,
    total > 1 ? `(${numero}/${total})` : "",
    dataCompra ? marcaCompra(paraBr(dataCompra)) : "",
    baixa ? marcaPago(baixa) : "",
  ]
    .filter(Boolean)
    .join(" ");

  await atualizar(
    TABELAS.despesa,
    row,
    montaLinha("despesa", { ...valores, data: vencimento, descricao }),
    userId,
  );
}



export async function salvarLancamento(
  tipo: Tipo,
  valores: Record<string, string>,
  userId: string,
  row?: string,
): Promise<void> {
  const mapa = MAPAS[tipo];

  if (row) {
    if (tipo === "despesa" && /credito|crédito/i.test(txt(valores["pagamento"] ?? ""))) {
      await editarParcela(row, valores, userId);
      return;
    }
    await atualizar(mapa.tabela, row, montaLinha(tipo, valores), userId);
    return;
  }


  if (tipo === "despesa") {
    await gravarDespesa(valores, userId);
    return;
  }

  if (tipo === "manutencao") {
    const valor = paraNumero(valores["valor"] ?? "0");
    const forma = txt(valores["pagamento"] ?? "");
    if (valor > 0 && forma) {
      await gravarDespesa(
        {
          data: valores["data"] ?? "",
          categoria: "Manutenção",
          descricao: txt(valores["servico"] ?? "") || "Manutenção",
          valor: valores["valor"] ?? "",
          pagamento: forma,
          parcelas: valores["parcelas"] ?? "",
          dataPrimeiraParcela: valores["dataPrimeiraParcela"] ?? "",
        },
        userId,
      );
      const observacao = [txt(valores["observacao"] ?? ""), "valor lançado em despesa"]
        .filter(Boolean)
        .join(" · ");
      await inserir(
        mapa.tabela,
        montaLinha(tipo, { ...valores, valor: "0", observacao }),
        userId,
      );
      return;
    }
  }

  await inserir(mapa.tabela, montaLinha(tipo, valores), userId);
}


export async function excluirLancamento(
  tipo: Tipo,
  row: string,
  userId: string,
): Promise<void> {
  await remover(MAPAS[tipo].tabela, row, userId);
}


/** marca (ou desfaz) a baixa de pagamento de uma despesa ou abastecimento no cartão */
export async function baixarPagamento(
  row: string,
  userId: string,
  dataPago: string | null,
): Promise<void> {
  const { selectAll } = await import("./db.server");
  const marca = dataPago ? paraBr(dataPago) : null;

  const despesas = await selectAll(TABELAS.despesa, userId);
  const despesa = despesas.find((l) => txt(l["ID"]) === txt(row));
  if (despesa) {
    const atual = txt(despesa["OBS"] ?? despesa["OBSERVAÇÃO"] ?? despesa["DESCRICAO"] ?? "");
    await atualizar(TABELAS.despesa, row, { OBS: aplicaBaixa(atual, marca) }, userId);
    return;
  }

  // abastecimento: a marca fica junto do posto, única coluna de texto livre
  const abastecimentos = await selectAll(TABELAS.abastecimento, userId);
  const abastecimento = abastecimentos.find((l) => txt(l["ID"]) === txt(row));
  if (abastecimento) {
    const atual = txt(abastecimento["POSTO"] ?? abastecimento["Posto"] ?? "");
    await atualizar(TABELAS.abastecimento, row, { POSTO: aplicaBaixa(atual, marca) }, userId);
    return;
  }

  throw new Error("Não encontrei essa conta para dar baixa. Atualize a tela e tente de novo.");
}
