import { createServerFn } from "@tanstack/react-start";

import type { TipoCadastro } from "./renomear-cadastro";

export const renomearCadastroFn = createServerFn({ method: "POST" })
  .inputValidator((input: { tipo: TipoCadastro; de: string; para: string }) => {
    if (!["cartao", "categoria", "aplicativo"].includes(input?.tipo)) throw new Error("Tipo inválido");
    const de = String(input.de ?? "").trim();
    const para = String(input.para ?? "").trim().slice(0, 60);
    if (!de || !para) throw new Error("Informe o nome novo.");
    return { tipo: input.tipo, de, para };
  })
  .handler(async ({ data }): Promise<{ alterados: number }> => {
    const { exigirUsuario } = await import("./auth.server");
    const { selectAll, atualizar, txt } = await import("./db.server");
    const { invalidarPainelCache } = await import("./painel.server");
    const { COLUNAS_CADASTRO, mesmoNome, trocaCartao } = await import("./renomear-cadastro");
    const usuario = await exigirUsuario();
    let alterados = 0;
    for (const { tabela, colunas } of COLUNAS_CADASTRO[data.tipo]) {
      const linhas = await selectAll(tabela, usuario.id);
      for (const linha of linhas) {
        const id = txt(linha["ID"]);
        if (!id) continue;
        const mudancas: Record<string, string> = {};
        for (const col of colunas) {
          if (!(col in linha)) continue;
          const atual = txt(linha[col]);
          if (data.tipo === "cartao") {
            const novo = trocaCartao(atual, data.de, data.para);
            if (novo !== null && novo !== atual) mudancas[col] = novo;
          } else if (mesmoNome(atual, data.de) && atual !== data.para) {
            mudancas[col] = data.para;
          }
        }
        if (Object.keys(mudancas).length) {
          await atualizar(tabela, id, mudancas, usuario.id);
          alterados++;
        }
      }
    }
    invalidarPainelCache(usuario.id);
    return { alterados };
  });
