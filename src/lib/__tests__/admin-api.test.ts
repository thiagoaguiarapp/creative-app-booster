import { afterEach, describe, expect, it, vi } from "vitest";
import { acaoAdminSchema, headersAdmin, ORIGEM_PORTAL, resumoContas, ultimosUsuarios, verificarTokenAdmin } from "../admin-api";
import { responderAdmin } from "../admin-api.server";

const ID = "11111111-1111-4111-8111-111111111111";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("administração via portal", () => {
  it("exige motivo inclusive nas quatro ações permitidas", () => {
    for (const acao of ["premium", "removerPremium", "bloquear", "desbloquear"]) {
      expect(acaoAdminSchema.safeParse({ userId: ID, acao, motivo: " " }).success).toBe(false);
      expect(acaoAdminSchema.safeParse({ userId: ID, acao, motivo: "Atendimento solicitado" }).success).toBe(true);
    }
    expect(acaoAdminSchema.safeParse({ userId: ID, acao: "excluir", motivo: "teste" }).success).toBe(false);
  });
  it("restringe CORS exclusivamente ao www do portal", () => {
    expect(headersAdmin(new Request("https://app.test", { headers: { Origin: ORIGEM_PORTAL } })).get("Access-Control-Allow-Origin")).toBe("https://www.rotacontrolapp.com.br");
    for (const Origin of ["https://rotacontrolapp.com.br", "https://evil.test", "null"]) {
      expect(headersAdmin(new Request("https://app.test", { headers: { Origin } })).has("Access-Control-Allow-Origin")).toBe(false);
    }
  });
  it("nega acesso sem token ou com token inválido e falha fechado sem configuração", async () => {
    // Synthetic fixture, not a real credential.
    expect(await verificarTokenAdmin(new Request("https://app.test"), "fixture-only")).toBe(401);
    expect(await verificarTokenAdmin(new Request("https://app.test", { headers: { Authorization: "Bearer wrong-fixture" } }), "fixture-only")).toBe(401);
    expect(await verificarTokenAdmin(new Request("https://app.test"), undefined)).toBe(503);
    expect(await verificarTokenAdmin(new Request("https://app.test", { headers: { Authorization: "Bearer fixture-only", Origin: ORIGEM_PORTAL } }), "fixture-only")).toBeNull();
  });
  it("calcula totais completos e lista apenas os 100 últimos usuários", () => {
    const now = new Date("2026-11-02T02:37:00Z");
    const contas = Array.from({ length: 105 }, (_, i) => ({ id: String(i), created_at: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(), user_metadata: { is_premium: i % 2 === 0 } }));
    const lista = ultimosUsuarios(contas, now);
    expect(lista).toHaveLength(100);
    expect(lista[0]?.id).toBe("104");
    expect(resumoContas(contas, now).totalUsuarios).toBe(105);
    expect(resumoContas(contas, now).premium).toBe(53);
  });
  it("conta mês brasileiro e atividade na janela exata de sete dias", () => {
    expect(resumoContas([
      { id: "a", created_at: "2026-11-01T02:59:59Z", last_sign_in_at: "2026-10-26T02:36:59Z" },
      { id: "b", created_at: "2026-11-01T03:00:00Z", last_sign_in_at: "2026-10-26T02:37:00Z" },
    ], new Date("2026-11-02T02:37:00Z"))).toEqual({ totalUsuarios: 2, cadastrosMes: 1, ativos7d: 1, premium: 0 });
  });
  it("não devolve dados pessoais na API pública e só lista usuários na API protegida", async () => {
    vi.stubEnv("NOCORRE_ADMIN_TOKEN", "fixture-only");
    vi.stubEnv("MOTOCA_SUPABASE_URL", "https://backend.test");
    vi.stubEnv("MOTOCA_SUPABASE_SERVICE_ROLE_KEY", "fixture-service");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ users: [{ id: ID, email: "example@example.test", user_metadata: { nome: "Exemplo" } }] })));
    const request = () => new Request("https://app.test/api/admin", { headers: { Authorization: "Bearer fixture-only" } });
    const publicData = await (await responderAdmin(request(), false)).json();
    expect(publicData).toEqual({ totalUsuarios: 1, cadastrosMes: 0, ativos7d: 0, premium: 0 });
    const privateData = await (await responderAdmin(request(), true)).json();
    expect(privateData.usuarios[0].id).toBe(ID);
  });
  it("recusa POST sem motivo antes de qualquer consulta ao serviço", async () => {
    vi.stubEnv("NOCORRE_ADMIN_TOKEN", "fixture-only");
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const response = await responderAdmin(new Request("https://app.test/api/admin", {
      method: "POST", headers: { Authorization: "Bearer fixture-only", "Content-Type": "application/json" },
      body: JSON.stringify({ userId: ID, acao: "bloquear" }),
    }), true);
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("aplica Premium e guarda motivo em metadados protegidos na mesma alteração", async () => {
    vi.stubEnv("NOCORRE_ADMIN_TOKEN", "fixture-only");
    vi.stubEnv("MOTOCA_SUPABASE_URL", "https://backend.test");
    vi.stubEnv("MOTOCA_SUPABASE_SERVICE_ROLE_KEY", "fixture-service");
    let atualizacao: Record<string, any> = {};
    vi.stubGlobal("fetch", vi.fn(async (_url: unknown, init?: RequestInit) => {
      if (init?.method === "PUT") {
        atualizacao = JSON.parse(String(init.body));
        return Response.json({ id: ID });
      }
      return Response.json({ id: ID, user_metadata: { nome: "Exemplo" }, app_metadata: { provider: "email" } });
    }));
    const response = await responderAdmin(new Request("https://app.test/api/admin", {
      method: "POST", headers: { Authorization: "Bearer fixture-only", "Content-Type": "application/json" },
      body: JSON.stringify({ userId: ID, acao: "premium", motivo: "Concessão solicitada" }),
    }), true);
    expect(response.status).toBe(200);
    expect(atualizacao["user_metadata"]).toEqual({ nome: "Exemplo", is_premium: true });
    expect(atualizacao["app_metadata"].ultima_acao_admin.motivo).toBe("Concessão solicitada");
  });
});