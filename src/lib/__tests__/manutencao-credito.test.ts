import { describe, expect, it, vi } from "vitest";

vi.mock("../db.server", () => ({
  atualizar: vi.fn(), inserir: vi.fn(), remover: vi.fn(), selectAll: vi.fn(),
  txt: (v: unknown) => String(v ?? "").trim(),
}));
vi.mock("../painel.server", () => ({ TABELAS: { manutencao: "MANUTENCAO", despesa: "DESPESA", abastecimento: "ABAST" } }));

import { observacaoManutencao } from "../painel-write.server";
import { cartaoDe, dataPago, limpaDescricao, primeiraParcelaIso } from "../pagamentos";

describe("manutenção no crédito: vencimento editado é salvo", () => {
  it("grava o vencimento informado na edição", () => {
    const obs = observacaoManutencao("", {
      observacao: "",
      pagamento: "Crédito à vista",
      dataPrimeiraParcela: "2026-11-06",
      cartao: "nubank",
    });
    expect(primeiraParcelaIso(obs)).toBe("2026-11-06");
    expect(cartaoDe(obs)).toBe("NUBANK");
  });

  it("trocar o vencimento substitui o anterior e mantém a baixa", () => {
    const obs = observacaoManutencao("freio [primeira 06/11/2026] [pago 07/11/2026]", {
      observacao: "freio",
      pagamento: "Crédito à vista",
      dataPrimeiraParcela: "2026-12-06",
    });
    expect(primeiraParcelaIso(obs)).toBe("2026-12-06");
    expect(dataPago(obs)).toBe("07/11/2026");
    expect(limpaDescricao(obs)).toBe("freio");
  });

  it("edição sem forma de pagamento preserva as marcas", () => {
    const obs = observacaoManutencao("x [primeira 06/11/2026] [cartao INTER]", { observacao: "nova" });
    expect(primeiraParcelaIso(obs)).toBe("2026-11-06");
    expect(cartaoDe(obs)).toBe("INTER");
    expect(limpaDescricao(obs)).toBe("nova");
  });

  it("mudar para Pix remove o vencimento", () => {
    const obs = observacaoManutencao("x [primeira 06/11/2026]", { observacao: "x", pagamento: "Pix" });
    expect(primeiraParcelaIso(obs)).toBe("");
  });
});
