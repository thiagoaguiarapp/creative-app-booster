const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_sheets/v4";

export const SPREADSHEET_ID = "1G8mVtwGYnsajLO-LgBRX1Jx-6d5mm1TmyQ8e3SRYHfY";

export async function batchGet(ranges: string[]): Promise<string[][][]> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Conexão com o Google Sheets não configurada.");
  }

  const qs = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
  const url = `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${qs}&valueRenderOption=FORMATTED_VALUE`;

  let res: Response | null = null;
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
      },
    });
    if (res.ok) break;
    // 429/5xx: espera crescente (0.6s, 1.2s, 2.4s) antes de tentar de novo.
    if (res.status === 429 || res.status >= 500) {
      if (tentativa === 3) break;
      const retryAfter = Number(res.headers.get("retry-after"));
      const espera = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : 600 * 2 ** tentativa;
      await new Promise((r) => setTimeout(r, Math.min(espera, 5000)));
      continue;
    }
    break;
  }

  if (!res || !res.ok) {
    const body = res ? await res.text() : "sem resposta";
    console.error(`Google Sheets request failed [${res?.status}]: ${body}`);
    if (res?.status === 429) {
      throw new Error(
        "O Google Sheets atingiu o limite de leituras por minuto. Aguarde alguns instantes e recarregue.",
      );
    }
    throw new Error(`Falha ao ler a planilha [${res?.status}]: ${body}`);
  }


  const json = (await res.json()) as {
    valueRanges?: { values?: string[][] }[];
  };
  return ranges.map((_, i) => json.valueRanges?.[i]?.values ?? []);
}

function auth() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Conexão com o Google Sheets não configurada.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

async function ok(res: Response) {
  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Sheets write failed [${res.status}]: ${body}`);
    throw new Error(`Falha ao gravar na planilha [${res.status}]: ${body}`);
  }
  return res.json();
}

/** Nome de aba entre aspas simples quando tem caracteres especiais. */
export function quoteSheet(name: string): string {
  return /^[A-Za-z0-9_]+$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`;
}

export async function appendRow(sheetName: string, values: string[]): Promise<void> {
  const range = `${quoteSheet(sheetName)}!A1`;
  await ok(
    await fetch(
      `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      { method: "POST", headers: auth(), body: JSON.stringify({ values: [values] }) },
    ),
  );
}

/** Atualiza apenas células específicas de uma linha (preserva fórmulas das demais). */
export async function updateCells(
  sheetName: string,
  row: number,
  cells: { col: number; value: string }[],
): Promise<void> {
  if (cells.length === 0) return;
  const data = cells.map((c) => ({
    range: `${quoteSheet(sheetName)}!${colLetter(c.col)}${row}`,
    values: [[c.value]],
  }));
  await ok(
    await fetch(`${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
    }),
  );
}

export function colLetter(index: number): string {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

let sheetIdCache: Record<string, number> | null = null;

async function sheetIds(): Promise<Record<string, number>> {
  if (sheetIdCache) return sheetIdCache;
  const res = await fetch(
    `${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`,
    { headers: auth() },
  );
  const json = (await ok(res)) as {
    sheets?: { properties?: { title?: string; sheetId?: number } }[];
  };
  const map: Record<string, number> = {};
  for (const s of json.sheets ?? []) {
    if (s.properties?.title != null && s.properties.sheetId != null) {
      map[s.properties.title] = s.properties.sheetId;
    }
  }
  sheetIdCache = map;
  return map;
}

export async function deleteRow(sheetName: string, row: number): Promise<void> {
  const ids = await sheetIds();
  const sheetId = ids[sheetName];
  if (sheetId == null) throw new Error(`Aba "${sheetName}" não encontrada na planilha.`);
  await ok(
    await fetch(`${GATEWAY_URL}/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: { sheetId, dimension: "ROWS", startIndex: row - 1, endIndex: row },
            },
          },
        ],
      }),
    }),
  );
}

/** "R$ 1.234,56" | "1.234,56" | "" -> number */
export function num(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function txt(raw: string | undefined): string {
  return (raw ?? "").trim();
}

/** dd/mm/yyyy -> sortable yyyy-mm-dd (empty when unparseable) */
export function isoDate(raw: string | undefined): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(txt(raw));
  if (!m) return "";
  const [, d, mo, y] = m;
  const year = y!.length === 2 ? `20${y}` : y!;
  return `${year}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
}

export function isEmptyRow(row: string[]): boolean {
  return !row.some((c) => txt(c) !== "");
}
