export type Tipo = "ganho" | "abastecimento" | "despesa" | "repasse" | "manutencao";

export type Campo = {
  key: string;
  label: string;
  tipo: "text" | "date" | "number" | "money";
  obrigatorio?: boolean;
  /** lista de sugestões (menu suspenso) alimentada pelos dados da planilha */
  sugestoes?: "plataforma";
};

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
    { key: "recebido", label: "Valor recebido (R$)", tipo: "money" },
  ],
  abastecimento: [
    { key: "data", label: "Data", tipo: "date", obrigatorio: true },
    { key: "odometro", label: "Odômetro (km)", tipo: "number", obrigatorio: true },
    { key: "litros", label: "Litros", tipo: "number", obrigatorio: true },
    { key: "precoLitro", label: "Preço por litro (R$)", tipo: "money" },
    { key: "valorPago", label: "Valor pago (R$)", tipo: "money", obrigatorio: true },
    { key: "pagamento", label: "Forma de pagamento", tipo: "text" },
  ],
  despesa: [
    { key: "data", label: "Data", tipo: "date", obrigatorio: true },
    { key: "categoria", label: "Categoria", tipo: "text", obrigatorio: true },
    { key: "descricao", label: "Observação", tipo: "text" },
    { key: "valor", label: "Valor (R$)", tipo: "money", obrigatorio: true },
    { key: "pagamento", label: "Forma de pagamento", tipo: "text" },
  ],
  repasse: [
    { key: "data", label: "Data", tipo: "date", obrigatorio: true },
    { key: "aplicativo", label: "Aplicativo", tipo: "text", obrigatorio: true, sugestoes: "plataforma" },
    { key: "valor", label: "Valor recebido (R$)", tipo: "money", obrigatorio: true },
    { key: "forma", label: "Forma de recebimento", tipo: "text" },
  ],
  manutencao: [
    { key: "veiculo", label: "Veículo", tipo: "text", obrigatorio: true },
    { key: "data", label: "Data do serviço", tipo: "date", obrigatorio: true },
    { key: "servico", label: "Serviço", tipo: "text", obrigatorio: true },
    { key: "kmTroca", label: "Km da troca", tipo: "number", obrigatorio: true },
    { key: "validadeKm", label: "Validade (km)", tipo: "number", obrigatorio: true },
    { key: "valor", label: "Valor (R$)", tipo: "money" },
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
