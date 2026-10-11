// Contas a pagar (Premium): agrupa as despesas e abastecimentos já lançados pela forma de pagamento.
// Não cria lançamentos: só organiza os existentes.
import { inicioPeriodo, intervaloPersonalizado, type PeriodoEntregas } from "./entregas-filtro";
import { FORMAS, type Forma, type Pagamento } from "./pagamentos";

export function filtrarPagamentosPeriodo(
  pagamentos: Pagamento[],
  opts: { periodo: PeriodoEntregas; de?: string; ate?: string },
): Pagamento[] {
  const intervalo = intervaloPersonalizado(opts.de ?? "", opts.ate ?? "");
  const ini = opts.periodo === "personalizado" ? intervalo.de : inicioPeriodo(opts.periodo);
  const fim = opts.periodo === "personalizado" ? intervalo.ate : "";
  return pagamentos.filter((p) => {
    // crédito pelo vencimento; à vista pela data da compra
    const iso = p.forma === "Crédito" ? p.isoPagamento : p.iso;
    if (ini && iso < ini) return false;
    if (fim && iso > fim) return false;
    return true;
  });
}

export type CardForma = {
  forma: Forma;
  total: number;
  quantidade: number;
  emAberto: number;
};

export function cardsPorForma(pagamentos: Pagamento[]): CardForma[] {
  return FORMAS.map((forma) => {
    const itens = pagamentos.filter((p) => p.forma === forma);
    return {
      forma,
      total: itens.reduce((s, p) => s + p.valor, 0),
      quantidade: itens.length,
      emAberto: itens.filter((p) => !p.pago).reduce((s, p) => s + p.valor, 0),
    };
  }).filter((c) => c.quantidade > 0 || c.forma !== "Outros");
}
