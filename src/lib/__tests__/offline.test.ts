import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { descartarItem, enfileirar, itemTravado, lerFila, salvarOuEnfileirar, sincronizarFila, type ItemFila } from "../offline";

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
    "mantém os lançamentos após %s e permite nova tentativa",
    async (mensagem) => {
      enfileirar(ganho);
      enfileirar(despesa);
      const falhar = vi.fn().mockRejectedValue(new Error(mensagem));
      expect(await sincronizarFila(falhar)).toEqual({ enviados: 0, falhas: 2 });
      expect(lerFila().map((i) => i.payload)).toEqual([ganho, despesa]);

      const salvar = vi.fn().mockResolvedValue(undefined);
      expect(await sincronizarFila(salvar)).toEqual({ enviados: 2, falhas: 0 });
      expect(salvar.mock.calls).toEqual([[{ data: ganho }], [{ data: despesa }]]);
      expect(lerFila()).toEqual([]);
    },
  );

  it("um lançamento recusado não impede o envio dos seguintes", async () => {
    enfileirar(ganho);
    enfileirar(despesa);
    const salvar = vi.fn().mockRejectedValueOnce(new Error("Data inválida")).mockResolvedValueOnce(undefined);
    expect(await sincronizarFila(salvar)).toEqual({ enviados: 1, falhas: 1 });
    expect(lerFila().map((item) => item.payload)).toEqual([ganho]);
  });

  it("para de reenviar sozinho após 5 recusas, mas mantém guardado até o usuário descartar", async () => {
    enfileirar(ganho);
    const falhar = vi.fn().mockRejectedValue(new Error("Data inválida"));
    for (let i = 0; i < 5; i++) await sincronizarFila(falhar);
    expect(falhar).toHaveBeenCalledTimes(5);
    expect(await sincronizarFila(falhar)).toEqual({ enviados: 0, falhas: 0 });
    expect(falhar).toHaveBeenCalledTimes(5);
    const [item] = lerFila();
    expect(itemTravado(item)).toBe(true);
    descartarItem(item.id);
    expect(lerFila()).toEqual([]);
  });

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