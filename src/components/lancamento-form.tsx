import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
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
  CAMPOS,
  FORMAS_RECEBIMENTO,
  TITULOS,
  paraInputDate,
  type Tipo,
} from "@/lib/entry-schema";
import { EXTRAS_SUGERIDOS, ehExtra } from "@/lib/extras";
import { acharManutencaoAtiva, ehCategoriaManutencao } from "@/lib/manutencao-link";
import { painelQueryOptions } from "@/lib/painel-query";
import { excluirLancamentoFn, salvarLancamentoFn } from "@/lib/painel.functions";

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
    const inicial = iniciais?.[campo.key];
    if (inicial !== undefined && (!registro || inicial.trim() !== "")) {
      out[campo.key] = inicial;
    }

  }
  return out;
}

function numeroBr(valor: string | undefined): number {
  const n = Number(String(valor ?? "").replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function usePlataformas(tipo: Tipo): string[] {
  const { data } = useQuery(painelQueryOptions());
  const nomes = new Set<string>();
  for (const g of data?.ganhos ?? []) if (g.plataforma?.trim()) nomes.add(g.plataforma.trim());
  for (const r of data?.repasses ?? []) if (r.aplicativo?.trim()) nomes.add(r.aplicativo.trim());
  if (tipo === "ganho") for (const e of EXTRAS_SUGERIDOS) nomes.add(e);
  const lista = Array.from(nomes);
  const filtrada = tipo === "ganho" ? lista : lista.filter((n) => !ehExtra(n));
  return filtrada.sort((a, b) => a.localeCompare(b, "pt-BR"));
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
}: {
  tipo: Tipo;
  row?: number;
  registro?: Record<string, unknown>;
  iniciais?: Record<string, string>;
  titulo?: string;
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [valores, setValores] = useState(() => valoresIniciais(tipo, registro, iniciais));
  const [seguinte, setSeguinte] = useState<{
    row?: number;
    registro?: Record<string, unknown>;
    iniciais: Record<string, string>;
    titulo: string;
  } | null>(null);
  const salvar = useServerFn(salvarLancamentoFn);
  const plataformas = usePlataformas(tipo);
  const formas = useFormas();
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
          valor: v["valor"] ?? "",
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
            ? "Esse serviço já está em manutenção — atualize o km e a validade."
            : "Complete o registro na tela de manutenção.",
        );
        return;
      }
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visivel = (campo: (typeof CAMPOS)[Tipo][number]) =>
    !campo.somenteSe || campo.somenteSe.valores.includes(valores[campo.somenteSe.key] ?? "");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const enviaveis: Record<string, string> = {};
    for (const campo of CAMPOS[tipo]) {
      if (!visivel(campo)) continue;
      if (campo.obrigatorio && !valores[campo.key]?.trim()) {
        toast.error(`Preencha "${campo.label}".`);
        return;
      }
      enviaveis[campo.key] = valores[campo.key] ?? "";
    }
    mutation.mutate(enviaveis);
  }

  if (seguinte) {
    return (
      <FormularioDialog
        tipo="manutencao"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            {titulo ?? `${row ? "Editar" : "Novo"} ${TITULOS[tipo]}`}
          </DialogTitle>
          <DialogDescription>
            As alterações são gravadas direto na sua planilha do Google Sheets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
          {CAMPOS[tipo].filter(visivel).map((campo) => (
            <div key={campo.key} className="flex flex-col gap-1.5">
              <Label htmlFor={campo.key}>{campo.label}</Label>
              {campo.tipo === "select" ? (
                <Select
                  value={valores[campo.key] ?? ""}
                  onValueChange={(v) =>
                    setValores((atual) => ({
                      ...atual,
                      [campo.key]: v,
                      ...(campo.key === "pagamento" && v !== "Crédito" ? { parcelas: "" } : {}),
                    }))
                  }
                >
                  <SelectTrigger id={campo.key}>
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
                  type={campo.tipo === "date" ? "date" : campo.tipo === "text" ? "text" : "number"}
                  step={campo.tipo === "text" || campo.tipo === "date" ? undefined : "any"}
                  inputMode={campo.tipo === "money" || campo.tipo === "number" ? "decimal" : undefined}
                  maxLength={campo.tipo === "text" ? 120 : undefined}
                  list={campo.sugestoes ? `sugestoes-${campo.key}` : undefined}
                  value={valores[campo.key] ?? ""}
                  onChange={(e) => setValores((v) => ({ ...v, [campo.key]: e.target.value }))}
                />
              )}
              {campo.sugestoes && (
                <datalist id={`sugestoes-${campo.key}`}>
                  {(campo.sugestoes === "forma" ? formas : plataformas).map((nome) => (
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
                  As parcelas serão lançadas nos meses seguintes.
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
            <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs sm:col-span-2">
              <p className="text-warning">
                Já existe manutenção ativa de “{existente.servico}”
                {existente.veiculo ? ` (${existente.veiculo})` : ""} em {existente.data}, km{" "}
                {existente.kmTroca.toLocaleString("pt-BR")}.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
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


          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando…" : "Salvar na planilha"}
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

const TIPOS_RAPIDOS: { tipo: Tipo; rotulo: string; desc: string }[] = [
  { tipo: "ganho", rotulo: "Ganho diário", desc: "Corridas e faturamento" },
  { tipo: "abastecimento", rotulo: "Abastecimento", desc: "Litros e odômetro" },
  { tipo: "despesa", rotulo: "Despesa", desc: "Custos operacionais" },
  { tipo: "repasse", rotulo: "Repasse / recebimento", desc: "Valores recebidos" },
];

/** Botão único que abre um menu rápido para escolher o tipo de lançamento. */
export function NovoLancamentoRapido({ className }: { className?: string }) {
  const [menu, setMenu] = useState(false);
  const [tipo, setTipo] = useState<Tipo | null>(null);

  return (
    <>
      <Button
        size="lg"
        onClick={() => setMenu(true)}
        {...(className ? { className } : {})}
      >
        <Plus className="size-5" /> Novo lançamento
      </Button>

      <Dialog open={menu} onOpenChange={setMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>Escolha o que você quer registrar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {TIPOS_RAPIDOS.map((item) => (
              <button
                key={item.tipo}
                type="button"
                onClick={() => {
                  setMenu(false);
                  setTipo(item.tipo);
                }}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/50"
              >
                <span>
                  <span className="block text-sm font-medium">{item.rotulo}</span>
                  <span className="block text-xs text-muted-foreground">{item.desc}</span>
                </span>
                <Plus className="size-4 text-primary" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {tipo && (
        <FormularioDialog
          tipo={tipo}
          aberto={true}
          onOpenChange={(v) => {
            if (!v) setTipo(null);
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
  registro: Record<string, unknown> & { row: number };
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
