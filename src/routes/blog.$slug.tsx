import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";

import { LandingFooter } from "@/components/landing-footer";
import { Button } from "@/components/ui/button";
import { ARTIGOS_BLOG } from "@/lib/artigos-blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const artigo = ARTIGOS_BLOG.find((a) => a.slug === params.slug);
    if (!artigo) throw notFound();
    return artigo;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.titulo ?? "Artigo"} | Blog Rota Control` },
      { name: "description", content: loaderData?.descricao ?? "" },
      { property: "og:title", content: loaderData?.titulo ?? "" },
      { property: "og:description", content: loaderData?.descricao ?? "" },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Artigo,
});

function Artigo() {
  const artigo = Route.useLoaderData();

  return (
    <div className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:py-12">
        <header className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-1 size-4" /> Todos os artigos
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </header>

        <article className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {new Date(`${artigo.data}T12:00:00`).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> {artigo.tempoLeitura} de leitura
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              {artigo.titulo}
            </h1>
            <p className="text-base text-muted-foreground">{artigo.descricao}</p>
          </div>

          <div className="flex flex-col gap-4">
            {artigo.conteudo.map((paragrafo, i) =>
              paragrafo.startsWith("## ") ? (
                <h2 key={i} className="mt-4 font-display text-2xl font-semibold">
                  {paragrafo.slice(3)}
                </h2>
              ) : (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {paragrafo}
                </p>
              ),
            )}
          </div>
        </article>

        <section className="panel flex flex-col items-center gap-3 p-8 text-center">
          <h2 className="font-display text-xl font-semibold">
            Controle tudo isso automaticamente
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            O Rota Control calcula seu custo por km, organiza os repasses e avisa a hora da
            manutenção. Grátis para começar.
          </p>
          <Button asChild>
            <Link to="/auth">Criar conta grátis</Link>
          </Button>
        </section>
      </div>
      <LandingFooter />
    </div>
  );
}
