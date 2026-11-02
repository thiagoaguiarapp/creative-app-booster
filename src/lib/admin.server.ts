/** Funções administrativas (somente para usuários com role "admin"). */

function baseUrl(): string {
  const u = process.env["MOTOCA_SUPABASE_URL"];
  if (!u) throw new Error("Serviço administrativo não configurado.");
  return u.replace(/\/$/, "");
}

function servico(): string {
  const k = process.env["MOTOCA_SUPABASE_SERVICE_ROLE_KEY"];
  if (!k) throw new Error("Serviço administrativo não configurado.");
  return k;
}

function cabecalhos(extra?: Record<string, string>): Record<string, string> {
  const k = servico();
  return {
    apikey: k,
    ...(k.startsWith("sb_") ? {} : { Authorization: `Bearer ${k}` }),
    "Content-Type": "application/json",
    ...extra,
  };
}

export type CategoriasPadrao = {
  plataformas: string[];
  combustiveis: string[];
  servicos: string[];
};

export const CATEGORIAS_VAZIAS: CategoriasPadrao = {
  plataformas: [],
  combustiveis: [],
  servicos: [],
};

/** Lê a role do usuário na tabela profiles. */
export async function roleDe(userId: string): Promise<string> {
  const res = await fetch(
    `${baseUrl()}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userId)}`,
    { headers: cabecalhos() },
  );
  if (!res.ok) throw new Error("Não foi possível verificar as permissões.");
  const linhas = (await res.json()) as { role?: unknown }[];
  if (!Array.isArray(linhas)) throw new Error("Resposta de permissões inválida.");
  return String(linhas[0]?.role ?? "").trim().toLowerCase();
}

type UsuarioAuth = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
  banned_until?: string | null;
};

/** Categorias padrão ficam guardadas no perfil do administrador. */
async function idDoAdmin(): Promise<string | null> {
  const res = await fetch(
    `${baseUrl()}/rest/v1/profiles?select=id&role=eq.admin&order=created_at.asc&limit=1`,
    { headers: cabecalhos() },
  );
  if (!res.ok) return null;
  const linhas = (await res.json().catch(() => [])) as { id?: string }[];
  return linhas[0]?.id ?? null;
}

function normalizarLista(bruto: unknown): string[] {
  if (!Array.isArray(bruto)) return [];
  const vistos = new Set<string>();
  for (const item of bruto) {
    const v = String(item ?? "").replace(/\s+/g, " ").trim().toUpperCase().slice(0, 40);
    if (v) vistos.add(v);
  }
  return Array.from(vistos).sort((a, b) => a.localeCompare(b, "pt-BR")).slice(0, 60);
}

export function normalizarCategorias(bruto: unknown): CategoriasPadrao {
  const o = (bruto ?? {}) as Record<string, unknown>;
  return {
    plataformas: normalizarLista(o["plataformas"]),
    combustiveis: normalizarLista(o["combustiveis"]),
    servicos: normalizarLista(o["servicos"]),
  };
}

async function metadataDe(userId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${baseUrl()}/auth/v1/admin/users/${userId}`, {
    headers: cabecalhos(),
  });
  if (!res.ok) return {};
  const dados = (await res.json()) as UsuarioAuth;
  return dados.user_metadata ?? {};
}

/** Lista de categorias padrão visível para todos os usuários do app. */
export async function lerCategorias(): Promise<CategoriasPadrao> {
  const admin = await idDoAdmin();
  if (!admin) return CATEGORIAS_VAZIAS;
  const meta = await metadataDe(admin);
  return normalizarCategorias(meta["categorias_padrao"]);
}

