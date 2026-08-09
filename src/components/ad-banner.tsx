import { useEffect, useRef } from "react";
import { useRouteContext } from "@tanstack/react-router";

import { ADSENSE_CLIENT, ADSENSE_SLOT_PADRAO, carregarAdSense } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Bloco de anúncio do Google AdSense.
 * Não é carregado nem renderizado para usuários Premium.
 */
export function AdBanner({ slot = ADSENSE_SLOT_PADRAO }: { slot?: string }) {
  const context = useRouteContext({ from: "__root__" });
  const isPremium = context.usuario?.isPremium ?? false;
  const empurrado = useRef(false);

  useEffect(() => {
    if (isPremium || empurrado.current) return;
    empurrado.current = true;
    carregarAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense indisponível (bloqueador de anúncios ou ambiente de preview)
    }
  }, [isPremium]);

  if (isPremium) return null;

  return (
    <aside aria-label="Anúncio" className="mt-6">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
