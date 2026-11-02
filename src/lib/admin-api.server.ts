import { acaoAdminSchema, headersAdmin, ORIGEM_PORTAL, resumoContas, ultimosUsuarios, verificarTokenAdmin, type ContaAdmin, type AcaoAdmin } from "./admin-api";

function configuracao() {
  const url = process.env["MOTOCA_SUPABASE_URL"];
  const key = process.env["MOTOCA_SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Configuração indisponível");
  const headers = { apikey: key, "Content-Type": "application/json", ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) };
  return { url: url.replace(/\/$/, ""), headers };
}

async function backend(path: string, init: RequestInit = {}) {
  const { url, headers } = configuracao();
  const response = await fetch(`${url}${path}`, { ...init, headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Serviço administrativo indisponível");
  return response;
}

export async function listarContasAdmin(): Promise<ContaAdmin[]> {
  const todas: ContaAdmin[] = [];
  for (let page = 1; ; page++) {
    const response = await backend(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const payload = await response.json() as { users?: ContaAdmin[] };
    if (!Array.isArray(payload.users)) throw new Error("Resposta inválida");
    todas.push(...payload.users);
    if (payload.users.length < 200) return todas;
  }
}

async function aplicarAcaoAdmin(data: AcaoAdmin) {
  const userPath = `/auth/v1/admin/users/${encodeURIComponent(data.userId)}`;
  const response = await backend(userPath);
  const user = await response.json() as ContaAdmin;
  if (user.id !== data.userId) throw new Error("Conta inválida");
  // Preserve the previous protection for administrator accounts.
  const { roleDe } = await import("./admin.server");
  if ((data.acao === "bloquear" || data.acao === "removerPremium") && await roleDe(data.userId) === "admin") {
    return false;
  }
  const corpo: Record<string, unknown> = {
    app_metadata: {
      ...(user.app_metadata ?? {}),
      ultima_acao_admin: { acao: data.acao, motivo: data.motivo, em: new Date().toISOString(), origem: "portal_rota_control" },
    },
  };
  if (data.acao === "premium" || data.acao === "removerPremium") {
    corpo["user_metadata"] = { ...(user.user_metadata ?? {}), is_premium: data.acao === "premium" };
  } else {
    corpo["ban_duration"] = data.acao === "bloquear" ? "876000h" : "none";
  }
  await backend(userPath, { method: "PUT", body: JSON.stringify(corpo) });
  return true;
}

export async function responderAdmin(request: Request, incluirUsuarios: boolean): Promise<Response> {
  const headers = headersAdmin(request);
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
  if (request.method === "OPTIONS") {
    if (request.headers.get("Origin") !== ORIGEM_PORTAL) return json({ erro: "Origem não permitida" }, 403);
    const method = request.headers.get("Access-Control-Request-Method");
    const requested = (request.headers.get("Access-Control-Request-Headers") ?? "").toLowerCase().split(",").map((h) => h.trim()).filter(Boolean);
    if (!method || !["GET", "POST"].includes(method) || requested.some((h) => !["authorization", "content-type"].includes(h))) return json({ erro: "Requisição inválida" }, 403);
    return new Response(null, { status: 204, headers });
  }
  const failure = await verificarTokenAdmin(request, process.env["NOCORRE_ADMIN_TOKEN"]);
  if (failure) return json({ erro: failure === 503 ? "Conexão não configurada" : "Acesso negado" }, failure);
  if (new URL(request.url).search) return json({ erro: "Parâmetros não permitidos" }, 400);
  try {
    if (request.method === "GET") {
      const contas = await listarContasAdmin();
      return json({ ...resumoContas(contas), ...(incluirUsuarios ? { usuarios: ultimosUsuarios(contas) } : {}) });
    }
    if (request.method !== "POST") return json({ erro: "Método não permitido" }, 405);
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) return json({ erro: "Envie JSON" }, 415);
    if (Number(request.headers.get("Content-Length") ?? 0) > 8192) return json({ erro: "Dados muito grandes" }, 413);
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 8192) return json({ erro: "Dados muito grandes" }, 413);
    let bruto: unknown;
    try { bruto = JSON.parse(text); } catch { return json({ erro: "JSON inválido" }, 400); }
    const parsed = acaoAdminSchema.safeParse(bruto);
    if (!parsed.success) return json({ erro: "Informe ID válido, ação permitida e motivo obrigatório" }, 400);
    if (!await aplicarAcaoAdmin(parsed.data)) return json({ erro: "Ação não permitida para administrador" }, 403);
    return json({ ok: true });
  } catch {
    // Never forward upstream responses, user data, credentials, or stack traces.
    return json({ erro: "Não foi possível consultar ou atualizar a conta" }, 502);
  }
}