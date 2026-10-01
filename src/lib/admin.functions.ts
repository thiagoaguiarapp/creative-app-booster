import { createServerFn } from "@tanstack/react-start";

import type { CategoriasPadrao, ResumoAdmin } from "./admin.server";

export const resumoAdminFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ResumoAdmin> => {
    const { resumoAdmin } = await import("./admin.server");
    return resumoAdmin();
  },
);

export const salvarCategoriasFn = createServerFn({ method: "POST" })
  .inputValidator((input: { categorias: unknown }) => input)
  .handler(async ({ data }): Promise<CategoriasPadrao> => {
    const { salvarCategorias } = await import("./admin.server");
    return salvarCategorias(data.categorias);
  });

export const categoriasPadraoFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoriasPadrao> => {
    const { lerCategorias } = await import("./admin.server");
    return lerCategorias();
  },
);

export const acaoUsuarioFn = createServerFn({ method: "POST" })
  .inputValidator((input: { userId: string; acao: import("./admin.server").AcaoUsuario }) => {
    const acoes = ["premium", "removerPremium", "bloquear", "desbloquear", "recuperarSenha"];
    if (typeof input?.userId !== "string" || !acoes.includes(input.acao)) throw new Error("Dados inválidos.");
    return input;
  })
  .handler(async ({ data }) => {
    const { acaoUsuario } = await import("./admin.server");
    await acaoUsuario(data.userId, data.acao);
    return { ok: true };
  });
