import { z } from "zod";
import { conciliacaoRecebimentos } from "./conciliacao";
import { montaDespesasUnificadas } from "./despesas-unificadas";
import { montaPagamentos, type Pagamento } from "./pagamentos";
import type { PainelData } from "./sheets-types";

export function dataIsoValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

export const configuracaoCaixaSchema = z.object({
  inicio: z.string().refine(dataIsoValida, "Informe uma data válida."),
  saldoInicial: z.number().finite().min(-1e9).max(1e9),
  historicas: z.array(z.string().max(120)).max(2000).default([]),
});
export type ConfiguracaoCaixa = z.infer<typeof configuracaoCaixaSchema>;
export function lerConfiguracaoCaixa(valor: unknown): ConfiguracaoCaixa | null {
  const resultado = configuracaoCaixaSchema.safeParse(valor);
  return resultado.success ? resultado.data : null;
}
export function exigirPremiumCaixa(usuario: { isPremium: boolean }) {
  if (!usuario.isPremium) throw new Error("Este controle é exclusivo para Premium.");
}
export function isoDaBaixa(br: string) {
  const iso = br.split("/").reverse().join("-");
  return dataIsoValida(iso) ? iso : "";
}
export function pagamentosCaixa(data: PainelData): Pagamento[] {
  const base = montaPagamentos(data.despesas, data.abastecimentos);
  const manutencoes = montaDespesasUnificadas(data).filter((p) => p.tipo === "manutencao");
  return [...base, ...manutencoes.map((p): Pagamento => ({
    id: p.id, row: p.row, origem: "Manutenção", data: p.data, iso: p.iso,
    dataPagamento: p.data, isoPagamento: p.iso, descricao: p.descricao,
    categoria: p.categoria, forma: p.forma, valor: p.valor,
    pago: p.forma !== "Crédito", dataPago: "",
  }))];
}
export type MovimentoCaixa = { id: string; iso: string; descricao: string; forma: string; entrada: number; saida: number; saldo: number };
const centavos = (n: number) => Math.round(n * 100) / 100;
export function calcularCaixa(data: PainelData, config: ConfiguracaoCaixa, de: string, ate: string, hoje: string) {
  const todos = pagamentosCaixa(data);
  const pertence = (p: Pagamento) => (p.forma === "Crédito" ? p.isoPagamento : p.iso) >= config.inicio || config.historicas.includes(p.id) || (p.pago && isoDaBaixa(p.dataPago) >= config.inicio);
  const contas = todos.filter(pertence);
  const historicas = todos.filter((p) => p.forma === "Crédito" && !p.pago && !pertence(p));
  const abertos = contas.filter((p) => p.forma === "Crédito" && !p.pago).sort((a, b) => a.isoPagamento.localeCompare(b.isoPagamento));
  const movimentos: MovimentoCaixa[] = [];
  // Recebimentos imediatos já geram repasse: usar apenas REPASSE evita duplicar GANHO.RECEBIDO.
  for (const r of data.repasses) {
    if (r.iso < config.inicio || r.iso > hoje) continue;
    movimentos.push({ id: `repasse-${r.row}`, iso: r.iso, descricao: r.aplicativo, forma: r.forma, entrada: r.valor, saida: 0, saldo: 0 });
  }
  for (const p of contas) {
    const iso = p.forma === "Crédito" ? isoDaBaixa(p.dataPago) : p.iso;
    if (!p.pago || !iso || iso < config.inicio || iso > hoje) continue;
    movimentos.push({ id: p.id, iso, descricao: p.descricao || p.categoria, forma: p.forma, entrada: 0, saida: p.valor, saldo: 0 });
  }
  movimentos.sort((a, b) => a.iso.localeCompare(b.iso) || a.id.localeCompare(b.id));
  let acumulado = config.saldoInicial;
  for (const m of movimentos) { acumulado = centavos(acumulado + m.entrada - m.saida); m.saldo = acumulado; }
  const fim = ate < hoje ? ate : hoje;
  const periodo = movimentos.filter((m) => m.iso >= de && m.iso <= fim);
  const entradas = centavos(periodo.reduce((s, m) => s + m.entrada, 0));
  const saidas = centavos(periodo.reduce((s, m) => s + m.saida, 0));
  const saldoAcumulado = centavos(config.saldoInicial + movimentos.filter((m) => m.iso <= fim).reduce((s, m) => s + m.entrada - m.saida, 0));
  const aPagar = centavos(abertos.reduce((s, p) => s + p.valor, 0));
  const aReceber = centavos(conciliacaoRecebimentos(data.ganhos, data.repasses.filter((r) => r.iso <= hoje), (iso) => iso >= config.inicio && iso <= hoje, null).reduce((s, p) => s + p.pendenteMes, 0));
  const porDia = new Map<string, { dia: string; saldo: number }>();
  const saldoAnterior = centavos(config.saldoInicial + movimentos.filter((m) => m.iso < de).reduce((s, m) => s + m.entrada - m.saida, 0));
  porDia.set(de, { dia: de, saldo: saldoAnterior });
  for (const m of periodo) porDia.set(m.iso, { dia: m.iso, saldo: m.saldo });
  return { contas, historicas, abertos, movimentos: periodo.slice().reverse(), entradas, saidas, saldoPeriodo: centavos(entradas - saidas), saldoAcumulado, aPagar, aReceber, previsto: centavos(saldoAcumulado + aReceber - aPagar), evolucao: [...porDia.values()] };
}