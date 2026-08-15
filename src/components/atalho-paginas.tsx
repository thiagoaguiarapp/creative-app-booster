import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Bike, Fuel, Home, ListChecks, Receipt, Wallet, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";

const paginas = [
  { title: "Início", url: "/", icon: Home },
  { title: "Ganhos diários", url: "/ganhos-diarios", icon: Bike },
  { title: "Abastecimento", url: "/abastecimento", icon: Fuel },
  { title: "Despesas", url: "/despesas", icon: Receipt },
  { title: "Recebimento / Repasse", url: "/repasses", icon: Wallet },
  { title: "Manutenção", url: "/manutencao", icon: Wrench },
  { title: "Relatório", url: "/relatorio", icon: BarChart3 },
  { title: "Todos os lançamentos", url: "/lancamentos", icon: ListChecks },
];

export function AtalhoPaginas() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
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
  );
}
