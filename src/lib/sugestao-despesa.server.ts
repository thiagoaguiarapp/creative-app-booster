import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai/run-id.server";
import { normalizarSugestao, type PedidoSugestao, type SugestaoDespesa } from "./sugestao-despesa";

const MODELO = "openai/gpt-6-astra";

const respostaSchema = z.object({ categoria: z.string(), descricao: z.string() });

export async function sugerirDespesa(pedido: PedidoSugestao): Promise<SugestaoDespesa> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Assistente indisponível no momento.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const existentes = pedido.categoriasExistentes.slice(0, 80);
  const result = streamText({
    model: provider.responses(MODELO),
    maxRetries: 0,
    system:
      "Você organiza lançamentos de despesas de entregadores e motoristas de aplicativo no Brasil. " +
      "Responda em português do Brasil. Sugira UMA categoria curta (1 a 3 palavras, em MAIÚSCULAS) e uma descrição clara de até 80 caracteres. " +
      "Se alguma categoria já usada pelo usuário servir, use exatamente esse nome. " +
      "Peças, serviços e revisões da moto/carro (óleo, pneu, freio, corrente, relação, mecânico) devem usar categoria de manutenção como TROCA DE OLEO, PNEU MOTO, FREIO ou MANUTENÇÃO. " +
      "Não invente valores, marcas ou detalhes que o usuário não informou.",
    prompt:
      `Tipo de gasto informado: ${pedido.tipoGasto}\n` +
      `Valor: R$ ${pedido.valor.toFixed(2).replace(".", ",")}\n` +
      `Situação do veículo: ${pedido.situacao}\n` +
      `Categorias já usadas: ${existentes.length ? existentes.join(", ") : "nenhuma"}`,
    output: Output.object({ schema: respostaSchema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    const out = await result.output;
    return normalizarSugestao(out, existentes);
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new Error("Não foi possível sugerir agora. Preencha manualmente.");
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 402) throw new Error("Os créditos de IA acabaram. Tente mais tarde.");
    if (status === 429) throw new Error("Muitos pedidos agora. Aguarde um instante e tente de novo.");
    if (status === 403) throw new Error("O assistente não está disponível no momento.");
    throw e instanceof Error ? e : new Error("Falha ao sugerir.");
  }
}
