import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SITUACOES_VEICULO, type SugestaoDespesa } from "@/lib/sugestao-despesa";
import { sugerirDespesaFn } from "@/lib/sugestao-despesa.functions";
import { paraNumeroBr } from "@/lib/numero";

type Situacao = (typeof SITUACOES_VEICULO)[number];

/** Assistente: o entregador conta o gasto e a IA sugere categoria e descrição. */
export function AssistenteDespesa({
  categoriasExistentes,
  valorAtual,
  onAplicar,
}: {
  categoriasExistentes: string[];
  valorAtual: string;
  onAplicar: (s: SugestaoDespesa & { valor: string }) => void;
}) {
  const [tipoGasto, setTipoGasto] = useState("");
  const [valor, setValor] = useState(valorAtual);
  const [situacao, setSituacao] = useState<Situacao>("Funcionando normal");
  const sugerir = useServerFn(sugerirDespesaFn);
  const m = useMutation({
    mutationFn: () =>
      sugerir({ data: { tipoGasto, valor: paraNumeroBr(valor), situacao, categoriasExistentes } }),
    onSuccess: (s) => {
      onAplicar({ ...s, valor });
      toast.success("Sugestão aplicada. Confira antes de salvar.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível sugerir agora."),
  });
  const valorNum = paraNumeroBr(valor);
  const pronto = tipoGasto.trim().length >= 2 && valorNum > 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:col-span-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="h-4 w-4 text-primary" /> Assistente de lançamento
      </div>
      <p className="text-xs text-muted-foreground">Conte o gasto e a IA sugere a categoria e uma descrição clara.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5 sm:col-span-3">
          <Label htmlFor="ia-tipo" className="text-xs">Tipo de gasto</Label>
          <Input id="ia-tipo" value={tipoGasto} maxLength={120} placeholder="Ex.: troquei a corrente da moto" onChange={(e) => setTipoGasto(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ia-valor" className="text-xs">Valor (R$)</Label>
          <Input id="ia-valor" inputMode="decimal" value={valor} placeholder="0,00" onChange={(e) => setValor(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label className="text-xs">Situação do veículo</Label>
          <Select value={situacao} onValueChange={(v) => setSituacao(v as Situacao)}>
            <SelectTrigger aria-label="Situação do veículo"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SITUACOES_VEICULO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="button" variant="secondary" disabled={!pronto || m.isPending} onClick={() => m.mutate()}>
        <Sparkles className="mr-2 h-4 w-4" />
        {m.isPending ? "Pensando…" : "Sugerir categoria e descrição"}
      </Button>
    </div>
  );
}
