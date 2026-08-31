import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks, Loader2, Plus, Shield, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SectionCard, StatCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resumoAdminFn, salvarCategoriasFn } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminVisaoGeral,
});

type Listas = { plataformas: string[]; combustiveis: string[]; servicos: string[] };

const GRUPOS: { chave: keyof Listas; titulo: string; exemplo: string }[] = [
  { chave: "plataformas", titulo: "Plataformas", exemplo: "Ex.: UBER, IFOOD, 99" },
  { chave: "combustiveis", titulo: "Combustíveis / postos", exemplo: "Ex.: GASOLINA, ETANOL" },
  { chave: "servicos", titulo: "Serviços de manutenção", exemplo: "Ex.: TROCA DE ÓLEO" },
];

function dataBr(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function AdminVisaoGeral() {
  const carregar = useServerFn(resumoAdminFn);
  const salvar = useServerFn(salvarCategoriasFn);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-resumo"],
    queryFn: () => carregar(),
  });

  const [listas, setListas] = useState<Listas>({
    plataformas: [],
    combustiveis: [],
    servicos: [],
  });
  const [novos, setNovos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data?.categorias) setListas(data.categorias);
  }, [data]);

  const mutation = useMutation({
    mutationFn: (categorias: Listas) => salvar({ data: { categorias } }),
    onSuccess: (salvas) => {
      setListas(salvas);
      queryClient.invalidateQueries({ queryKey: ["categorias-padrao"] });
      queryClient.invalidateQueries({ queryKey: ["admin-resumo"] });
      toast.success("Categorias atualizadas.");
    },
    onError: () => toast.error("Não foi possível salvar as categorias."),
  });

  function adicionar(chave: keyof Listas) {
    const valor = (novos[chave] ?? "").trim().toUpperCase();
    if (!valor) return;
    if (listas[chave].includes(valor)) return;
    const atualizado = { ...listas, [chave]: [...listas[chave], valor].sort() };
    setNovos((n) => ({ ...n, [chave]: "" }));
    mutation.mutate(atualizado);
  }

  function remover(chave: keyof Listas, valor: string) {
    mutation.mutate({ ...listas, [chave]: listas[chave].filter((v) => v !== valor) });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando dados…
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
            <StatCard label="Usuários cadastrados" value={String(data.totalUsuarios)} icon={Users} />
            <StatCard
              label="Lançamentos no app"
              value={String(data.totalLancamentos)}
              icon={ListChecks}
              tone="success"
            />
            <StatCard
              label="Contas premium"
              value={String(data.usuarios.filter((u) => u.premium).length)}
              icon={Shield}
              tone="warning"
            />
          </div>

          <SectionCard title="Lançamentos por módulo">
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.porTabela.map((t) => (
                <li
                  key={t.nome}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{t.nome}</span>
                  <span className="num font-semibold">{t.total}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Usuários" description={`${data.usuarios.length} conta(s)`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
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
                  {data.usuarios.map((u) => (
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
          </SectionCard>

          <SectionCard
            title="Categorias padrão"
            description="Opções que aparecem nos menus suspensos do app"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {GRUPOS.map((g) => (
                <div key={g.chave} className="rounded-md border border-border p-3">
                  <p className="font-display text-sm font-semibold uppercase tracking-wide">
                    {g.titulo}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={novos[g.chave] ?? ""}
                      placeholder={g.exemplo}
                      onChange={(e) => setNovos((n) => ({ ...n, [g.chave]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          adicionar(g.chave);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      disabled={mutation.isPending}
                      onClick={() => adicionar(g.chave)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {listas[g.chave].length === 0 && (
                      <li className="text-xs text-muted-foreground">Nenhuma opção cadastrada.</li>
                    )}
                    {listas[g.chave].map((v) => (
                      <li
                        key={v}
                        className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-sm"
                      >
                        <span>{v}</span>
                        <button
                          type="button"
                          aria-label={`Remover ${v}`}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() => remover(g.chave, v)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
