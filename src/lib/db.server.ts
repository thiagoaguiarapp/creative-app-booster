/** Acesso ao banco (Supabase / PostgREST) usando a chave de serviço no servidor. */

function base(): string {
  const url = process.env["MOTOCA_SUPABASE_URL"];
  if (!url) throw new Error("Conexão com o banco não configurada (URL ausente).");
  return `${url.replace(/\/$/, "")}/rest/v1`;
}

function headers(extra?: Record<string, string>): Record<string, string> {
  const key = process.env["MOTOCA_SUPABASE_SERVICE_ROLE_KEY"];
  if (!key) throw new Error("Conexão com o banco não configurada (chave ausente).");
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
  const colunas = await colunasDe(tabela);
  if (!colunas.includes(COLUNA_USUARIO)) return "";
  return `&${COLUNA_USUARIO}=eq.${encodeURIComponent(userId)}`;
}

export async function selectAll(tabela: string, userId?: string): Promise<Linha[]> {
  const paginas: Linha[] = [];
  const tamanho = 1000;
  const dono = await filtroDono(tabela, userId);
  for (let inicio = 0; ; inicio += tamanho) {
    const res = await fetch(
      `${base()}/${encodeURIComponent(tabela)}?select=*&order=ID.asc${dono}`,
      { headers: headers({ Range: `${inicio}-${inicio + tamanho - 1}` }) },
    );
    const lote = (await ok(res, "ler")) as Linha[] | null;
    if (!lote || lote.length === 0) break;
    paginas.push(...lote);
    if (lote.length < tamanho) break;
  }
  return paginas;
}


/** Colunas realmente existentes em cada tabela (lidas do schema do banco). */
let colunasCache: Record<string, string[]> | null = null;

export async function colunasDe(tabela: string): Promise<string[]> {
  if (!colunasCache) {
    const res = await fetch(`${base()}/`, {
      headers: headers({ Accept: "application/openapi+json" }),
    });
    const spec = (await ok(res, "ler schema")) as {
      definitions?: Record<string, { properties?: Record<string, unknown> }>;
    };
    const mapa: Record<string, string[]> = {};
    for (const [nome, def] of Object.entries(spec.definitions ?? {})) {
      mapa[nome] = Object.keys(def.properties ?? {});
    }
    colunasCache = mapa;
  }
  return colunasCache[tabela] ?? [];
}

/** Normaliza nome de coluna: sem acentos, sem espaços extras, maiúsculas. */
function chaveNormalizada(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Remove campos que não existem na tabela e ajusta o nome da coluna quando ela
 * existe com outra grafia (maiúsculas/minúsculas ou acentos).
 */
async function filtrar(tabela: string, dados: Linha): Promise<Linha> {
  const colunas = await colunasDe(tabela);
  if (colunas.length === 0) return dados;
  const porNome = new Map(colunas.map((c) => [chaveNormalizada(c), c]));
  const saida: Linha = {};
  for (const [k, v] of Object.entries(dados)) {
    const real = colunas.includes(k) ? k : porNome.get(chaveNormalizada(k));
    if (real) saida[real] = v;
  }
  return saida;
}

async function proximoId(tabela: string): Promise<number> {
  // A coluna ID pode ser texto e conter valores não numéricos; pegamos o maior número existente.
  const res = await fetch(
    `${base()}/${encodeURIComponent(tabela)}?select=ID`,
    { headers: headers() },
  );
  const linhas = (await ok(res, "ler")) as { ID?: unknown }[] | null;
  let maior = 0;
  for (const l of linhas ?? []) {
    const n = Number(String(l?.ID ?? "").trim());
    if (Number.isFinite(n) && n > maior) maior = n;
  }
  return maior + 1;
}

export async function inserir(tabela: string, dados: Linha, userId?: string): Promise<void> {
  const corpo = await filtrar(tabela, {
    ...dados,
    ...(userId ? { [COLUNA_USUARIO]: userId } : {}),
    ID: await proximoId(tabela),
  });
  const res = await fetch(`${base()}/${encodeURIComponent(tabela)}`, {
    method: "POST",
    headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify(corpo),
  });
  await ok(res, "gravar");
}

export async function atualizar(
  tabela: string,
  id: string,
  dados: Linha,
  userId?: string,
): Promise<void> {
  const corpo = await filtrar(tabela, dados);
  if (Object.keys(corpo).length === 0) return;
  const res = await fetch(
    `${base()}/${encodeURIComponent(tabela)}?ID=eq.${encodeURIComponent(id)}${await filtroDono(tabela, userId)}`,
    {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(corpo),
    },
  );
  await ok(res, "atualizar");
}

export async function remover(tabela: string, id: string, userId?: string): Promise<void> {
  const res = await fetch(
    `${base()}/${encodeURIComponent(tabela)}?ID=eq.${encodeURIComponent(id)}${await filtroDono(tabela, userId)}`,
    {
      method: "DELETE",
      headers: headers({ Prefer: "return=minimal" }),
    },
  );
  await ok(res, "excluir");
}


/* ---------- conversões ---------- */

/** "R$ 1.234,56" | "1.234,56" | 1234.56 | "" -> number */
export function num(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (raw == null) return 0;
  const cleaned = String(raw)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function txt(raw: unknown): string {
  return raw == null ? "" : String(raw).trim();
}

/** aceita "dd/mm/aaaa" ou "aaaa-mm-dd" e devolve "aaaa-mm-dd" */
export function isoDate(raw: unknown): string {
  const valor = txt(raw);
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(valor);
  if (br) {
    const ano = br[3]!.length === 2 ? `20${br[3]}` : br[3]!;
    return `${ano}-${br[2]!.padStart(2, "0")}-${br[1]!.padStart(2, "0")}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : "";
}

/** qualquer data -> "dd/mm/aaaa" para exibição */
export function dataBr(raw: unknown): string {
  const iso = isoDate(raw);
  if (!iso) return txt(raw);
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
