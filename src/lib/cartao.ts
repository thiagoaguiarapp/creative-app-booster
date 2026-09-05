import type { Pagamento } from "./pagamentos";

export type Fatura = {
  /** aaaa-mm do vencimento */
  mes: string;
  total: number;
  pago: number;
  aberto: number;
  itens: Pagamento[];
};

/** compras/parcelas do cartão agrupadas por mês de vencimento (mais recente primeiro) */
export function faturasDoCartao(pagamentos: Pagamento[]): Fatura[] {
  const mapa = new Map<string, Pagamento[]>();
  for (const p of pagamentos) {
    if (p.forma !== "Crédito" || !p.isoPagamento) continue;
    const mes = p.isoPagamento.slice(0, 7);
    const lista = mapa.get(mes) ?? [];
    lista.push(p);
    mapa.set(mes, lista);
  }
  return Array.from(mapa.entries())
    .map(([mes, itens]) => {
      const total = itens.reduce((s, p) => s + p.valor, 0);
      const pago = itens.filter((p) => p.pago).reduce((s, p) => s + p.valor, 0);
      return {
        mes,
        total,
        pago,
        aberto: total - pago,
        itens: itens.sort((a, b) => a.isoPagamento.localeCompare(b.isoPagamento)),
      };
    })
    .sort((a, b) => b.mes.localeCompare(a.mes));
}

export type ResumoCartao = {
  limite: number;
  /** soma das parcelas do cartão ainda sem baixa */
  usado: number;
  disponivel: number;
  percentual: number;
  nivel: "ok" | "atencao" | "estourado";
};

/** limite comprometido pelas parcelas em aberto */
export function resumoCartao(pagamentos: Pagamento[], limite: number): ResumoCartao {
  const usado = pagamentos
    .filter((p) => p.forma === "Crédito" && !p.pago)
    .reduce((s, p) => s + p.valor, 0);
  const disponivel = Math.max(0, limite - usado);
  const percentual = limite > 0 ? Math.min(100, (usado / limite) * 100) : 0;
  const nivel: ResumoCartao["nivel"] =
    limite > 0 && percentual >= 90 ? "estourado" : percentual >= 70 ? "atencao" : "ok";
  return { limite, usado, disponivel, percentual, nivel };
}
