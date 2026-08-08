import type { Ganho, Repasse } from "./sheets-types";
import { ehExtra } from "./extras";

export const normalizarPlataforma = (nome: string) =>
  nome.trim().toUpperCase().replace(/\s+/g, " ");

export type AuditoriaMensal = {
  chave: string;
  mes: string;
  app: string;
  faturado: number;
  recebido: number;
  diferenca: number;
  saldoAcumulado: number;
  ganhos: Ganho[];
  repasses: Repasse[];
  suspeitas: string[];
};

export function criarAuditoriaMensal(ganhos: Ganho[], repasses: Repasse[]): AuditoriaMensal[] {
  const mapa = new Map<string, AuditoriaMensal>();
  const pegar = (mes: string, nome: string) => {
    const normalizado = normalizarPlataforma(nome);
    const chave = `${mes}|${normalizado}`;
    let item = mapa.get(chave);
    if (!item) {
      item = {
        chave,
        mes,
        app: nome.trim() || "—",
        faturado: 0,
        recebido: 0,
        diferenca: 0,
        saldoAcumulado: 0,
        ganhos: [],
        repasses: [],
        suspeitas: [],
      };
      mapa.set(chave, item);
    }
    return item;
  };

  for (const ganho of ganhos) {
    if (ehExtra(ganho.plataforma) || !ganho.iso) continue;
    const item = pegar(ganho.iso.slice(0, 7), ganho.plataforma);
    item.faturado += ganho.faturamento;
    item.ganhos.push(ganho);
  }
  for (const repasse of repasses) {
    if (ehExtra(repasse.aplicativo) || !repasse.iso) continue;
    const item = pegar(repasse.iso.slice(0, 7), repasse.aplicativo);
    item.recebido += repasse.valor;
    item.repasses.push(repasse);
  }

  const ordenados = Array.from(mapa.values()).sort(
    (a, b) => a.mes.localeCompare(b.mes) || a.app.localeCompare(b.app, "pt-BR"),
  );
  const saldos = new Map<string, number>();
  for (const item of ordenados) {
    item.diferenca = item.faturado - item.recebido;
    const plataforma = normalizarPlataforma(item.app);
    item.saldoAcumulado = (saldos.get(plataforma) ?? 0) + item.diferenca;
    saldos.set(plataforma, item.saldoAcumulado);
    if (item.faturado > 0.009 && item.recebido <= 0.009) {
      item.suspeitas.push("Mês sem nenhuma baixa registrada");
    }
    if (item.recebido > 0.009 && item.faturado <= 0.009) {
      item.suspeitas.push("Recebimento sem faturamento no mesmo mês — confira a data");
    }
  }
  return ordenados.reverse();
}

export function saldosAteMes(auditoria: AuditoriaMensal[], mes: string) {
  const saldos = new Map<string, { app: string; saldo: number }>();
  for (const item of [...auditoria].reverse()) {
    if (item.mes > mes) continue;
    saldos.set(normalizarPlataforma(item.app), { app: item.app, saldo: item.saldoAcumulado });
  }
  return saldos;
}