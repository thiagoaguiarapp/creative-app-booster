import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enfileirar, lerFila, salvarOuEnfileirar, sincronizarFila, type ItemFila } from "../offline";

const ganho: ItemFila["payload"] = { tipo: "ganho", valores: { valor: "50" } };
const despesa: ItemFila["payload"] = { tipo: "despesa", valores: { valor: "20" } };

beforeEach(() => {
  const dados = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (chave: string) => dados.get(chave) ?? null,
      setItem: (chave: string, valor: string) => dados.set(chave, valor),
      removeItem: (chave: string) => dados.delete(chave),
    },
    dispatchEvent: vi.fn(),
  });
  vi.stubGlobal("navigator", { onLine: true });
});

afterEach(() => vi.unstubAllGlobals());

describe("sincronização offline sem perda de lançamentos", () => {
  it.each(["Servidor indisponível: 503", "Limite de gravações: 429", "Sessão expirada", "Dados inválidos"])(
    "mantém o lançamento e os seguintes após %s e permite nova tentativa",
    async (mensagem) => {
      enfileirar(ganho);
      enfileirar(despesa);
      const original = lerFila();
      const falhar = vi.fn().mockRejectedValue(new Error(mensagem));
      expect(await sincronizarFila(falhar)).toEqual({ enviados: 0, falhas: 1 });
      expect(falhar).toHaveBeenCalledTimes(1);
      expect(lerFila()).toEqual(original);

      const salvar = vi.fn().mockResolvedValue(undefined);
      expect(await sincronizarFila(salvar)).toEqual({ enviados: 2, falhas: 0 });
      expect(salvar.mock.calls).toEqual([[{ data: ganho }], [{ data: despesa }]]);
      expect(lerFila()).toEqual([]);
    },
  );

  it("remove somente o confirmado quando o próximo falha", async () => {
    enfileirar(ganho);
    enfileirar(despesa);
    const salvar = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("503"));
    expect(await sincronizarFila(salvar)).toEqual({ enviados: 1, falhas: 1 });
    expect(lerFila().map((item) => item.payload)).toEqual([despesa]);
  });

  it("guarda sem internet, mantém na queda de conexão e envia ao reconectar", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const salvar = vi.fn().mockResolvedValue(undefined);
    expect(await salvarOuEnfileirar(salvar, ganho)).toEqual({ offline: true });
    expect(salvar).not.toHaveBeenCalled();
    vi.stubGlobal("navigator", { onLine: true });
    expect(await sincronizarFila(vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))))
      .toEqual({ enviados: 0, falhas: 0 });
    expect(lerFila().map((item) => item.payload)).toEqual([ganho]);
    expect(await sincronizarFila(salvar)).toEqual({ enviados: 1, falhas: 0 });
    expect(lerFila()).toEqual([]);
  });
});