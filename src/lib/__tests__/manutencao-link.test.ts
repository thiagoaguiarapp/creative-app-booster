import { describe, expect, it } from "vitest";
import { acharManutencaoAtiva, ehCategoriaManutencao, reconhecerManutencaoDespesa } from "../manutencao-link";
import type { Manutencao } from "../sheets-types";

const plano = (campos: Partial<Manutencao> = {}): Manutencao => ({
  id: "1", row: "1", veiculo: "Moto", data: "26/10/2026", iso: "2026-10-26",
  servico: "Troca de óleo", kmTroca: 1000, validadeKm: 3000, valor: 0,
  observacao: "", pagamento: "", ...campos,
});

describe("reconhecimento de manutenção em despesas", () => {
  it.each(["PEÇAS", "serviço", "ÓLEO", "Pneus", "Pastilha de freio", "RELAÇÃO", "Corrente", "Filtro", "Velas", "Bateria", "Suspensão", "Alinhamento"])(
    "reconhece %s na categoria", (categoria) => {
      expect(ehCategoriaManutencao(categoria)).toBe(true);
    },
  );
  it("verifica a descrição mesmo com categoria genérica", () => {
    expect(reconhecerManutencaoDespesa([], "Outros", "Troca de PNEU traseiro")?.servico)
      .toBe("Troca de PNEU traseiro");
  });
  it("não diferencia acento e maiúsculas ao aproveitar o plano", () => {
    const ativa = plano();
    expect(reconhecerManutencaoDespesa([ativa], "Outros", "TROCA DE OLEO", "mÓtO"))
      .toEqual({ servico: "Troca de óleo", ativa });
  });
  it("aproveita serviços cadastrados sem exigir palavra-chave", () => {
    const ativa = plano({ servico: "Kit transmissão" });
    expect(reconhecerManutencaoDespesa([ativa], "Outros", "KIT TRANSMISSAO")?.ativa?.row).toBe("1");
  });
  it("usa a categoria para achar plano quando descrição não identifica o serviço", () => {
    expect(reconhecerManutencaoDespesa([plano()], "TROCA DE ÓLEO", "Compra na loja")?.ativa?.row).toBe("1");
  });
  it("prefere o nome exato ao serviço parcial e pega o registro mais recente", () => {
    const lista = [plano({ servico: "Óleo", row: "2" }), plano({ iso: "2026-01-01", row: "3" }), plano()];
    expect(acharManutencaoAtiva(lista, "Troca de oleo")?.row).toBe("1");
  });
  it("não atualiza o plano de outro veículo", () => {
    expect(reconhecerManutencaoDespesa([plano()], "Óleo", "", "Carro")?.ativa).toBeUndefined();
  });
  it.each(["Alimentação", "Internet", "Cinema", "Sorvete", "Pagamento de aplicativo"])(
    "não trata %s como manutenção", (categoria) => {
      expect(reconhecerManutencaoDespesa([], categoria, "Compra do dia")).toBeUndefined();
    },
  );
});