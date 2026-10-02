import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { concluirOnboardingFn } from "@/lib/auth.functions";
import { paraNumeroBr as paraNumero } from "@/lib/numero";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

const TIPOS = ["Moto", "Carro", "Bicicleta"];
const APPS_SUGERIDOS = ["iFood", "Uber", "99", "Zé Delivery", "Lalamove", "Particular"];
const METAS = [800, 1200, 1500, 2000];

export function OnboardingBoasVindas({ aberto }: { aberto: boolean }) {
  const router = useRouter();
  const concluir = useServerFn(concluirOnboardingFn);
  const [etapa, setEtapa] = useState(1);
  const [tipo, setTipo] = useState("Moto");
  const [nome, setNome] = useState("");
  const [placa, setPlaca] = useState("");
  const [km, setKm] = useState("");
  const [apps, setApps] = useState<string[]>([]);
  const [outro, setOutro] = useState("");
  const [meta, setMeta] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [fechado, setFechado] = useState(false);

  const alternar = (app: string) =>
    setApps((l) => (l.includes(app) ? l.filter((a) => a !== app) : [...l, app]));

  const addOutro = () => {
    const n = outro.trim();
    if (!n) return;
    if (!apps.some((a) => a.toLowerCase() === n.toLowerCase())) setApps((l) => [...l, n]);
    setOutro("");
  };

  const avancar = () => {
    if (etapa === 1 && nome.trim().length < 2) {
      toast.error("Informe o nome ou apelido do veículo.");
      return;
    }
    if (etapa === 2 && apps.length === 0) {
      toast.error("Marque pelo menos um app em que você roda.");
      return;
    }
    setEtapa((e) => e + 1);
  };

  const finalizar = async () => {
    setSalvando(true);
    try {
      await concluir({
        data: {
          veiculo: { nome: nome.trim(), tipo, placa: placa.trim(), km: paraNumero(km) },
          plataformas: apps,
          metaSemanal: paraNumero(meta),
        },
      });
      toast.success("Tudo pronto! Boas entregas.");
      setFechado(true);
      await router.invalidate();
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto && !fechado}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Etapa {etapa} de 3
          </p>
          <Progress value={(etapa / 3) * 100} className="h-1.5" />
          <DialogTitle className="pt-2">
            {etapa === 1 && "Seu veículo de trabalho"}
            {etapa === 2 && "Em quais apps você roda?"}
            {etapa === 3 && "Sua meta semanal"}
          </DialogTitle>
          <DialogDescription>
            {etapa === 1 && "Bem-vindo ao No Corre! Vamos preparar o app em 3 passos rápidos."}
            {etapa === 2 && "Esses apps viram botões de lançamento rápido na tela Início."}
            {etapa === 3 && "Quanto você quer faturar por semana? A barra de progresso acompanha seu dia a dia."}
          </DialogDescription>
        </DialogHeader>

        {etapa === 1 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={tipo === t ? "default" : "outline"}
                  className="h-11"
                  onClick={() => setTipo(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ob-nome">Nome ou apelido</Label>
              <Input id="ob-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Titan 160" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ob-placa">Placa (opcional)</Label>
                <Input id="ob-placa" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} placeholder="ABC1D23" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ob-km">KM atual</Label>
                <Input id="ob-km" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Ex.: 25000" />
              </div>
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {[...APPS_SUGERIDOS, ...apps.filter((a) => !APPS_SUGERIDOS.includes(a))].map((app) => {
                const ativo = apps.includes(app);
                return (
                  <Button
                    key={app}
                    type="button"
                    variant={ativo ? "default" : "outline"}
                    className={cn("h-11 rounded-full px-4", ativo && "font-semibold")}
                    onClick={() => alternar(app)}
                  >
                    {ativo && <Check className="size-4" />} {app}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={outro}
                onChange={(e) => setOutro(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOutro()}
                placeholder="Outro app"
              />
              <Button type="button" variant="outline" onClick={addOutro} aria-label="Adicionar app">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {METAS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={paraNumero(meta) === m ? "default" : "outline"}
                  className="h-11"
                  onClick={() => setMeta(String(m))}
                >
                  {brl(m)}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ob-meta">Ou digite outro valor (R$)</Label>
              <Input id="ob-meta" inputMode="decimal" value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Ex.: 1000" />
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {etapa > 1 && (
            <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setEtapa((e) => e - 1)} disabled={salvando}>
              Voltar
            </Button>
          )}
          {etapa < 3 ? (
            <Button type="button" className="h-11 flex-1" onClick={avancar}>
              Avançar
            </Button>
          ) : (
            <Button type="button" className="h-11 flex-1" onClick={finalizar} disabled={salvando}>
              {salvando ? "Salvando..." : "Concluir e começar a rodar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
