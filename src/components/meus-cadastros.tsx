import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SectionCard } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { salvarCadastrosFn } from "@/lib/auth.functions";
import { cartaoDe, normalizaCartao } from "@/lib/pagamentos";
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

const GRUPOS: { tipo: TipoCadastro; titulo: string; chave: "cartoes" | "categorias" | "plataformas"; exemplo: string }[] = [
  { tipo: "cartao", titulo: "Cartões de crédito", chave: "cartoes", exemplo: "Ex.: Nubank" },
  { tipo: "categoria", titulo: "Categorias de despesa", chave: "categorias", exemplo: "Ex.: Lavagem" },
  { tipo: "aplicativo", titulo: "Aplicativos", chave: "plataformas", exemplo: "Ex.: iFood" },
];
const CHAVE: Record<TipoCadastro, "cartoes" | "categorias" | "plataformas"> = {
  cartao: "cartoes",
  categoria: "categorias",
  aplicativo: "plataformas",
};

export function MeusCadastros() {
  const { data } = useQuery(painelQueryOptions());
  const qc = useQueryClient();
  const renomear = useServerFn(renomearCadastroFn);
  const [editando, setEditando] = useState<{ tipo: TipoCadastro; de: string; para: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [novos, setNovos] = useState<Record<TipoCadastro, string>>({ cartao: "", categoria: "", aplicativo: "" });
  const ctx = useRouteContext({ from: "__root__" });
  const router = useRouter();
  const salvarCadastros = useServerFn(salvarCadastrosFn);
  const salvos = {
    cartoes: ctx.usuario?.cartoes ?? [],
    categorias: ctx.usuario?.categorias ?? [],
    plataformas: ctx.usuario?.plataformas ?? [],
  };

  async function gravarLista(tipo: TipoCadastro, lista: string[]) {
    await salvarCadastros({ data: { [CHAVE[tipo]]: lista } });
    await router.invalidate();
  }

  async function adicionar(tipo: TipoCadastro) {
    let nome = novos[tipo].trim();
    if (tipo === "cartao") nome = normalizaCartao(nome);
    if (!nome) return;
    if (listas[tipo].some((i) => mesmoNome(i.nome, nome))) {
      toast.info(`"${nome}" já está na lista.`);
      return;
    }
    setSalvando(true);
    try {
      await gravarLista(tipo, [...salvos[CHAVE[tipo]], nome]);
      setNovos({ ...novos, [tipo]: "" });
      toast.success(`"${nome}" adicionado.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível adicionar.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerSalvo(tipo: TipoCadastro, nome: string) {
    setSalvando(true);
    try {
      await gravarLista(tipo, salvos[CHAVE[tipo]].filter((n) => !mesmoNome(n, nome)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível remover.");
    } finally {
      setSalvando(false);
    }
  }

  const listasBase = useMemo<Record<TipoCadastro, Item[]>>(
    () => ({
      cartao: contar([
        ...(data?.despesas ?? []).map((d) => cartaoDe(d.descricao)),
        ...(data?.abastecimentos ?? []).map((a) => a.cartao),
        ...(data?.manutencoes ?? []).map((m) => m.cartao),
      ]),
      categoria: contar((data?.despesas ?? []).map((d) => d.categoria).filter((c) => c !== "—")),
      aplicativo: contar([
        ...(data?.ganhos ?? []).map((g) => g.plataforma),
        ...(data?.repasses ?? []).map((r) => r.aplicativo),
      ]),
    }),
    [data],
  );
  const listas: Record<TipoCadastro, Item[]> = {
    cartao: [...listasBase.cartao],
    categoria: [...listasBase.categoria],
    aplicativo: [...listasBase.aplicativo],
  };
  for (const g of GRUPOS) {
    for (const n of salvos[g.chave]) {
      if (!listas[g.tipo].some((i) => mesmoNome(i.nome, n))) listas[g.tipo].push({ nome: n, usos: 0 });
    }
    listas[g.tipo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  async function salvar() {
    if (!editando) return;
    const para = editando.para.trim();
    if (!para || para === editando.de) return setEditando(null);
    setSalvando(true);
    try {
      const r = await renomear({ data: { tipo: editando.tipo, de: editando.de, para } });
      const lista = salvos[CHAVE[editando.tipo]];
      if (lista.some((n) => mesmoNome(n, editando.de)) || r.alterados === 0) {
        await gravarLista(editando.tipo, [...lista.filter((n) => !mesmoNome(n, editando.de)), para]);
      }
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
      description="Adicione novos nomes ou corrija um existente: todos os lançamentos com ele são atualizados. Use o mesmo nome de outro item para juntar os dois."
    >
      <div className="space-y-5">
        {GRUPOS.map(({ tipo, titulo, exemplo }) => (
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
                          <span className="text-xs text-muted-foreground">
                            {it.usos ? `${it.usos} uso(s)` : "sem uso"}
                          </span>
                          {it.usos === 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={salvando}
                              onClick={() => removerSalvo(tipo, it.nome)}
                              aria-label={`Remover ${it.nome}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
            <div className="flex gap-2">
              <Input
                value={novos[tipo]}
                placeholder={exemplo}
                onChange={(e) => setNovos({ ...novos, [tipo]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && adicionar(tipo)}
                className="h-9"
                aria-label={`Adicionar em ${titulo}`}
              />
              <Button size="sm" variant="outline" onClick={() => adicionar(tipo)} disabled={salvando || !novos[tipo].trim()}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
