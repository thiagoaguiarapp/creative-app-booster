import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

import { painelQueryOptions } from "@/lib/painel-query";
import { manutencoesPendentes } from "@/lib/manutencao-alerta";

const CHAVE = "noCorre.avisoManutencao";

/**
 * Dispara notificação local no Android quando uma manutenção está vencida
 * ou perto de vencer (pelo hodômetro). Avisa cada item no máximo 1x por dia.
 */
export function AvisoManutencao() {
  const { data } = useQuery(painelQueryOptions());

  useEffect(() => {
    if (!data || !Capacitor.isNativePlatform()) return;
    const pendentes = manutencoesPendentes(data.manutencoes, data.odometroAtual);
    if (pendentes.length === 0) return;

    const hoje = new Date().toISOString().slice(0, 10);
    let enviados: Record<string, string> = {};
    try {
      enviados = JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
    } catch {
      enviados = {};
    }
    const novos = pendentes.filter((p) => enviados[p.chave] !== hoje);
    if (novos.length === 0) return;

    void (async () => {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== "granted") perm = await LocalNotifications.requestPermissions();
        if (perm.display !== "granted") return;
        await LocalNotifications.schedule({
          notifications: novos.map((p, i) => ({
            id: 7000 + i,
            title: p.vencido ? `Manutenção vencida: ${p.servico}` : `Manutenção chegando: ${p.servico}`,
            body: p.vencido
              ? `${p.veiculo} passou ${p.km.toLocaleString("pt-BR")} km do prazo. Agende o serviço.`
              : `${p.veiculo}: faltam ${p.km.toLocaleString("pt-BR")} km.`,
          })),
        });
        for (const p of novos) enviados[p.chave] = hoje;
        localStorage.setItem(CHAVE, JSON.stringify(enviados));
      } catch {
        // plugin indisponível em versões antigas do app
      }
    })();
  }, [data]);

  return null;
}
