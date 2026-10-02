import type { Abastecimento, Despesa } from "./sheets-types";

export type Forma = "Dinheiro" | "Pix" | "Débito" | "Crédito" | "Outros";

export const FORMAS: Forma[] = ["Dinheiro", "Pix", "Débito", "Crédito", "Outros"];

export type Pagamento = {
  id: string;
  row: string;
  origem: "Despesa" | "Abastecimento";
  /** data da compra (competência) */
  data: string;
  iso: string;
  /** data em que o valor sai do bolso (crédito = vencimento gravado da parcela) */
  dataPagamento: string;
  isoPagamento: string;
  descricao: string;
  categoria: string;
  forma: Forma;
  valor: number;
  /** já quitado (à vista sempre; crédito só com baixa registrada) */
  pago: boolean;
  /** data em que a baixa foi registrada (dd/mm/aaaa) */
  dataPago: string;
};

/** categoria usada nas retiradas pessoais (salário) */
export const CATEGORIA_RETIRADA = "Retirada pessoal";

export function ehRetirada(categoria: string): boolean {
  return semAcento(categoria ?? "").includes("retirada");
}


/** "aaaa-mm-dd" + n meses, ajustando o dia ao último dia do mês quando necessário */
export function somaMeses(iso: string, meses: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return iso;
  const ano = Number(m[1]);
  const mes = Number(m[2]) - 1;
  const dia = Number(m[3]);
  const ultimoDia = new Date(ano, mes + meses + 1, 0).getDate();
  const d = new Date(ano, mes + meses, Math.min(dia, ultimoDia));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function paraBr(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function paraIso(br: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br ?? "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

/** marca gravada na observação das parcelas de crédito */
const MARCA_COMPRA = /\s*\[compra (\d{2}\/\d{2}\/\d{4})\]/i;

/** marca da baixa de pagamento */
const MARCA_PAGO = /\s*\[pago (\d{2}\/\d{2}\/\d{4})\]/i;

/** marcas de parcelamento do abastecimento (gravadas na coluna POSTO) */
const MARCA_PARCELAS = /\s*\[parcelas (\d+)\]/i;
const MARCA_PRIMEIRA = /\s*\[primeira (\d{2}\/\d{2}\/\d{4})\]/i;

/** monta a marca "[compra dd/mm/aaaa]" */
export function marcaCompra(dataBr: string): string {
  return `[compra ${dataBr}]`;
}

/** monta a marca "[pago dd/mm/aaaa]" */
export function marcaPago(dataBr: string): string {
  return `[pago ${dataBr}]`;
}

/** acrescenta ou remove a marca de baixa na observação */
export function aplicaBaixa(descricao: string, dataBr: string | null): string {
  const limpa = (descricao ?? "").replace(MARCA_PAGO, "").trim();
  return dataBr ? `${limpa} ${marcaPago(dataBr)}`.trim() : limpa;
}

/** remove as marcas internas da descrição exibida */
export function limpaDescricao(descricao: string): string {
  return (descricao ?? "")
    .replace(MARCA_COMPRA, "")
    .replace(MARCA_PAGO, "")
    .replace(MARCA_PARCELAS, "")
    .replace(MARCA_PRIMEIRA, "")
    .trim();
}

/** total de parcelas do abastecimento lido da marca "[parcelas N]" (1 quando não houver) */
export function parcelasAbastecimento(posto: string): number {
  const m = MARCA_PARCELAS.exec(posto ?? "");
  return m ? Math.max(1, Number(m[1])) : 1;
}

/** vencimento da 1ª parcela em iso lido da marca "[primeira dd/mm/aaaa]" ("" quando não houver) */
export function primeiraParcelaIso(posto: string): string {
  const m = MARCA_PRIMEIRA.exec(posto ?? "");
  return m ? paraIso(m[1]!) : "";
}

/** data da baixa em dd/mm/aaaa ("" quando não houver) */
export function dataPago(descricao: string): string {
  const m = MARCA_PAGO.exec(descricao ?? "");
  return m ? m[1]! : "";
}

/** data da compra em iso lida da marca; sem marca, usa a própria data da linha */
export function isoCompra(descricao: string, isoLinha: string): string {
  const m = MARCA_COMPRA.exec(descricao ?? "");
  return m ? paraIso(m[1]!) || isoLinha : isoLinha;
}

/** marca de parcela "(2/6)" na observação */
const MARCA_PARCELA = /\s*\((\d+)\s*\/\s*(\d+)\)/;

/** lê "(2/6)" na observação e devolve o número da parcela (1 quando não houver) */
export function numeroParcela(descricao: string): number {
  const m = MARCA_PARCELA.exec(descricao ?? "");
  return m ? Number(m[1]) : 1;
}

/** lê "(2/6)" na observação e devolve o total de parcelas (1 quando não houver) */
export function totalParcelas(descricao: string): number {
  const m = MARCA_PARCELA.exec(descricao ?? "");
  return m ? Number(m[2]) : 1;
}

/** remove a marca "(n/total)" do texto exibido */
export function semMarcaParcela(descricao: string): string {
  return (descricao ?? "").replace(MARCA_PARCELA, "").trim();
}



function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizaForma(valor: string): Forma {
  const t = semAcento(valor ?? "");
  if (!t) return "Outros";
  if (t.includes("pix")) return "Pix";
  if (t.includes("credito")) return "Crédito";
  if (t.includes("debito")) return "Débito";
  if (t.includes("dinheiro") || t.includes("a vista") || t.includes("avista")) return "Dinheiro";
  return "Outros";
}

export function montaPagamentos(
  despesas: Despesa[],
  abastecimentos: Abastecimento[],
): Pagamento[] {
  const lista: Pagamento[] = [
    ...despesas.map((d) => {
      const iso = isoCompra(d.descricao, d.iso);
      const forma = normalizaForma(d.pagamento);
      const baixa = dataPago(d.descricao);
      return {
        id: `despesa-${d.row}`,
        row: d.row,
        origem: "Despesa" as const,
        data: paraBr(iso),
        iso,
        isoPagamento: d.iso,
        dataPagamento: d.data,
        descricao: [d.categoria, limpaDescricao(d.descricao)].filter(Boolean).join(" · "),
        categoria: d.categoria,
        forma,
        valor: d.valor,
        pago: forma !== "Crédito" || baixa !== "",
        dataPago: baixa,
      };
    }),
    ...abastecimentos.flatMap((a) => {
      const forma = normalizaForma(a.pagamento);
      const baixa = a.dataPago ?? "";
      const n = forma === "Crédito" ? Math.max(1, a.parcelas || 1) : 1;
      const primeira = forma === "Crédito" ? (a.primeiraParcela ?? "") : "";
      const base = n > 1 ? Math.floor((a.valorPago / n) * 100) / 100 : a.valorPago;
      const resto = n > 1 ? Math.round((a.valorPago - base * n) * 100) / 100 : 0;
      const postoLimpo = limpaDescricao(a.posto);
      const descBase = postoLimpo ? `Abastecimento · ${postoLimpo}` : "Abastecimento";
      return Array.from({ length: n }, (_, i) => {
        const valor = i === 0 ? Math.round((base + resto) * 100) / 100 : base;
        const isoPag = primeira ? somaMeses(primeira, i) : a.iso;
        return {
          id: n > 1 ? `abastecimento-${a.row}-${i + 1}` : `abastecimento-${a.row}`,
          row: a.row,
          origem: "Abastecimento" as const,
          data: a.data,
          iso: a.iso,
          isoPagamento: isoPag,
          dataPagamento: paraBr(isoPag),
          descricao: n > 1 ? `${descBase} (${i + 1}/${n})` : descBase,
          categoria: "Abastecimento",
          forma,
          valor,
          // a baixa do abastecimento é única: quita todas as parcelas de uma vez
          pago: forma !== "Crédito" || baixa !== "",
          dataPago: baixa,
        };
      });
    }),
  ];
  return lista.sort((a, b) => b.isoPagamento.localeCompare(a.isoPagamento));
}



export function totaisPorForma(pagamentos: Pagamento[]) {
  return FORMAS.map((forma) => {
    const itens = pagamentos.filter((p) => p.forma === forma);
    return {
      forma,
      total: itens.reduce((s, p) => s + p.valor, 0),
      quantidade: itens.length,
    };
  });
}

/** total de crédito que vence em cada mês (aaaa-mm), do mais antigo ao mais novo */
export function faturaPorMes(pagamentos: Pagamento[]) {
  const mapa = new Map<string, number>();
  for (const p of pagamentos) {
    if (p.forma !== "Crédito" || !p.isoPagamento) continue;
    const mes = p.isoPagamento.slice(0, 7);
    mapa.set(mes, (mapa.get(mes) ?? 0) + p.valor);
  }
  return Array.from(mapa.entries())
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

/** contas de crédito ainda sem baixa (inclui as vencidas), das mais antigas para as mais novas */
export function parcelasEmAberto(pagamentos: Pagamento[]) {
  return pagamentos
    .filter((p) => p.forma === "Crédito" && !p.pago)
    .sort((a, b) => a.isoPagamento.localeCompare(b.isoPagamento));
}

/** contas de crédito já baixadas, das mais recentes para as mais antigas */
export function parcelasPagas(pagamentos: Pagamento[]) {
  return pagamentos
    .filter((p) => p.forma === "Crédito" && p.pago)
    .sort((a, b) => b.isoPagamento.localeCompare(a.isoPagamento));
}



export function rotuloMes(mes: string) {
  const [ano, m] = mes.split("-");
  const nomes = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  return `${nomes[Number(m) - 1] ?? m}/${ano}`;
}
