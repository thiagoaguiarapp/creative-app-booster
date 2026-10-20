import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CloudOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { salvarLancamentoFn } from "@/lib/painel.functions";
import { aoMudarFila, descartarItem, itemTravado, lerFila, sincronizarFila, type ItemFila } from "@/lib/offline";

/** Faixa de "sem internet" e envio automático dos lançamentos guardados. */
export function SincroniaOffline() {
  const salvar = useServerFn(salvarLancamentoFn);
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(true);
  const [fila, setFila] = useState<ItemFila[]>([]);

  useEffect(() => {
    const atualizar = () => setFila(lerFila());
    const enviar = async () => {
      if (!navigator.onLine || lerFila().length === 0) return;
      const r = await sincronizarFila(salvar);
      if (r.enviados > 0) {
        await queryClient.invalidateQueries({ queryKey: ["painel"] });
        toast.success(`${r.enviados} lançamento(s) feitos sem internet foram enviados.`);
      }
      if (r.falhas > 0) toast.error("Alguns lançamentos não foram aceitos. Eles continuam guardados no aparelho e serão reenviados.", { id: "sincronia-offline-erro" });
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

  const travados = fila.filter(itemTravado);
  const pendentes = fila.length - travados.length;

  if (online && fila.length === 0) return null;

  const descartar = () => {
    if (!window.confirm(`Descartar ${travados.length} lançamento(s) que o servidor não aceitou? Essa ação não pode ser desfeita.`)) return;
    travados.forEach((i) => descartarItem(i.id));
  };

  return (
    <div
      className="fixed inset-x-0 z-40 flex justify-center px-3"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 0.25rem)" }}
    >
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground shadow-lg">
        {!online ? (
          <CloudOff className="h-3.5 w-3.5 text-destructive" />
        ) : pendentes > 0 ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        )}
        {!online
          ? fila.length > 0
            ? `Sem internet · ${fila.length} lançamento(s) guardado(s) no aparelho`
            : "Sem internet · mostrando os últimos dados salvos"
          : pendentes > 0
            ? `Enviando ${pendentes} lançamento(s)…`
            : `${travados.length} lançamento(s) não aceito(s) pelo servidor`}
        {online && pendentes === 0 && travados.length > 0 && (
          <button type="button" onClick={descartar} className="ml-1 font-semibold text-destructive underline">
            Descartar
          </button>
        )}
      </div>
    </div>
  );
}
