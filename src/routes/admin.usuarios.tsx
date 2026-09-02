import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Loader2, Shield, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionCard, StatCard } from "@/components/shell";
import { Input } from "@/components/ui/input";
import { resumoAdminFn } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Administração Rota Control" },
      {
        name: "description",
        content: "Lista completa de contas do app com busca, filtros por plano e status.",
      },
      { property: "og:title", content: "Usuários — Administração Rota Control" },
      {
        property: "og:description",
        content: "Lista completa de contas do app com busca, filtros por plano e status.",
      },
    ],
  }),
  component: AdminUsuarios,
});

type Filtro = "todos" | "premium" | "free" | "pendentes" | "admins";

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "premium", rotulo: "Premium" },
  { chave: "free", rotulo: "Free" },
  { chave: "pendentes", rotulo: "Pendentes" },
  { chave: "admins", rotulo: "Administradores" },
];

function dataBr(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function AdminUsuarios() {
  const carregar = useServerFn(resumoAdminFn);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-resumo"],
    queryFn: () => carregar(),
  });

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const usuarios = data?.usuarios ?? [];

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtro === "premium" && !u.premium) return false;
      if (filtro === "free" && u.premium) return false;
      if (filtro === "pendentes" && u.confirmado) return false;
      if (filtro === "admins" && u.role !== "admin") return false;
      if (!termo) return true;
      return (
        (u.nome ?? "").toLowerCase().includes(termo) ||
        (u.email ?? "").toLowerCase().includes(termo)
      );
    });
  }, [usuarios, busca, filtro]);

  const premium = usuarios.filter((u) => u.premium).length;
  const pendentes = usuarios.filter((u) => !u.confirmado).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando usuários…
        </div>
      )}
      {error && (
        <SectionCard title="Erro">
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        </SectionCard>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard label="Contas cadastradas" value={String(usuarios.length)} icon={Users} />
            <StatCard
              label="Contas premium"
              value={String(premium)}
              icon={Shield}
              tone="success"
            />
            <StatCard
              label="Confirmação pendente"
              value={String(pendentes)}
              icon={Clock}
              tone="warning"
            />
          </div>

          <SectionCard
            title="Usuários"
            description={`${lista.length} de ${usuarios.length} conta(s)`}
          >
            <div className="space-y-3">
              <Input
                value={busca}
                placeholder="Buscar por nome ou e-mail"
                onChange={(e) => setBusca(e.target.value)}
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTROS.map((f) => (
                  <button
                    key={f.chave}
                    type="button"
                    onClick={() => setFiltro(f.chave)}
                    className={cn(
                      "rounded-md border border-border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                      filtro === f.chave
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.rotulo}
                  </button>
                ))}
              </div>

              {lista.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              )}

              {/* Mobile: cards empilhados */}
              <ul className="space-y-2 lg:hidden">
                {lista.map((u) => (
                  <li key={u.id} className="rounded-md border border-border p-3">
                    <p className="font-medium">{u.nome || "—"}</p>
                    <p className="text-xs break-all text-muted-foreground">{u.email}</p>
                    {u.role === "admin" && (
                      <span className="text-[10px] uppercase tracking-wide text-primary">
                        administrador
                      </span>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <span className={u.confirmado ? "text-success" : "text-warning"}>
                        {u.confirmado ? "Confirmado" : "Pendente"}
                      </span>
                      <span>{u.premium ? "Premium" : "Free"}</span>
                      <span className="text-muted-foreground">
                        Cadastro: {dataBr(u.criadoEm)}
                      </span>
                      <span className="text-muted-foreground">
                        Acesso: {dataBr(u.ultimoAcesso)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: tabela */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2">Usuário</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Plano</th>
                      <th className="py-2">Cadastro</th>
                      <th className="py-2">Último acesso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((u) => (
                      <tr key={u.id} className="border-t border-border align-top">
                        <td className="py-2 pr-3">
                          <p className="font-medium">{u.nome || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                          {u.role === "admin" && (
                            <span className="text-[10px] uppercase tracking-wide text-primary">
                              administrador
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={u.confirmado ? "text-success" : "text-warning"}>
                            {u.confirmado ? "Confirmado" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{u.premium ? "Premium" : "Free"}</td>
                        <td className="py-2 pr-3">{dataBr(u.criadoEm)}</td>
                        <td className="py-2">{dataBr(u.ultimoAcesso)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
