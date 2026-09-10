export type Tipo = "ganho" | "abastecimento" | "despesa" | "repasse" | "manutencao";

export type Campo = {
  key: string;
  label: string;
  tipo: "text" | "date" | "number" | "money" | "select";
  obrigatorio?: boolean;
  /** lista de sugestões (menu suspenso) alimentada pelos dados da planilha */
  sugestoes?: "plataforma" | "forma" | "veiculo" | "servico" | "combustivel";
  /** opções fixas para tipo "select" */
  opcoes?: string[];
  /** só exibe o campo quando outro campo tem um dos valores listados */
  somenteSe?: { key: string; valores: string[] };
};

/** formas de recebimento sugeridas no formulário de repasse */
export const FORMAS_RECEBIMENTO = [
  "Dinheiro",
  "Pix",
  "Repasse do app",
  "Cartão da maquininha",
  "Gorjeta",
  "Sobra de troco",
];

/** formas de pagamento usadas em todas as telas */
export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Débito",
  "Pix",
  "Crédito à vista",
  "Crédito parcelado",
];

/** verdadeiro para "Crédito à vista" e "Crédito parcelado" */
export const ehCredito = (forma: string): boolean => /cr[eé]dito/i.test(forma ?? "");

/** bloco padrão de pagamento (mesmos campos e rótulos em todas as telas) */
export const camposPagamento = (opcoes?: { parcelamento?: boolean }): Campo[] => [
  {
    key: "pagamento",
    label: "Forma de pagamento",
    tipo: "select",
    opcoes: opcoes?.parcelamento === false
      ? FORMAS_PAGAMENTO.filter((f) => f !== "Crédito parcelado")
      : FORMAS_PAGAMENTO,
  },
  ...(opcoes?.parcelamento === false
    ? []
    : ([
        {
          key: "parcelas",
          label: "Número de parcelas",
          tipo: "number",
          somenteSe: { key: "pagamento", valores: ["Crédito parcelado"] },
        },
        {
          key: "dataPrimeiraParcela",
          label: "Data do pagamento (vencimento)",
          tipo: "date",
          somenteSe: { key: "pagamento", valores: ["Crédito à vista", "Crédito parcelado"] },
        },
      ] as Campo[])),
];

/** tipos de combustível do abastecimento */
export const COMBUSTIVEIS = [
  "Gasolina",
  "Gasolina aditivada",
  "Etanol",
  "GNV",
  "Diesel",
];


export const TITULOS: Record<Tipo, string> = {
  ganho: "lançamento de ganho",
  abastecimento: "abastecimento",
  despesa: "despesa",
  repasse: "repasse",
  manutencao: "manutenção",
};

export const CAMPOS: Record<Tipo, Campo[]> = {
  ganho: [
    { key: "data", label: "Data", tipo: "date", obrigatorio: true },
    { key: "plataforma", label: "Aplicativo", tipo: "text", obrigatorio: true, sugestoes: "plataforma" },
    { key: "corridas", label: "Rotas / corridas", tipo: "number" },
    { key: "faturamento", label: "Faturamento (R$)", tipo: "money", obrigatorio: true },
  ],
  abastecimento: [
    { key: "data", label: "Data", tipo: "date", obrigatorio: true },
    { key: "veiculo", label: "Veículo", tipo: "text", sugestoes: "veiculo" },
    { key: "combustivel", label: "Combustível utilizado", tipo: "select", opcoes: COMBUSTIVEIS, obrigatorio: true },
    { key: "posto", label: "Posto (opcional)", tipo: "text", sugestoes: "combustivel" },
    { key: "odometro", label: "Odômetro (km)", tipo: "number", obrigatorio: true },
    { key: "litros", label: "Litros", tipo: "number", obrigatorio: true },
    { key: "precoLitro", label: "Preço por litro (R$)", tipo: "money" },
    { key: "temDesconto", label: "Teve desconto?", tipo: "select", opcoes: ["Não", "Sim"] },
    {
      key: "descontoLitro",
      label: "Desconto por litro (R$)",
      tipo: "money",
      somenteSe: { key: "temDesconto", valores: ["Sim"] },
    },
    {
      key: "desconto",
      label: "Desconto total (R$)",
      tipo: "money",
      somenteSe: { key: "temDesconto", valores: ["Sim"] },
    },
    { key: "valorPago", label: "Valor pago (R$)", tipo: "money", obrigatorio: true },
    ...camposPagamento({ parcelamento: false }),
  ],

  despesa: [
    { key: "data", label: "Data", tipo: "date", obrigatorio: true },
    { key: "categoria", label: "Categoria", tipo: "text", obrigatorio: true },
    { key: "descricao", label: "Observação", tipo: "text" },
    { key: "valor", label: "Valor total (R$)", tipo: "money", obrigatorio: true },
    ...camposPagamento(),
  ],
  repasse: [

    { key: "data", label: "Data", tipo: "date", obrigatorio: true },
    { key: "aplicativo", label: "Aplicativo", tipo: "text", obrigatorio: true, sugestoes: "plataforma" },
    { key: "valor", label: "Valor recebido (R$)", tipo: "money", obrigatorio: true },
    { key: "forma", label: "Forma de recebimento", tipo: "select", opcoes: FORMAS_RECEBIMENTO },
  ],
  manutencao: [
    { key: "veiculo", label: "Veículo", tipo: "text", obrigatorio: true, sugestoes: "veiculo" },
    { key: "data", label: "Data do serviço", tipo: "date", obrigatorio: true },
    { key: "servico", label: "Serviço", tipo: "text", obrigatorio: true, sugestoes: "servico" },
    { key: "kmTroca", label: "Km da troca", tipo: "number", obrigatorio: true },
    { key: "validadeKm", label: "Validade (km)", tipo: "number", obrigatorio: true },
    { key: "valor", label: "Valor (R$)", tipo: "money" },
    ...camposPagamento(),
    { key: "observacao", label: "Observação", tipo: "text" },
  ],
};


/** "dd/mm/aaaa" -> "aaaa-mm-dd" para o input date */
export function paraInputDate(br: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(br.trim());
  if (!m) return "";
  const [, d, mo, y] = m;
  const ano = y!.length === 2 ? `20${y}` : y!;
  return `${ano}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
}
