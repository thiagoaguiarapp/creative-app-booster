import { createServerFn } from "@tanstack/react-start";

import type { Meta } from "./metas.server";

export const getMetaSemanalFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Meta | null> => {
    const { exigirUsuario } = await import("./auth.server");
    const { buscarMeta } = await import("./metas.server");
    const usuario = await exigirUsuario();
    return buscarMeta(usuario.id, "semanal");
  },
);

export const salvarMetaSemanalFn = createServerFn({ method: "POST" })
  .inputValidator((input: { valor: number }) => input)
  .handler(async ({ data }): Promise<Meta> => {
    const { exigirUsuario } = await import("./auth.server");
    const { salvarMeta } = await import("./metas.server");
    const usuario = await exigirUsuario();
    const valor = Math.max(0, Number(data.valor) || 0);
    return salvarMeta(usuario.id, "semanal", valor);
  });
