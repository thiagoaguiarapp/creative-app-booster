// Abre a página do No Corre na Google Play.
//
// Dentro do app instalado, window.open(..., "_blank") não faz nada: o
// WebView do Android não abre janelas novas por padrão, então o clique no
// botão do aviso de atualização era simplesmente descartado.
//
// O que funciona é mandar a própria janela para um link de outra origem.
// O Capacitor intercepta essa navegação e entrega o endereço ao Android,
// que abre fora do app: o app da Play Store para o endereço "market://",
// ou o navegador para o endereço https.

import { LINK_PLAY_STORE, LINK_PLAY_STORE_NATIVA } from "@/lib/versao-app";

/** Tempo que a Play Store leva para aparecer na frente. */
const ESPERA_MS = 1200;

/**
 * Passado esse tempo, o relógio da página foi congelado porque o app ficou
 * em segundo plano — sinal de que a loja abriu e não precisa de fallback.
 */
const MARGEM_MS = 3000;

export async function abrirPlayStore() {
  const { Capacitor } = await import("@capacitor/core");

  // No site, o caminho de sempre continua valendo.
  if (!Capacitor.isNativePlatform()) {
    window.open(LINK_PLAY_STORE, "_blank", "noopener,noreferrer");
    return;
  }

  const inicio = Date.now();
  let saiuDoApp = false;
  const vigiar = () => {
    if (document.visibilityState === "hidden") saiuDoApp = true;
  };
  document.addEventListener("visibilitychange", vigiar);

  window.location.href = LINK_PLAY_STORE_NATIVA;

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", vigiar);
    if (saiuDoApp || document.visibilityState !== "visible") return;
    if (Date.now() - inicio > MARGEM_MS) return;
    // Aparelho sem o app da Play Store: abre a página web da loja.
    window.location.href = LINK_PLAY_STORE;
  }, ESPERA_MS);
}
