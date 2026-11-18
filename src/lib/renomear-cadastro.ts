import { normalizaCartao } from "./pagamentos";

export type TipoCadastro = "cartao" | "categoria" | "aplicativo";

/** compara nomes ignorando acentos, maiúsculas e espaços extras */
export function mesmoNome(a: string, b: string): boolean {
  const n = (s: string) =>
    (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  return n(a) !== "" && n(a) === n(b);
}

/** troca a marca "[cartao DE]" por "[cartao PARA]" no texto; devolve null quando não há o cartão */
export function trocaCartao(texto: string, de: string, para: string): string | null {
  const alvo = normalizaCartao(de);
  const novo = normalizaCartao(para);
  if (!alvo || !novo) return null;
  let achou = false;
  const saida = (texto ?? "").replace(/\[cartao ([^\]]{1,40})\]/gi, (m, nome: string) => {
    if (normalizaCartao(nome) !== alvo) return m;
    achou = true;
    return `[cartao ${novo}]`;
  });
  return achou ? saida : null;
}

/** colunas de texto onde cada cadastro é gravado, por tabela */
export const COLUNAS_CADASTRO: Record<TipoCadastro, { tabela: string; colunas: string[] }[]> = {
  cartao: [
    { tabela: "DESPESAS", colunas: ["OBS"] },
    { tabela: "CONTROLE COMBUSTIVEL", colunas: ["POSTO", "Posto"] },
    { tabela: "MANUTENCAO", colunas: ["OBSERVAÇÃO", "OBSERVACAO", "OBS"] },
  ],
  categoria: [{ tabela: "DESPESAS", colunas: ["TIPO DE GASTO"] }],
  aplicativo: [
    { tabela: "DIARIO", colunas: ["APP"] },
    { tabela: "REPASSE", colunas: ["APLICATIVO"] },
  ],
};
