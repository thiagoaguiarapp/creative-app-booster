/** Acesso ao banco (Supabase / PostgREST) usando a chave de serviço no servidor. */

const SUPABASE_URL_PADRAO = "https://yxzwqgbtcwrtpnmfvyxe.supabase.co";
const SUPABASE_SERVICE_PADRAO =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4endxZ2J0Y3dydHBubWZ2eXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjIyMjA2MywiZXhwIjoyMTAxNzk4NDYzfQ.TtGLUGN7PapdPZcLUOMo78PcfRObRL4U6s3Mbp3u7Nw";

function base(): string {
  const url = process.env["MOTOCA_SUPABASE_URL"] ?? SUPABASE_URL_PADRAO;
  return `${url.replace(/\/$/, "")}/rest/v1`;
}

function chaveServico(): string {
  return process.env["MOTOCA_SUPABASE_SERVICE_ROLE_KEY"] ?? SUPABASE_SERVICE_PADRAO;
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const key = chaveServico();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function ok(res: Response, acao: string): Promise<unknown> {
  if (!res.ok) {
    const body = await res.text();
    console.error(`Supabase ${acao} falhou [${res.status}]: ${body}`);
    throw new Error(`Falha ao ${acao} no banco [${res.status}]: ${body}`);
  }
  const texto = await res.text();
  return texto ? JSON.parse(texto) : null;
}

export type Linha = Record<string, unknown>;
export const COLUNA_USUARIO = "USER_ID";

/* ------------------------------------------------------------------ */
/* Helpers de valor                                                    */
/* ------------------------------------------------------------------ */

/** Texto limpo de qualquer valor vindo do banco. */
export function txt(valor: unknown): string {
  return String(valor ?? "").trim();
}

/** Número a partir de formatos comuns ("1.234,56", "1234.56", number). */
export function num(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  let s = txt(valor);
  if (!s) return 0;
  s = s.replace(/[R$\s]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Data no formato brasileiro dd/mm/aaaa (aceita ISO ou dd/mm/aaaa). */
export function dataBr(valor: unknown): string {
  const s = txt(valor);
  if (!s) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s;
}

/** Data no formato ISO aaaa-mm-dd (aceita dd/mm/aaaa ou ISO). */
export function isoDate(valor: unknown): string {
  const s = txt(valor);
  if (!s) return "";
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (iso) return iso[1]!;
  return "";
}

/* ------------------------------------------------------------------ */
/* CRUD                                                                */
/* ------------------------------------------------------------------ */

/** Filtro PostgREST que restringe as linhas ao dono informado. */
function filtroDono(userId?: string): string {
  return userId ? `&${COLUNA_USUARIO}=eq.${encodeURIComponent(userId)}` : "";
}

/** Busca todas as linhas de uma tabela (filtro por dono quando aplicável). */
export async function selectAll<T = Linha>(tabela: string, userId?: string): Promise<T[]> {
  const url = `${base()}/${tabela}?select=*${filtroDono(userId)}`;
  const res = await fetch(url, { headers: headers() });
  const dados = (await ok(res, `buscar em ${tabela}`)) as T[] | null;
  return dados ?? [];
}

/** Próximo ID sequencial da tabela. */
async function proximoId(tabela: string): Promise<number> {
  const url = `${base()}/${tabela}?select=ID&order=ID.desc&limit=1`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return Date.now();
  const arr = (await res.json().catch(() => [])) as Linha[];
  const atual = Number(arr[0]?.["ID"] ?? 0);
  return (Number.isFinite(atual) ? atual : 0) + 1;
}

/** Insere uma linha, atribuindo ID sequencial e o dono quando informado. */
export async function inserir<T = Linha>(
  tabela: string,
  dados: Linha,
  userId?: string,
): Promise<T> {
  const payload: Linha = { ...dados };
  if (payload["ID"] === undefined || payload["ID"] === null || txt(payload["ID"]) === "") {
    payload["ID"] = await proximoId(tabela);
  }
  if (userId) payload[COLUNA_USUARIO] = userId;
  const res = await fetch(`${base()}/${tabela}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  const arr = (await ok(res, `criar em ${tabela}`)) as T[];
  return (arr[0] ?? payload) as T;
}

/** Atualiza uma linha pelo ID. */
export async function atualizar<T = Linha>(
  tabela: string,
  id: string,
  dados: Linha,
  userId?: string,
): Promise<T> {
  const res = await fetch(
    `${base()}/${tabela}?ID=eq.${encodeURIComponent(id)}${filtroDono(userId)}`,
    {
      method: "PATCH",
      headers: headers({ Prefer: "return=representation" }),
      body: JSON.stringify(dados),
    },
  );
  const arr = (await ok(res, `atualizar em ${tabela}`)) as T[];
  return (arr[0] ?? { ID: id, ...dados }) as T;
}

/** Remove uma linha pelo ID. */
export async function remover(tabela: string, id: string, userId?: string): Promise<void> {
  const res = await fetch(
    `${base()}/${tabela}?ID=eq.${encodeURIComponent(id)}${filtroDono(userId)}`,
    {
      method: "DELETE",
      headers: headers(),
    },
  );
  await ok(res, `deletar em ${tabela}`);
}

/* ------------------------------------------------------------------ */
/* Aliases legados (mantidos para compatibilidade)                     */
/* ------------------------------------------------------------------ */

export async function buscarBanco<T = Linha>(
  tabela: string,
  query?: string,
  userId?: string,
): Promise<T[]> {
  const url = `${base()}/${tabela}${query ? `?${query}` : "?select=*"}${filtroDono(userId)}`;
  const res = await fetch(url, { headers: headers() });
  const dados = (await ok(res, `buscar em ${tabela}`)) as T[] | null;
  return dados ?? [];
}

export async function criarBanco<T = Linha>(
  tabela: string,
  dados: Linha,
  userId?: string,
): Promise<T> {
  return inserir<T>(tabela, dados, userId);
}

export async function atualizarBanco<T = Linha>(
  tabela: string,
  id: string,
  dados: Linha,
  userId?: string,
): Promise<T> {
  return atualizar<T>(tabela, id, dados, userId);
}

export async function deletarBanco(
  tabela: string,
  id: string,
  userId?: string,
): Promise<void> {
  return remover(tabela, id, userId);
}
