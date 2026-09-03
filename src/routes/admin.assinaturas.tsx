import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CreditCard, Loader2, RotateCcw, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { SectionCard, StatCard } from "@/components/shell";
import { Input } from "@/components/ui/input";
import { resumoAdminFn } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/assinaturas")({
  head: () => ({
    meta: [
      { title: "Assinaturas — Administração Rota Control" },
      {
        name: "description",
        content:
          "Status das assinaturas Premium: quem assinou, quem está no plano Free e quem pode precisar restaurar a compra.",
      },
      { property: "og:title", content: "Assinaturas — Administração Rota Control" },
      {
        property: "og:description",
        content:
          "Status das assinaturas Premium: quem assinou, quem está no plano Free e quem pode precisar restaurar a compra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAssinaturas,
});

type Filtro = "todos" | "assinantes" | "free" | "restaurar";

const FILTROS: { chave: Filtro; rotulo: string }[] = [
  { chave: "todos", rotulo: "Todos" },
  { chave: "assinantes", rotulo: "Assinantes" },
  { chave: "free", rotulo: "Sem assinatura" },
  { chave: "restaurar", rotulo: "Precisa restaurar" },
];

const DIAS_INATIVO = 30;

function dataBr(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function diasDesde(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

/** premium ativo, mas sem acessar o app há muito tempo: compra pode ter se perdido na troca de aparelho */
function precisaRestaurar(u: { premium: boolean; ultimoAcesso: string }): boolean {
  if (!u.premium) return false;
  const dias = diasDesde(u.ultimoAcesso);
  return dias === null || dias >= DIAS_INATIVO;
}

function AdminAssinaturas() {
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
      if (filtro === "assinantes" && !u.premium) return false;
      if (filtro === "free" && u.premium) return false;
      if (filtro === "restaurar" && !precisaRestaurar(u)) return false;
      if (!termo) return true;
      return (
        (u.nome ?? "").toLowerCase().includes(termo) ||
        (u.email ?? "").toLowerCase().includes(termo)
      );
    });
  }, [usuarios, busca, filtro]);

  const assinantes = usuarios.filter((u) => u.premium).length;
  const restaurar = usuarios.filter(precisaRestaurar).length;
  const conversao = usuarios.length ? Math.round((assinantes / usuarios.length) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando assinaturas…
        </div>
      )}
      {error && (
        <SectionCard title="Erro">
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        </SectionCard>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Contas" value={String(usuarios.length)} icon={Users} />
            <StatCard
              label="Assinantes Premium"
              value={String(assinantes)}
              icon={CreditCard}
              tone="success"
            />
            <StatCard label="Conversão" value={`${conversao}%`} icon={CreditCard} />
            <StatCard
              label="Podem precisar restaurar"
              value={String(restaurar)}
              icon={RotateCcw}
              tone="warning"
            />
          </div>

          <SectionCard
            title="Status das assinaturas"
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
                <p className="text-sm text-muted-foreground">Nenhuma conta encontrada.</p>
              )}

              {/* Mobile: cards empilhados */}
              <ul className="space-y-2 lg:hidden">
                {lista.map((u) => (
                  <li key={u.id} className="rounded-md border border-border p-3">
                    <p className="font-medium">{u.nome || "—"}</p>
                    <p className="text-xs break-all text-muted-foreground">{u.email}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <span className={u.premium ? "text-success" : "text-muted-foreground"}>
                        {u.premium ? "Assinante Premium" : "Sem assinatura"}
                      </span>
                      <span className={u.confirmado ? "text-success" : "text-warning"}>
                        {u.confirmado ? "E-mail confirmado" : "Confirmação pendente"}
                      </span>
                      <span className="text-muted-foreground">
                        Cadastro: {dataBr(u.criadoEm)}
                      </span>
                      <span className="text-muted-foreground">
                        Acesso: {dataBr(u.ultimoAcesso)}
                      </span>
                    </div>
                    {precisaRestaurar(u) && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                        <AlertTriangle className="size-3.5" /> Pode precisar restaurar a compra
                      </p>
                    )}
                  </li>
                ))}
              </ul>

              {/* Desktop: tabela */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2">Usuário</th>
                      <th className="py-2">Assinatura</th>
                      <th className="py-2">Conta</th>
                      <th className="py-2">Cadastro</th>
                      <th className="py-2">Último acesso</th>
                      <th className="py-2">Ação sugerida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((u) => (
                      <tr key={u.id} className="border-t border-border align-top">
                        <td className="py-2 pr-3">
                          <p className="font-medium">{u.nome || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={u.premium ? "text-success" : "text-muted-foreground"}>
                            {u.premium ? "Premium" : "Free"}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span className={u.confirmado ? "text-success" : "text-warning"}>
                            {u.confirmado ? "Confirmada" : "Pendente"}
                          </span>
                        </td>
                        <td className="py-2 pr-3">{dataBr(u.criadoEm)}</td>
                        <td className="py-2 pr-3">{dataBr(u.ultimoAcesso)}</td>
                        <td className="py-2">
                          {precisaRestaurar(u) ? (
                            <span className="flex items-center gap-1.5 text-warning">
                              <AlertTriangle className="size-3.5" /> Restaurar compra
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                “Precisa restaurar” marca assinantes Premium sem acesso ao app há {DIAS_INATIVO}{" "}
                dias ou mais — normalmente troca de aparelho, em que basta usar “Restaurar compras”
                na tela Premium.
              </p>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
