export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export type Ganho = {
  id: string;
  data: string;
  plataforma: string;
  corridas: number;
  km: number;
  bruto: number;
  gorjeta: number;
};

export const ganhos: Ganho[] = [
  { id: "g1", data: "03/08", plataforma: "iFood", corridas: 18, km: 74, bruto: 214.9, gorjeta: 18 },
  { id: "g2", data: "02/08", plataforma: "Rappi", corridas: 12, km: 51, bruto: 148.3, gorjeta: 9.5 },
  { id: "g3", data: "01/08", plataforma: "iFood", corridas: 21, km: 88, bruto: 246.7, gorjeta: 24 },
  { id: "g4", data: "31/07", plataforma: "Particular", corridas: 6, km: 27, bruto: 96, gorjeta: 12 },
  { id: "g5", data: "30/07", plataforma: "iFood", corridas: 16, km: 66, bruto: 189.4, gorjeta: 7 },
];

export type Abastecimento = {
  id: string;
  data: string;
  posto: string;
  litros: number;
  precoLitro: number;
  odometro: number;
};

export const abastecimentos: Abastecimento[] = [
  { id: "a1", data: "02/08", posto: "Ipiranga Centro", litros: 18.4, precoLitro: 5.89, odometro: 84210 },
  { id: "a2", data: "29/07", posto: "Shell Av. Brasil", litros: 20.1, precoLitro: 5.79, odometro: 83890 },
  { id: "a3", data: "25/07", posto: "Ipiranga Centro", litros: 17.2, precoLitro: 5.95, odometro: 83540 },
];

export type Despesa = {
  id: string;
  data: string;
  categoria: string;
  descricao: string;
  valor: number;
};

export const despesas: Despesa[] = [
  { id: "d1", data: "03/08", categoria: "Alimentação", descricao: "Almoço em rota", valor: 24 },
  { id: "d2", data: "02/08", categoria: "Equipamento", descricao: "Capa de chuva", valor: 89.9 },
  { id: "d3", data: "01/08", categoria: "Taxas", descricao: "Estacionamento", valor: 15 },
  { id: "d4", data: "30/07", categoria: "Telefonia", descricao: "Recarga dados", valor: 39.9 },
];

export type Repasse = {
  id: string;
  periodo: string;
  origem: string;
  previsto: number;
  recebido: number;
  status: "Recebido" | "Pendente" | "Atrasado";
};

export const repasses: Repasse[] = [
  { id: "r1", periodo: "28/07 – 03/08", origem: "iFood", previsto: 651, recebido: 651, status: "Recebido" },
  { id: "r2", periodo: "28/07 – 03/08", origem: "Rappi", previsto: 148.3, recebido: 0, status: "Pendente" },
  { id: "r3", periodo: "21/07 – 27/07", origem: "Rappi", previsto: 212.4, recebido: 0, status: "Atrasado" },
  { id: "r4", periodo: "21/07 – 27/07", origem: "iFood", previsto: 574.2, recebido: 574.2, status: "Recebido" },
];

export type Manutencao = {
  id: string;
  item: string;
  ultimaKm: number;
  intervaloKm: number;
  custoEstimado: number;
  oficina: string;
};

export const odometroAtual = 84210;

export const manutencoes: Manutencao[] = [
  { id: "m1", item: "Troca de óleo", ultimaKm: 82000, intervaloKm: 3000, custoEstimado: 120, oficina: "Moto Center" },
  { id: "m2", item: "Relação (corrente)", ultimaKm: 78000, intervaloKm: 12000, custoEstimado: 320, oficina: "Moto Center" },
  { id: "m3", item: "Pneu traseiro", ultimaKm: 76500, intervaloKm: 15000, custoEstimado: 410, oficina: "Pneus Rápido" },
  { id: "m4", item: "Pastilha de freio", ultimaKm: 81200, intervaloKm: 8000, custoEstimado: 95, oficina: "Moto Center" },
  { id: "m5", item: "Revisão geral", ultimaKm: 72000, intervaloKm: 10000, custoEstimado: 260, oficina: "Concessionária" },
];

export function statusManutencao(m: Manutencao) {
  const percorrido = odometroAtual - m.ultimaKm;
  const restante = m.intervaloKm - percorrido;
  const progresso = Math.min(100, Math.round((percorrido / m.intervaloKm) * 100));
  const nivel: "ok" | "atencao" | "vencido" =
    restante <= 0 ? "vencido" : restante <= m.intervaloKm * 0.2 ? "atencao" : "ok";
  return { percorrido, restante, progresso, nivel };
}
