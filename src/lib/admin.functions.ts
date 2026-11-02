import { createServerFn } from "@tanstack/react-start";

import type { CategoriasPadrao } from "./admin.server";

export const categoriasPadraoFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoriasPadrao> => {
    const { lerCategorias } = await import("./admin.server");
    return lerCategorias();
  },
);

