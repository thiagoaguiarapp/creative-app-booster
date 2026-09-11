import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { baixarPagamentoFn } from "@/lib/painel.functions";
import type { Pagamento } from "@/lib/pagamentos";
import { brl } from "@/lib/sheets-types";

function hojeInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** hook de baixa reutilizável (também usado no botão rápido de cada linha) */
export function useBaixaPagamento() {
  const baixar = useServerFn(baixarPagamentoFn);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { rows: string[]; dataPago: string | null }) => baixar({ data: v }),
    onSuccess: async (_r, v) => {
      await queryClient.invalidateQueries({ queryKey: ["painel"] });
      toast.success(v.dataPago ? "Pagamento dado como pago." : "Baixa desfeita.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function BotaoBaixaRapida({ pagamento }: { pagamento: Pagamento }) {
  const baixa = useBaixaPagamento();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={baixa.isPending}
      onClick={() => baixa.mutate({ rows: [pagamento.id], dataPago: hojeInput() })}
    >
      <CheckCircle2 className="size-4" /> Paguei
    </Button>
  );
}

export function BotaoDesfazerBaixa({ pagamento }: { pagamento: Pagamento }) {
  const baixa = useBaixaPagamento();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={baixa.isPending}
      onClick={() => baixa.mutate({ rows: [pagamento.id], dataPago: null })}
    >
      <Undo2 className="size-4" /> Desfazer
    </Button>
  );
}

export function BaixaPagamentoDialog({
  abertas,
  pagas,
  hojeIso,
  children,
}: {
  abertas: Pagamento[];
  pagas: Pagamento[];
  hojeIso: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [selecao, setSelecao] = useState<string[]>([]);
  const [data, setData] = useState(hojeInput());
  const baixa = useBaixaPagamento();

  const total = abertas
    .filter((p) => selecao.includes(p.id))
    .reduce((s, p) => s + p.valor, 0);

  function alternar(row: string, marcado: boolean) {
    setSelecao((s) => (marcado ? [...new Set([...s, row])] : s.filter((r) => r !== row)));
  }

  function confirmar() {
    if (selecao.length === 0) {
      toast.error("Escolha pelo menos uma conta.");
      return;
    }
    baixa.mutate(
      { rows: selecao, dataPago: data },
      {
        onSuccess: () => {
          setSelecao([]);
          setAberto(false);
        },
      },
    );
  }

  return (
    <>
      <span onClick={() => setAberto(true)}>{children}</span>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dar baixa em pagamento</DialogTitle>
            <DialogDescription>
              Marque o que você já pagou. Dinheiro, Pix e débito não entram aqui — são pagos no ato.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {abertas.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Nada em aberto no momento.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {abertas.map((p) => {
                  const vencida = p.isoPagamento <= hojeIso;
                  return (
                    <label
                      key={p.row}
                      className="flex cursor-pointer items-center gap-3 py-2.5"
                    >
                      <Checkbox
                        checked={selecao.includes(p.id)}
                        onCheckedChange={(v) => alternar(p.id, v === true)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.descricao}</span>
                        <span className="num flex items-center gap-2 text-xs text-muted-foreground">
                          vence {p.dataPagamento}
                          {vencida && <Badge variant="destructive">vencida</Badge>}
                        </span>
                      </span>
                      <span className="num shrink-0 text-sm font-semibold">{brl(p.valor)}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {pagas.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Já pagos</p>
                <div className="flex flex-col divide-y divide-border">
                  {pagas.slice(0, 10).map((p) => (
                    <div key={p.row} className="flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{p.descricao}</span>
                        <span className="num text-xs text-muted-foreground">
                          pago {p.dataPago || p.dataPagamento}
                        </span>
                      </span>
                      <span className="num shrink-0 text-sm">{brl(p.valor)}</span>
                      <BotaoDesfazerBaixa pagamento={p} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-1.5">
              <Label htmlFor="data-pagamento">Data do pagamento</Label>
              <Input
                id="data-pagamento"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <Button onClick={confirmar} disabled={baixa.isPending}>
              <CheckCircle2 className="size-4" /> Confirmar {total > 0 ? brl(total) : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
