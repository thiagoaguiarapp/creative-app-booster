import { useEffect } from "react";

import { ADSENSE_CLIENT } from "@/lib/adsense";

/**
 * Slot de anúncio display do AdSense.
 *
 * IMPORTANTE: crie um bloco de anúncio "Display responsivo" no painel do
 * Google AdSense e cole o ID (data-ad-slot) na constante abaixo.
 * Enquanto estiver com o valor de exemplo, nenhum anúncio é exibido.
 */
export const ADSENSE_SLOT_LANDING = "0000000000";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSenseSlot({ slot, className }: { slot: string; className?: string }) {
  useEffect(() => {
    if (slot === "0000000000") return;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // Script ainda não carregou ou bloqueador de anúncios — ignora.
    }
  }, [slot]);

  if (slot === "0000000000") return null;

  return (
    <ins
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
