import { Link } from "@tanstack/react-router";
import { BarChart3, Bike, Fuel, Home, LayoutGrid, ListChecks, Receipt, Wallet, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" variant="outline" aria-label="Atalhos de acesso às páginas">
          <LayoutGrid className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Acessar páginas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {paginas.map((item) => (
          <DropdownMenuItem key={item.url} asChild>
            <Link to={item.url} className="flex items-center gap-2">
              <item.icon className="size-4 text-muted-foreground" />
              <span>{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
