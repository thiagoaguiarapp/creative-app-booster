/**
 * Configuração do Google AdSense.
 * Substitua pelos seus identificadores reais do painel do AdSense.
 */
export const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
export const ADSENSE_SLOT_PADRAO = "YYYYYYYYYY";

const SCRIPT_ID = "google-adsense-script";

/** Injeta o script do AdSense uma única vez (somente no browser). */
export function carregarAdSense() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(s);
}
