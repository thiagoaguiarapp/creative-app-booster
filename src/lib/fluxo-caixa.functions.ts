import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { configuracaoCaixaSchema, dataIsoValida, exigirPremiumCaixa } from "./fluxo-caixa";

export const salvarCaixaFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => configuracaoCaixaSchema.parse(input))
  .handler(async ({ data }) => {
    const { exigirUsuario, salvarConfiguracaoCaixa } = await import("./auth.server");
    const usuario = await exigirUsuario();
    exigirPremiumCaixa(usuario);
    if (data.inicio > new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" })) throw new Error("O início não pode ser uma data futura.");
    return salvarConfiguracaoCaixa(data);
  });

export const baixarContaCaixaFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1), dataPago: z.string().refine(dataIsoValida).nullable() }).parse(input))
  .handler(async ({ data }) => {
    const { exigirUsuario } = await import("./auth.server");
    const { loadPainelData, invalidarPainelCache } = await import("./painel.server");
    const { pagamentosCaixa } = await import("./fluxo-caixa");
    const { baixarPagamento } = await import("./painel-write.server");
    const usuario = await exigirUsuario();
    exigirPremiumCaixa(usuario);
    if (!usuario.caixa) throw new Error("Defina primeiro o início do controle.");
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    if (data.dataPago && (data.dataPago < usuario.caixa.inicio || data.dataPago > hoje)) throw new Error("O pagamento deve estar entre o início do controle e hoje.");
    const painel = await loadPainelData(usuario.id);
    const p = pagamentosCaixa(painel).find((p) => p.id === data.id);
    if (!p || p.forma !== "Crédito" || p.origem === "Manutenção") throw new Error("Esta conta não permite baixa aqui; edite o lançamento em Despesas.");
    if (p.isoPagamento < usuario.caixa.inicio && !usuario.caixa.historicas.includes(p.id)) throw new Error("Inclua esta conta antiga no controle antes de dar baixa.");
    await baixarPagamento(p.id, usuario.id, data.dataPago);
    invalidarPainelCache(usuario.id);
    return { ok: true };
  });