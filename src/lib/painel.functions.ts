import { createServerFn } from "@tanstack/react-start";

import type { Tipo } from "./entry-schema";
import type { PainelData } from "./sheets-types";

export const getPainelData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PainelData> => {
    const { loadPainelData } = await import("./painel.server");
    return loadPainelData();
  },
);

export const salvarLancamentoFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { tipo: Tipo; valores: Record<string, string>; row?: number }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { salvarLancamento } = await import("./painel-write.server");
    const { invalidarPainelCache } = await import("./painel.server");
    await salvarLancamento(data.tipo, data.valores, data.row);
    invalidarPainelCache();
    return { ok: true };
  });

export const excluirLancamentoFn = createServerFn({ method: "POST" })
  .inputValidator((input: { tipo: Tipo; row: number }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { excluirLancamento } = await import("./painel-write.server");
    const { invalidarPainelCache } = await import("./painel.server");
    await excluirLancamento(data.tipo, data.row);
    invalidarPainelCache();
    return { ok: true };
  });
