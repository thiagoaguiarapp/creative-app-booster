import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Bike, Home, Plus, User } from "lucide-react";

import { NovoLancamentoRapido } from "@/components/lancamento-form";
import { cn } from "@/lib/utils";

const esquerda = [
  { title: "Início", url: "/inicio", icon: Home },
  { title: "Entregas", url: "/lancamentos", icon: Bike },
];
const direita = [
  { title: "Financeiro", url: "/relatorio", icon: BarChart3 },
  { title: "Perfil", url: "/configuracoes", icon: User },
];

/** Navegação principal do celular: 4 abas + botão (+) central de lançamento. */
export function BarraInferior() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const Aba = ({ item }: { item: (typeof esquerda)[number] }) => {
    const ativo = pathname === item.url;
    return (
      <Link
        to={item.url}
        aria-current={ativo ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors",
          ativo ? "text-primary" : "text-muted-foreground",
        )}
      >
        <item.icon className="size-5" />
        {item.title}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ bottom: "var(--altura-banner-ads, 0px)" }}
    >
      <div className="flex items-end px-2 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {esquerda.map((i) => <Aba key={i.url} item={i} />)}
        <div className="flex flex-1 justify-center">
          <NovoLancamentoRapido
            trigger={(abrir) => (
              <button
                type="button"
                onClick={abrir}
                aria-label="Novo lançamento"
                className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
              >
                <Plus className="size-7" />
              </button>
            )}
          />
        </div>
        {direita.map((i) => <Aba key={i.url} item={i} />)}
      </div>
    </nav>
  );
}
