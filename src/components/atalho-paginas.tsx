import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Fuel, Home, ListChecks, Receipt, Wallet, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const paginas = [
  { title: "Início", short: "Início", url: "/inicio", icon: Home },
  { title: "Abastecimento", short: "Abastec.", url: "/abastecimento", icon: Fuel },
  { title: "Despesas", short: "Despesas", url: "/despesas", icon: Receipt },
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

    </>
  );
}
