import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Bike, Eraser, Fuel, Home, ListChecks, Receipt, Wallet, Wrench } from "lucide-react";

import logoAsset from "@/assets/logo.png.asset.json";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Início", url: "/", icon: Home },
  { title: "Ganhos diários", url: "/ganhos-diarios", icon: Bike },
  { title: "Abastecimento", url: "/abastecimento", icon: Fuel },
  { title: "Despesas", url: "/despesas", icon: Receipt },
  { title: "Recebimento / Repasse", url: "/repasses", icon: Wallet },
  { title: "Manutenção", url: "/manutencao", icon: Wrench },
  { title: "Relatório", url: "/relatorio", icon: BarChart3 },
  { title: "Todos os lançamentos", url: "/lancamentos", icon: ListChecks },
  { title: "Limpar duplicados", url: "/limpeza", icon: Eraser },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Bike className="size-4" />
          </span>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-base font-semibold uppercase tracking-wide">
                Rota Control
              </p>
              <p className="text-[11px] text-muted-foreground">Gestão do entregador</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
