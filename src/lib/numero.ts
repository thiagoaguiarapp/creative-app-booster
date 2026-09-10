/** Leitura de números digitados no padrão brasileiro ("1.234,56") ou com ponto ("1234.56"). */
export function paraNumeroBr(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (valor == null) return 0;
  const bruto = String(valor).trim().replace(/[^\d,.-]/g, "");
  if (!bruto) return 0;
  const comVirgula = bruto.includes(",");
  const limpo = comVirgula
    ? bruto.replace(/\./g, "").replace(",", ".")
    : bruto.replace(/\.(?=\d{3}(\D|$))/g, "");
  const n = Number.parseFloat(limpo);
  return Number.isFinite(n) ? n : 0;
}

/** ano mínimo e máximo aceitos nas datas dos lançamentos */
export const ANO_MIN = 2000;
export const anoMax = () => new Date().getFullYear() + 10;

/** aceita "aaaa-mm-dd" ou "dd/mm/aaaa" com ano plausível */
export function dataValida(valor: string): boolean {
  const texto = String(valor ?? "").trim();
  if (!texto) return true;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!iso && !br) return false;
  const ano = Number(iso ? iso[1] : br![3]);
  const mes = Number(iso ? iso[2] : br![2]);
  const dia = Number(iso ? iso[3] : br![1]);
  if (ano < ANO_MIN || ano > anoMax()) return false;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  return true;
}

/** formata em reais */
export const emReais = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
