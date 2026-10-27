import type { Manutencao } from "./sheets-types";

function normalizar(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TERMOS_MANUTENCAO = /\b(manuten\w*|oficina\w*|revisao|revisoes|peca\w*|servico\w*|oleo\w*|mecanic\w*|pneu\w*|freio\w*|pastilha\w*|relacao|relacoes|corrente\w*|filtro\w*|vela\w*|bateria\w*|suspensao|amortecedor\w*|alinhamento\w*|balanceamento\w*|embreagem\w*|correia\w*|rolamento\w*|escapamento\w*|radiador\w*|arrefecimento|lubrific\w*)\b/;

/** categorias de despesa que representam um serviço de manutenção */
export function ehCategoriaManutencao(categoria: string): boolean {
  const c = normalizar(categoria);
  return TERMOS_MANUTENCAO.test(c);
}

function contemServico(texto: string, servico: string): boolean {
  return ` ${texto} `.includes(` ${servico} `);
}

/** procura uma manutenção já ativa com o mesmo serviço (e veículo, quando informado) */
export function acharManutencaoAtiva(
  lista: Manutencao[],
  servico: string,
  veiculo?: string,
): Manutencao | undefined {
  const s = normalizar(servico);
  if (!s) return undefined;
  const v = normalizar(veiculo ?? "");
  const candidatas = lista.filter((m) => {
    const ms = normalizar(m.servico);
    if (!ms) return false;
    const bate = ms === s || contemServico(ms, s) || contemServico(s, ms);
    if (!bate) return false;
    if (v && normalizar(m.veiculo) && normalizar(m.veiculo) !== v) return false;
    return true;
  });
  return candidatas.sort((a, b) => {
    const exata = Number(normalizar(b.servico) === s) - Number(normalizar(a.servico) === s);
    return exata || b.iso.localeCompare(a.iso);
  })[0];
}

/** Uma única decisão para o formulário: reconhecer o gasto e aproveitar o plano. */
export function reconhecerManutencaoDespesa(
  lista: Manutencao[],
  categoria: string,
  descricao: string,
  veiculo?: string,
): { servico: string; ativa?: Manutencao } | undefined {
  const ativa = acharManutencaoAtiva(lista, descricao, veiculo)
    ?? acharManutencaoAtiva(lista, categoria, veiculo);
  if (!ativa && !ehCategoriaManutencao(categoria) && !ehCategoriaManutencao(descricao)) {
    return undefined;
  }
  const servico = ativa?.servico
    ?? (ehCategoriaManutencao(descricao) ? descricao.trim() : categoria.trim());
  return { servico, ativa };
}
