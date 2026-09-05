import { createServerFn } from "@tanstack/react-start";

export type ConfigCartao = { limiteCartao: number; vencimentoCartao: number };

export const getCartaoFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ConfigCartao> => {
    const { exigirUsuario } = await import("./auth.server");
    const usuario = await exigirUsuario();
    return {
      limiteCartao: usuario.limiteCartao,
      vencimentoCartao: usuario.vencimentoCartao,
    };
  },
);

export const salvarCartaoFn = createServerFn({ method: "POST" })
  .inputValidator((input: ConfigCartao) => input)
  .handler(async ({ data }): Promise<ConfigCartao> => {
    const { salvarCartao } = await import("./auth.server");
    return salvarCartao(data.limiteCartao, data.vencimentoCartao);
  });
