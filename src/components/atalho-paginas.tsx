import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Bike, CreditCard, Fuel, Home, ListChecks, Receipt, Scale, Wallet, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const paginas = [
  { title: "Início", short: "Início", url: "/", icon: Home },
  { title: "Ganhos diários", short: "Ganhos", url: "/ganhos-diarios", icon: Bike },
  { title: "Abastecimento", short: "Abastec.", url: "/abastecimento", icon: Fuel },
  { title: "Despesas", short: "Despesas", url: "/despesas", icon: Receipt },
  { title: "Pagamentos", short: "Pagam.", url: "/pagamentos", icon: CreditCard },
  { title: "Fluxo de caixa", short: "Fluxo", url: "/fluxo-caixa", icon: Scale },
  { title: "Recebimento / Repasse", short: "Repasse", url: "/repasses", icon: Wallet },
  { title: "Manutenção", short: "Manut.", url: "/manutencao", icon: Wrench },
  { title: "Relatório", short: "Relatório", url: "/relatorio", icon: BarChart3 },
  { title: "Todos os lançamentos", short: "Todos", url: "/lancamentos", icon: ListChecks },
];

export function AtalhoPaginas() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Desktop: linha de ícones abaixo do título */}
      <div className="hidden flex-wrap items-center justify-center gap-2 md:flex">
        {paginas.map((item) => (
          <Button
            key={item.url}
            asChild
            size="icon"
            variant={pathname === item.url ? "default" : "outline"}
            aria-label={item.title}
            title={item.title}
          >
            <Link to={item.url}>
              <item.icon className="size-4" />
            </Link>
          </Button>
        ))}
      </div>

      {/* Mobile: barra fixa inferior */}
      <nav
        aria-label="Atalhos de navegação"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      >
        <div className="flex snap-x gap-1 overflow-x-auto px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          {paginas.map((item) => {
            const ativo = pathname === item.url;
            return (
              <Link
                key={item.url}
                to={item.url}
                aria-label={item.title}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex min-h-14 min-w-16 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
                  ativo
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5 shrink-0" />
                <span className="leading-none">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
