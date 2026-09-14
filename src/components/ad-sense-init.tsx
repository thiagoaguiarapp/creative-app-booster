import { useRouteContext } from "@tanstack/react-router";
import { useEffect } from "react";

import { inicializarAdSense } from "@/lib/adsense";

/**
 * Componente sem renderização visual que carrega o script do Google AdSense
 * no <head> de todas as páginas web.
 *
 * - Usuários Premium: não carrega (sem anúncios).
 * - App nativo (Android/iOS): não carrega (AdMob é usado lá).
 */
export function AdSenseInit() {
  const context = useRouteContext({ from: "__root__" });
  const isPremium = context.usuario?.isPremium ?? false;

  useEffect(() => {
    void inicializarAdSense(isPremium);
  }, [isPremium]);

  return null;
}
