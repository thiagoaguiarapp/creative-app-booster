export type Ganho = {
  id: string;
  row: string;
  data: string;
  iso: string;
  plataforma: string;
  corridas: number;
  faturamento: number;
  recebido: number;
};

export type Abastecimento = {
  id: string;
  row: string;
  data: string;
  iso: string;
  posto: string;
  combustivel: string;
  veiculo: string;
  odometro: number;
  litros: number;
  precoLitro: number;
  kmRodado: number;
  kmPorLitro: number;
  custoKm: number;
  desconto: number;
  valorPago: number;
  pagamento: string;
  /** data em que a baixa do cartão foi registrada (dd/mm/aaaa) */
  dataPago: string;
};

export type Despesa = {
  id: string;
  row: string;
  data: string;
  iso: string;
  valor: number;
  categoria: string;
  descricao: string;
  pagamento: string;
};

export type Repasse = {
  id: string;
  row: string;
  data: string;
  iso: string;
  aplicativo: string;
  valor: number;
  forma: string;
};

export type Manutencao = {
  id: string;
  row: string;
  veiculo: string;
  data: string;
  iso: string;
  servico: string;
  kmTroca: number;
  validadeKm: number;
  valor: number;
  observacao: string;
};

export type PainelData = {
  ganhos: Ganho[];
  abastecimentos: Abastecimento[];
  despesas: Despesa[];
  repasses: Repasse[];
  manutencoes: Manutencao[];
  odometroAtual: number;
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function statusManutencao(m: Manutencao, odometroAtual: number) {
  const percorrido = Math.max(0, odometroAtual - m.kmTroca);
  const restante = m.validadeKm - percorrido;
  const progresso = m.validadeKm
    ? Math.min(100, Math.round((percorrido / m.validadeKm) * 100))
    : 0;
  const nivel: "ok" | "atencao" | "vencido" =
    restante <= 0 ? "vencido" : restante <= m.validadeKm * 0.2 ? "atencao" : "ok";
  return { percorrido, restante, progresso, nivel };
}
