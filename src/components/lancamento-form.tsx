import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2, type LucideIcon } from "lucide-react";
import { useState } from "react";
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
  CAMPOS,
  FORMAS_RECEBIMENTO,
  TITULOS,
  paraInputDate,
  type Tipo,
} from "@/lib/entry-schema";
import { EXTRAS_SUGERIDOS, ehExtra } from "@/lib/extras";
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
    if (!registro && iniciais?.[campo.key] !== undefined) {
      out[campo.key] = iniciais[campo.key] ?? "";
    }
  }
  return out;
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
  const salvar = useServerFn(salvarLancamentoFn);
  const plataformas = usePlataformas();
  const formas = useFormas();
  const invalidar = useInvalidarPainel();

  const mutation = useMutation({
    mutationFn: (v: Record<string, string>) =>
      salvar({ data: row ? { tipo, valores: v, row } : { tipo, valores: v } }),
    onSuccess: async () => {
      await invalidar();
      toast.success(row ? "Lançamento atualizado na planilha." : "Lançamento salvo na planilha.");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    for (const campo of CAMPOS[tipo]) {
      if (campo.obrigatorio && !valores[campo.key]?.trim()) {
        toast.error(`Preencha "${campo.label}".`);
        return;
      }
    }
    mutation.mutate(valores);
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
          {CAMPOS[tipo].map((campo) => (
            <div key={campo.key} className="flex flex-col gap-1.5">
              <Label htmlFor={campo.key}>{campo.label}</Label>
              <Input
                id={campo.key}
                type={campo.tipo === "date" ? "date" : campo.tipo === "text" ? "text" : "number"}
                step={campo.tipo === "text" || campo.tipo === "date" ? undefined : "any"}
                inputMode={campo.tipo === "money" || campo.tipo === "number" ? "decimal" : undefined}
                maxLength={campo.tipo === "text" ? 120 : undefined}
                list={campo.sugestoes ? `sugestoes-${campo.key}` : undefined}
                value={valores[campo.key] ?? ""}
                onChange={(e) =>
                  setValores((v) => ({ ...v, [campo.key]: e.target.value }))
                }
              />
              {campo.sugestoes && (
                <datalist id={`sugestoes-${campo.key}`}>
                  {(campo.sugestoes === "forma" ? formas : plataformas).map((nome) => (
                    <option key={nome} value={nome} />
                  ))}
                </datalist>
              )}
            </div>
          ))}

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
  ganho: "Novo ganho",
  abastecimento: "Novo abastecimento",
  despesa: "Nova despesa",
  repasse: "Novo repasse",
  manutencao: "Nova manutenção",
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
