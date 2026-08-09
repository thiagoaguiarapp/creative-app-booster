import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Bike, Crown, Fuel, Home, ListChecks, LogOut, Receipt, Wallet, Wrench } from "lucide-react";
import { useState } from "react";

import logoAsset from "@/assets/logo.png.asset.json";
import { PremiumDialog } from "@/components/premium-dialog";
import { sairFn } from "@/lib/auth.functions";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
];

export function AppSidebar({ email }: { email?: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const router = useRouter();
  const sair = useServerFn(sairFn);
  const [saindo, setSaindo] = useState(false);


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <img
            src={logoAsset.url}
            alt="Rota Control"
            className="size-8 shrink-0 rounded-md bg-sidebar-primary object-cover"
          />
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

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <PremiumDialog
              trigger={
                <SidebarMenuButton tooltip="Seja Premium — remova os anúncios">
                  <Crown className="size-4 text-primary" />
                  <span>Seja Premium</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && email && (
          <p className="truncate px-2 pt-1 text-[11px] text-muted-foreground">{email}</p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              disabled={saindo}
              onClick={async () => {
                setSaindo(true);
                try {
                  await sair();
                  await router.invalidate();
                  router.navigate({ to: "/auth", replace: true });
                } finally {
                  setSaindo(false);
                }
              }}
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>

  );
}
