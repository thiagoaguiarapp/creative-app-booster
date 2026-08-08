import type { Manutencao } from "./sheets-types";

function normalizar(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** categorias de despesa que representam um serviço de manutenção */
export function ehCategoriaManutencao(categoria: string): boolean {
  const c = normalizar(categoria);
  if (!c) return false;
  return ["manuten", "oficina", "revisao", "peca", "troca de oleo", "mecanic"].some((p) =>
    c.includes(p),
  );
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
    const bate = ms === s || ms.includes(s) || s.includes(ms);
    if (!bate) return false;
    if (v && normalizar(m.veiculo) && normalizar(m.veiculo) !== v) return false;
    return true;
  });
  return candidatas.sort((a, b) => (a.iso < b.iso ? 1 : -1))[0];
}
