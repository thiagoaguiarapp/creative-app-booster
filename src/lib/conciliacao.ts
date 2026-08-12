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
/**
 * Aplica os recebimentos aos faturamentos por plataforma em ordem cronológica (FIFO),
 * inclusive quando o repasse cai em um mês posterior ao faturamento.
 * Retorna, por plataforma, o faturado do período e o quanto desse faturado já foi quitado
 * (mesmo que a baixa tenha acontecido depois do período).
 */
export function quitacaoPorApp(
  ganhos: Ganho[],
  repasses: Repasse[],
  noPeriodo: (iso: string) => boolean,
) {
  const porPlataforma = new Map<string, { app: string; ganhos: Ganho[]; repasses: Repasse[] }>();
  const pegar = (nome: string) => {
    const chave = normalizarPlataforma(nome);
    let item = porPlataforma.get(chave);
    if (!item) {
      item = { app: nome.trim() || "—", ganhos: [], repasses: [] };
      porPlataforma.set(chave, item);
    }
    return item;
  };
  for (const g of ganhos) {
    if (ehExtra(g.plataforma) || !g.iso) continue;
    pegar(g.plataforma).ganhos.push(g);
  }
  for (const r of repasses) {
    if (ehExtra(r.aplicativo) || !r.iso) continue;
    pegar(r.aplicativo).repasses.push(r);
  }

  const resultado = new Map<string, { app: string; faturado: number; quitado: number; quitadoDepois: number }>();
  for (const [chave, item] of porPlataforma) {
    const dividas = [...item.ganhos]
      .sort((a, b) => a.iso.localeCompare(b.iso))
      .map((g) => ({ g, restante: g.faturamento, pago: 0, pagoFora: 0 }));
    const pagamentos = [...item.repasses].sort((a, b) => a.iso.localeCompare(b.iso));
    for (const pagamento of pagamentos) {
      let sobra = pagamento.valor;
      const mesPagamento = pagamento.iso.slice(0, 7);
      // 1) quita o próprio mês do repasse, 2) meses anteriores (mais antigo primeiro),
      // 3) meses posteriores (adiantamento). Assim um repasse de julho não é consumido
      // por dívidas de maio/junho antes de baixar o faturamento de julho.
      const grupos = [
        dividas.filter((d) => d.g.iso.slice(0, 7) === mesPagamento),
        dividas.filter((d) => d.g.iso.slice(0, 7) < mesPagamento),
        dividas.filter((d) => d.g.iso.slice(0, 7) > mesPagamento),
      ];
      for (const grupo of grupos) {
        for (const divida of grupo) {
          if (sobra <= 0.0001) break;
          if (divida.restante <= 0.0001) continue;
          const usado = Math.min(sobra, divida.restante);
          divida.restante -= usado;
          divida.pago += usado;
          if (!noPeriodo(pagamento.iso)) divida.pagoFora += usado;
          sobra -= usado;
        }
        if (sobra <= 0.0001) break;
      }
    }
    let faturado = 0;
    let quitado = 0;
    let quitadoDepois = 0;
    for (const divida of dividas) {
      if (!noPeriodo(divida.g.iso)) continue;
      faturado += divida.g.faturamento;
      quitado += divida.pago;
      quitadoDepois += divida.pagoFora;
    }
    resultado.set(chave, { app: item.app, faturado, quitado, quitadoDepois });
  }
  return resultado;
}
