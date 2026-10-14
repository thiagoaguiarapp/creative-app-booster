import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { salvarLancamentoFn } from "@/lib/painel.functions";
import { aoMudarFila, lerFila, sincronizarFila } from "@/lib/offline";

/** Faixa de "sem internet" e envio automático dos lançamentos guardados. */
export function SincroniaOffline() {
  const salvar = useServerFn(salvarLancamentoFn);
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);

  useEffect(() => {
    const atualizar = () => setPendentes(lerFila().length);
    const enviar = async () => {
      if (!navigator.onLine || lerFila().length === 0) return;
      const r = await sincronizarFila(salvar);
      if (r.enviados > 0) {
        await queryClient.invalidateQueries({ queryKey: ["painel"] });
        toast.success(`${r.enviados} lançamento(s) feitos sem internet foram enviados.`);
      }
      if (r.falhas > 0) toast.error(`${r.falhas} lançamento(s) não puderam ser salvos.`);
    };
    const ficouOnline = () => {
      setOnline(true);
      void enviar();
    };
    const ficouOffline = () => setOnline(false);

    setOnline(navigator.onLine);
    atualizar();
    void enviar();
    const tirar = aoMudarFila(atualizar);
    window.addEventListener("online", ficouOnline);
    window.addEventListener("offline", ficouOffline);
    const timer = window.setInterval(() => void enviar(), 30_000);
    return () => {
      tirar();
      window.removeEventListener("online", ficouOnline);
      window.removeEventListener("offline", ficouOffline);
      window.clearInterval(timer);
    };
  }, [salvar, queryClient]);

  if (online && pendentes === 0) return null;

  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-3"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.25rem)" }}
    >
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground shadow-lg">
        {online ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CloudOff className="h-3.5 w-3.5 text-destructive" />}
        {online
          ? `Enviando ${pendentes} lançamento(s)…`
          : pendentes > 0
            ? `Sem internet · ${pendentes} lançamento(s) guardado(s) no aparelho`
            : "Sem internet · mostrando os últimos dados salvos"}
      </div>
    </div>
  );
}
