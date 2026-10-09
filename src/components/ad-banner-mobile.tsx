import { useEffect } from "react";
import { useRouteContext } from "@tanstack/react-router";

import { ALTURA_BANNER, esconderBanner, mostrarBanner } from "@/lib/admob";

/**
 * Banner do AdMob ancorado na parte inferior, exibido apenas para usuários
 * do plano Free dentro do app nativo (Android/iOS).
 *
 * Não renderiza nada no DOM: o banner é uma camada nativa sobre a WebView.
 * O componente apenas reserva o espaço inferior para o banner não cobrir
 * a barra de navegação do app.
 */
export function AdBannerMobile() {
  const context = useRouteContext({ from: "__root__" });
  const isPremium = context.usuario?.isPremium ?? false;

  useEffect(() => {
    let ativo = true;

    if (isPremium) {
      void esconderBanner();
      document.documentElement.style.removeProperty("--altura-banner-ads");
      return;
    }

    void mostrarBanner().then((exibiu) => {
      if (!ativo || !exibiu) return;
      document.documentElement.style.setProperty(
        "--altura-banner-ads",
        `${ALTURA_BANNER}px`,
      );
    });

    return () => {
      ativo = false;
      void esconderBanner();
      document.documentElement.style.removeProperty("--altura-banner-ads");
    };
  }, [isPremium]);

  return null;
}
