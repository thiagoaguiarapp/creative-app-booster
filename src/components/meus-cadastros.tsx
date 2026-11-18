import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Pencil, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartaoDe } from "@/lib/pagamentos";
import { painelQueryOptions } from "@/lib/painel-query";
import { renomearCadastroFn } from "@/lib/renomear-cadastro.functions";
import { mesmoNome, type TipoCadastro } from "@/lib/renomear-cadastro";

type Item = { nome: string; usos: number };

function contar(valores: (string | undefined)[]): Item[] {
  const mapa: Item[] = [];
  for (const v of valores) {
    const t = v?.trim();
    if (!t) continue;
    const it = mapa.find((i) => mesmoNome(i.nome, t));
    if (it) it.usos++;
    else mapa.push({ nome: t, usos: 1 });
  }
  return mapa.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

const GRUPOS: { tipo: TipoCadastro; titulo: string }[] = [
  { tipo: "cartao", titulo: "Cartões de crédito" },
  { tipo: "categoria", titulo: "Categorias de despesa" },
  { tipo: "aplicativo", titulo: "Aplicativos" },
];

export function MeusCadastros() {
  const { data } = useQuery(painelQueryOptions());
  const qc = useQueryClient();
  const renomear = useServerFn(renomearCadastroFn);
  const [editando, setEditando] = useState<{ tipo: TipoCadastro; de: string; para: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  const listas = useMemo<Record<TipoCadastro, Item[]>>(
    () => ({
      cartao: contar([
        ...(data?.despesas ?? []).map((d) => cartaoDe(d.descricao)),
        ...(data?.abastecimentos ?? []).map((a) => a.cartao),
        ...(data?.manutencoes ?? []).map((m) => m.cartao),
      ]),
      categoria: contar((data?.despesas ?? []).map((d) => d.categoria)),
      aplicativo: contar([
        ...(data?.ganhos ?? []).map((g) => g.plataforma),
        ...(data?.repasses ?? []).map((r) => r.aplicativo),
      ]),
    }),
    [data],
  );

  async function salvar() {
    if (!editando) return;
    const para = editando.para.trim();
    if (!para || para === editando.de) return setEditando(null);
    setSalvando(true);
    try {
      const r = await renomear({ data: { tipo: editando.tipo, de: editando.de, para } });
      toast.success(`Nome alterado em ${r.alterados} lançamento(s).`);
      setEditando(null);
      await qc.invalidateQueries({ queryKey: ["painel"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível alterar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SectionCard
      title="Cartões, categorias e aplicativos"
      description="Corrija um nome e todos os lançamentos com ele são atualizados. Use o mesmo nome de outro item para juntar os dois."
    >
      <div className="space-y-5">
        {GRUPOS.map(({ tipo, titulo }) => (
          <div key={tipo} className="space-y-2">
            <p className="text-sm font-semibold">{titulo}</p>
            {listas[tipo].length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cadastrado ainda.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {listas[tipo].map((it) => {
                  const ativo = editando?.tipo === tipo && editando.de === it.nome;
                  return (
                    <li key={it.nome} className="flex items-center gap-2 px-3 py-2">
                      {ativo ? (
                        <>
                          <Input
                            autoFocus
                            value={editando.para}
                            onChange={(e) => setEditando({ ...editando, para: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && salvar()}
                            className="h-9"
                            aria-label={`Novo nome para ${it.nome}`}
                          />
                          <Button size="icon" onClick={salvar} disabled={salvando} aria-label="Salvar">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditando(null)} aria-label="Cancelar">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 truncate text-sm">{it.nome}</span>
                          <span className="text-xs text-muted-foreground">{it.usos} uso(s)</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditando({ tipo, de: it.nome, para: it.nome })}
                            aria-label={`Editar ${it.nome}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
