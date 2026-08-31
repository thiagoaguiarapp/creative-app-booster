/** Funções administrativas (somente para usuários com role "admin"). */
import { exigirUsuario } from "./auth.server";

function baseUrl(): string {
  const u = process.env["MOTOCA_SUPABASE_URL"];
  if (!u) throw new Error("Conexão com o banco não configurada (URL ausente).");
  return u.replace(/\/$/, "");
}

function servico(): string {
  const k = process.env["MOTOCA_SUPABASE_SERVICE_ROLE_KEY"];
  if (!k) throw new Error("Conexão com o banco não configurada (chave ausente).");
  return k;
}

function cabecalhos(extra?: Record<string, string>): Record<string, string> {
  const k = servico();
  return {
    apikey: k,
    Authorization: `Bearer ${k}`,
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

export type UsuarioAdmin = {
  id: string;
  email: string;
  nome: string;
  criadoEm: string;
  ultimoAcesso: string;
  confirmado: boolean;
  premium: boolean;
  role: string;
};

export type ResumoAdmin = {
  usuarios: UsuarioAdmin[];
  totalUsuarios: number;
  totalLancamentos: number;
  porTabela: { nome: string; total: number }[];
  categorias: CategoriasPadrao;
};

/** Lê a role do usuário na tabela profiles. */
export async function roleDe(userId: string): Promise<string> {
  const res = await fetch(
    `${baseUrl()}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(userId)}`,
    { headers: cabecalhos() },
  );
  if (!res.ok) return "";
  const linhas = (await res.json().catch(() => [])) as { role?: unknown }[];
  return String(linhas[0]?.role ?? "").trim().toLowerCase();
}

export async function exigirAdmin(): Promise<{ id: string; email: string }> {
  const usuario = await exigirUsuario();
  const role = await roleDe(usuario.id);
  if (role !== "admin") throw new Error("Acesso restrito ao administrador.");
  return { id: usuario.id, email: usuario.email };
}

type UsuarioAuth = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

async function listarAuthUsers(): Promise<UsuarioAuth[]> {
  const todos: UsuarioAuth[] = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const res = await fetch(
      `${baseUrl()}/auth/v1/admin/users?page=${pagina}&per_page=200`,
      { headers: cabecalhos() },
    );
    if (!res.ok) break;
    const dados = (await res.json()) as { users?: UsuarioAuth[] };
    const lote = dados.users ?? [];
    todos.push(...lote);
    if (lote.length < 200) break;
  }
  return todos;
}

async function contar(tabela: string): Promise<number> {
  const res = await fetch(
    `${baseUrl()}/rest/v1/${encodeURIComponent(tabela)}?select=ID`,
    { headers: cabecalhos({ Prefer: "count=exact", Range: "0-0" }) },
  );
  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

const TABELAS_LANCAMENTO = [
  { nome: "Ganhos diários", tabela: "DIARIO" },
  { nome: "Abastecimentos", tabela: "CONTROLE COMBUSTIVEL" },
  { nome: "Despesas", tabela: "DESPESAS" },
  { nome: "Repasses", tabela: "REPASSE" },
  { nome: "Manutenções", tabela: "MANUTENCAO" },
];

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

export async function salvarCategorias(bruto: unknown): Promise<CategoriasPadrao> {
  const admin = await exigirAdmin();
  const categorias = normalizarCategorias(bruto);
  const meta = await metadataDe(admin.id);
  const res = await fetch(`${baseUrl()}/auth/v1/admin/users/${admin.id}`, {
    method: "PUT",
    headers: cabecalhos(),
    body: JSON.stringify({ user_metadata: { ...meta, categorias_padrao: categorias } }),
  });
  if (!res.ok) throw new Error("Não foi possível salvar as categorias.");
  return categorias;
}

export async function resumoAdmin(): Promise<ResumoAdmin> {
  await exigirAdmin();
  const [usuariosAuth, contagens, categorias] = await Promise.all([
    listarAuthUsers(),
    Promise.all(TABELAS_LANCAMENTO.map((t) => contar(t.tabela))),
    lerCategorias(),
  ]);

  const roles = new Map<string, string>();
  const resPerfis = await fetch(`${baseUrl()}/rest/v1/profiles?select=id,role`, {
    headers: cabecalhos(),
  });
  if (resPerfis.ok) {
    const linhas = (await resPerfis.json().catch(() => [])) as { id?: string; role?: string }[];
    for (const l of linhas) if (l.id) roles.set(l.id, String(l.role ?? "").toLowerCase());
  }

  const usuarios: UsuarioAdmin[] = usuariosAuth.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    nome: String((u.user_metadata ?? {})["nome"] ?? "").trim(),
    criadoEm: u.created_at ?? "",
    ultimoAcesso: u.last_sign_in_at ?? "",
    confirmado: Boolean(u.email_confirmed_at ?? u.confirmed_at),
    premium: (u.user_metadata ?? {})["is_premium"] === true,
    role: roles.get(u.id) || "user",
  }));
  usuarios.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  const porTabela = TABELAS_LANCAMENTO.map((t, i) => ({
    nome: t.nome,
    total: contagens[i] ?? 0,
  }));

  return {
    usuarios,
    totalUsuarios: usuarios.length,
    totalLancamentos: porTabela.reduce((s, t) => s + t.total, 0),
    porTabela,
    categorias,
  };
}

/* ------------------------- Relatórios globais ------------------------- */

export type TipoLancamento = "ganho" | "abastecimento" | "despesa" | "repasse" | "manutencao";

export type LancamentoAdmin = {
  id: string;
  tipo: TipoLancamento;
  iso: string;
  categoria: string;
  valor: number;
  usuarioId: string;
};

const ROTULO_TIPO: Record<TipoLancamento, string> = {
  ganho: "Faturamento",
  abastecimento: "Abastecimento",
  despesa: "Despesa",
  repasse: "Repasse",
  manutencao: "Manutenção",
};

export const TIPOS_LANCAMENTO = (
  Object.keys(ROTULO_TIPO) as TipoLancamento[]
).map((t) => ({ valor: t, rotulo: ROTULO_TIPO[t] }));

/** Todos os lançamentos do app (todos os usuários), já normalizados. */
export async function lancamentosGlobais(): Promise<LancamentoAdmin[]> {
  await exigirAdmin();
  const { selectAll, isoDate, num, txt } = await import("./db.server");

  const normalizar = (v: unknown) =>
    txt(v).replace(/\s+/g, " ").trim().toUpperCase();
  const pegar = (linha: Record<string, unknown>, ...nomes: string[]) => {
    for (const n of nomes) {
      const v = linha[n];
      if (v !== undefined && v !== null && txt(v) !== "") return v;
    }
    return undefined;
  };

  const [ganhos, comb, desp, rep, manut] = await Promise.all([
    selectAll("DIARIO"),
    selectAll("CONTROLE COMBUSTIVEL"),
    selectAll("DESPESAS"),
    selectAll("REPASSE"),
    selectAll("MANUTENCAO"),
  ]);

  const dono = (l: Record<string, unknown>) => txt(pegar(l, "USER_ID"));

  const itens: LancamentoAdmin[] = [
    ...ganhos.map((l) => ({
      id: `ganho-${txt(l["ID"])}`,
      tipo: "ganho" as const,
      iso: isoDate(pegar(l, "DATA", "Data")),
      categoria: normalizar(pegar(l, "APP", "APLICATIVO", "PLATAFORMA")) || "—",
      valor: num(pegar(l, "FATURAMENTO")),
      usuarioId: dono(l),
    })),
    ...comb.map((l) => ({
      id: `abast-${txt(l["ID"])}`,
      tipo: "abastecimento" as const,
      iso: isoDate(pegar(l, "Data", "DATA")),
      categoria: normalizar(pegar(l, "POSTO", "Posto")) || "COMBUSTÍVEL",
      valor: num(pegar(l, "VALOR PAGO", "VALOR")),
      usuarioId: dono(l),
    })),
    ...desp.map((l) => ({
      id: `desp-${txt(l["ID"])}`,
      tipo: "despesa" as const,
      iso: isoDate(pegar(l, "DATA", "Data")),
      categoria: normalizar(pegar(l, "TIPO DE GASTO", "CATEGORIA")) || "OUTROS",
      valor: num(pegar(l, "VALOR")),
      usuarioId: dono(l),
    })),
    ...rep.map((l) => ({
      id: `rep-${txt(l["ID"])}`,
      tipo: "repasse" as const,
      iso: isoDate(pegar(l, "DATA", "Data")),
      categoria: normalizar(pegar(l, "APLICATIVO", "APP")) || "—",
      valor: num(pegar(l, "VALOR RECEBIDO", "VALOR")),
      usuarioId: dono(l),
    })),
    ...manut.map((l) => ({
      id: `manut-${txt(l["ID"])}`,
      tipo: "manutencao" as const,
      iso: isoDate(pegar(l, "DATA MANUTENÇÃO", "DATA MANUTENCAO", "DATA")),
      categoria: normalizar(pegar(l, "SERVIÇO", "SERVICO")) || "—",
      valor: num(pegar(l, "VALOR GASTO", "VALOR")),
      usuarioId: dono(l),
    })),
  ].filter((i) => i.iso !== "");

  itens.sort((a, b) => b.iso.localeCompare(a.iso));
  return itens;
}
