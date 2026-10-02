import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react";

import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";
import { ARTIGOS_BLOG } from "@/lib/artigos-blog";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Dicas para entregadores e motoristas | Rota Control" },
      {
        name: "description",
        content:
          "Dicas práticas para entregadores e motoristas de aplicativo: custo por km, lucro real, organização de repasses e manutenção preventiva da moto.",
      },
      { property: "og:title", content: "Blog — Dicas para entregadores | Rota Control" },
      {
        property: "og:description",
        content:
          "Custo por km, lucro real, repasses e manutenção: conteúdo prático para quem vive na estrada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Blog,
});

function formatarData(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Blog() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1 size-4" /> Voltar
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </header>

        <section className="flex flex-col gap-3">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Blog do Rota Control</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Dicas práticas para quem trabalha na rua: finanças, combustível, manutenção e
            organização dos repasses das plataformas.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          {ARTIGOS_BLOG.map((a) => (
            <Link
              key={a.slug}
              to="/blog/$slug"
              params={{ slug: a.slug }}
              className="panel group flex flex-col gap-3 p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> {formatarData(a.data)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {a.tempoLeitura} de leitura
                </span>
              </div>
              <h2 className="font-display text-xl font-semibold group-hover:text-primary">
                {a.titulo}
              </h2>
              <p className="text-sm text-muted-foreground">{a.descricao}</p>
              <span className="flex items-center gap-1 text-sm font-medium text-primary">
                Ler artigo <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </section>
      </div>
      <LandingFooter />
    </div>
  );
}
