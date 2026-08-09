import { atualizar, inserir, selectAll, txt } from "./db.server";

const TABELA = "METAS";

export type Meta = {
  id: number;
  userId: string;
  tipo: string;
  valor: number;
  atualizadoEm: string;
};

export async function buscarMeta(userId: string, tipo: string): Promise<Meta | null> {
  const linhas = await selectAll(TABELA, userId);
  const linha = linhas.find((l) => txt(l["TIPO"]).toLowerCase() === tipo.toLowerCase());
  if (!linha) return null;
  return {
    id: Number(linha["ID"]),
    userId: String(linha["USER_ID"]),
    tipo: txt(linha["TIPO"]),
    valor: Number(linha["VALOR"]) || 0,
    atualizadoEm: String(linha["ATUALIZADO_EM"] ?? ""),
  };
}

export async function salvarMeta(userId: string, tipo: string, valor: number): Promise<Meta> {
  const existente = await buscarMeta(userId, tipo);
  const agora = new Date().toISOString();
  if (existente) {
    await atualizar(TABELA, existente.id, { VALOR: valor, ATUALIZADO_EM: agora }, userId);
    return { ...existente, valor, atualizadoEm: agora };
  }
  await inserir(TABELA, { TIPO: tipo, VALOR: valor, ATUALIZADO_EM: agora }, userId);
  const nova = await buscarMeta(userId, tipo);
  if (!nova) throw new Error("Não foi possível salvar a meta.");
  return nova;
}
