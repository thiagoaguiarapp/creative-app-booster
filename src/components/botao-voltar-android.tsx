import { useEffect } from "react";

/**
 * Botão "voltar" do Android: fecha a janela/menu aberto (envia Escape);
 * sem janela aberta, volta para a tela anterior.
 */
export function BotaoVoltarAndroid() {
  useEffect(() => {
    let remover: (() => void) | undefined;
    let cancelado = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        const h = await App.addListener("backButton", ({ canGoBack }) => {
          const aberto = document.querySelector(
            '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"], [role="listbox"]',
          );
          if (aberto) {
            const alvo = (document.activeElement as HTMLElement | null) ?? document.body;
            alvo.dispatchEvent(
              new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }),
            );
            return;
          }
          if (canGoBack || window.history.length > 1) window.history.back();
          else void App.minimizeApp();
        });
        if (cancelado) void h.remove();
        else remover = () => void h.remove();
      } catch {
        /* fora do app nativo */
      }
    })();
    return () => {
      cancelado = true;
      remover?.();
    };
  }, []);
  return null;
}
