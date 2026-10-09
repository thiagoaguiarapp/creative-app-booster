// Regras de filtragem da tela de Entregas: período rápido e intervalo personalizado.

export type PeriodoEntregas = "hoje" | "semana" | "mes" | "tudo" | "personalizado";

export interface LinhaEntrega {
  iso?: string | null;
  plataforma?: string | null;
}

export function isoLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function inicioPeriodo(p: PeriodoEntregas): string {
  const d = new Date();
  if (p === "hoje") return isoLocal(d);
  if (p === "semana") {
    const dia = (d.getDay() + 6) % 7; // segunda = 0
    d.setDate(d.getDate() - dia);
    return isoLocal(d);
  }
  if (p === "mes") return isoLocal(new Date(d.getFullYear(), d.getMonth(), 1));
  return "";
}

/**
 * Normaliza o intervalo digitado: inverte quando o usuário troca a ordem e
 * trata data única quando um dos lados fica vazio.
 */
export function intervaloPersonalizado(de: string, ate: string): { de: string; ate: string } {
  if (!de && !ate) return { de: "", ate: "" };
  if (!de) return { de: ate, ate };
  if (!ate) return { de, ate: de };
  return de <= ate ? { de, ate } : { de: ate, ate: de };
}

export function filtrarEntregas<T extends LinhaEntrega>(
  ganhos: T[],
  opts: { periodo: PeriodoEntregas; app?: string; de?: string; ate?: string },
): T[] {
  const app = opts.app ?? "todos";
  const intervalo = intervaloPersonalizado(opts.de ?? "", opts.ate ?? "");
  const ini = opts.periodo === "personalizado" ? intervalo.de : inicioPeriodo(opts.periodo);
  const fim = opts.periodo === "personalizado" ? intervalo.ate : "";

  return ganhos
    .filter((g) => {
      const iso = g.iso ?? "";
      if (ini && iso < ini) return false;
      if (fim && iso > fim) return false;
      return app === "todos" || g.plataforma === app;
    })
    .sort((a, b) => (b.iso ?? "").localeCompare(a.iso ?? ""));
}
