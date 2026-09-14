/**
 * Integração com o Google AdSense (web).
 *
 * Só carrega no navegador. No app nativo (Capacitor) o AdMob é usado.
 * Usuários Premium não veem anúncios no site.
 */

export const ADSENSE_CLIENT = "ca-pub-2715745778380480";

const SCRIPT_ID = "adsbygoogle-script";
let inicializado = false;

async function ehAppNativo(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Injeta o script do AdSense no <head> quando apropriado.
 *
 * @param isPremium - Se true, não carrega anúncios (usuário Premium).
 */
export async function inicializarAdSense(isPremium: boolean): Promise<void> {
  if (typeof window === "undefined") return;
  if (isPremium) return;
  if (inicializado || document.getElementById(SCRIPT_ID)) return;
  if (await ehAppNativo()) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
  inicializado = true;
}
