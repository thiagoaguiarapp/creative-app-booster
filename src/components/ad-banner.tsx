import { ExternalLink, Sparkles } from "lucide-react";
import { useRouteContext } from "@tanstack/react-router";

/**
 * Banner de anúncio (placeholder responsivo).
 * Não é renderizado para usuários Premium.
 */
export function AdBanner({ slot = "rodape" }: { slot?: string }) {
  const context = useRouteContext({ from: "__root__" });
  const isPremium = context.usuario?.isPremium ?? false;
  if (isPremium) return null;

  return (
    <aside
      aria-label="Anúncio"
      data-ad-slot={slot}
      className="mt-6 overflow-hidden rounded-xl border border-dashed border-border bg-muted/40"
    >
      <a
        href="https://lovable.dev"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="flex flex-col items-center gap-2 px-4 py-6 text-center transition-colors hover:bg-accent/40 sm:flex-row sm:justify-between sm:text-left"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-primary/10 p-2 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Publicidade
            </p>
            <p className="text-sm font-medium text-foreground">
              Espaço reservado para anúncios do parceiro
            </p>
            <p className="text-xs text-muted-foreground">
              Assine o Premium para navegar sem anúncios.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          Saiba mais <ExternalLink className="size-3" />
        </span>
      </a>
    </aside>
  );
}
