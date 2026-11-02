import { z } from "zod";

export const ORIGEM_PORTAL = "https://www.rotacontrolapp.com.br";
export const acaoAdminSchema = z.object({
  userId: z.string().uuid(),
  acao: z.enum(["premium", "removerPremium", "bloquear", "desbloquear"]),
  motivo: z.string().trim().min(1).max(1000),
}).strict();
export type AcaoAdmin = z.infer<typeof acaoAdminSchema>;

export type ContaAdmin = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  banned_until?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export function resumoContas(contas: ContaAdmin[], agora = new Date()) {
  // Civil month in Brazil, independent of the server's timezone.
  const dataBrasil = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(agora);
  const ano = dataBrasil.find((p) => p.type === "year")?.value;
  const mes = dataBrasil.find((p) => p.type === "month")?.value;
  const inicioMes = Date.parse(`${ano}-${mes}-01T00:00:00-03:00`);
  const limite = agora.getTime();
  return {
    totalUsuarios: contas.length,
    cadastrosMes: contas.filter((u) => {
      const t = Date.parse(u.created_at ?? "");
      return t >= inicioMes && t <= limite;
    }).length,
    ativos7d: contas.filter((u) => {
      const t = Date.parse(u.last_sign_in_at ?? "");
      return t >= limite - 7 * 86400000 && t <= limite;
    }).length,
    premium: contas.filter((u) => u.user_metadata?.["is_premium"] === true).length,
  };
}

export function ultimosUsuarios(contas: ContaAdmin[], agora = new Date()) {
  return [...contas].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 100).map((u) => ({
      id: u.id,
      nome: String(u.user_metadata?.["nome"] ?? ""),
      email: u.email ?? "",
      plano: u.user_metadata?.["is_premium"] === true ? "premium" : "free",
      bloqueado: Date.parse(u.banned_until ?? "") > agora.getTime(),
      criadoEm: u.created_at ?? "",
    }));
}

export function headersAdmin(request: Request) {
  const headers = new Headers({
    "Cache-Control": "no-store, private",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.headers.get("Origin") === ORIGEM_PORTAL) {
    headers.set("Access-Control-Allow-Origin", ORIGEM_PORTAL);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }
  return headers;
}

export async function verificarTokenAdmin(request: Request, secret: string | undefined): Promise<number | null> {
  const origin = request.headers.get("Origin");
  if (origin !== null && origin !== ORIGEM_PORTAL) return 403;
  if (!secret) return 503;
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ") || authorization.length > 2048) return 401;
  const token = authorization.slice(7);
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([token, secret].map(async (value) =>
    new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))));
  let diferenca = 0;
  for (let i = 0; i < 32; i++) diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diferenca === 0 ? null : 401;
}