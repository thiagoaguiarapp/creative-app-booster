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
