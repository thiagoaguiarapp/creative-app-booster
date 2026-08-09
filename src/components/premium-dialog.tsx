import { useRouteContext, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Crown, Sparkles } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { definirPremiumFn } from "@/lib/premium.functions";

const beneficios = [
  "Navegação 100% livre de anúncios",
  "Interface mais limpa nas telas de início e relatório",
  "Apoie o desenvolvimento contínuo do Rota Control",
];

export function PremiumDialog({ trigger }: { trigger: React.ReactNode }) {
  const context = useRouteContext({ from: "__root__" });
  const isPremium = context.usuario?.isPremium ?? false;
  const router = useRouter();
  const definir = useServerFn(definirPremiumFn);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const alternar = async (ativo: boolean) => {
    setCarregando(true);
    try {
      await definir({ data: { ativo } });
      await router.invalidate();
      toast.success(ativo ? "Premium ativado! Anúncios removidos." : "Plano Premium cancelado.");
      setAberto(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o plano.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="size-5 text-primary" />
            {isPremium ? "Você é Premium" : "Seja Premium"}
          </DialogTitle>
          <DialogDescription>
            {isPremium
              ? "Seu plano está ativo e os anúncios estão desligados."
              : "Remova os anúncios e deixe o app com a cara de quem trabalha sério."}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {beneficios.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plano mensal</p>
          <p className="font-display text-2xl font-semibold">R$ 9,90 / mês</p>
          <p className="text-xs text-muted-foreground">
            Pagamento ainda em modo demonstração — a ativação abaixo é simulada.
          </p>
        </div>

        <DialogFooter>
          {isPremium ? (
            <Button variant="outline" disabled={carregando} onClick={() => alternar(false)}>
              {carregando ? "Processando…" : "Cancelar Premium"}
            </Button>
          ) : (
            <Button disabled={carregando} onClick={() => alternar(true)}>
              <Sparkles className="mr-1 size-4" />
              {carregando ? "Ativando…" : "Ativar Premium (simulado)"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
