import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { painelQueryOptions } from "@/lib/painel-query";
import { resumoSemanaPorDia, totaisSemana } from "@/lib/resumo-semana";
import { brl } from "@/lib/sheets-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/resumo-semana")({
  head: () => ({ meta: [
    { title: "Resumo da semana por dia — No Corre" },
    { name: "description", content: "Faturamento, gastos e lucro de cada dia da semana atual no No Corre." },
    { property: "og:title", content: "Resumo da semana por dia — No Corre" },
    { property: "og:description", content: "Confira o faturamento e os gastos diários da semana atual." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(painelQueryOptions()),
  errorComponent: ({ error }) => <div role="alert" className="p-6 text-sm text-destructive">{error.message}</div>,
  component: ResumoSemanaPage,
});

function ResumoSemanaPage() {
  const { data } = useSuspenseQuery(painelQueryOptions());
  const hoje = new Date();
  const inicio = startOfWeek(hoje, { weekStartsOn: 1 });
  const fim = endOfWeek(hoje, { weekStartsOn: 1 });
  const hojeIso = format(hoje, "yyyy-MM-dd");
  const dias = resumoSemanaPorDia(data, format(inicio, "yyyy-MM-dd"));
  const total = totaisSemana(dias);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 py-1">
      <header className="flex items-center gap-3">
        <Button asChild size="icon" variant="outline">
          <Link to="/inicio" aria-label="Voltar para Início"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold">Resumo da semana</h1>
          <p className="text-xs text-muted-foreground">{format(inicio, "dd/MM")} a {format(fim, "dd/MM/yyyy")}</p>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2 border-y border-border py-4 sm:gap-4" aria-label="Totais da semana">
        <Valor rotulo="Faturamento" valor={total.faturamento} cor="text-success" />
        <Valor rotulo="Gastos" valor={total.gastos} cor="text-destructive" />
        <Valor rotulo="Lucro" valor={total.lucro} cor={total.lucro >= 0 ? "text-success" : "text-destructive"} />
      </section>

      <section aria-labelledby="dias-semana">
        <h2 id="dias-semana" className="mb-3 text-sm font-semibold">Por dia</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {dias.map((dia) => (
            <li key={dia.iso} className={cn("panel min-w-0 p-4", dia.iso === hojeIso && "border-primary/60")}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize">{format(parseISO(dia.iso), "EEEE", { locale: ptBR })}</h3>
                <span className="text-xs text-muted-foreground">{format(parseISO(dia.iso), "dd/MM")}{dia.iso === hojeIso ? " · Hoje" : ""}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Valor rotulo="Faturado" valor={dia.faturamento} cor="text-success" />
                <Valor rotulo="Gastos" valor={dia.gastos} cor="text-destructive" />
                <Valor rotulo="Lucro" valor={dia.lucro} cor={dia.lucro >= 0 ? "text-success" : "text-destructive"} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Valor({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{rotulo}</p>
      <p className={cn("num break-words text-sm font-semibold sm:text-base", cor)}>{brl(valor)}</p>
    </div>
  );
}