import { createServerFn } from "@tanstack/react-start";

import type { Tipo } from "./entry-schema";
import type { PainelData } from "./sheets-types";

export const getPainelData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PainelData> => {
    const { exigirUsuario } = await import("./auth.server");
    const { loadPainelData } = await import("./painel.server");
    const usuario = await exigirUsuario();
    return loadPainelData(usuario.id);
  },
);

export const salvarLancamentoFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { tipo: Tipo; valores: Record<string, string>; row?: number }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { exigirUsuario } = await import("./auth.server");
    const { salvarLancamento } = await import("./painel-write.server");
    const { invalidarPainelCache } = await import("./painel.server");
    const usuario = await exigirUsuario();
    await salvarLancamento(data.tipo, data.valores, usuario.id, data.row);
    invalidarPainelCache(usuario.id);
    return { ok: true };
  });

export const excluirLancamentoFn = createServerFn({ method: "POST" })
  .inputValidator((input: { tipo: Tipo; row: number }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { exigirUsuario } = await import("./auth.server");
    const { excluirLancamento } = await import("./painel-write.server");
    const { invalidarPainelCache } = await import("./painel.server");
    const usuario = await exigirUsuario();
    await excluirLancamento(data.tipo, data.row, usuario.id);
    invalidarPainelCache(usuario.id);
    return { ok: true };
  });
