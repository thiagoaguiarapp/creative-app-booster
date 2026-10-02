import { useEffect, useState } from "react";
import { ArrowUpCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CHAVE_ADIAR_AVISO,
  LINK_PLAY_STORE,
  VERSAO_NATIVA_MAIS_RECENTE,
  VERSAO_NATIVA_MAIS_RECENTE_NOME,
  VERSAO_NATIVA_MINIMA,
} from "@/lib/versao-app";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Mostra um aviso discreto quando o app instalado no celular está em uma
 * versão anterior à publicada na Google Play. Só aparece no app nativo.
 */
export function AvisoAtualizacao() {
  const [visivel, setVisivel] = useState(false);
  const [obrigatorio, setObrigatorio] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import("@capacitor/app");
        const info = await App.getInfo();
        const instalada = Number(info.build);
        if (!Number.isFinite(instalada)) return;
        if (instalada >= VERSAO_NATIVA_MAIS_RECENTE) return;

        const forcado = instalada < VERSAO_NATIVA_MINIMA;
        if (!forcado) {
          const adiado = Number(localStorage.getItem(CHAVE_ADIAR_AVISO) ?? "0");
          if (adiado && Date.now() - adiado < UM_DIA_MS) return;
        }

        if (!cancelado) {
          setObrigatorio(forcado);
          setVisivel(true);
        }
      } catch {
        // Sem informação nativa disponível: não mostra nada.
      }
    }

    void verificar();
    return () => {
      cancelado = true;
    };
  }, []);

  if (!visivel) return null;

  function adiar() {
    try {
      localStorage.setItem(CHAVE_ADIAR_AVISO, String(Date.now()));
    } catch {
      // ignora indisponibilidade de armazenamento
    }
    setVisivel(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <ArrowUpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Nova versão disponível ({VERSAO_NATIVA_MAIS_RECENTE_NOME})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {obrigatorio
              ? "Atualize o No Corre para continuar usando o aplicativo."
              : "Atualize pela Play Store para ter as melhorias mais recentes."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                window.open(LINK_PLAY_STORE, "_blank");
              }}
            >
              Atualizar agora
            </Button>
            {!obrigatorio && (
              <Button size="sm" variant="ghost" onClick={adiar}>
                Lembrar depois
              </Button>
            )}
          </div>
        </div>
        {!obrigatorio && (
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={adiar}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
