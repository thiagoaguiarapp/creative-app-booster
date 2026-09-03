/**
 * Integração com o Google AdMob (Capacitor).
 *
 * Só funciona dentro do aplicativo Android/iOS compilado.
 * No navegador e no preview, todas as funções são no-op.
 *
 * IDs abaixo são os oficiais de TESTE do Google. Substitua pelos IDs
 * reais dos seus blocos de anúncio antes de publicar na Play Store.
 */

export const ADMOB_BANNER_ID_ANDROID = "ca-app-pub-3940256099942544/6300978111";
export const ADMOB_BANNER_ID_IOS = "ca-app-pub-3940256099942544/2934735716";
export const ADMOB_INTERSTITIAL_ID_ANDROID = "ca-app-pub-3940256099942544/1033173712";
export const ADMOB_INTERSTITIAL_ID_IOS = "ca-app-pub-3940256099942544/4411468910";

/** Altura reservada no rodapé para o banner (dp). */
export const ALTURA_BANNER = 60;

let inicializado = false;
let bannerVisivel = false;

/** Verdadeiro apenas dentro do app nativo (Android/iOS). */
export async function ehAppNativo(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function plataforma(): Promise<"android" | "ios" | "web"> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.getPlatform() as "android" | "ios" | "web";
  } catch {
    return "web";
  }
}

async function inicializar() {
  if (inicializado) return;
  const { AdMob } = await import("@capacitor-community/admob");
  await AdMob.initialize({ initializeForTesting: true });
  inicializado = true;
}

/** Exibe o banner ancorado na parte inferior da tela. */
export async function mostrarBanner(): Promise<boolean> {
  if (!(await ehAppNativo())) return false;
  try {
    await inicializar();
    const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
    const plat = await plataforma();
    await AdMob.showBanner({
      adId: plat === "ios" ? ADMOB_BANNER_ID_IOS : ADMOB_BANNER_ID_ANDROID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
    });
    bannerVisivel = true;
    return true;
  } catch {
    // AdMob indisponível — o app continua funcionando sem anúncio.
    return false;
  }
}

/** Remove o banner (usado quando o usuário vira Premium ou sai da tela). */
export async function esconderBanner(): Promise<void> {
  if (!bannerVisivel) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.removeBanner();
  } catch {
    // ignora
  } finally {
    bannerVisivel = false;
  }
}

/** Pré-carrega um interstitial (etapa futura, já preparada). */
export async function prepararInterstitial(): Promise<boolean> {
  if (!(await ehAppNativo())) return false;
  try {
    await inicializar();
    const { AdMob } = await import("@capacitor-community/admob");
    const plat = await plataforma();
    await AdMob.prepareInterstitial({
      adId: plat === "ios" ? ADMOB_INTERSTITIAL_ID_IOS : ADMOB_INTERSTITIAL_ID_ANDROID,
      isTesting: true,
    });
    return true;
  } catch {
    return false;
  }
}

/** Exibe o interstitial previamente preparado. */
export async function mostrarInterstitial(): Promise<boolean> {
  if (!(await ehAppNativo())) return false;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.showInterstitial();
    return true;
  } catch {
    return false;
  }
}
