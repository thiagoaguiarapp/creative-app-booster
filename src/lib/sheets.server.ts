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

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Google Sheets request failed [${res.status}]: ${body}`);
    throw new Error(`Falha ao ler a planilha [${res.status}]: ${body}`);
  }

  const json = (await res.json()) as {
    valueRanges?: { values?: string[][] }[];
  };
  return ranges.map((_, i) => json.valueRanges?.[i]?.values ?? []);
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
