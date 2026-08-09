import { createServerFn } from "@tanstack/react-start";

export type SessaoUsuario = { id: string; email: string } | null;

export const sessaoFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessaoUsuario> => {
    const { usuarioAtual } = await import("./auth.server");
    return usuarioAtual();
  },
);

export const entrarFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; senha: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { entrar } = await import("./auth.server");
    await entrar(data.email.trim(), data.senha);
    return { ok: true };
  });

export const cadastrarFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; senha: string }) => input)
  .handler(async ({ data }): Promise<{ logado: boolean }> => {
    const { cadastrar } = await import("./auth.server");
    const usuario = await cadastrar(data.email.trim(), data.senha);
    return { logado: usuario !== null };
  });

export const sairFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: true }> => {
    const { limparSessao } = await import("./auth.server");
    limparSessao();
    return { ok: true };
  },
);
