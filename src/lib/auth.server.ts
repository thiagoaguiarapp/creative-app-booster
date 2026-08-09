/** Autenticação via Supabase Auth (REST), com sessão em cookies httpOnly. */
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

const ACCESS = "motoca_at";
const REFRESH = "motoca_rt";

function url(): string {
  const u = process.env["MOTOCA_SUPABASE_URL"];
  if (!u) throw new Error("Conexão com o banco não configurada (URL ausente).");
  return `${u.replace(/\/$/, "")}/auth/v1`;
}

function anon(): string {
  const k = process.env["MOTOCA_SUPABASE_ANON_KEY"];
  if (!k) throw new Error("Conexão com o banco não configurada (chave ausente).");
  return k;
}

export type Usuario = {
  id: string;
  email: string;
  nome: string;
  telefone: string;
  metaSemanal: number;
  isPremium: boolean;
};

type Tokens = { access_token?: string; refresh_token?: string };

const opcoesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: true,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function gravarSessao(t: Tokens) {
  if (t.access_token) setCookie(ACCESS, t.access_token, opcoesCookie);
  if (t.refresh_token) setCookie(REFRESH, t.refresh_token, opcoesCookie);
}

export function limparSessao() {
  deleteCookie(ACCESS, { path: "/" });
  deleteCookie(REFRESH, { path: "/" });
}

async function chamar(rota: string, corpo: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${url()}${rota}`, {
    method: "POST",
    headers: { apikey: anon(), "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = String(dados["msg"] ?? dados["error_description"] ?? dados["message"] ?? "");
    throw new Error(traduzir(msg, res.status));
  }
  return dados;
}

function traduzir(msg: string, status: number): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Já existe uma conta com esse e-mail.";
  if (m.includes("password") && m.includes("6")) return "A senha precisa ter ao menos 6 caracteres.";
  if (m.includes("email") && m.includes("invalid")) return "E-mail inválido.";
  if (m.includes("confirm")) return "Confirme seu e-mail antes de entrar.";
  return msg || `Falha na autenticação (${status}).`;
}

function extrairUsuario(dados: Record<string, unknown>): Usuario | null {
  const u = (dados["user"] ?? dados) as Record<string, unknown> | null;
  if (!u || typeof u["id"] !== "string") return null;
  const meta = (u["user_metadata"] ?? {}) as Record<string, unknown>;
  return {
    id: u["id"],
    email: String(u["email"] ?? ""),
    nome: String(meta["nome"] ?? "").trim(),
    telefone: String(meta["telefone"] ?? "").trim(),
    metaSemanal: metaSemanalDe(u),
    isPremium: meta["is_premium"] === true,
  };
}

/** Lê a meta semanal armazenada no user_metadata. */
export function metaSemanalDe(dados: Record<string, unknown>): number {
  const meta = (dados["user_metadata"] ?? {}) as Record<string, unknown>;
  const valor = Number(meta["metaSemanal"] ?? 0);
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

/** Atualiza o user_metadata preservando os campos existentes do perfil. */
async function atualizarMetadata(mudancas: Record<string, unknown>): Promise<Usuario> {
  const atual = await exigirUsuario();
  const token = getCookie(ACCESS);
  if (!token) throw new Error("Sessão expirada. Entre novamente para continuar.");
  const res = await fetch(`${url()}/user`, {
    method: "PUT",
    headers: {
      apikey: anon(),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        nome: atual.nome,
        telefone: atual.telefone,
        metaSemanal: atual.metaSemanal,
        is_premium: atual.isPremium,
        ...mudancas,
      },
    }),
  });
  const dados = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(traduzir(String(dados["msg"] ?? dados["message"] ?? ""), res.status));
  const salvo = extrairUsuario(dados);
  if (!salvo) throw new Error("Não foi possível salvar as informações do perfil.");
  return salvo;
}

/** Salva nome e telefone no perfil do usuário logado. */
export async function salvarPerfil(nome: string, telefone: string): Promise<Usuario> {
  return atualizarMetadata({ nome, telefone });
}

/** Salva/atualiza a meta semanal preservando o restante do perfil. */
export async function salvarMetaSemanal(valor: number): Promise<number> {
  const salvo = await atualizarMetadata({ metaSemanal: valor });
  return salvo.metaSemanal;
}

/** Ativa ou cancela o plano Premium (sem anúncios). */
export async function definirPremium(ativo: boolean): Promise<boolean> {
  const salvo = await atualizarMetadata({ is_premium: ativo });
  return salvo.isPremium;
}

export async function entrar(email: string, senha: string): Promise<Usuario> {
  const dados = await chamar("/token?grant_type=password", { email, password: senha });
  gravarSessao(dados as Tokens);
  const usuario = extrairUsuario(dados);
  if (!usuario) throw new Error("Não foi possível iniciar a sessão.");
  return usuario;
}

export async function cadastrar(email: string, senha: string): Promise<Usuario | null> {
  const dados = await chamar("/signup", { email, password: senha });
  if ((dados as Tokens).access_token) {
    gravarSessao(dados as Tokens);
    return extrairUsuario(dados);
  }
  // Confirmação de e-mail ativa no projeto: ainda não há sessão.
  return null;
}

async function usuarioPorToken(token: string): Promise<Usuario | null> {
  const res = await fetch(`${url()}/user`, {
    headers: { apikey: anon(), Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return extrairUsuario((await res.json()) as Record<string, unknown>);
}

/** Usuário da requisição atual, renovando o token quando necessário. */
export async function usuarioAtual(): Promise<Usuario | null> {
  const access = getCookie(ACCESS);
  if (access) {
    const u = await usuarioPorToken(access);
    if (u) return u;
  }
  const refresh = getCookie(REFRESH);
  if (!refresh) return null;
  try {
    const dados = await chamar("/token?grant_type=refresh_token", { refresh_token: refresh });
    gravarSessao(dados as Tokens);
    return extrairUsuario(dados);
  } catch {
    limparSessao();
    return null;
  }
}

export async function exigirUsuario(): Promise<Usuario> {
  const u = await usuarioAtual();
  if (!u) throw new Error("Sessão expirada. Entre novamente para continuar.");
  return u;
}
