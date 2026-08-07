/** Gorjeta, caixinha, sobra de troco: entram apenas em Ganhos diários. */

const norma = (s: string) => (s ?? "").trim().toUpperCase();

export const EXTRAS_SUGERIDOS = ["Gorjeta", "Sobra troco"];

export function ehGorjeta(nome: string) {
  const n = norma(nome);
  return n.startsWith("GORJETA") || n.startsWith("CAIXINHA");
}

export function ehSobra(nome: string) {
  const n = norma(nome);
  return n.startsWith("SOBRA") || n.startsWith("TROCO");
}

export function ehExtra(nome: string) {
  return ehGorjeta(nome) || ehSobra(nome);
}
