/**
 * Integração com o Google AdMob (Capacitor).
 *
 * Só funciona dentro do aplicativo Android/iOS compilado.
 * No navegador e no preview, todas as funções são no-op.
 *
 * Banners Android usam os blocos reais. iOS e interstitial ainda usam
 * os IDs de teste do Google; interstitial não está ativo nas telas.
 */

export const ADMOB_BANNER_ID_ANDROID = "ca-app-pub-2715745778380480/4859804306";
export const ADMOB_BANNER_ID_IOS = "ca-app-pub-3940256099942544/2934735716";
export const ADMOB_INTERSTITIAL_ID_ANDROID = "ca-app-pub-2715745778380480/4347672561";
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
  await AdMob.initialize({ initializeForTesting: false });
  inicializado = true;
}

/** Exibe o banner ancorado na parte inferior da tela. */
export async function mostrarBanner(adIdAndroid = ADMOB_BANNER_ID_ANDROID): Promise<boolean> {
  if (!(await ehAppNativo())) return false;
  try {
    await inicializar();
    const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
    const plat = await plataforma();
    await AdMob.showBanner({
      adId: plat === "ios" ? ADMOB_BANNER_ID_IOS : adIdAndroid,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: false,
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
      isTesting: false,
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

/** Lançamentos salvos entre um intersticial e outro. */
export const LANCAMENTOS_POR_INTERSTICIAL = 3;
/** Intervalo mínimo entre intersticiais (ms). */
export const INTERVALO_MIN_INTERSTICIAL_MS = 5 * 60 * 1000;

let usuarioFree = false;
let contadorLancamentos = 0;
let ultimoIntersticial = 0;

/** Informado pelo controlador de anúncios: só usuários Free veem intersticial. */
export function definirUsuarioFree(free: boolean) {
  usuarioFree = free;
}

/** Decide se deve exibir o intersticial após um lançamento (regra pura). */
export function deveMostrarIntersticial(contador: number, ultimo: number, agora: number): boolean {
  return (
    contador >= LANCAMENTOS_POR_INTERSTICIAL && agora - ultimo >= INTERVALO_MIN_INTERSTICIAL_MS
  );
}

/** Chamado após salvar um lançamento novo. */
export async function registrarLancamentoParaAnuncio(): Promise<void> {
  if (!usuarioFree) return;
  contadorLancamentos += 1;
  const agora = Date.now();
  if (!deveMostrarIntersticial(contadorLancamentos, ultimoIntersticial, agora)) return;
  if (!(await prepararInterstitial())) return;
  if (await mostrarInterstitial()) {
    contadorLancamentos = 0;
    ultimoIntersticial = agora;
  }
}
