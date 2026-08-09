import { createServerFn } from "@tanstack/react-start";

export const getMetaSemanalFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    const { exigirUsuario } = await import("./auth.server");
    const usuario = await exigirUsuario();
    return usuario.metaSemanal;
  },
);

export const salvarMetaSemanalFn = createServerFn({ method: "POST" })
  .inputValidator((input: { valor: number }) => input)
  .handler(async ({ data }): Promise<number> => {
    const { salvarMetaSemanal } = await import("./auth.server");
    const valor = Math.max(0, Number(data.valor) || 0);
    return salvarMetaSemanal(valor);
  });
