import { createFileRoute, Link, Outlet, useRouteContext } from "@tanstack/react-router";

import { PageHeader, SectionCard } from "@/components/shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Rota Control" },
      {
        name: "description",
        content: "Painel do administrador: usuários, métricas globais e categorias padrão do app.",
      },
      { property: "og:title", content: "Administração — Rota Control" },
      {
        property: "og:description",
        content: "Painel do administrador: usuários, métricas globais e categorias padrão do app.",
      },
    ],
  }),
  component: AdminLayout,
});

const ABAS = [
  { to: "/admin", rotulo: "Visão geral", exato: true },
  { to: "/admin/usuarios", rotulo: "Usuários", exato: false },
  { to: "/admin/assinaturas", rotulo: "Assinaturas", exato: false },
  { to: "/admin/relatorios", rotulo: "Relatórios", exato: false },
] as const;

function AdminLayout() {
  const context = useRouteContext({ from: "__root__" });
  const admin = context.usuario?.isAdmin === true;

  if (!admin) {
    return (
      <div className="space-y-4">
        <PageHeader title="Administração" subtitle="Área restrita" />
        <SectionCard title="Acesso negado">
          <p className="text-sm text-muted-foreground">
            Esta área é exclusiva do administrador do app.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Administração" subtitle="Usuários, métricas, categorias e relatórios" />

      <nav className="flex gap-2 overflow-x-auto">
        {ABAS.map((aba) => (
          <Link
            key={aba.to}
            to={aba.to}
            activeOptions={{ exact: aba.exato }}
            className={cn(
              "rounded-md border border-border px-3 py-2 text-sm font-medium whitespace-nowrap",
              "text-muted-foreground transition-colors hover:text-foreground",
            )}
            activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
          >
            {aba.rotulo}
          </Link>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
