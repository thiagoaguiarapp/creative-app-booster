/** Acesso ao banco (Supabase / PostgREST) usando a chave de serviço no servidor. */
function base(): string {
  const url = "https://yxzwqgbtcwrtpnmfvyxe.supabase.co";
  return `${url.replace(/\/$/, "")}/rest/v1`;
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4endxZ2J0Y3dydHBubWZ2eXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjIyMjA2MywiZXhwIjoyMTAxNzk4NDYzfQ.TtGLUGN7PapdPZcLUOMo78PcfRObRL4U6s3Mbp3u7Nw";
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

/** Filtro de dono: só aplicado quando a tabela tem a coluna USER_ID. */
async function filtroDono(tabela: string, userId?: string): Promise<string> {
  if (!userId) return "";
  return "";
}

export async function buscarBanco<T = Linha>(
  tabela: string,
  query?: string,
  userId?: string
): Promise<T[]> {
  const filtro = await filtroDono(tabela, userId);
  const q = [query, filtro].filter(Boolean).join("&");
  const url = `${base()}/${tabela}${q ? `?${q}` : ""}`;
  const res = await fetch(url, { headers: headers() });
  return (await ok(res, `buscar em ${tabela}`)) as T[];
}

export async function criarBanco<T = Linha>(
  tabela: string,
  dados: Linha,
  userId?: string
): Promise<T> {
  const payload = userId ? { ...dados, [COLUNA_USUARIO]: userId } : dados;
  const url = `${base()}/${tabela}`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });
  const arr = (await ok(res, `criar em ${tabela}`)) as T[];
  return arr[0];
}

export async function atualizarBanco<T = Linha>(
  tabela: string,
  id: string,
  dados: Linha,
  userId?: string
): Promise<T> {
  const filtro = await filtroDono(tabela, userId);
  const q = [`id=eq.${id}`, filtro].filter(Boolean).join("&");
  const url = `${base()}/${tabela}?${q}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(dados),
  });
  const arr = (await ok(res, `atualizar em ${tabela}`)) as T[];
  return arr[0];
}

export async function deletarBanco(
  tabela: string,
  id: string,
  userId?: string
): Promise<void> {
  const filtro = await filtroDono(tabela, userId);
  const q = [`id=eq.${id}`, filtro].filter(Boolean).join("&");
  const url = `${base()}/${tabela}?${q}`;
  const res = await fetch(url, { method: "DELETE", headers: headers() });
  await ok(res, `deletar em ${tabela}`);
}
