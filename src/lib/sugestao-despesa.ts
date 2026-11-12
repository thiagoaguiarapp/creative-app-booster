import { z } from "zod";

function normalizaTexto(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export const SITUACOES_VEICULO = [
  "Funcionando normal",
  "Barulho ou falha",
  "Parado / quebrado",
  "Revisão preventiva",
] as const;

export const pedidoSugestaoSchema = z.object({
  tipoGasto: z.string().trim().min(2, "Conte qual foi o gasto.").max(120),
  valor: z.number().positive("Informe o valor.").max(100000),
  situacao: z.enum(SITUACOES_VEICULO),
  categoriasExistentes: z.array(z.string().max(60)).max(80).default([]),
});
export type PedidoSugestao = z.infer<typeof pedidoSugestaoSchema>;

export type SugestaoDespesa = { categoria: string; descricao: string };

const limpa = (s: unknown, max: number) =>
  String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Ajusta a resposta do modelo: reaproveita a categoria já cadastrada (sem diferenciar acento/maiúscula). */
export function normalizarSugestao(bruta: { categoria?: unknown; descricao?: unknown }, existentes: string[]): SugestaoDespesa {
  const cat = limpa(bruta.categoria, 40).toUpperCase();
  const igual = existentes.find((e) => normalizaTexto(e) === normalizaTexto(cat));
  const descricao = limpa(bruta.descricao, 120);
  if (!cat) throw new Error("Não foi possível sugerir uma categoria. Preencha manualmente.");
  return { categoria: igual ?? cat, descricao };
}
