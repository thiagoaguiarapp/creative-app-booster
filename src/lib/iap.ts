/**
 * Compras dentro do app (In-App Purchases) via RevenueCat + Google Play.
 *
 * Só funciona dentro do app Android/iOS compilado. No navegador todas as
 * funções retornam um resultado "indisponível", sem quebrar a tela.
 *
 * Configure a chave pública do RevenueCat em VITE_REVENUECAT_ANDROID_KEY
 * (e VITE_REVENUECAT_IOS_KEY, se publicar na App Store).
 */

/** Identificador do entitlement configurado no painel do RevenueCat. */
export const ENTITLEMENT_PREMIUM = "premium";
/** Identificador do produto de assinatura mensal na Google Play. */
export const PRODUTO_MENSAL = "rota_control_premium_mensal";

export type ResultadoCompra =
  | { ok: true; premium: boolean }
  | { ok: false; motivo: "indisponivel" | "cancelado" | "erro"; mensagem?: string | undefined };

let configurado = false;

export async function ehAppNativo(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function chaveApi(): Promise<string | undefined> {
  const { Capacitor } = await import("@capacitor/core");
  const plat = Capacitor.getPlatform();
  const env = import.meta.env as Record<string, string | undefined>;
  return plat === "ios"
    ? env["VITE_REVENUECAT_IOS_KEY"]
    : env["VITE_REVENUECAT_ANDROID_KEY"];
}

async function configurar() {
  if (configurado) return;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const apiKey = await chaveApi();
  if (!apiKey) throw new Error("Chave do RevenueCat não configurada.");
  await Purchases.configure({ apiKey });
  configurado = true;
}

function temPremium(info: { entitlements: { active: Record<string, unknown> } }) {
  return Boolean(info.entitlements.active[ENTITLEMENT_PREMIUM]);
}

/** Preço formatado da assinatura mensal, quando disponível na loja. */
export async function precoAssinatura(): Promise<string | null> {
  if (!(await ehAppNativo())) return null;
  try {
    await configurar();
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const ofertas = await Purchases.getOfferings();
    const pacote = ofertas.current?.availablePackages?.[0];
    return pacote?.product?.priceString ?? null;
  } catch {
    return null;
  }
}

/** Abre o fluxo de compra da Google Play para a assinatura mensal. */
export async function comprarAssinatura(): Promise<ResultadoCompra> {
  if (!(await ehAppNativo())) return { ok: false, motivo: "indisponivel" };
  try {
    await configurar();
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const ofertas = await Purchases.getOfferings();
    const pacote = ofertas.current?.availablePackages?.[0];
    if (!pacote) {
      return { ok: false, motivo: "erro", mensagem: "Assinatura indisponível na loja." };
    }
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pacote });
    return { ok: true, premium: temPremium(customerInfo) };
  } catch (err) {
    const e = err as { code?: string; userCancelled?: boolean; message?: string };
    if (e?.userCancelled) return { ok: false, motivo: "cancelado" };
    return { ok: false, motivo: "erro", mensagem: e?.message };
  }
}

/** Recupera assinaturas já compradas com a mesma conta Google. */
export async function restaurarCompras(): Promise<ResultadoCompra> {
  if (!(await ehAppNativo())) return { ok: false, motivo: "indisponivel" };
  try {
    await configurar();
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    return { ok: true, premium: temPremium(customerInfo) };
  } catch (err) {
    return { ok: false, motivo: "erro", mensagem: (err as Error)?.message };
  }
}
