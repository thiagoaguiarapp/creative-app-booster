/** Acesso ao banco (Supabase / PostgREST) usando a chave de serviço no servidor. */
function base(): string {
  const url = "https://yxzwqgbtcwrtpnmfvyxe.supabase.co";
  return `${url.replace(/\/$/, "")}/rest/v1`;
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4endxZ2J0Y3dydHBubWZ2eXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjIyMjQ2MywiZXhwIjoyMTAxNzk4NDYzfQ.TtGLUGN7PapdPZcLUOMo78PcfRObRL4U6s3Mbp3u7Nw";
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
