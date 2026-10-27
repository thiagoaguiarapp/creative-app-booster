/** Preferências visuais do app, guardadas no aparelho. */
export type CorDestaque = "ciano" | "laranja" | "verde" | "azul" | "roxo";
export type Tema = "escuro" | "claro";
export type Fonte = "normal" | "grande" | "extra";

export type Preferencias = {
  cor: CorDestaque;
  tema: Tema;
  fonte: Fonte;
  privacidade: boolean;
  vibracao: boolean;
};

export const PREFERENCIAS_PADRAO: Preferencias = {
  cor: "ciano",
  tema: "escuro",
  fonte: "normal",
  privacidade: false,
  vibracao: true,
};

const CHAVE = "nocorre-preferencias";

export function lerPreferencias(): Preferencias {
  if (typeof window === "undefined") return PREFERENCIAS_PADRAO;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? { ...PREFERENCIAS_PADRAO, ...JSON.parse(bruto) } : PREFERENCIAS_PADRAO;
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

export function aplicarPreferencias(p: Preferencias) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.dataset.cor = p.cor;
  html.dataset.tema = p.tema;
  html.dataset.fonte = p.fonte;
  html.dataset.privacidade = p.privacidade ? "on" : "off";
}

export function salvarPreferencias(p: Preferencias) {
  window.localStorage.setItem(CHAVE, JSON.stringify(p));
  aplicarPreferencias(p);
  window.dispatchEvent(new Event("nocorre-preferencias"));
}

/** Vibração curta ao confirmar algo, se o usuário deixou ligada. */
export function vibrarConfirmacao() {
  if (typeof navigator === "undefined" || !lerPreferencias().vibracao) return;
  navigator.vibrate?.(40);
}
