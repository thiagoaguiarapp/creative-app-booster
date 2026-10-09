import { statusManutencao, type Manutencao } from "./sheets-types";

export type Pendente = {
  chave: string;
  servico: string;
  veiculo: string;
  vencido: boolean;
  /** km que faltam (ou que passou, quando vencido) */
  km: number;
};

/** Último registro de cada serviço por veículo que está vencido ou em atenção. */
export function manutencoesPendentes(lista: Manutencao[], odometroAtual: number): Pendente[] {
  const ultimos = new Map<string, Manutencao>();
  for (const m of [...lista].sort((a, b) => (a.iso < b.iso ? 1 : -1))) {
    const chave = `${m.veiculo}|${m.servico}`.toUpperCase();
    if (!ultimos.has(chave)) ultimos.set(chave, m);
  }
  const out: Pendente[] = [];
  for (const [chave, m] of ultimos) {
    if (!m.validadeKm) continue;
    const s = statusManutencao(m, odometroAtual);
    if (s.nivel === "ok") continue;
    out.push({
      chave,
      servico: m.servico,
      veiculo: m.veiculo,
      vencido: s.nivel === "vencido",
      km: Math.abs(Math.round(s.restante)),
    });
  }
  return out;
}
