import { createServerFn } from "@tanstack/react-start";

export type SessaoUsuario = {
  id: string;
  email: string;
  nome: string;
  telefone: string;
  metaSemanal: number;
  isPremium: boolean;
  isAdmin?: boolean;
  veiculos: {
    id: string;
    nome: string;
    placa: string;
    tipo: string;
    km: number;
    padrao: boolean;
  }[];
} | null;

export const salvarVeiculosFn = createServerFn({ method: "POST" })
  .inputValidator((input: { veiculos: unknown }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { salvarVeiculos } = await import("./auth.server");
    await salvarVeiculos(data.veiculos);
    return { ok: true };
  });

export const salvarPerfilFn = createServerFn({ method: "POST" })
  .inputValidator((input: { nome: string; telefone: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { salvarPerfil } = await import("./auth.server");
    const nome = data.nome.trim().slice(0, 80);
    if (nome.length < 2) throw new Error("Informe seu nome.");
    await salvarPerfil(nome, data.telefone.trim().slice(0, 20));
    return { ok: true };
  });

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

export const reenviarConfirmacaoFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; redirectTo: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { reenviarConfirmacao } = await import("./auth.server");
    await reenviarConfirmacao(data.email.trim(), data.redirectTo);
    return { ok: true };
  });

export const recuperarSenhaFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; redirectTo: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { recuperarSenha } = await import("./auth.server");
    await recuperarSenha(data.email.trim(), data.redirectTo);
    return { ok: true };
  });

export const redefinirSenhaFn = createServerFn({ method: "POST" })
  .inputValidator((input: { accessToken: string; senha: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { redefinirSenha } = await import("./auth.server");
    if (data.senha.length < 6) throw new Error("A senha precisa ter ao menos 6 caracteres.");
    await redefinirSenha(data.accessToken, data.senha);
    return { ok: true };
  });
