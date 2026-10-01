import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Zap } from "lucide-react";
import { useMemo, useState } from "react";
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
import { normalizarPlataforma } from "@/lib/conciliacao";
import { ehExtra } from "@/lib/extras";
import { paraNumeroBr as paraNumero } from "@/lib/numero";
import { salvarLancamentoFn } from "@/lib/painel.functions";
import type { Ganho } from "@/lib/sheets-types";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

const isoDia = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** apps do usuário, ordenados pelo uso mais recente */
function appsDoUsuario(ganhos: Ganho[], cadastrados: string[]): string[] {
  const mapa = new Map<string, { nome: string; iso: string }>();
  for (const g of ganhos) {
    const nome = g.plataforma.trim();
    if (!nome || ehExtra(nome)) continue;
    const chave = normalizarPlataforma(nome);
    const atual = mapa.get(chave);
    if (!atual || g.iso > atual.iso) mapa.set(chave, { nome, iso: g.iso });
  }
  for (const nome of cadastrados) {
    const chave = normalizarPlataforma(nome);
    if (!mapa.has(chave)) mapa.set(chave, { nome, iso: "" });
  }
  return [...mapa.values()].sort((a, b) => b.iso.localeCompare(a.iso)).map((a) => a.nome);
}

export function LancamentoRapidoApp({
  ganhos,
  plataformas = [],
}: {
  ganhos: Ganho[];
  plataformas?: string[];
}) {
  const apps = useMemo(() => appsDoUsuario(ganhos, plataformas), [ganhos, plataformas]);
  const [app, setApp] = useState<string | null>(null);
  const [novoApp, setNovoApp] = useState(false);

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Zap className="size-3.5 text-primary" /> Lançamento rápido
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {apps.map((nome) => (
          <Button
            key={nome}
            variant="outline"
            className="h-11 shrink-0 rounded-full px-5 font-semibold"
            onClick={() => {
              setNovoApp(false);
              setApp(nome);
            }}
          >
            {nome}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="h-11 shrink-0 rounded-full border border-dashed border-border px-4"
          onClick={() => {
            setNovoApp(true);
            setApp("");
          }}
        >
          <Plus className="size-4" /> {apps.length ? "Outro app" : "Adicionar app"}
        </Button>
      </div>
      {app !== null && (
        <ModalRapido app={app} novoApp={novoApp} onClose={() => setApp(null)} />
      )}
    </div>
  );
}

function ModalRapido({
  app,
  novoApp,
  onClose,
}: {
  app: string;
  novoApp: boolean;
  onClose: () => void;
}) {
  const salvar = useServerFn(salvarLancamentoFn);
  const queryClient = useQueryClient();
  const [nome, setNome] = useState(app);
  const [data, setData] = useState(isoDia(0));
  const [faturado, setFaturado] = useState("");
  const [corridas, setCorridas] = useState("");
  const [emMaos, setEmMaos] = useState("");
  const [forma, setForma] = useState<"Dinheiro" | "Pix">("Dinheiro");
  const [salvando, setSalvando] = useState(false);

  const valorFat = paraNumero(faturado);
  const valorMaos = paraNumero(emMaos);
  const invalido =
    !nome.trim() || valorFat <= 0 || valorMaos < 0 || valorMaos > valorFat + 0.001;

  const gravar = async () => {
    if (invalido) return;
    setSalvando(true);
    try {
      await salvar({
        data: {
          tipo: "ganho",
          valores: { data, plataforma: nome.trim(), corridas, faturamento: faturado },
        },
      });
      if (valorMaos > 0) {
        await salvar({
          data: {
            tipo: "repasse",
            valores: { data, aplicativo: nome.trim(), valor: emMaos, forma },
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["painel"] });
      toast.success(
        valorMaos > 0
          ? `${nome.trim()}: ${brl(valorFat)} lançado, ${brl(valorMaos)} já baixado em ${forma}.`
          : `${nome.trim()}: ${brl(valorFat)} lançado.`,
      );
      onClose();
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{novoApp ? "Novo app" : nome}</DialogTitle>
          <DialogDescription>Lance o ganho do dia em poucos segundos.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {novoApp && (
            <div className="grid gap-1.5">
              <Label htmlFor="rap-app">Nome do app</Label>
              <Input id="rap-app" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: iFood" />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>Data</Label>
            <div className="flex gap-2">
              {[
                { l: "Hoje", v: isoDia(0) },
                { l: "Ontem", v: isoDia(-1) },
              ].map((o) => (
                <Button
                  key={o.l}
                  type="button"
                  size="sm"
                  variant={data === o.v ? "default" : "outline"}
                  onClick={() => setData(o.v)}
                >
                  {o.l}
                </Button>
              ))}
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rap-fat">Faturado (R$)</Label>
              <Input id="rap-fat" inputMode="decimal" value={faturado} onChange={(e) => setFaturado(e.target.value)} placeholder="0,00" autoFocus={!novoApp} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rap-cor">Entregas</Label>
              <Input id="rap-cor" inputMode="numeric" value={corridas} onChange={(e) => setCorridas(e.target.value.replace(/\D/g, ""))} placeholder="0" />
            </div>
          </div>
          <div className="grid gap-1.5 rounded-lg border border-border p-3">
            <Label htmlFor="rap-maos">Recebido em mãos (opcional)</Label>
            <p className="text-xs text-muted-foreground">
              Quanto desse valor o cliente pagou direto a você. Já dá baixa no repasse.
            </p>
            <Input id="rap-maos" inputMode="decimal" value={emMaos} onChange={(e) => setEmMaos(e.target.value)} placeholder="0,00" />
            {valorMaos > 0 && (
              <div className="flex gap-2 pt-1">
                {(["Dinheiro", "Pix"] as const).map((f) => (
                  <Button key={f} type="button" size="sm" variant={forma === f ? "default" : "outline"} onClick={() => setForma(f)}>
                    {f}
                  </Button>
                ))}
              </div>
            )}
            {valorMaos > valorFat + 0.001 && (
              <p className="text-xs text-destructive">Não pode ser maior que o faturado.</p>
            )}
            {valorMaos > 0 && valorMaos <= valorFat && (
              <p className={cn("text-xs text-muted-foreground")}>
                A receber do app: <strong>{brl(valorFat - valorMaos)}</strong>
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button className="h-11 w-full" disabled={invalido || salvando} onClick={gravar}>
            {salvando ? "Salvando..." : "Gravar ganho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
