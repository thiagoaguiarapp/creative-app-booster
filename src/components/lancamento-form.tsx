import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Bike,
  ChevronRight,
  Fuel,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";


import {
  CAMPOS,
  FORMAS_RECEBIMENTO,
  TITULOS,
  paraInputDate,
  type Tipo,
} from "@/lib/entry-schema";
import { EXTRAS_SUGERIDOS, ehExtra } from "@/lib/extras";
import { acharManutencaoAtiva, ehCategoriaManutencao } from "@/lib/manutencao-link";
import { dataValida, emReais, paraNumeroBr } from "@/lib/numero";
import {
  isoCompra,
  limpaDescricao,
  semMarcaParcela,
  totalParcelas,
} from "@/lib/pagamentos";
import { painelQueryOptions } from "@/lib/painel-query";
import { categoriasQueryOptions } from "@/lib/categorias-query";
import { excluirLancamentoFn, salvarLancamentoFn } from "@/lib/painel.functions";


function normalizaTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** casa o valor salvo com uma das opções do select, sem diferenciar maiúsculas/acentos */
function casaOpcao(valor: string, opcoes: string[]): string {
  const alvo = normalizaTexto(valor);
  return opcoes.find((o) => normalizaTexto(o) === alvo) ?? valor;
}

function valoresIniciais(
  tipo: Tipo,
  registro?: Record<string, unknown>,
  iniciais?: Record<string, string>,
) {
  const out: Record<string, string> = {};
  for (const campo of CAMPOS[tipo]) {
    const bruto = registro?.[campo.key];
    if (campo.tipo === "date") {
      out[campo.key] = registro ? paraInputDate(String(bruto ?? "")) : "";
    } else if (bruto === undefined || bruto === null) {
      out[campo.key] = "";
    } else if (typeof bruto === "number") {
      out[campo.key] = bruto ? String(bruto) : "";
    } else {
      out[campo.key] = String(bruto) === "—" ? "" : String(bruto);
    }
    if (campo.tipo === "select" && campo.opcoes && out[campo.key]) {
      out[campo.key] = casaOpcao(out[campo.key]!, campo.opcoes);
      // valor antigo "Crédito" -> decide entre à vista e parcelado pela marca (n/total)
      if (campo.key === "pagamento" && normalizaTexto(out[campo.key]!) === "credito") {
        const descricao = String(registro?.["descricao"] ?? registro?.["observacao"] ?? "");
        out[campo.key] = /\(\d+\s*\/\s*\d+\)/.test(descricao)
          ? "Crédito parcelado"
          : "Crédito à vista";
      }
    }
    const inicial = iniciais?.[campo.key];
    if (inicial !== undefined && (!registro || inicial.trim() !== "")) {
      out[campo.key] = inicial;
    }

  }

  // despesa no crédito: os campos de parcela vêm das marcas internas do lançamento
  if (tipo === "despesa" && registro && /cr[eé]dito/i.test(String(registro["pagamento"] ?? ""))) {
    const descricao = String(registro["descricao"] ?? "");
    const isoLinha =
      String(registro["iso"] ?? "") || paraInputDate(String(registro["data"] ?? ""));
    out["dataPrimeiraParcela"] = isoLinha;
    out["data"] = isoCompra(descricao, isoLinha);
    const total = totalParcelas(descricao);
    if (total > 1) out["parcelas"] = String(total);
    out["descricao"] = semMarcaParcela(limpaDescricao(descricao));
  }

  // datas gravadas com ano impossível (ex.: "206") abrem em branco para serem corrigidas
  for (const campo of CAMPOS[tipo]) {
    if (campo.tipo !== "date") continue;
    const atual = out[campo.key];
    if (atual && !dataValida(atual)) out[campo.key] = "";
  }

  return out;
}

function numeroBr(valor: string | undefined): number {
  return paraNumeroBr(valor);
}


function useCategorias() {
  const { data } = useQuery(categoriasQueryOptions());
  return data ?? { plataformas: [], combustiveis: [], servicos: [] };
}

function usePlataformas(tipo: Tipo): string[] {
  const { data } = useQuery(painelQueryOptions());
  const categorias = useCategorias();
  const nomes = new Set<string>(categorias.plataformas);
  for (const g of data?.ganhos ?? []) if (g.plataforma?.trim()) nomes.add(g.plataforma.trim());
  for (const r of data?.repasses ?? []) if (r.aplicativo?.trim()) nomes.add(r.aplicativo.trim());
  if (tipo === "ganho") for (const e of EXTRAS_SUGERIDOS) nomes.add(e);
  const lista = Array.from(nomes);
  const filtrada = tipo === "ganho" ? lista : lista.filter((n) => !ehExtra(n));
  return filtrada.sort((a, b) => a.localeCompare(b, "pt-BR"));
}


/** Veículos cadastrados em Configurações + nomes já usados nos lançamentos. */
function useVeiculos(): { nomes: string[]; padrao: string } {
  const context = useRouteContext({ from: "__root__" });
  const { data } = useQuery(painelQueryOptions());
  const cadastrados = context.usuario?.veiculos ?? [];
  const nomes = new Set<string>();
  for (const v of cadastrados) if (v.nome.trim()) nomes.add(v.nome.trim());
  for (const m of data?.manutencoes ?? []) {
    const n = m.veiculo?.trim();
    if (n && n !== "—") nomes.add(n);
  }
  const padrao = (cadastrados.find((v) => v.padrao) ?? cadastrados[0])?.nome.trim() ?? "";
  return { nomes: Array.from(nomes).sort((a, b) => a.localeCompare(b, "pt-BR")), padrao };
}

function useFormas(): string[] {
  const { data } = useQuery(painelQueryOptions());
  const nomes = new Set<string>(FORMAS_RECEBIMENTO);
  for (const r of data?.repasses ?? []) {
    const f = r.forma?.trim();
    if (f && f !== "—") nomes.add(f);
  }
  return Array.from(nomes).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Serviços já usados na tela de manutenção + categorias do admin (sem duplicar por digitação). */
function useServicos(): string[] {
  const { data } = useQuery(painelQueryOptions());
  const categorias = useCategorias();
  const nomes = new Map<string, string>();
  const add = (s?: string) => {
    const t = s?.trim();
    if (!t || t === "—") return;
    const k = t.toLocaleLowerCase("pt-BR");
    if (!nomes.has(k)) nomes.set(k, t);
  };
  for (const s of categorias.servicos) add(s);
  for (const m of data?.manutencoes ?? []) add(m.servico);
  return Array.from(nomes.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function useInvalidarPainel() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["painel"] });
}

function FormularioDialog({
  tipo,
  row,
  registro,
  iniciais,
  titulo,
  aberto,
  onOpenChange,
  semPagamento = false,
}: {
  tipo: Tipo;
  row?: string;
  registro?: Record<string, unknown>;
  iniciais?: Record<string, string>;
  titulo?: string;
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  /** oculta forma de pagamento/parcelas (manutenção encadeada a uma despesa) */
  semPagamento?: boolean;
}) {
  const veiculos = useVeiculos();
  const [valores, setValores] = useState(() => {
    const base = valoresIniciais(tipo, registro, iniciais);
    if (!registro && !base["veiculo"] && veiculos.padrao && "veiculo" in base) {
      base["veiculo"] = veiculos.padrao;
    }
    return base;
  });
  const [seguinte, setSeguinte] = useState<{
    row?: string;
    registro?: Record<string, unknown>;
    iniciais: Record<string, string>;
    titulo: string;
  } | null>(null);
  const salvar = useServerFn(salvarLancamentoFn);
  const plataformas = usePlataformas(tipo);
  const formas = useFormas();
  const categorias = useCategorias();
  const servicos = useServicos();
  const [servicoOutro, setServicoOutro] = useState(false);
  const [veiculoOutro, setVeiculoOutro] = useState(false);
  const invalidar = useInvalidarPainel();
  const { data: painel } = useQuery(painelQueryOptions());

  const litros = numeroBr(valores["litros"]);
  const precoLitro = numeroBr(valores["precoLitro"]);
  const comDesconto = (valores["temDesconto"] ?? "") === "Sim";
  const descontoTotal = comDesconto
    ? Math.max(numeroBr(valores["desconto"]), litros * numeroBr(valores["descontoLitro"]))
    : 0;
  const totalCalculado = Math.max(0, litros * precoLitro - descontoTotal);

  useEffect(() => {
    if (tipo !== "abastecimento") return;
    if (litros <= 0 || precoLitro <= 0) return;
    const alvo = totalCalculado.toFixed(2);
    setValores((v) => (v["valorPago"] === alvo ? v : { ...v, valorPago: alvo }));
  }, [tipo, litros, precoLitro, totalCalculado]);



  const existente =
    tipo === "manutencao" && !row
      ? acharManutencaoAtiva(
          painel?.manutencoes ?? [],
          valores["servico"] ?? "",
          valores["veiculo"] ?? "",
        )
      : undefined;

  const mutation = useMutation({
    mutationFn: (v: Record<string, string>) =>
      salvar({ data: row ? { tipo, valores: v, row } : { tipo, valores: v } }),
    onSuccess: async (_r, v) => {
      await invalidar();
      toast.success(row ? "Lançamento atualizado na planilha." : "Lançamento salvo na planilha.");
      if (tipo === "despesa" && !row && ehCategoriaManutencao(v["categoria"] ?? "")) {
        const servico = (v["descricao"] ?? "").trim() || (v["categoria"] ?? "").trim();
        const ativa = acharManutencaoAtiva(painel?.manutencoes ?? [], servico);
        const base: Record<string, string> = {
          data: v["data"] ?? "",
          servico,
        };
        setSeguinte(
          ativa
            ? {
                row: ativa.row,
                registro: ativa as unknown as Record<string, unknown>,
                iniciais: base,
                titulo: "Atualizar manutenção existente",
              }
            : { iniciais: base, titulo: "Registrar manutenção do serviço" },
        );
        toast.info(
          ativa
            ? "O valor já foi lançado na despesa — aqui atualize apenas km e validade."
            : "O valor já foi lançado na despesa — complete apenas km e validade.",
        );

        return;
      }
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const CAMPOS_OCULTOS_SEM_PAGAMENTO = ["pagamento", "parcelas", "dataPrimeiraParcela", "valor"];
  const visivel = (campo: (typeof CAMPOS)[Tipo][number]) => {
    if (semPagamento && CAMPOS_OCULTOS_SEM_PAGAMENTO.includes(campo.key)) return false;
    return !campo.somenteSe || campo.somenteSe.valores.includes(valores[campo.somenteSe.key] ?? "");
  };

  // prévia do parcelamento (evita salvar valor errado sem perceber)
  const parcelasPrevia = Math.max(1, Math.trunc(numeroBr(valores["parcelas"])) || 1);
  const totalPrevia = numeroBr(valores["valor"]);
  const previaParcelamento =
    parcelasPrevia > 1 && totalPrevia > 0
      ? `${parcelasPrevia}x de ${emReais(Math.floor((totalPrevia / parcelasPrevia) * 100) / 100)} · total ${emReais(totalPrevia)}`
      : "";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const enviaveis: Record<string, string> = {};
    for (const campo of CAMPOS[tipo]) {
      if (!visivel(campo)) continue;
      const valor = valores[campo.key] ?? "";
      if (campo.obrigatorio && !valor.trim()) {
        toast.error(`Preencha "${campo.label}".`);
        return;
      }
      if (campo.tipo === "date" && valor.trim() && !dataValida(valor)) {
        toast.error(`Data inválida em "${campo.label}". Confira o dia, o mês e o ano.`);
        return;
      }
      if ((campo.tipo === "money" || campo.tipo === "number") && valor.trim()) {
        if (!/^-?[\d.,\s]+$/.test(valor.trim())) {
          toast.error(`Valor inválido em "${campo.label}".`);
          return;
        }
        const n = numeroBr(valor);
        if (n < 0) {
          toast.error(`"${campo.label}" não pode ser negativo.`);
          return;
        }
        if (campo.obrigatorio && campo.tipo === "money" && n <= 0) {
          toast.error(`Informe um valor maior que zero em "${campo.label}".`);
          return;
        }
      }
      enviaveis[campo.key] = valor;
    }
    if (semPagamento) {
      for (const key of CAMPOS_OCULTOS_SEM_PAGAMENTO) enviaveis[key] = "";
    }
    mutation.mutate(enviaveis);
  }


  if (seguinte) {
    return (
      <FormularioDialog
        tipo="manutencao"
        semPagamento
        {...(seguinte.row ? { row: seguinte.row } : {})}
        {...(seguinte.registro ? { registro: seguinte.registro } : {})}
        iniciais={seguinte.iniciais}
        titulo={seguinte.titulo}
        aberto
        onOpenChange={(v) => {
          if (!v) {
            setSeguinte(null);
            onOpenChange(false);
          }
        }}
      />
    );
  }


  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-0 translate-x-0 translate-y-0 flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border">
        <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/30 px-5 py-4 text-left sm:px-6">
          <DialogTitle className="font-display text-lg uppercase tracking-wide sm:text-xl">
            {titulo ?? `${row ? "Editar" : "Novo"} ${TITULOS[tipo]}`}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo. Os dados são gravados na sua conta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-6 sm:grid-cols-2 sm:gap-4 sm:px-6">
          {CAMPOS[tipo].filter(visivel).map((campo) => (
            <div key={campo.key} className="flex min-w-0 flex-col gap-2 sm:gap-1.5">
              <Label htmlFor={campo.key} className="text-sm sm:text-xs">{campo.label}</Label>
              {campo.key === "veiculo" && !veiculoOutro && veiculos.nomes.length > 0 ? (
                <Select
                  value={valores[campo.key] ?? ""}
                  onValueChange={(v) => {
                    if (v === "__outro__") {
                      setVeiculoOutro(true);
                      setValores((atual) => ({ ...atual, [campo.key]: "" }));
                      return;
                    }
                    setValores((atual) => ({ ...atual, [campo.key]: v }));
                  }}
                >
                  <SelectTrigger id={campo.key} className="h-12 text-base sm:h-9 sm:text-sm">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(valores[campo.key] &&
                    !veiculos.nomes.some(
                      (n) => n.toLocaleLowerCase("pt-BR") === (valores[campo.key] ?? "").toLocaleLowerCase("pt-BR"),
                    )
                      ? [valores[campo.key] ?? "", ...veiculos.nomes]
                      : veiculos.nomes
                    ).map((nome) => (
                      <SelectItem key={nome} value={nome}>
                        {nome}
                      </SelectItem>
                    ))}
                    <SelectItem value="__outro__">+ Novo veículo (digitar)…</SelectItem>
                  </SelectContent>
                </Select>
              ) : campo.key === "servico" && tipo === "manutencao" && !servicoOutro ? (
                <Select
                  value={valores[campo.key] ?? ""}
                  onValueChange={(v) => {
                    if (v === "__outro__") {
                      setServicoOutro(true);
                      setValores((atual) => ({ ...atual, [campo.key]: "" }));
                      return;
                    }
                    setValores((atual) => ({ ...atual, [campo.key]: v }));
                  }}
                >
                  <SelectTrigger id={campo.key} className="h-12 text-base sm:h-9 sm:text-sm">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {(valores[campo.key] &&
                    !servicos.some(
                      (s) => s.toLocaleLowerCase("pt-BR") === (valores[campo.key] ?? "").toLocaleLowerCase("pt-BR"),
                    )
                      ? [valores[campo.key] ?? "", ...servicos]
                      : servicos
                    ).map((nome) => (
                      <SelectItem key={nome} value={nome}>
                        {nome}
                      </SelectItem>
                    ))}
                    <SelectItem value="__outro__">+ Novo serviço (digitar)…</SelectItem>
                  </SelectContent>
                </Select>
              ) : campo.tipo === "select" ? (
                <Select
                  value={valores[campo.key] ?? ""}
                  onValueChange={(v) =>
                    setValores((atual) => ({
                      ...atual,
                      [campo.key]: v,
                      ...(campo.key === "pagamento" && !/crédito/i.test(v)
                        ? { parcelas: "", dataPrimeiraParcela: "" }
                        : {}),
                      ...(campo.key === "pagamento" && /crédito/i.test(v) && !atual["dataPrimeiraParcela"]
                        ? { dataPrimeiraParcela: atual["data"] ?? "" }
                        : {}),
                    }))
                  }
                >
                  <SelectTrigger id={campo.key} className="h-12 text-base sm:h-9 sm:text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campo.opcoes ?? []).map((opcao) => (
                      <SelectItem key={opcao} value={opcao}>
                        {opcao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={campo.key}
                  className="h-12 text-base sm:h-9 sm:text-sm"
                  type={campo.tipo === "date" ? "date" : "text"}
                  inputMode={campo.tipo === "money" || campo.tipo === "number" ? "decimal" : undefined}
                  maxLength={campo.tipo === "text" ? 120 : campo.tipo === "date" ? undefined : 15}
                  placeholder={campo.tipo === "money" ? "0,00" : undefined}
                  list={campo.sugestoes ? `sugestoes-${campo.key}` : undefined}
                  value={valores[campo.key] ?? ""}
                  onChange={(e) => {
                    const bruto = e.target.value;
                    const limpo =
                      campo.tipo === "money" || campo.tipo === "number"
                        ? bruto.replace(/[^\d.,-]/g, "")
                        : bruto;
                    setValores((v) => {
                      const prox = { ...v, [campo.key]: limpo };
                      // ao corrigir a data da compra, o vencimento acompanha
                      // quando estava vazio ou igual à data antiga
                      if (campo.tipo === "date" && campo.key === "data") {
                        const venc = v["dataPrimeiraParcela"] ?? "";
                        if (!venc || venc === (v["data"] ?? "")) {
                          prox["dataPrimeiraParcela"] = limpo;
                        }
                      }
                      return prox;
                    });
                  }}
                />

              )}
              {campo.sugestoes && (
                <datalist id={`sugestoes-${campo.key}`}>
                  {(campo.sugestoes === "forma"
                    ? formas
                    : campo.sugestoes === "veiculo"
                      ? veiculos.nomes
                      : campo.sugestoes === "servico"
                        ? categorias.servicos
                        : campo.sugestoes === "combustivel"
                          ? categorias.combustiveis
                          : plataformas
                  ).map((nome) => (
                    <option key={nome} value={nome} />
                  ))}
                </datalist>
              )}
              {tipo === "abastecimento" && campo.key === "valorPago" && litros > 0 && precoLitro > 0 && (
                <p className="text-xs text-muted-foreground">
                  {litros.toLocaleString("pt-BR")} L x R$ {precoLitro.toFixed(2)}
                  {descontoTotal > 0 ? ` - R$ ${descontoTotal.toFixed(2)} de desconto` : ""} = R${" "}
                  {totalCalculado.toFixed(2)}
                </p>
              )}
              {campo.key === "parcelas" && (
                <p className="text-xs text-muted-foreground">
                  {previaParcelamento
                    ? `${previaParcelamento} · a partir da data do pagamento`
                    : "As parcelas serão lançadas mês a mês a partir da data da 1ª parcela."}
                </p>
              )}

              {campo.key === "dataPrimeiraParcela" && (
                <p className="text-xs text-muted-foreground">
                  Se vazio, usa a data da compra.
                </p>
              )}
              {tipo === "repasse" &&
                campo.key === "aplicativo" &&
                ehExtra(valores[campo.key] ?? "") && (
                  <p className="text-xs text-warning">
                    Gorjeta e sobra de troco devem ser lançadas em Ganhos diários.
                  </p>
                )}
            </div>
          ))}


          {existente && (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm sm:col-span-2 sm:p-3 sm:text-xs">
              <p className="text-warning">
                Já existe manutenção ativa de “{existente.servico}”
                {existente.veiculo ? ` (${existente.veiculo})` : ""} em {existente.data}, km{" "}
                {existente.kmTroca.toLocaleString("pt-BR")}.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 sm:mt-2"
                onClick={() =>
                  setSeguinte({
                    row: existente.row,
                    registro: existente as unknown as Record<string, unknown>,
                    iniciais: valores,
                    titulo: "Atualizar manutenção existente",
                  })
                }
              >
                Atualizar a manutenção existente
              </Button>
            </div>
          )}
          </div>

          <DialogFooter className="shrink-0 gap-3 border-t bg-muted/30 px-5 py-5 sm:gap-2 sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full text-base sm:h-9 sm:w-auto sm:text-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="h-12 w-full text-base sm:h-9 sm:w-auto sm:text-sm" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const ROTULOS_NOVO: Record<Tipo, string> = {
  ganho: "Lançar ganho",
  abastecimento: "Lançar abastecimento",
  despesa: "Lançar despesa",
  repasse: "Lançar repasse",
  manutencao: "Lançar manutenção",
};


export function NovoLancamento({
  tipo,
  rotulo,
  iniciais,
  titulo,
  variant,
  size,
  icone: Icone = Plus,
  className,
}: {
  tipo: Tipo;
  rotulo?: string;
  iniciais?: Record<string, string>;
  titulo?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  icone?: LucideIcon;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <Button
        onClick={() => setAberto(true)}
        {...(variant ? { variant } : {})}
        {...(size ? { size } : {})}
        {...(className ? { className } : {})}
      >
        <Icone className="size-4" /> {rotulo ?? ROTULOS_NOVO[tipo]}
      </Button>
      {aberto && (
        <FormularioDialog
          tipo={tipo}
          {...(iniciais ? { iniciais } : {})}
          {...(titulo ? { titulo } : {})}
          aberto={aberto}
          onOpenChange={setAberto}
        />
      )}
    </>
  );
}

type ItemRapido = {
  id: string;
  tipo: Tipo;
  rotulo: string;
  desc: string;
  icone: LucideIcon;
  iniciais?: Record<string, string>;
  titulo?: string;
};

const TIPOS_RAPIDOS: ItemRapido[] = [
  { id: "ganho", tipo: "ganho", rotulo: "Ganho diário", desc: "Corridas e faturamento", icone: Bike },
  { id: "abastecimento", tipo: "abastecimento", rotulo: "Abastecimento", desc: "Litros e odômetro", icone: Fuel },
  { id: "despesa", tipo: "despesa", rotulo: "Despesa", desc: "Custos operacionais", icone: Receipt },
  { id: "repasse", tipo: "repasse", rotulo: "Repasse / recebimento", desc: "Valores recebidos", icone: Wallet },
  { id: "manutencao", tipo: "manutencao", rotulo: "Manutenção", desc: "Serviços e trocas", icone: Wrench },
];

function ListaTiposRapidos({ onEscolher }: { onEscolher: (item: ItemRapido) => void }) {
  return (
    <div className="grid gap-2 overflow-y-auto pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {TIPOS_RAPIDOS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onEscolher(item)}
          className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/50 active:bg-accent"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <item.icone className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{item.rotulo}</span>
            <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

/** Botão único que abre um menu rápido para escolher o tipo de lançamento. */
export function NovoLancamentoRapido({ className }: { className?: string }) {
  const [menu, setMenu] = useState(false);
  const [item, setItem] = useState<ItemRapido | null>(null);
  const isMobile = useIsMobile();

  const escolher = (i: ItemRapido) => {
    setMenu(false);
    setItem(i);
  };

  return (
    <>
      <Button
        size="lg"
        onClick={() => setMenu(true)}
        {...(className ? { className } : {})}
      >
        <Plus className="size-5" /> Novo lançamento
      </Button>

      {isMobile ? (
        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetContent
            side="bottom"
            className="flex max-h-[85dvh] flex-col gap-4 rounded-t-2xl px-4 pb-4 pt-3"
          >
            <div className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-muted" />
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle>Novo lançamento</SheetTitle>
              <SheetDescription>Escolha o que você quer registrar.</SheetDescription>
            </SheetHeader>
            <ListaTiposRapidos onEscolher={escolher} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={menu} onOpenChange={setMenu}>
          <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Novo lançamento</DialogTitle>
              <DialogDescription>Escolha o que você quer registrar.</DialogDescription>
            </DialogHeader>
            <ListaTiposRapidos onEscolher={escolher} />
          </DialogContent>
        </Dialog>
      )}

      {item && (
        <FormularioDialog
          tipo={item.tipo}
          {...(item.iniciais ? { iniciais: item.iniciais } : {})}
          {...(item.titulo ? { titulo: item.titulo } : {})}
          aberto={true}
          onOpenChange={(v) => {
            if (!v) setItem(null);
          }}
        />
      )}
    </>
  );
}

/** Data de hoje no formato do input date (aaaa-mm-dd). */
export function hojeInputDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AcoesLancamento({
  tipo,
  registro,
}: {
  tipo: Tipo;
  registro: Record<string, unknown> & { row: string };
}) {
  const [aberto, setAberto] = useState(false);
  const excluir = useServerFn(excluirLancamentoFn);
  const invalidar = useInvalidarPainel();

  const remover = useMutation({
    mutationFn: () => excluir({ data: { tipo, row: registro.row } }),
    onSuccess: async () => {
      await invalidar();
      toast.success("Lançamento excluído da planilha.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Editar lançamento"
        onClick={() => setAberto(true)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Excluir lançamento"
        disabled={remover.isPending}
        onClick={() => {
          if (confirm("Excluir este lançamento da planilha?")) remover.mutate();
        }}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
      {aberto && (
        <FormularioDialog
          tipo={tipo}
          row={registro.row}
          registro={registro}
          aberto={aberto}
          onOpenChange={setAberto}
        />
      )}
    </div>
  );
}
